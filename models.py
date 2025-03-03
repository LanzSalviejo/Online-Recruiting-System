from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import authenticate, login, logout
from django.conf import settings
import os
import json
from datetime import datetime

class User(AbstractUser):
    """
    Base user model that extends Django's AbstractUser.
    Serves as the parent class for Applicant, HR Staff, and Administrator.
    """
    # Fields directly from diagram
    userID = models.AutoField(primary_key=True)
    firstName = models.CharField(max_length=50)
    lastName = models.CharField(max_length=50)
    emailAddress = models.EmailField(unique=True)
    passwordSalt = models.CharField(max_length=128)
    passwordHash = models.CharField(max_length=128)
    accountType = models.CharField(max_length=20)
    imagePath = models.CharField(max_length=255, blank=True)
    
    # Override Django's default fields to match our custom fields
    USERNAME_FIELD = 'emailAddress'
    REQUIRED_FIELDS = ['firstName', 'lastName']
    
    def login(self, request, password):
        """User login method"""
        user = authenticate(request, username=self.emailAddress, password=password)
        if user is not None:
            login(request, user)
            return True
        return False
        
    def logout(self, request):
        """User logout method"""
        logout(request)
        return True
        
    def modifyAccount(self, first_name=None, last_name=None, email=None, image=None):
        """Modify user account method"""
        if first_name:
            self.firstName = first_name
        if last_name:
            self.lastName = last_name
        if email:
            self.emailAddress = email
        if image:
            # Save the image and update the path
            if self.imagePath and os.path.exists(os.path.join(settings.MEDIA_ROOT, self.imagePath)):
                os.remove(os.path.join(settings.MEDIA_ROOT, self.imagePath))
            
            filename = f"profile_{self.userID}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            ext = os.path.splitext(image.name)[1]
            rel_path = f"profile_images/{filename}{ext}"
            full_path = os.path.join(settings.MEDIA_ROOT, rel_path)
            
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            with open(full_path, 'wb+') as destination:
                for chunk in image.chunks():
                    destination.write(chunk)
            
            self.imagePath = rel_path
        
        self.save()
        return True
        
    class Meta:
        db_table = 'User'

class Applicant(User):
    """
    Applicant user model that extends the base User class.
    Represents job applicants in the system.
    """
    phoneNumber = models.IntegerField()
    dateOfBirth = models.DateField()
    education = models.CharField(max_length=255)
    workExperience = models.CharField(max_length=255)
    preferredJobs = models.TextField()  # Stored as JSON or comma-separated
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    postalCode = models.CharField(max_length=10)
    
    def applyForJobs(self, job_posting, education=None, work_experience=None, job_specific_info=None, resume=None):
        """Method for applicants to apply for jobs"""
        if not education:
            education = self.education
        
        if not work_experience:
            work_experience = self.workExperience
        
        # Create a new job application
        application = JobApplication.objects.create(
            postID=job_posting,
            userID=self,
            education=education,
            workExperience=int(work_experience) if isinstance(work_experience, str) else work_experience,
            jobSpecificInfo=job_specific_info or "",
            passedScreen="PENDING"
        )
        
        # Trigger the screening process
        system = SystemAIEngine()
        system.screenApplication(application)
        
        return application
        
    def withdrawApplication(self, application_id):
        """Method to withdraw an application"""
        try:
            application = JobApplication.objects.get(applicationID=application_id, userID=self)
            application.delete()
            return True
        except JobApplication.DoesNotExist:
            return False
        
    def searchJobs(self, category=None, location=None, position_type=None, min_salary=None, due_date=None):
        """Method to search for jobs"""
        query = JobPosting.objects.all()
        
        if category:
            query = query.filter(category=category)
        
        if location:
            query = query.filter(location__icontains=location)
        
        if position_type:
            query = query.filter(positionType=position_type)
        
        if min_salary:
            query = query.filter(salary__gte=min_salary)
        
        if due_date:
            query = query.filter(dueDate__gte=due_date)
        
        return query
        
    def modifyPreferredJobs(self, position_type=None, category=None, location=None, salary=None):
        """Method to modify preferred jobs"""
        try:
            # Get or create job preferences
            preferences, created = JobPreferences.objects.get_or_create(userID=self)
            
            if position_type:
                preferences.positionType = position_type
            
            if category:
                preferences.category = category
            
            if location:
                preferences.location = location
            
            if salary is not None:
                preferences.salary = salary
            
            preferences.save()
            return True
        except Exception as e:
            print(f"Error modifying preferred jobs: {str(e)}")
            return False
        
    def modifyEducationWorkHistory(self, education=None, work_experience=None):
        """Method to modify education and work history"""
        if education:
            self.education = education
        
        if work_experience:
            self.workExperience = work_experience
        
        self.save()
        return True
    
    class Meta:
        db_table = 'Applicant'

