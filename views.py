from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Count, Q, F
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.urls import reverse
from django.conf import settings

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from datetime import datetime, timedelta
import json

from .models import (
    User, Applicant, HRStaff, Administrator, 
    JobCategories, JobPosting, JobApplication, 
    JobPreferences, SystemAIEngine
)
from .serializers import (
    UserSerializer, ApplicantSerializer, JobCategoriesSerializer,
    JobPostingSerializer, JobApplicationSerializer, JobPreferencesSerializer
)

# Authentication Views
def login_view(request):
    """View for user login"""
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        try:
            user = User.objects.get(emailAddress=email)
            if user.login(request, password):
                return redirect('dashboard')
            else:
                messages.error(request, 'Invalid credentials')
        except User.DoesNotExist:
            messages.error(request, 'User does not exist')
        
    return render(request, 'login.html')

def register_view(request):
    """View for applicant registration"""
    if request.method == 'POST':
        first_name = request.POST.get('firstName')
        last_name = request.POST.get('lastName')
        email = request.POST.get('email')
        password = request.POST.get('password')
        phone = request.POST.get('phone')
        dob = request.POST.get('dob')
        street = request.POST.get('street')
        city = request.POST.get('city')
        postal_code = request.POST.get('postalCode')
        
        # Check if user already exists
        if User.objects.filter(emailAddress=email).exists():
            messages.error(request, 'User with this email already exists')
            return render(request, 'register.html')
        
        # Create applicant
        applicant = Applicant.objects.create(
            firstName=first_name,
            lastName=last_name,
            emailAddress=email,
            passwordSalt='', # Will be handled by Django's auth
            passwordHash='', # Will be handled by Django's auth
            accountType='APPLICANT',
            phoneNumber=phone,
            dateOfBirth=dob,
            education='',
            workExperience='0',
            preferredJobs='',
            street=street,
            city=city,
            postalCode=postal_code
        )
        applicant.set_password(password)
        applicant.save()
        
        # Log the user in
        user = authenticate(request, username=email, password=password)
        if user:
            login(request, user)
            return redirect('dashboard')
        
    return render(request, 'register.html')

@login_required
def logout_view(request):
    """View for user logout"""
    request.user.logout(request)
    return redirect('login')

# Dashboard Views
@login_required
def dashboard_view(request):
    """Main dashboard view based on user type"""
    user = request.user
    
    if user.accountType == 'APPLICANT':
        return applicant_dashboard(request)
    elif user.accountType == 'HR':
        return hr_dashboard(request)
    elif user.accountType == 'ADMIN':
        return admin_dashboard(request)
    else:
        messages.error(request, 'Invalid account type')
        return redirect('login')

def applicant_dashboard(request):
    """Dashboard for applicants"""
    user = request.user
    
    # Get recent job postings
    jobs = JobPosting.objects.filter(dueDate__gte=datetime.now().date()).order_by('-postDate')[:10]
    
    # Get user's applications
    applications = JobApplication.objects.filter(userID=user).order_by('-applicationDate')
    
    context = {
        'jobs': jobs,
        'applications': applications
    }
    
    return render(request, 'applicant_dashboard.html', context)

def hr_dashboard(request):
    """Dashboard for HR staff"""
    user = request.user
    
    # Get job postings created by this HR staff
    job_postings = JobPosting.objects.filter(creatorUserID=user).order_by('-postDate')
    
    # Get recent applications for jobs posted by this HR staff
    applications = JobApplication.objects.filter(
        postID__creatorUserID=user
    ).order_by('-applicationDate')[:10]
    
    context = {
        'job_postings': job_postings,
        'applications': applications
    }
    
    return render(request, 'hr_dashboard.html', context)

def admin_dashboard(request):
    """Dashboard for administrators"""
    # Get all HR staff accounts
    hr_staff = HRStaff.objects.all()
    
    # Get job categories
    categories = JobCategories.objects.all()
    
    # Get some stats for the dashboard
    total_jobs = JobPosting.objects.count()
    total_applications = JobApplication.objects.count()
    total_applicants = Applicant.objects.count()
    
    context = {
        'hr_staff': hr_staff,
        'categories': categories,
        'total_jobs': total_jobs,
        'total_applications': total_applications,
        'total_applicants': total_applicants
    }
    
    return render(request, 'admin_dashboard.html', context)

