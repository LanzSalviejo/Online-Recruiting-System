// User model - base model for all user types
const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    accountType: { 
      type: String, 
      required: true, 
      enum: ['applicant', 'hr', 'admin'] 
    },
    imagePath: { type: String, default: '/images/default-avatar.png' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  // Applicant model - extends User
  const ApplicantSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    phoneNumber: { type: String },
    dateOfBirth: { type: Date },
    address: {
      street: { type: String },
      city: { type: String },
      postalCode: { type: String }
    },
    // Education and work experience will be separate collections with references
    // Preferred jobs will be another collection
  });
  
  // HR Staff model - extends User
  const HRStaffSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workingId: { type: String, required: true },
    phoneNumber: { type: String }
  });
  
  // Administrator model - extends User
  // Using the base User model with accountType = 'admin'
  
  // Education model - linked to Applicant
  const EducationSchema = new mongoose.Schema({
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', required: true },
    degree: { 
      type: String, 
      enum: ['High School', 'Associate', 'Diploma', 'Bachelor', 'Master', 'PhD', 'Other'] 
    },
    fieldOfStudy: { type: String },
    institution: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    inProgress: { type: Boolean, default: false },
    description: { type: String }
  });
  
  // Work Experience model - linked to Applicant
  const WorkExperienceSchema = new mongoose.Schema({
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String },
    skills: [{ type: String }],
    // Duration will be calculated when needed
  });
  
  // Job Category model
  const JobCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  // Job Posting model
  const JobPostingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    positionType: { 
      type: String, 
      required: true,
      enum: ['Full Time', 'Part Time', 'Contract', 'Internship', 'Co-op'] 
    },
    category: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'JobCategory', 
      required: true 
    },
    location: { type: String, required: true },
    contactEmail: { type: String, required: true },
    minEducationLevel: { 
      type: String, 
      required: true,
      enum: ['High School', 'Associate', 'Diploma', 'Bachelor', 'Master', 'PhD'] 
    },
    minExperience: { type: Number, required: true, min: 0 }, // in years
    description: { type: String, required: true },
    responsibilities: [{ type: String }],
    requirements: [{ type: String }],
    salary: { type: Number },
    postDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true }
  });
  
  // Job Preferences model - linked to Applicant
  const JobPreferenceSchema = new mongoose.Schema({
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', required: true },
    positionType: [{ 
      type: String, 
      enum: ['Full Time', 'Part Time', 'Contract', 'Internship', 'Co-op'] 
    }],
    categories: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'JobCategory'
    }],
    locations: [{ type: String }],
    minSalary: { type: Number },
    keywords: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  // Job Application model
  const JobApplicationSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting', required: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', required: true },
    applicationDate: { type: Date, default: Date.now },
    coverLetter: { type: String },
    resumePath: { type: String },
    status: { 
      type: String, 
      enum: ['Pending', 'Screened Out', 'Under Review', 'Interview', 'Offer', 'Rejected', 'Accepted'], 
      default: 'Pending' 
    },
    screeningScore: { type: Number },
    passedScreening: { type: Boolean },
    notes: { type: String },
    updatedAt: { type: Date, default: Date.now }
  });
  
  // Create models from schemas
  const User = mongoose.model('User', UserSchema);
  const Applicant = mongoose.model('Applicant', ApplicantSchema);
  const HRStaff = mongoose.model('HRStaff', HRStaffSchema);
  const Education = mongoose.model('Education', EducationSchema);
  const WorkExperience = mongoose.model('WorkExperience', WorkExperienceSchema);
  const JobCategory = mongoose.model('JobCategory', JobCategorySchema);
  const JobPosting = mongoose.model('JobPosting', JobPostingSchema);
  const JobPreference = mongoose.model('JobPreference', JobPreferenceSchema);
  const JobApplication = mongoose.model('JobApplication', JobApplicationSchema);
  
  // Export models
  module.exports = {
    User,
    Applicant,
    HRStaff,
    Education,
    WorkExperience,
    JobCategory,
    JobPosting,
    JobPreference,
    JobApplication
  };