from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router for our API views
router = DefaultRouter()
router.register(r'jobs', views.JobPostingViewSet, basename='jobposting')
router.register(r'applications', views.JobApplicationViewSet, basename='jobapplication')
router.register(r'preferences', views.JobPreferencesViewSet, basename='jobpreferences')
router.register(r'categories', views.JobCategoriesViewSet, basename='jobcategories')

# URL patterns
urlpatterns = [
    # Authentication URLs
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    
    # Dashboard URLs
    path('', views.dashboard_view, name='dashboard'),
    
    # API URLs
    path('