import React, { useState, useEffect } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { CircularProgress, Box } from '@material-ui/core';
import axios from 'axios';
import storageService from '../services/storageService';

/**
 * GuestRoute - Protects routes that should only be accessible to unauthenticated users
 *
 * Redirects authenticated users to the account page.
 * Use for: Login, Register, Forgot Password pages
 *
 */
function GuestRoute({ component: Component, ...rest }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = storageService.getAuthToken();

            if (!token) {
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            try {
                await axios.get('/api/auth/verify', {
                    headers: {
                        'x-auth-token': token,
                    },
                });
                // Token is valid - user is authenticated
                setIsAuthenticated(true);
            } catch (error) {
                // Token is invalid or expired
                if (error.response?.status === 401 || error.response?.status === 403) {
                    // Clear invalid token, but preserve userId for anonymous user fallback
                    storageService.clearInvalidToken();
                }
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
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
                !isAuthenticated ? (
                    <Component {...props} />
                ) : (
                    <Redirect to="/dashboard" />
                )
            }
        />
    );
}

export default GuestRoute;