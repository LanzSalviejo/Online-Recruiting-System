from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg
from django.core.mail import send_mail
from datetime import datetime

from .models import JobPosting, JobPreference, JobApplication, UserEducation, UserExperience


class JobPostingViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = JobPosting.objects.filter(is_active=True)
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__name=category)
            
        # Filter by location
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)
            
        # Filter by salary range
        min_salary = self.request.query_params.get('min_salary', None)
        if min_salary:
            queryset = queryset.filter(salary_range_min__gte=min_salary)
            
        # Filter by position type
        position_type = self.request.query_params.get('position_type', None)
        if position_type:
            queryset = queryset.filter(position_type=position_type)
            
        return queryset

    def perform_create(self, serializer):
        job_posting = serializer.save(creator=self.request.user)
        self._notify_matching_applicants(job_posting)

    def _notify_matching_applicants(self, job_posting):
        # Find users with matching job preferences
        matching_preferences = JobPreference.objects.filter(
            categories__in=[job_posting.category],
            min_salary__lte=job_posting.salary_range_max,
            position_type=job_posting.position_type
        )

        for preference in matching_preferences:
            send_mail(
                'New Job Matching Your Preferences',
                f'A new job matching your preferences has been posted: {job_posting.title}',
                'noreply@recruitingsystem.com',
                [preference.user.email],
                fail_silently=True,
            )

class JobApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        application = serializer.save(applicant=self.request.user)
        self._screen_application(application)

    def _screen_application(self, application):
        # Calculate education score (0-40 points)
        education_score = self._calculate_education_score(application)
        
        # Calculate experience score (0-40 points)
        experience_score = self._calculate_experience_score(application)
        
        # Calculate skills match score (0-20 points)
        skills_score = self._calculate_skills_score(application)
        
        # Calculate total score
        total_score = education_score + experience_score + skills_score
        
        # Update application with score and screening result
        application.screening_score = total_score
        application.passed_screening = total_score >= 75
        application.save()

        # Send notifications
        if application.passed_screening:
            self._notify_hr_staff(application)
        else:
            self._notify_applicant(application)

    def _calculate_education_score(self, application):
        required_level = application.job_posting.min_education_level
        applicant_education = UserEducation.objects.filter(user=application.applicant).latest('end_date')
        
        # Implementation of education scoring logic
        # Returns score between 0-40

    def _calculate_experience_score(self, application):
        required_years = application.job_posting.min_experience_years
        applicant_experience = UserExperience.objects.filter(user=application.applicant)
        
        # Implementation of experience scoring logic
        # Returns score between 0-40

    def _calculate_skills_score(self, application):
        # Implementation of skills matching logic
        # Returns score between 0-20
        return 1

class ReportViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['get'])
    def application_statistics(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        # Filter applications by date
        applications = JobApplication.objects.filter(
            application_date__year=year,
            application_date__month=month if month else application_date__month
        )

        # Get category statistics
        category_stats = applications.values('job_posting__category__name')\
            .annotate(
                total_applications=Count('id'),
                qualified_candidates=Count('id', filter=Q(passed_screening=True))
            )\
            .order_by('-total_applications')

        return Response(category_stats)