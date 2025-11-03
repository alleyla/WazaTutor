# WazaTutor Backend Server

This is the authentication and user management backend for WazaTutor.

## Features

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Input validation with Joi
- Rate limiting for security
- PostgreSQL database for user storage
- Protected account management endpoints

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and JWT secret:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wazatutor
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your-very-secure-secret-key
```

3. Create the PostgreSQL database:
```bash
psql -U postgres
CREATE DATABASE wazatutor;
\q
```

4. Initialize the database schema:
```bash
npm run init-db
```

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will run on port 3002 by default (configurable via SERVER_PORT in .env).

## API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user.

**Request body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "userId": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

#### POST /api/auth/login
Login with existing credentials.

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "userId": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

#### GET /api/auth/verify
Verify a JWT token (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "userId": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

#### POST /api/auth/logout
Logout (client-side token removal).

**Response:**
```json
{
  "message": "Logout successful"
}
```

### Account Management

#### GET /api/account
Get user account information (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "userId": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /api/account
Update user account information (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request body:**
```json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

**Response:**
```json
{
  "message": "Account updated successfully",
  "user": {
    "userId": 1,
    "username": "newusername",
    "email": "newemail@example.com",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Security Features

- Passwords are hashed using bcrypt with salt rounds
- JWT tokens expire after 7 days (configurable)
- Rate limiting on auth endpoints (10 requests per 15 minutes per IP)
- Input validation using Joi
- Helmet for security headers
- CORS protection

## Database Schema

### users table
```sql
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
