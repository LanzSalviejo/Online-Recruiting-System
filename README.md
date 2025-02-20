## Installation Instructions

### Windows Installation

1. **Install Python:**

   - Download Python from [python.org](https://www.python.org/downloads/)
   - During installation, check "Add Python to PATH"
   - Verify installation:
     ```cmd
     python --version
     pip --version
     ```

2. **Install Node.js:**

   - Download Node.js from [nodejs.org](https://nodejs.org/)
   - Run the installer
   - Verify installation:
     ```cmd
     node --version
     npm --version
     ```

3. **Install PostgreSQL:**

   - Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Run the installer
   - Remember your password and port number
   - Add PostgreSQL bin directory to PATH if not done automatically

4. **Set up the Backend:**

   ```cmd
   # Create and activate virtual environment
   python -m venv venv
   venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt

   # Set up database
   python manage.py makemigrations
   python manage.py migrate

   # Create superuser
   python manage.py createsuperuser

   # Run the server
   python manage.py runserver
   ```

5. **Set up the Frontend:**

   ```cmd
   # Install dependencies
   npm install

   # Run the development server
   npm run dev
   ```

### Linux Installation

1. **Install Python and pip:**

   ```bash
   sudo apt update
   sudo apt install python3 python3-pip python3-venv
   ```

2. **Install Node.js and npm:**

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
   sudo apt install nodejs
   ```

3. **Install PostgreSQL:**

   ```bash
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql

   # Create database
   sudo -u postgres psql
   CREATE DATABASE recruitingdb;
   CREATE USER myuser WITH PASSWORD 'mypassword';
   GRANT ALL PRIVILEGES ON DATABASE recruitingdb TO myuser;
   \q
   ```

4. **Set up the Backend:**

   ```bash
   # Create and activate virtual environment
   python3 -m venv venv
   source venv/bin/activate

   # Install dependencies
   pip install -r requirements.txt

   # Set up database
   python manage.py makemigrations
   python manage.py migrate

   # Create superuser
   python manage.py createsuperuser

   # Run the server
   python manage.py runserver
   ```

5. **Set up the Frontend:**

   ```bash
   # Install dependencies
   npm install

   # Run the development server
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory:

```env
DEBUG=True
SECRET_KEY=your_secret_key
DATABASE_URL=postgresql://user:password@localhost:5432/recruitingdb
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@example.com
EMAIL_HOST_PASSWORD=your_email_password
```

## Running the Application

1. Start the Django backend:

   ```bash
   python manage.py runserver
   ```

2. In a new terminal, start the React frontend:

   ```bash
   npm run dev
   ```

3. Access the application at `http://localhost:3000`

## Running Tests

```bash
# Backend tests
python manage.py test

# Frontend tests
npm test
```
