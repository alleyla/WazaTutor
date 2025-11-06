import React, { useState, useEffect } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { CircularProgress, Box } from '@material-ui/core';
import axios from 'axios';
import storageService from '../services/storageService';

/**
 * ProtectedRoute component that checks for authentication token
 * and verifies its validity before rendering the component.
 * Redirects to login if not authenticated or token is invalid.
 */
function ProtectedRoute({ component: Component, ...rest }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      const verifyToken = async () => {

          const token = storageService.getAuthToken();

          if (!token) {
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
          }

          try {
            // Relative URL works in dev (via CRA proxy) and prod (same origin)
            await axios.get('/api/auth/verify', {
                headers: {
                'x-auth-token': token,
            }
            });
            setIsAuthenticated(true);
          } catch (_error) {
              // Only clear auth data on authentication errors
              if (_error.response?.status === 401 || _error.response?.status === 403) {
                  storageService.clearInvalidToken();
                  // Don't remove userId - App.js handles the fallback to anonymous
              }
            setIsAuthenticated(false);
          } finally {
            setIsLoading(false);
          }
      };

    verifyToken();
  }, []);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: props.location },
            }}
          />
        )
      }
    />
  );
}

export default ProtectedRoute;
