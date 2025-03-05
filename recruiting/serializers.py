from rest_framework import serializers
from .models import (
    User, Applicant, HRStaff, Administrator,
    JobCategories, JobPosting, JobApplication, JobPreferences
)

class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model"""
    class Meta:
        model = User
        fields = ['userID', 'firstName', 'lastName', 'emailAddress', 
                  'accountType', 'imagePath']
        read_only_fields = ['userID']

class ApplicantSerializer(serializers.ModelSerializer):
    """Serializer for the Applicant model"""
    class Meta:
        model = Applicant
        fields = ['userID', 'firstName', 'lastName', 'emailAddress', 
                  'phoneNumber', 'dateOfBirth', 'education', 'workExperience',
                  'street', 'city', 'postalCode', 'imagePath']
        read_only_fields = ['userID']

class HRStaffSerializer(serializers.ModelSerializer):
    """Serializer for the HRStaff model"""
    class Meta:
        model = HRStaff
        fields = ['userID', 'firstName', 'lastName', 'emailAddress', 
                  'phoneNumber', 'workingID', 'imagePath']
        read_only_fields = ['userID']

class JobCategoriesSerializer(serializers.ModelSerializer):
    """Serializer for the JobCategories model"""
    class Meta:
        model = JobCategories
        fields = ['category']

class JobPostingSerializer(serializers.ModelSerializer):
    """Serializer for the JobPosting model"""
    creatorName = serializers.SerializerMethodField()
    
    class Meta:
        model = JobPosting
        fields = ['postID', 'creatorUserID', 'creatorName', 'title', 'positionType', 
                  'category', 'location', 'contactEmail', 'minimalRequiredEducationLevel', 
                  'minimalRequiredWorkingExperience', 'jobDescription', 'postDate', 
                  'dueDate', 'salary']
        read_only_fields = ['postID', 'creatorUserID', 'postDate']
    
    def get_creatorName(self, obj):
        """Get the name of the job posting creator"""
        return f"{obj.creatorUserID.firstName} {obj.creatorUserID.lastName}"

class JobApplicationSerializer(serializers.ModelSerializer):
    """Serializer for the JobApplication model"""
    applicantName = serializers.SerializerMethodField()
    jobTitle = serializers.SerializerMethodField()
    
    class Meta:
        model = JobApplication
        fields = ['applicationID', 'postID', 'userID', 'applicantName', 'jobTitle',
                  'applicationDate', 'jobSpecificInfo', 'education', 'workExperience',
                  'passedScreen']
        read_only_fields = ['applicationID', 'userID', 'applicationDate', 'passedScreen']
    
    def get_applicantName(self, obj):
        """Get the name of the applicant"""
        return f"{obj.userID.firstName} {obj.userID.lastName}"
    
    def get_jobTitle(self, obj):
        """Get the title of the job posting"""
        return obj.postID.title

class JobPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for the JobPreferences model"""
    userName = serializers.SerializerMethodField()
    
    class Meta:
        model = JobPreferences
        fields = ['userID', 'userName', 'positionType', 'category', 'location', 'salary']
        read_only_fields = ['userID']
    
    def get_userName(self, obj):
        """Get the name of the user"""
        return f"{obj.userID.firstName} {obj.userID.lastName}"