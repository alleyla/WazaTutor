import React from 'react';
import { Route, Redirect } from 'react-router-dom';

/**
 * ProtectedRoute component that checks for authentication token
 * before rendering the component. Redirects to login if not authenticated.
 */
function ProtectedRoute({ component: Component, ...rest }) {
  const isAuthenticated = () => {
    const token = localStorage.getItem('authToken');
    return !!token;
  };

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated() ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
}

export default ProtectedRoute;
