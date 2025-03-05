from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from recruiting import views

# Create a router for our API views
router = DefaultRouter()
router.register(r'jobs', views.JobPostingViewSet, basename='jobposting')
router.register(r'applications', views.JobApplicationViewSet, basename='jobapplication')
router.register(r'preferences', views.JobPreferencesViewSet, basename='jobpreferences')
router.register(r'categories', views.JobCategoriesViewSet, basename='jobcategories')

# URL patterns
urlpatterns = [
    # Admin URLs
    path('admin/', admin.site.urls),

    # Authentication URLs
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    
    # Dashboard URLs
    path('', views.dashboard_view, name='dashboard'),
    
    # API URLs
    path('api/', include(router.urls)),
    path('api/reports/', views.ReportAPIView.as_view(), name='reports'),
    
    # Applicant URLs
    path('jobs/', views.applicant_job_list, name='job_list'),
    path('jobs/<int:job_id>/', views.job_detail, name='job_detail'),
    path('applications/', views.my_applications, name='my_applications'),
    path('profile/', views.profile_view, name='profile'),
    path('preferences/', views.preferences_view, name='preferences'),
    
    # HR Staff URLs
    path('hr/jobs/', views.hr_job_list, name='hr_job_list'),
    path('hr/jobs/create/', views.create_job, name='create_job'),
    path('hr/jobs/<int:job_id>/', views.edit_job, name='edit_job'),
    path('hr/applications/', views.view_applications, name='view_applications'),
    
    # Admin URLs
    path('admin/staff/', views.admin_staff_list, name='admin_staff_list'),
    path('admin/staff/create/', views.create_hr_staff, name='create_hr_staff'),
    path('admin/categories/', views.admin_categories, name='admin_categories'),
    path('admin/reports/', views.admin_reports, name='admin_reports'),
]