import React, { useContext } from "react";
import { SITE_NAME, SITE_VERSION, ThemeContext } from "../config/config";
import { useHistory, useLocation } from "react-router-dom";
import { makeStyles, Button, IconButton, Box } from "@material-ui/core";
import HomeIcon from '@material-ui/icons/Home';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import storageService from '../services/storageService';
import { toast } from 'react-toastify';

const useStyles = makeStyles((theme) => ({
    siteNavLink: {
        textAlign: 'left',
        paddingTop: "3px",
        "&:hover": {
            cursor: "pointer"
        }
    },
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    leftSection: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),
    },
    logo: {
        color: 'white',
        textDecoration: 'none',
        fontSize: '1.1rem',
        fontWeight: 500,
        cursor: 'pointer',
        paddingTop: 3,
        '&:hover': {
            opacity: 0.8,
        },
    },
    navButton: {
        color: 'white',
        textTransform: 'none',
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
    },
    rightSection: {
        display: 'flex',
        alignItems: 'center',
        gap: theme. spacing(1),
    },
    iconButton: {
        color: 'white',
    },
}));

function BrandLogoNav({ isPrivileged = false, noLink = false }) {
    const context = useContext(ThemeContext);
    const history = useHistory();
    const location = useLocation();
    const classes = useStyles();
    const isAuthenticated = storageService.isAuthenticated();

    const brandString = `${SITE_NAME} (v${SITE_VERSION})`;

    // Don't render navigation on login or register pages
    if (location.pathname === '/login' || location.pathname === '/register') {
        return null;
    }

    const handleLogoClick = (evt) => {
        if (evt.type === "click" || evt.key === "Enter") {
            if (isAuthenticated) {
                history.push('/dashboard');
            } else {
                history.push('/register');
            }
        }
    };

    const handleLogout = () => {
        storageService.clearAuthUser();
        toast.success('Logged out successfully');
        history. push('/login');
    };

    // If noLink or LMS student mode, show simple brand without full navigation
    if (noLink || (context.jwt.length !== 0 && !isPrivileged)) {
        return (
            <div style={{ textAlign: 'left', paddingTop: 6 }}>
                {brandString}
            </div>
        );
    }

    return (
        <Box className={classes.toolbar}>
            {/* Left Section: Logo and Main Navigation */}
            <Box className={classes.leftSection}>
                {/* Logo / App Name */}
                <div
                    role={"link"}
                    tabIndex={0}
                    onClick={handleLogoClick}
                    onKeyDown={handleLogoClick}
                    className={classes.logo}
                >
                    {brandString}
                </div>

                {/* Authenticated User Navigation */}
                {isAuthenticated && (
                    <>
                        <Button
                            className={classes.navButton}
                            startIcon={<HomeIcon />}
                            onClick={() => history.push('/dashboard')}
                        >
                            Dashboard
                        </Button>
                        <Button
                            className={classes.navButton}
                            startIcon={<MenuBookIcon />}
                            onClick={() => history.push('/lessons')}
                        >
                            Courses
                        </Button>
                    </>
                )}
            </Box>

            {/* Right Section: Auth Actions */}
            <Box className={classes. rightSection}>
                {isAuthenticated ? (
                    <>
                        <IconButton
                            className={classes.iconButton}
                            onClick={() => history.push('/account')}
                            aria-label="Account"
                            title="Account"
                        >
                            <AccountCircleIcon />
                        </IconButton>
                        <IconButton
                            className={classes.iconButton}
                            onClick={handleLogout}
                            aria-label="Logout"
                            title="Logout"
                        >
                            <ExitToAppIcon />
                        </IconButton>
                    </>
                ) : (
                    <>
                        <Button
                            className={classes.navButton}
                            onClick={() => history.push('/register')}
                        >
                            Sign up
                        </Button>
                        <Button
                            className={classes.navButton}
                            onClick={() => history.push('/login')}
                        >
                            Login
                        </Button>
                    </>
                )}
            </Box>
        </Box>
    );
}

export default BrandLogoNav;