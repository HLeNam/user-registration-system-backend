# User Registration API - Backend

A NestJS-based REST API for user registration and authentication system with PostgreSQL database.

## 📋 Features

- User registration with email and password validation
- Password hashing using bcrypt for security
- JWT token-based authentication
- PostgreSQL database integration with TypeORM
- CORS enabled for frontend integration
- Comprehensive error handling
- Environment-based configuration

## 🛠️ Tech Stack

- **Framework**: NestJS 11.x
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt for password hashing
- **Validation**: class-validator and class-transformer
- **ORM**: TypeORM 0.3.27

## 📦 Prerequisites

Before running the project, ensure you have:

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🚀 Installation

1. **Clone the repository** (if applicable)

   ```bash
   git clone https://github.com/HLeNam/user-registration-system-backend
   cd user-registration-system-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.development` file in the root directory and add the following variables:

   ```env
   NODE_ENV=development

   # Database Configuration
   DB_URL=postgresql://username:password@localhost:5432/user_registration_db
   DB_TYPE=postgres
   DB_SYNCHRONIZE=true
   DB_AUTO_LOAD_ENTITIES=true

   # Security
   SECRET_KEY=your_secret_key_here

   # JWT Configuration
   JWT_TOKEN_SECRET=your_jwt_secret_key_here
   JWT_TOKEN_EXPIRES_IN=3600
   JWT_REFRESH_TOKEN_EXPIRES_IN=86400
   JWT_TOKEN_AUDIENCE=localhost:3000
   JWT_TOKEN_ISSUER=localhost:3000

   # Cookie Configuration
   COOKIE_SECRET=your_cookie_secret_here
   ACCESS_TOKEN_COOKIE_NAME=access_token
   REFRESH_TOKEN_COOKIE_NAME=refresh_token
   COOKIE_SECURE=false
   COOKIE_SAME_SITE=lax

   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

   **⚠️ Important**: Never commit `.env` file to version control. Add it to `.gitignore`.

4. **Create PostgreSQL database**

   ```bash
   createdb user_registration_db
   ```

   Or use your PostgreSQL client to create a new database named `user_registration_db`.

## 🏃 Running the Application

### Development Mode

Start the development server with hot-reload enabled (`.env.development` for dev):

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

### Production Mode

Build and run the production version (`.env` for prod):

```bash
npm run build
npm run start:prod
```

### Debug Mode

Run with debugging enabled (`.env.test` for debug):

```bash
npm run start:debug
```

## 📚 API Endpoints

### User Registration

**Endpoint**: `POST /api/auth/register`

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (201)**:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "5bed0ec8-7379-4939-9251-33de0e98fdc7",
      "email": "user@example.com",
      "createdAt": "2025-10-26T21:51:29.385Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YmVkMGVjOC03Mzc5LTQ5MzktOTI1MS0zM2RlMGU5OGZkYzciLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ0b2tlblR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NjE1NDA2ODgsImV4cCI6MTc2MTU0NDI4OCwiYXVkIjoibG9jYWxob3N0OjMwMDAiLCJpc3MiOiJsb2NhbGhvc3Q6MzAwMCJ9.uxpAMQ9opq_TPymxDo2k2hognT40vaO71xgUQMUt_a0",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YmVkMGVjOC03Mzc5LTQ5MzktOTI1MS0zM2RlMGU5OGZkYzciLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ0b2tlblR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzYxNTQwNjg4LCJleHAiOjE3NjE2MjcwODgsImF1ZCI6ImxvY2FsaG9zdDozMDAwIiwiaXNzIjoibG9jYWxob3N0OjMwMDAifQ.RPmtfGqSQl9u9B9cYd8lycLtAn-3ex6RWq8TkJ81BJE",
      "accessTokenExpiresAt": 1761544288,
      "refreshTokenExpiresAt": 1761627088,
      "refreshTokenIssuedAt": 1761540688
    }
  },
  "timestamp": "2025-10-27T04:51:28.575Z",
  "path": "/api/auth/register"
}
```

**Error Response (400/409)**:

```json
{
  "success": false,
  "message": "email already exists",
  "errors": {
    "email": ["email 'user@example.com' is already taken"]
  },
  "timestamp": "2025-10-27T04:50:16.482Z",
  "path": "/api/auth/register"
}
```

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "password": [
      "password must contain at least one lowercase letter, one uppercase letter, and one number"
    ]
  },
  "timestamp": "2025-10-27T04:52:09.816Z",
  "path": "/api/auth/register"
}
```

### Validation Rules

- **Email**: Must be a valid email format and unique in the database
- **Password**: Password must contain at least one lowercase letter, one uppercase letter, and one number

## 🗄️ Database Schema

### User Table

| Field                 | Type     | Constraints      | Description                |
| --------------------- | -------- | ---------------- | -------------------------- |
| id                    | UUID     | Primary Key      | Unique identifier          |
| email                 | String   | Unique, Not Null | User email address         |
| password              | String   | Not Null         | Hashed password            |
| refreshToken          | String   |                  | Refresh token              |
| refreshTokenExpiresAt | Date     | Timestamp        | Refresh token expire at    |
| refreshTokenIssuedAt  | Date     | Timestamp        | Refresh token issue at     |
| createdAt             | DateTime | Default: now()   | Account creation timestamp |

## 🔒 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt with salt rounds
- **CORS Protection**: Configured to accept requests only from whitelisted frontend URLs
- **Environment Variables**: Sensitive data is stored in `.env` file
- **Input Validation**: Server-side validation using class-validator
- **JWT Tokens**: Secure token-based authentication

## 🚨 Troubleshooting

### Database Connection Error

- Ensure PostgreSQL is running
- Verify `DB_URL` in `.env` file is correct
- Check if the database exists and credentials are valid

### Port Already in Use

- Change the port in `main.ts` or use:
  ```bash
  PORT=3000 npm run start:dev
  ```

### CORS Error

- Update `FRONTEND_URL` in `.env` to match your frontend URL
- Ensure CORS is properly configured in `main.ts`
