from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator

class User(AbstractUser):
    ACCOUNT_TYPES = (
        ('APPLICANT', 'Applicant'),
        ('HR', 'HR Staff'),
        ('ADMIN', 'Administrator')
    )
    
    account_type = models.CharField(max_length=10, choices=ACCOUNT_TYPES)
    phone_number = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    working_id = models.CharField(max_length=20, blank=True)  # For HR staff

class JobCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Job Categories"

class JobPosting(models.Model):
    POSITION_TYPES = (
        ('FULL_TIME', 'Full Time'),
        ('PART_TIME', 'Part Time'),
        ('CONTRACT', 'Contract'),
        ('COOP', 'Co-op')
    )
    EDUCATION_TYPES = (
        ('MASTERS', 'Masters'),
        ('BACHELORS','Bachelors'),
        ('ASSOCIATE','Associate'),
        ('CERTIFICATE','Certificate'),
        ('HIGH_SCHOOL','High School')
    )

    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    position_type = models.CharField(max_length=20, choices=POSITION_TYPES)
    category = models.ForeignKey(JobCategory, on_delete=models.CASCADE)
    location = models.CharField(max_length=100)
    contact_email = models.EmailField()
    min_education_level = models.CharField(max_length=100,choices=EDUCATION_TYPES)
    min_experience_years = models.PositiveIntegerField()
    job_description = models.TextField()
    salary_range_min = models.DecimalField(max_digits=10, decimal_places=2)
    salary_range_max = models.DecimalField(max_digits=10, decimal_places=2)
    post_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)

class JobApplication(models.Model):


class JobPreference(models.Model):


class UserEducation(models.Model):
    EDUCATION_TYPES = (
        ('MASTERS', 'Masters'),
        ('BACHELORS','Bachelors'),
        ('ASSOCIATE','Associate'),
        ('CERTIFICATE','Certificate'),
        ('HIGH_SCHOOL','High School')
    )

    education_level = models.CharField(max_length=100,choices=EDUCATION_TYPES)


class UserExperience(models.Model):
