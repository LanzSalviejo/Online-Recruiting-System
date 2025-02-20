from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import datetime, timedelta
from decimal import Decimal

from ..models import (
    JobCategory,
    JobPosting,
    JobApplication,
    JobPreference,
    UserEducation,
    UserExperience
)

class JobPostingViewSetTests(APITestCase):
    def setUp(self):
        # Create test users
        self.admin_user = get_user_model().objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='testpass123'
        )
        self.hr_user = get_user_model().objects.create_user(
            username='hrstaff',
            email='hr@test.com',
            password='testpass123',
            account_type='HR'
        )
        self.applicant_user = get_user_model().objects.create_user(
            username='applicant',
            email='applicant@test.com',
            password='testpass123',
            account_type='APPLICANT'
        )

        # Create test category
        self.category = JobCategory.objects.create(
            name='Information Technology',
            description='IT related jobs'
        )

        # Create test job posting
        self.job_posting = JobPosting.objects.create(
            creator=self.hr_user,
            title='Software Developer',
            position_type='FULL_TIME',
            category=self.category,
            location='Remote',
            contact_email='hr@company.com',
            min_education_level='Bachelor',
            min_experience_years=2,
            job_description='Test job description',
            salary_range_min=Decimal('50000.00'),
            salary_range_max=Decimal('80000.00'),
            due_date=datetime.now() + timedelta(days=30)
        )

        self.client = Client()

    def test_list_job_postings(self):
        """Test retrieving list of job postings"""
        self.client.force_login(self.applicant_user)
        response = self.client.get(reverse('jobposting-list'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Software Developer')

    def test_create_job_posting_as_hr(self):
        """Test creating job posting as HR staff"""
        self.client.force_login(self.hr_user)
        data = {
            'title': 'Senior Developer',
            'position_type': 'FULL_TIME',
            'category': self.category.id,
            'location': 'New York',
            'contact_email': 'hr@company.com',
            'min_education_level': 'Masters',
            'min_experience_years': 5,
            'job_description': 'Senior role',
            'salary_range_min': '80000.00',
            'salary_range_max': '120000.00',
            'due_date': (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        response = self.client.post(reverse('jobposting-list'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(JobPosting.objects.count(), 2)

    def test_create_job_posting_as_applicant(self):
        """Test creating job posting as applicant (should fail)"""
        self.client.force_login(self.applicant_user)
        data = {
            'title': 'Should Not Work',
            'position_type': 'FULL_TIME',
            'category': self.category.id,
            'location': 'Test',
            'contact_email': 'test@test.com',
            'min_education_level': 'Bachelor',
            'min_experience_years': 1,
            'job_description': 'Test',
            'salary_range_min': '40000.00',
            'salary_range_max': '60000.00',
            'due_date': (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        response = self.client.post(reverse('jobposting-list'), data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

class JobApplicationViewSetTests(APITestCase):

class ReportViewSetTests(APITestCase):
