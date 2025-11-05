# WazaTutor

## Installation

To clone the WazaTutor repository, run:
```bash
  git clone --recurse-submodules https://github.com/alleyla/WazaTutor.git
  cd WazaTutor
```

...  

The server will run on port 3002 by default.

### Development Proxy (no CORS needed)
- The React app uses a development proxy (src/setupProxy.js), so you can call relative URLs like /api/auth/login from the frontend.
- During development:
  - React dev server runs on http://localhost:3001
  - API server runs on http://localhost:3002
  - The dev server forwards requests from /api/* to the API server automatically.
- In production, the Express server can serve both the API and the built React app from the same origin, so no CORS is required when deployed this way.

...  

# Additional Sections
...    
# Links
...  

# Upstream OATutor Content
...  

**Note:** Make sure to replace any CAHLR/OATutor URLs with alleyla/WazaTutor throughout the document, except for the upstream OATutor-Content link as requested.