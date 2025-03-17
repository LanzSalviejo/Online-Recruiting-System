## Technology Stack

- **Frontend:** React 19, React Router 7, Axios
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **Email Service:** Nodemailer
- **UI Components:** Custom components + Lucide React icons
- **Charting:** Recharts for data visualization

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- PostgreSQL (v12 or higher)

### Database Setup

1. Create a PostgreSQL database for the application:

```sql
CREATE DATABASE online_recruiting_system;
```

2. Create a PostgreSQL user with appropriate permissions:

```sql
CREATE USER recruiter WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE online_recruiting_system TO recruiter;
```

### Backend Setup

1. Navigate to the server directory:

```bash
cd online-recruiting-system/server
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables by creating a `.env` file in the server folder:

```
# Server Configuration
PORT=5000
NODE_ENV=development

# PostgreSQL Configuration
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=online_recruiting_system

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_should_be_long_and_complex

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USERNAME=your_email_username
EMAIL_PASSWORD=your_email_password
EMAIL_FROM_NAME=Online Recruiting System
EMAIL_FROM_ADDRESS=noreply@example.com
```

4. Initialize the database schema:

```bash
psql -U postgres -d online_recruiting_system -f ./config/schema.sql
psql -U postgres -d online_recruiting_system -f ./config/job_schema.sql
psql -U postgres -d online_recruiting_system -f ./migrations/create_notifications_table.sql
psql -U postgres -d online_recruiting_system -f ./migrations/add_screening_fields.sql
```

5. Start the server:

```bash
npm start
```

The server should now be running on http://localhost:5000.

### Frontend Setup

1. Navigate to the project root directory:

```bash
cd online-recruiting-system
```

2. Install dependencies:

```bash
npm install
```

3. Configure the API endpoint by creating a `.env` file:

```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:

```bash
npm start
```

The application should now be running at http://localhost:3000.

## Development

### Project Structure

```
online-recruiting-system/
├── public/                   # Static files
├── src/                      # Frontend source code
│   ├── components/           # Reusable components
│   │   ├── admin/            # Admin-specific components
│   │   ├── applicant/        # Applicant-specific components
│   │   ├── hr/               # HR-specific components
│   │   ├── layouts/          # Layout components
│   │   └── common/           # Shared components
│   ├── contexts/             # React contexts
│   ├── pages/                # Page components
│   │   ├── admin/            # Admin pages
│   │   ├── applicant/        # Applicant pages
│   │   ├── auth/             # Authentication pages
│   │   ├── hr/               # HR pages
│   │   ├── jobs/             # Job-related pages
│   │   └── profile/          # Profile pages
│   ├── services/             # API services
│   ├── styles/               # CSS styles
│   ├── utils/                # Utility functions
│   ├── App.js                # Main application component
│   └── index.js              # Application entry point
├── server/                   # Backend source code
│   ├── config/               # Configuration files
│   ├── controllers/          # API controllers
│   ├── middleware/           # Express middleware
│   ├── models/               # Data models
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── utils/                # Utility functions
│   └── server.js             # Server entry point
├── .env                      # Frontend environment variables
├── server/.env               # Backend environment variables
└── package.json              # Project dependencies
```

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Runs the test suite
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from create-react-app

## Deployment

### Backend Deployment

1. Set environment variables for production
2. Build the server:

```bash
cd server
npm run build
```

3. Start the server:

```bash
npm run start:prod
```

### Frontend Deployment

1. Build the React application:

```bash
npm run build
```

2. Deploy the contents of the `build` directory to your web server or hosting service

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Ensure PostgreSQL is running
   - Verify database credentials in the `.env` file
   - Check that the database and tables are properly created

2. **API Connection Issues**:
   - Verify the `REACT_APP_API_URL` in the frontend `.env` file
   - Ensure the backend server is running
   - Check for CORS issues in the backend configuration

3. **Authentication Problems**:
   - Ensure the JWT secret is properly set
   - Check token expiration settings
   - Verify that the auth middleware is correctly configured

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request