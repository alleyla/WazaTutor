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
- Served behind the same origin as the React app in production (no CORS needed)

## Development

- Run the Express API on port 3002
- Run the React dev server on port 3001
- The frontend uses a proxy (`src/setupProxy.js`), so requests to `/api/*` are forwarded to the Express server (no CORS needed in dev)

## Production

- Build the React app with `npm run build` (at repo root)
- Start the Express server with `NODE_ENV=production` and it will:
  - Serve the API under `/api/*`
  - Serve static files from `../build`
  - Return `index.html` for non-API routes to support client-side routing