class HRStaff(User):
    """
    HR Staff user model that extends the base User class.
    Represents HR personnel in the system.
    """
    phoneNumber = models.IntegerField()
    workingID = models.CharField(max_length=20)
    
    def postJobs(self, title, position_type, category, location, contact_email, min_education, min_experience, 
                description, salary, due_date):
        """Method to post new jobs"""
        job = JobPosting.objects.create(
            creatorUserID=self,
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
        
        # After creating the job, match it with user preferences
        system = SystemAIEngine()
        system.matchJobPositions(job)
        
        return job
        
    def modifyJobPostings(self, post_id, **kwargs):
        """Method to modify job postings"""
        try:
            job = JobPosting.objects.get(postID=post_id, creatorUserID=self)
            
            for key, value in kwargs.items():
                if hasattr(job, key):
                    setattr(job, key, value)
            
            job.save()
            return True
        except JobPosting.DoesNotExist:
            return False
        
    def viewApplications(self, post_id=None):
        """Method to view job applications"""
        if post_id:
            return JobApplication.objects.filter(postID__postID=post_id, postID__creatorUserID=self)
        else:
            return JobApplication.objects.filter(postID__creatorUserID=self)
        
    def searchApplications(self, name=None, date=None, category=None, passed_screen=None):
        """Method to search through applications"""
        applications = JobApplication.objects.filter(postID__creatorUserID=self)
        
        if name:
            applications = applications.filter(
                userID__firstName__icontains=name
            ) | applications.filter(
                userID__lastName__icontains=name
            )
        
        if date:
            applications = applications.filter(applicationDate=date)
        
        if category:
            applications = applications.filter(postID__category=category)
        
        if passed_screen is not None:
            applications = applications.filter(passedScreen=passed_screen)
        
        return applications
    
    class Meta:
        db_table = 'HRStaff'

class Administrator(User):
    """
    Administrator user model that extends the base User class.
    Represents system administrators with elevated privileges.
    """
    
    def createHRStaffAccount(self, first_name, last_name, email, password, phone_number, working_id):
        """Method to create HR staff accounts"""
        try:
            # Create new HR staff account
            hr_staff = HRStaff.objects.create(
                firstName=first_name,
                lastName=last_name,
                emailAddress=email,
                passwordSalt='', # Will be set by Django
                passwordHash='', # Will be set by Django
                accountType='HR',
                phoneNumber=phone_number,
                workingID=working_id
            )
            hr_staff.set_password(password)
            hr_staff.save()
            
            return hr_staff
        except Exception as e:
            print(f"Error creating HR staff account: {str(e)}")
            return None
        
    def manageJobCategories(self, action, category_name=None, new_name=None):
        """Method to manage job categories"""
        if action == 'add':
            if category_name:
                JobCategories.objects.create(category=category_name)
                return True
            return False
            
        elif action == 'modify':
            if category_name and new_name:
                try:
                    category = JobCategories.objects.get(category=category_name)
                    category.category = new_name
                    category.save()
                    return True
                except JobCategories.DoesNotExist:
                    return False
            return False
            
        elif action == 'delete':
            if category_name:
                try:
                    JobCategories.objects.get(category=category_name).delete()
                    return True
                except JobCategories.DoesNotExist:
                    return False
            return False
            
        return False
        
    def deleteJobPostings(self, post_id=None):
        """Method to delete job postings"""
        if post_id:
            try:
                JobPosting.objects.get(postID=post_id).delete()
                return True
            except JobPosting.DoesNotExist:
                return False
        return False
        
    def generateReports(self, report_type, year=None, month=None):
        """Method to generate system reports"""
        if report_type == 'monthly' and year and month:
            # Monthly applications report
            applications = JobApplication.objects.filter(
                applicationDate__year=year,
                applicationDate__month=month
            )
            
            # Group by category and count applications
            category_stats = {}
            for app in applications:
                category = app.postID.category
                if category not in category_stats:
                    category_stats[category] = {
                        'total': 0,
                        'qualified': 0
                    }
                
                category_stats[category]['total'] += 1
                if app.passedScreen == 'YES':
                    category_stats[category]['qualified'] += 1
            
            # Sort by total applications
            sorted_stats = sorted(
                category_stats.items(),
                key=lambda x: x[1]['total'],
                reverse=True
            )
            
            return sorted_stats
            
        elif report_type == 'yearly' and year:
            # Yearly applications report
            applications = JobApplication.objects.filter(
                applicationDate__year=year
            )
            
            # Group by category and count applications
            category_stats = {}
            for app in applications:
                category = app.postID.category
                if category not in category_stats:
                    category_stats[category] = {
                        'total': 0,
                        'qualified': 0
                    }
                
                category_stats[category]['total'] += 1
                if app.passedScreen == 'YES':
                    category_stats[category]['qualified'] += 1
            
            # Sort by total applications
            sorted_stats = sorted(
                category_stats.items(),
                key=lambda x: x[1]['total'],
                reverse=True
            )
            
            return sorted_stats
            
        elif report_type == 'monthly_candidates' and year and month:
            # Group by job title and count qualified candidates
            job_stats = {}
            applications = JobApplication.objects.filter(
                applicationDate__year=year,
                applicationDate__month=month
            )
            
            for app in applications:
                job_title = app.postID.title
                if job_title not in job_stats:
                    job_stats[job_title] = {
                        'total': 0,
                        'qualified': 0
                    }
                
                job_stats[job_title]['total'] += 1
                if app.passedScreen == 'YES':
                    job_stats[job_title]['qualified'] += 1
            
            # Calculate qualification rate and sort
            for job in job_stats:
                total = job_stats[job]['total']
                qualified = job_stats[job]['qualified']
                job_stats[job]['rate'] = qualified / total if total > 0 else 0
            
            sorted_stats = sorted(
                job_stats.items(),
                key=lambda x: x[1]['rate'],
                reverse=True
            )
            
            return sorted_stats
            
        elif report_type == 'yearly_candidates' and year:
            # Group by job title and count qualified candidates
            job_stats = {}
            applications = JobApplication.objects.filter(
                applicationDate__year=year
            )
            
            for app in applications:
                job_title = app.postID.title
                if job_title not in job_stats:
                    job_stats[job_title] = {
                        'total': 0,
                        'qualified': 0
                    }
                
                job_stats[job_title]['total'] += 1
                if app.passedScreen == 'YES':
                    job_stats[job_title]['qualified'] += 1
            
            # Calculate qualification rate and sort
            for job in job_stats:
                total = job_stats[job]['total']
                qualified = job_stats[job]['qualified']
                job_stats[job]['rate'] = qualified / total if total > 0 else 0
            
            sorted_stats = sorted(
                job_stats.items(),
                key=lambda x: x[1]['rate'],
                reverse=True
            )
            
            return sorted_stats
            
        return None
    
    class Meta:
        db_table = 'Administrator'

class JobCategories(models.Model):
    """
    Job Categories model for storing job categories.
    """
    category = models.CharField(max_length=50, primary_key=True)
    
    def addCategory(self, name):
        """Method to add a new category"""
        try:
            JobCategories.objects.create(category=name)
            return True
        except Exception as e:
            print(f"Error adding category: {str(e)}")
            return False
        
    def modifyCategory(self, new_name):
        """Method to modify an existing category"""
        try:
            self.category = new_name
            self.save()
            return True
        except Exception as e:
            print(f"Error modifying category: {str(e)}")
            return False
        
    def deleteCategory(self):
        """Method to delete a category"""
        try:
            self.delete()
            return True
        except Exception as e:
            print(f"Error deleting category: {str(e)}")
            return False
    
    class Meta:
        db_table = 'JobCategories'

class JobPosting(models.Model):
    """
    Job Posting model for storing job listings.
    """
    postID = models.AutoField(primary_key=True)
    creatorUserID = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)  # Added title field which was missing
    positionType = models.CharField(max_length=50)
    category = models.CharField(max_length=50)
    location = models.CharField(max_length=100)
    contactEmail = models.EmailField()
    minimalRequiredEducationLevel = models.CharField(max_length=50)
    minimalRequiredWorkingExperience = models.CharField(max_length=50)
    jobDescription = models.TextField()
    postDate = models.DateField(auto_now_add=True)
    dueDate = models.DateField()
    salary = models.IntegerField()
    
    def createJobPosting(cls, creator, title, position_type, category, location, contact_email, 
                        min_education, min_experience, description, salary, due_date):
        """Method to create a job posting (class method)"""
        return cls.objects.create(
            creatorUserID=creator,
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
        
    def modifyJobPosting(self, **kwargs):
        """Method to modify a job posting"""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        
        self.save()
        return True
        
    def deleteJobPosting(self):
        """Method to delete a job posting"""
        self.delete()
        return True
    
    class Meta:
        db_table = 'JobPosting'

class JobApplication(models.Model):
    """
    Job Application model for storing applications.
    """
    applicationID = models.AutoField(primary_key=True)
    postID = models.ForeignKey(JobPosting, on_delete=models.CASCADE)
    userID = models.ForeignKey(User, on_delete=models.CASCADE)
    applicationDate = models.DateField(auto_now_add=True)
    jobSpecificInfo = models.TextField()
    education = models.CharField(max_length=255)
    workExperience = models.IntegerField()
    passedScreen = models.CharField(max_length=10)  # YES, NO, or PENDING
    
    def submitApplication(cls, user, job_posting, job_specific_info, education, work_experience):
        """Method to submit an application (class method)"""
        application = cls.objects.create(
            postID=job_posting,
            userID=user,
            jobSpecificInfo=job_specific_info,
            education=education,
            workExperience=work_experience,
            passedScreen="PENDING"
        )
        
        # Trigger screening
        system = SystemAIEngine()
        system.screenApplication(application)
        
        return application
    
    class Meta:
        db_table = 'JobApplication'

class JobPreferences(models.Model):
    """
    Job Preferences model for storing applicant job preferences.
    """
    userID = models.ForeignKey(User, on_delete=models.CASCADE, primary_key=True)
    positionType = models.CharField(max_length=50)
    category = models.CharField(max_length=50)
    location = models.CharField(max_length=100)
    salary = models.IntegerField()
    
    def addPreference(cls, user, position_type, category, location, salary):
        """Method to add a job preference (class method)"""
        preference, created = cls.objects.get_or_create(userID=user)
        
        preference.positionType = position_type
        preference.category = category
        preference.location = location
        preference.salary = salary
        
        preference.save()
        return preference
        
    def modifyPreference(self, **kwargs):
        """Method to modify a job preference"""
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        
        self.save()
        return True
        
    def deletePreference(self):
        """Method to delete a job preference"""
        self.delete()
        return True
    
    class Meta:
        db_table = 'JobPreferences'

class SystemAIEngine:
    """
    System AI Engine class for automated tasks.
    """
    
    def screenApplication(self, application):
        """Method to screen applications"""
        # Get job requirements
        job = application.postID
        applicant = application.userID
        
        # Calculate education score (0-40 points)
        education_score = self._calculate_education_score(application)
        
        # Calculate experience score (0-40 points)
        experience_score = self._calculate_experience_score(application)
        
        # Calculate skills match score (0-20 points)
        skills_score = 15  # Default score for skills - would be more complex in real implementation
        
        # Calculate total score
        total_score = education_score + experience_score + skills_score
        
        # Update application with score and screening result
        if total_score >= 75:
            application.passedScreen = "YES"
        else:
            application.passedScreen = "NO"
        
        application.save()
        
        # Send notifications
        if application.passedScreen == "YES":
            self.sendAlertEmails(job.creatorUserID.emailAddress, 
                                f"Qualified applicant for {job.title}", 
                                f"A new qualified applicant ({applicant.firstName} {applicant.lastName}) has applied for the position of {job.title}.")
        else:
            # Will send rejection email after due date
            pass
        
        return application.passedScreen
    
    def _calculate_education_score(self, application):
        """Calculate education score based on requirements"""
        required_level = application.postID.minimalRequiredEducationLevel.lower()
        applicant_education = application.education.lower()
        
        # Define education levels
        education_levels = {
            'high school': 1,
            'associate': 2,
            'bachelor': 3,
            'master': 4,
            'doctorate': 5
        }
        
        # Get numeric levels for comparison
        required_level_num = 0
        applicant_level_num = 0
        
        for level, value in education_levels.items():
            if level in required_level:
                required_level_num = value
            if level in applicant_education:
                applicant_level_num = value
        
        # Calculate score
        if applicant_level_num > required_level_num:
            return 40  # Exceeds required
        elif applicant_level_num == required_level_num:
            return 30  # Meets required
        elif applicant_level_num == required_level_num - 1:
            return 15  # One level below
        else:
            return 0   # More than one level below
    
    def _calculate_experience_score(self, application):
        """Calculate experience score based on requirements"""
        try:
            required_years = int(application.postID.minimalRequiredWorkingExperience)
        except ValueError:
            # If value can't be converted to int, default to string comparison
            if "year" in application.postID.minimalRequiredWorkingExperience.lower():
                parts = application.postID.minimalRequiredWorkingExperience.lower().split()
                for i, part in enumerate(parts):
                    if part == "year" or part == "years":
                        try:
                            required_years = int(parts[i-1])
                            break
                        except (ValueError, IndexError):
                            required_years = 1
            else:
                required_years = 1
        
        # Calculate score: years * 8, max 40 points
        applicant_years = application.workExperience
        experience_score = min(applicant_years * 8, 40)
        
        return experience_score
        
    def sendAlertEmails(self, recipient, subject, message):
        """Method to send alert emails"""
        from django.core.mail import send_mail
        
        try:
            send_mail(
                subject,
                message,
                'noreply@recruitingsystem.com',
                [recipient],
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False
        
    def matchJobPositions(self, job_posting):
        """Method to match jobs with preferences"""
        # Find users with matching preferences
        matching_preferences = JobPreferences.objects.filter(
            category=job_posting.category
        )
        
        # For each match, send an email notification
        for preference in matching_preferences:
            # Check if the job matches other preferences
            matches = True
            
            # Check position type
            if preference.positionType and preference.positionType != job_posting.positionType:
                matches = False
                
            # Check location
            if preference.location and job_posting.location.lower().find(preference.location.lower()) == -1:
                matches = False
                
            # Check salary
            if preference.salary and job_posting.salary < preference.salary:
                matches = False
                
            # If it matches, send email notification
            if matches:
                user = preference.userID
                subject = "New Job Matching Your Preferences"
                message = f"""
                Hello {user.firstName},
                
                A new job matching your preferences has been posted:
                
                Title: {job_posting.title}
                Location: {job_posting.location}
                Salary: ${job_posting.salary}
                
                You can apply for this position through your account.
                
                Best regards,
                Online Recruiting System
                """
                
                self.sendAlertEmails(user.emailAddress, subject, message)
                
        return True