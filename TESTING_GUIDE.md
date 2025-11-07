# Testing Guide for Authentication System

This guide provides step-by-step instructions for testing the new authentication system.

## Prerequisites

### 1. Install PostgreSQL
```bash
# For Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# For macOS with Homebrew
brew install postgresql
brew services start postgresql

# For Windows
# Download and install from: https://www.postgresql.org/download/windows/
```

### 2. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE wazatutor;

# Exit PostgreSQL
\q
```

### 3. Configure Backend
```bash
# Navigate to server directory
cd server

# Copy environment variables
cp .env.example .env

# Edit .env file with your database credentials
# Make sure to set:
# - DB_HOST=localhost
# - DB_PORT=5432
# - DB_NAME=wazatutor
# - DB_USER=postgres
# - DB_PASSWORD=your_password
# - JWT_SECRET=your-secret-key (use a long random string)

# Install backend dependencies
npm install

# Initialize database
npm run init-db
```

### 4. Configure Frontend
```bash
# In the root directory, ensure .env has:
REACT_APP_API_URL=http://localhost:3002
```

## Running the Application

### Terminal 1 - Backend Server
```bash
cd server
npm run dev
```

You should see:
```
WazaTutor API server is running on port 3002
Environment: development
```

### Terminal 2 - Frontend Development Server
```bash
# From root directory
npm start
```

The application should open at `http://localhost:3001`

## Manual Testing Checklist

### ✅ Test 1: User Registration

1. Navigate to `http://localhost:3001/#/register`
2. Fill in the registration form:
   - Username: `testuser` (alphanumeric only, 3-50 chars)
   - Email: `test@example.com` (valid email)
   - Password: `Test1234` (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
   - Confirm Password: `Test1234`
3. Click "Sign Up"
4. Expected results:
   - ✅ Success message appears
   - ✅ Automatically redirected to home page
   - ✅ Check browser localStorage (DevTools > Application > Local Storage):
     - `authToken` should exist
     - `userId` should exist
     - `username` should be `testuser`

**Error Cases to Test:**
- Passwords don't match → Error message
- Email already exists → Error: "Email already registered"
- Username already exists → Error: "Username already taken"
- Weak password → Validation error

### ✅ Test 2: User Login

1. Log out if logged in (go to `/account` and click Logout)
2. Navigate to `http://localhost:3001/#/login`
3. Fill in the login form:
   - Email: `test@example.com`
   - Password: `Test1234`
4. Click "Sign In"
5. Expected results:
   - ✅ Success message appears
   - ✅ Redirected to home page
   - ✅ Token stored in localStorage

**Error Cases to Test:**
- Wrong password → Error: "Invalid email or password"
- Wrong email → Error: "Invalid email or password"
- Empty fields → Validation error

### ✅ Test 3: Protected Routes

1. Clear localStorage (DevTools > Application > Local Storage > Clear All)
2. Try to navigate to `http://localhost:3001/#/account`
3. Expected result:
   - ✅ Shows loading spinner briefly
   - ✅ Redirected to `/login` page

4. Log in again
5. Navigate to `http://localhost:3001/#/account`
6. Expected result:
   - ✅ Account page loads successfully
   - ✅ Shows current username and email

### ✅ Test 4: Account Management

1. While logged in, navigate to `/account`
2. Change username to `testuser2`
3. Click "Update Account"
4. Expected results:
   - ✅ Success message appears
   - ✅ Username updated in localStorage
   - ✅ Can verify in database:
     ```bash
     psql -U postgres wazatutor
     SELECT * FROM users;
     ```

**Error Cases to Test:**
- Username already taken → Error message
- Email already taken → Error message

### ✅ Test 5: Token Expiration

1. Log in successfully
2. In PostgreSQL, manually expire the token by waiting (or modify JWT_EXPIRATION to "1s" for testing)
3. Try to access `/account`
4. Expected result:
   - ✅ Redirected to login page
   - ✅ Token removed from localStorage

### ✅ Test 6: Rate Limiting

1. Attempt to log in with wrong password 11 times rapidly
2. Expected result:
   - ✅ After 10 attempts, receive: "Too many requests from this IP, please try again later."
3. Wait 15 minutes or restart server to reset

### ✅ Test 7: Logout

1. While logged in, go to `/account`
2. Click "Logout" button
3. Expected results:
   - ✅ Success message appears
   - ✅ Redirected to login page
   - ✅ All auth data removed from localStorage

### ✅ Test 8: Navigation Between Pages

1. Log in
2. Test navigation:
   - Home (`/`)
   - Account (`/account`)
   - Back to Home
   - Logout
   - Login page should show
3. Expected results:
   - ✅ All navigation works smoothly
   - ✅ Protected routes redirect when not authenticated

## Backend API Testing (Optional)

You can test the API directly using curl or Postman:

### Register
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "apiuser",
    "email": "api@example.com",
    "password": "ApiTest123",
    "confirmPassword": "ApiTest123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api@example.com",
    "password": "ApiTest123"
  }'
```

### Verify Token
```bash
# Replace YOUR_TOKEN with the token from login response
curl -X GET http://localhost:3002/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Account
```bash
curl -X GET http://localhost:3002/api/account \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Account
```bash
curl -X PUT http://localhost:3002/api/account \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "updateduser"
  }'
```

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `pg_isready`
- Verify database exists: `psql -U postgres -l | grep wazatutor`
- Check .env file has correct credentials

### Frontend can't connect to backend
- Verify backend is running on port 3002
- Check REACT_APP_API_URL in .env
- Check browser console for CORS errors

### Database errors
- Ensure database was initialized: `cd server && npm run init-db`
- Check database connection: `psql -U postgres wazatutor`
- Verify users table exists: `\dt` in psql

### Token validation fails
- Check JWT_SECRET is set in server/.env
- Verify system time is correct (tokens have expiration)
- Check browser console for 401/403 errors

## Success Criteria

All tests above should pass. The authentication system should:
- ✅ Allow users to register new accounts
- ✅ Validate input properly (password strength, email format, etc.)
- ✅ Hash passwords securely (not stored in plain text)
- ✅ Generate and validate JWT tokens
- ✅ Protect routes requiring authentication
- ✅ Allow users to update their profile
- ✅ Handle logout properly
- ✅ Show appropriate error messages
- ✅ Rate limit authentication attempts
- ✅ Persist authentication across page refreshes
- ✅ Redirect expired sessions to login

## Database Verification

To verify users are being stored correctly:
```bash
psql -U postgres wazatutor

-- View all users (passwords should be hashed)
SELECT user_id, username, email, created_at FROM users;

-- Check password is hashed (should see bcrypt hash)
SELECT password_hash FROM users WHERE username = 'testuser';
```

You should see bcrypt hashes (starting with `$2b$`) NOT plain text passwords.