# REST API Views
class JobPostingViewSet(viewsets.ModelViewSet):
    """API endpoint for job postings"""
    serializer_class = JobPostingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get job postings with filtering"""
        queryset = JobPosting.objects.filter(dueDate__gte=datetime.now().date())
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by location
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        # Filter by position type
        position_type = self.request.query_params.get('positionType', None)
        if position_type:
            queryset = queryset.filter(positionType=position_type)
        
        # Filter by minimum salary
        min_salary = self.request.query_params.get('minSalary', None)
        if min_salary:
            queryset = queryset.filter(salary__gte=min_salary)
        
        # Filter by due date
        due_date = self.request.query_params.get('dueDate', None)
        if due_date:
            queryset = queryset.filter(dueDate__gte=due_date)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new job posting"""
        # Only HR staff and admins can create job postings
        if request.user.accountType not in ['HR', 'ADMIN']:
            return Response({'error': 'You do not have permission to create job postings'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        # Create job posting
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set creator
        serializer.validated_data['creatorUserID'] = request.user
        
        # Save job posting
        self.perform_create(serializer)
        
        # Match job with preferences
        system = SystemAIEngine()
        system.matchJobPositions(serializer.instance)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Update a job posting"""
        instance = self.get_object()
        
        # Only the creator or an admin can update a job posting
        if request.user.accountType != 'ADMIN' and instance.creatorUserID != request.user:
            return Response({'error': 'You do not have permission to update this job posting'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a job posting"""
        instance = self.get_object()
        
        # Only admins can delete job postings
        if request.user.accountType != 'ADMIN':
            return Response({'error': 'You do not have permission to delete job postings'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        return super().destroy(request, *args, **kwargs)

class JobApplicationViewSet(viewsets.ModelViewSet):
    """API endpoint for job applications"""
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get job applications with filtering"""
        user = self.request.user
        
        if user.accountType == 'APPLICANT':
            # Applicants can only see their own applications
            return JobApplication.objects.filter(userID=user)
        elif user.accountType == 'HR':
            # HR staff can see applications for jobs they created
            return JobApplication.objects.filter(postID__creatorUserID=user)
        elif user.accountType == 'ADMIN':
            # Admins can see all applications
            return JobApplication.objects.all()
        else:
            return JobApplication.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Submit a job application"""
        # Only applicants can submit job applications
        if request.user.accountType != 'APPLICANT':
            return Response({'error': 'Only applicants can submit job applications'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        # Get job posting
        job_id = request.data.get('postID')
        try:
            job_posting = JobPosting.objects.get(postID=job_id)
        except JobPosting.DoesNotExist:
            return Response({'error': 'Job posting not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if job deadline has passed
        if job_posting.dueDate < datetime.now().date():
            return Response({'error': 'Application deadline has passed'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already applied
        if JobApplication.objects.filter(userID=request.user, postID=job_posting).exists():
            return Response({'error': 'You have already applied for this job'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Create application
        applicant = Applicant.objects.get(userID=request.user.userID)
        application = applicant.applyForJobs(
            job_posting=job_posting,
            education=request.data.get('education', applicant.education),
            work_experience=request.data.get('workExperience', applicant.workExperience),
            job_specific_info=request.data.get('jobSpecificInfo', '')
        )
        
        serializer = self.get_serializer(application)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        """Withdraw a job application"""
        instance = self.get_object()
        
        # Only the applicant or an admin can withdraw an application
        if request.user.accountType != 'ADMIN' and instance.userID != request.user:
            return Response({'error': 'You do not have permission to withdraw this application'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        return super().destroy(request, *args, **kwargs)

class JobPreferencesViewSet(viewsets.ModelViewSet):
    """API endpoint for job preferences"""
    serializer_class = JobPreferencesSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get job preferences for the authenticated user"""
        return JobPreferences.objects.filter(userID=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create or update job preferences"""
        # Only applicants can set preferences
        if request.user.accountType != 'APPLICANT':
            return Response({'error': 'Only applicants can set job preferences'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        # Check if preferences already exist
        try:
            preferences = JobPreferences.objects.get(userID=request.user)
            return self.update(request, pk=preferences.userID.userID)
        except JobPreferences.DoesNotExist:
            # Create new preferences
            applicant = Applicant.objects.get(userID=request.user.userID)
            applicant.modifyPreferredJobs(
                position_type=request.data.get('positionType'),
                category=request.data.get('category'),
                location=request.data.get('location'),
                salary=request.data.get('salary')
            )
            
            preferences = JobPreferences.objects.get(userID=request.user)
            serializer = self.get_serializer(preferences)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update job preferences"""
        instance = self.get_object()
        
        # Only the owner can update preferences
        if instance.userID != request.user:
            return Response({'error': 'You do not have permission to update these preferences'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        # Update preferences
        applicant = Applicant.objects.get(userID=request.user.userID)
        applicant.modifyPreferredJobs(
            position_type=request.data.get('positionType', instance.positionType),
            category=request.data.get('category', instance.category),
            location=request.data.get('location', instance.location),
            salary=request.data.get('salary', instance.salary)
        )
        
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class JobCategoriesViewSet(viewsets.ModelViewSet):
    """API endpoint for job categories"""
    queryset = JobCategories.objects.all()
    serializer_class = JobCategoriesSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """Create a job category"""
        # Only admins can create categories
        if request.user.accountType != 'ADMIN':
            return Response({'error': 'Only administrators can manage job categories'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        # Create category
        admin = Administrator.objects.get(userID=request.user.userID)
        success = admin.manageJobCategories('add', category_name=request.data.get('category'))
        
        if success:
            category = JobCategories.objects.get(category=request.data.get('category'))
            serializer = self.get_serializer(category)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Failed to create category'}, 
                            status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Update a job category"""
        # Only admins can update categories
        if request.user.accountType != 'ADMIN':
            return Response({'error': 'Only administrators can manage job categories'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        
        # Update category
        admin = Administrator.objects.get(userID=request.user.userID)
        success = admin.manageJobCategories('modify', 
                                          category_name=instance.category, 
                                          new_name=request.data.get('category'))
        
        if success:
            instance.refresh_from_db()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        else:
            return Response({'error': 'Failed to update category'}, 
                            status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a job category"""
        # Only admins can delete categories
        if request.user.accountType != 'ADMIN':
            return Response({'error': 'Only administrators can manage job categories'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        
        # Delete category
        admin = Administrator.objects.get(userID=request.user.userID)
        success = admin.manageJobCategories('delete', category_name=instance.category)
        
        if success:
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({'error': 'Failed to delete category'}, 
                            status=status.HTTP_400_BAD_REQUEST)

class ReportAPIView(APIView):
    """API for generating reports"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, format=None):
        """Generate report"""
        # Only admins can generate reports
        if request.user.accountType != 'ADMIN':
            return Response({'error': 'Only administrators can generate reports'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        report_type = request.query_params.get('type')
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        if not report_type or not year:
            return Response({'error': 'Report type and year are required'}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Generate report
        admin = Administrator.objects.get(userID=request.user.userID)
        report_data = admin.generateReports(report_type, year=year, month=month)
        
        if report_data:
            return Response(report_data)
        else:
            return Response({'error': 'Failed to generate report'}, 
                            status=status.HTTP_400_BAD_REQUEST)

# Additional view functions

@login_required
def applicant_job_list(request):
    """View for displaying job listings for applicants"""
    # Get filter parameters
    category = request.GET.get('category', '')
    location = request.GET.get('location', '')
    position_type = request.GET.get('position_type', '')
    min_salary = request.GET.get('min_salary', '')
    
    # Get job listings
    jobs = JobPosting.objects.filter(dueDate__gte=datetime.now().date())
    
    # Apply filters
    if category:
        jobs = jobs.filter(category=category)
    if location:
        jobs = jobs.filter(location__icontains=location)
    if position_type:
        jobs = jobs.filter(positionType=position_type)
    if min_salary:
        jobs = jobs.filter(salary__gte=min_salary)
    
    # Get categories for the filter dropdown
    categories = JobCategories.objects.all()
    
    context = {
        'jobs': jobs,
        'categories': categories,
        'filters': {
            'category': category,
            'location': location,
            'position_type': position_type,
            'min_salary': min_salary
        }
    }
    
    return render(request, 'job_list.html', context)

@login_required
def job_detail(request, job_id):
    """View for job details"""
    job = get_object_or_404(JobPosting, postID=job_id)
    
    # Check if user has already applied
    has_applied = False
    if request.user.accountType == 'APPLICANT':
        has_applied = JobApplication.objects.filter(userID=request.user, postID=job).exists()
    
    # Handle application submission
    if request.method == 'POST' and request.user.accountType == 'APPLICANT':
        if has_applied:
            messages.error(request, 'You have already applied for this job')
        elif job.dueDate < datetime.now().date():
            messages.error(request, 'Application deadline has passed')
        else:
            # Get applicant
            applicant = Applicant.objects.get(userID=request.user.userID)
            
            # Get form data
            education = request.POST.get('education', applicant.education)
            work_experience = request.POST.get('work_experience', applicant.workExperience)
            job_specific_info = request.POST.get('job_specific_info', '')
            
            # Submit application
            applicant.applyForJobs(
                job_posting=job,
                education=education,
                work_experience=work_experience,
                job_specific_info=job_specific_info
            )
            
            messages.success(request, 'Application submitted successfully')
            return redirect('my_applications')
    
    context = {
        'job': job,
        'has_applied': has_applied
    }
    
    return render(request, 'job_detail.html', context)

@login_required
def my_applications(request):
    """View for applicant's applications"""
    if request.user.accountType != 'APPLICANT':
        messages.error(request, 'You do not have permission to view this page')
        return redirect('dashboard')
    
    applications = JobApplication.objects.filter(userID=request.user).order_by('-applicationDate')
    
    context = {
        'applications': applications
    }
    
    return render(request, 'my_applications.html', context)

@login_required
def profile_view(request):
    """View for user profile"""
    user = request.user
    
    if request.method == 'POST':
        # Update profile
        first_name = request.POST.get('firstName', user.firstName)
        last_name = request.POST.get('lastName', user.lastName)
        email = request.POST.get('email', user.emailAddress)
        image = request.FILES.get('image', None)
        
        # Update user account
        user.modifyAccount(
            first_name=first_name,
            last_name=last_name,
            email=email,
            image=image
        )
        
        # For applicants, update additional fields
        if user.accountType == 'APPLICANT':
            phone = request.POST.get('phone', '')
            dob = request.POST.get('dob', None)
            education = request.POST.get('education', '')
            work_experience = request.POST.get('work_experience', '')
            street = request.POST.get('street', '')
            city = request.POST.get('city', '')
            postal_code = request.POST.get('postal_code', '')
            
            applicant = Applicant.objects.get(userID=user.userID)
            
            if phone:
                applicant.phoneNumber = phone
            if dob:
                applicant.dateOfBirth = dob
            
            applicant.modifyEducationWorkHistory(
                education=education,
                work_experience=work_experience
            )
            
            applicant.street = street
            applicant.city = city
            applicant.postalCode = postal_code
            applicant.save()
        
        messages.success(request, 'Profile updated successfully')
        return redirect('profile')
    
    context = {
        'user': user
    }
    
    return render(request, 'profile.html', context)

@login_required
def preferences_view(request):
    """View for job preferences"""
    if request.user.accountType != 'APPLICANT':
        messages.error(request, 'You do not have permission to view this page')
        return redirect('dashboard')
    
    # Get applicant
    applicant = Applicant.objects.get(userID=request.user.userID)
    
    # Get or create preferences
    try:
        preferences = JobPreferences.objects.get(userID=request.user)
    except JobPreferences.DoesNotExist:
        preferences = None
    
    # Get categories for the dropdown
    categories = JobCategories.objects.all()
    
    if request.method == 'POST':
        position_type = request.POST.get('position_type', '')
        category = request.POST.get('category', '')
        location = request.POST.get('location', '')
        salary = request.POST.get('salary', 0)
        
        # Update preferences
        applicant.modifyPreferredJobs(
            position_type=position_type,
            category=category,
            location=location,
            salary=salary
        )
        
        messages.success(request, 'Preferences updated successfully')
        return redirect('preferences')
    
    context = {
        'preferences': preferences,
        'categories': categories
    }
    
    return render(request, 'preferences.html', context)

@login_required
def hr_job_list(request):
    """View for HR staff job listings"""
    if request.user.accountType != 'HR':
        messages.error(request, 'You do not have permission to view this page')
        return redirect('dashboard')
    
    jobs = JobPosting.objects.filter(creatorUserID=request.user).order_by('-postDate')
    
    context = {
        'jobs': jobs
    }
    
    return render(request, 'hr_job_list.html', context)

@login_required
def create_job(request):
    """View for creating a job posting"""
    if request.user.accountType != 'HR':
        messages.error(request, 'You do not have permission to view this page')
        return redirect('dashboard')
    
    # Get HR staff
    hr_staff = HRStaff.objects.get(userID=request.user.userID)
    
    # Get categories for the dropdown
    categories = JobCategories.objects.all()
    
    if request.method == 'POST':
        title = request.POST.get('title', '')
        position_type = request.POST.get('position_type', '')
        category = request.POST.get('category', '')
        location = request.POST.get('location', '')
        contact_email = request.POST.get('contact_email', '')
        min_education = request.POST.get('min_education', '')
        min_experience = request.POST.get('min_experience', '')
        description = request.POST.get('description', '')
        salary = request.POST.get('salary', 0)
        due_date = request.POST.get('due_date', '')
        
        # Create job posting
        hr_staff.postJobs(
            title=title,
            position_type=position_type,
            category=category,
            location=location,
            contact_email=contact_email,
            min_education=min_education,
            min_experience=min_experience,
            description=description,
            salary=salary,
            due_date=due_date
        )
        
        messages.success(request, 'Job posting created successfully')
        return redirect('hr_job_list')
    
    context = {
        'categories': categories
    }
    
    return render(request, 'create_job.html', context)

@login_required
def edit_job(request, job_id):
    """View for editing a job posting"""
    if request.user.accountType != 'HR':
        messages.error(request, 'You do not have permission to view this page')
        return redirect('dashboard')
    
    # Get HR staff
    hr_staff = HRStaff.objects.get(userID=request.user.userID)
    
    # Get job posting
    job = get_object_or_404(JobPosting, postID=job_id, creatorUserID=request.user)
    
    # Get categories for the dropdown
    categories = JobCategories.objects.all()
    
    if request.method == 'POST':
        title = request.POST.get('title', job.title)
        position_type = request.POST.get('position_type', job.positionType)
        category = request.POST.get('category', job.category)
        location = request.POST.get('location', job.location)
        contact_email = request.POST.get('contact_email', job.contactEmail)
        min_education = request.POST.get('min_education', job.minimalRequiredEducationLevel)
        min_experience = request.POST.get('min_experience', job.minimalRequiredWorkingExperience)
        description = request.POST.get('description', job.jobDescription)
        salary = request.POST.get('salary', job.salary)
        due_date = request.POST.get('due_date', job.dueDate)
        
        # Update job posting
        hr_staff.modifyJobPostings(
            post_id=job_id,
            title=title,
            positionType=position_type,
            category=category,
            location=location,
            contactEmail=contact_email,
            minimalRequiredEducationLevel=min_education,
            minimalRequiredWorkingExperience=min_experience,
            jobDescription=description,
            salary=salary,
            dueDate=due_date
        )
        
        messages.success(request, 'Job posting updated successfully')
        return redirect('hr_job_list')
    
    context = {
        'job': job,
        'categories': categories
    }
    
    return render(request, 'edit_job.html', context)

@login_required
def view_applications(request):
    """View for HR staff to view applications"""
    if request.user.accountType != 'HR':
        messages.error(request, 'You do not have permission to view this page')
        return redirect('dashboard')
    
    # Get HR staff
    hr_staff = HRStaff.objects.get(userID=request.user.userID)
    
    # Get filter parameters
    job_id = request.GET.get('job_id', '')
    name = request.GET.get('name', '')
    passed_screen = request.GET.get('passed_screen', '')
    
    # Get applications
    if job_id:
        applications = hr_staff.viewApplications(post_id=job_id)
    else:
        applications = hr_staff.viewApplications()
    
    # Apply filters
    if name:
        applications = hr_staff.searchApplications(name=name)
    
    if passed_screen:
        applications = applications.filter(passedScreen=passed_screen)
    
    # Get jobs for the filter dropdown
    jobs = JobPosting.objects.filter(creatorUserID=request.user)
    
    context = {
        'applications': applications,
        'jobs': jobs,
        'filters': {
            'job_id': job_id,
            'name': name,
            'passed_screen': passed_screen
        }
    }
    
    return render(request, 'view_applications.html', context)

@login_required
def admin_staff_list(request):
    """View for admin to view HR staff accounts"""
    if request.user.accountType != 'ADMIN':
        messages.error(request, 'You do not have permission to view this page')
        return redirect('dashboard')
    
    hr_staff = HRStaff.objects.all()
    
    context = {
        'hr_staff': hr_staff
    }
    
    return render(request, 'admin_staff_list.html', context)

@login_required
def create_hr_staff(request):
    """View for admin to create HR staff accounts"""
    if request.user.accountType != 'ADMIN':
        messages.error(request, 'You do not have permission to view this page')
        return redirect('dashboard')
    
    # Get admin
    admin = Administrator.objects.get(userID=request.user.userID)
    
    if request.method == 'POST':
        first_name = request.POST.get('firstName', '')
        last_name = request.POST.get('lastName', '')
        email = request.POST.get('email', '')
        password = request.POST.get('password', '')
        phone = request.POST.get('phone', '')
        working_id = request.POST.get('working_id', '')
        
        # Create HR staff account
        hr_staff = admin.createHRStaffAccount(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=password,
            phone_number=phone,
            working_id=working_id
        )
        
        if hr_staff:
            messages.success(request, 'HR staff account created successfully')
            return redirect('admin_staff_list')
        else:
            messages.error(request, 'Failed to create HR staff account')
    
    return render(request, 'create_hr_staff.html')

@login_required
def admin_categories(request):
    """View for admin to manage job categories"""
    if request.user.accountType != 'ADMIN':
        messages.error(request, 'You do not have permission to view this page')
        return redirect('dashboard')
    
    # Get admin
    admin = Administrator.objects.get(userID=request.user.userID)
    
    # Get categories
    categories = JobCategories.objects.all()
    
    if request.method == 'POST':
        action = request.POST.get('action', '')
        category_name = request.POST.get('category_name', '')
        new_name = request.POST.get('new_name', '')
        
        # Perform action
        if action and category_name:
            success = admin.manageJobCategories(action, category_name=category_name, new_name=new_name)
            
            if success:
                messages.success(request, f'Category {action}d successfully')
            else:
                messages.error(request, f'Failed to {action} category')
            
            return redirect('admin_categories')
    
    context = {
        'categories': categories
    }
    
    return render(request, 'admin_categories.html', context)

@login_required
def admin_reports(request):
    """View for admin to generate reports"""
    if request.user.accountType != 'ADMIN':
        messages.error(request, 'You do not have permission to view this page')
        return redirect('dashboard')
    
    # Get admin
    admin = Administrator.objects.get(userID=request.user.userID)
    
    # Get report parameters
    report_type = request.GET.get('type', '')
    year = request.GET.get('year', datetime.now().year)
    month = request.GET.get('month', datetime.now().month)
    
    # Generate report
    report_data = None
    if report_type and year:
        report_data = admin.generateReports(report_type, year=year, month=month)
    
    context = {
        'report_data': report_data,
        'report_type': report_type,
        'year': year,
        'month': month
    }
    
    return render(request, 'admin_reports.html', context)