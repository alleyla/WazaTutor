import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import {
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    CircularProgress,
    FormControlLabel,
    Checkbox
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';
import { toast } from 'react-toastify';
import storageService from '../services/storageService';
import { SITE_NAME } from '../config/config';

const useStyles = makeStyles((theme) => ({
    root: {
        minHeight: '100vh',
        display: 'flex',
    },
    leftPanel: {
        flex: '0 0 66.666%',
        backgroundColor: '#01293e',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing(6),
        color: 'white',
        [theme.breakpoints.down('md')]: {
            display: 'none',
        },
    },
    rightPanel: {
        flex: '0 0 33.333%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing(4),
        backgroundColor: theme.palette.background.default,
        backgroundImage: `url(${process.env.PUBLIC_URL}/static/images/mainBg2.png)`,
        backgroundPosition: 'bottom center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        [theme.breakpoints.down('md')]: {
            flex: '1',
        },
    },
    logoContainer: {
        marginBottom: theme.spacing(4),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    logoImage: {
        height: 250,
        width: 'auto',
        display: 'block',
        marginBottom: theme.spacing(3),
        filter: 'drop-shadow(0 0 20px rgba(131, 243, 250, 0.6))',
    },
    heroTitle: {
        fontSize: '4rem',
        fontWeight: 700,
        textAlign: 'center',
        color: '#83f3fa',
        textShadow: `
            0 0 8px rgba(131, 243, 250, 0.5),
            0 0 15px rgba(131, 243, 250, 0.3),
            2px 2px 4px rgba(0, 0, 0, 0.7)
          `,
        WebkitTextStroke: '0.3px rgba(131, 243, 250, 0.2)',
        lineHeight: 1,
        margin: 0,
    },
    heroSubtitle: {
        fontSize: '1.5rem',
        textAlign: 'center',
        opacity: 0.9,
        maxWidth: 600,
        marginTop: theme.spacing(2),
    },
    paper: {
        padding: theme.spacing(4),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
        boxShadow: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',  // 90% opaque white
        backdropFilter: 'blur(10px)'
    },
    form: {
        width: '100%',
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
    link: {
        textDecoration: 'none',
        color: theme.palette.primary.main,
        fontWeight: 500,
        '&:hover': {
            color: '#15d2dd',
        },
    },
    errorText: {
        color: theme.palette.error.main,
        marginTop: theme.spacing(2),
        textAlign: 'center',
    },
    successText: {
        color: theme.palette.success.main,
        marginTop: theme.spacing(2),
        textAlign: 'center',
    },
}));

function Register() {
    const classes = useStyles();
    const history = useHistory();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post('/api/auth/register', formData);

            storageService.setAuthUser(
                response.data.token,
                response.data.user.id,
                response.data.user.name
            );

            setSuccess('Registration successful! Redirecting...');
            toast.success('Registration successful! ');

            setTimeout(() => {
                history.push('/dashboard');
            }, 800);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'An error occurred during registration';
            setError(errorMsg);
            toast.error(errorMsg);
            setLoading(false);
        }
    };

    return (
        <div className={classes.root}>
            {/* LEFT PANEL - Hero Section */}
            <div className={classes.leftPanel}>
                <div className={classes.logoContainer}>
                    <img
                        src={`${process.env.PUBLIC_URL}/static/images/logo.png`}
                        alt={SITE_NAME}
                        className={classes.logoImage}
                    />
                    <Typography className={classes.heroTitle}>
                        {SITE_NAME}
                    </Typography>
                </div>
                <Typography className={classes.heroSubtitle} style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    Master Foundational Math with
                </Typography>
                <Typography className={classes.heroSubtitle} style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, padding: 7 }}>
                    Adaptive AI + Smart Paper Practice.
                </Typography>
                <Typography className={classes.heroSubtitle} style={{ fontSize: '1rem', opacity: 0.85 }}>
                    A hybrid learning platform that combines personalized digital tutoring with the proven effectiveness of smart, handwritten problem-solving.
                </Typography>
            </div>

            {/* RIGHT PANEL - Signup Form */}
            <div className={classes.rightPanel}>
                <Paper className={classes.paper}>
                    <Typography component="h1" variant="h4" style={{ marginBottom: 16 }}>
                        Sign Up
                    </Typography>
                    <form className={classes.form} onSubmit={handleSubmit}>
                        {error && (
                            <Typography className={classes.errorText}>
                                {error}
                            </Typography>
                        )}
                        {success && (
                            <Typography className={classes.successText}>
                                {success}
                            </Typography>
                        )}
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="name"
                            label="Name"
                            name="name"
                            autoComplete="name"
                            autoFocus
                            value={formData.name}
                            onChange={handleChange}
                        />
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={agreeToTerms}
                                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                                    name="agreeToTerms"
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2">
                                    I Agree to{' '}
                                    <Link to="/terms" className={classes.link}>
                                        Terms & Conditions
                                    </Link>
                                </Typography>
                            }
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={classes.submit}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
                        </Button>
                        <Box mt={2}>
                            <Typography variant="body2" align="center">
                                Already have an account?{' '}
                                <Link to="/login" className={classes.link}>
                                    Sign In
                                </Link>
                            </Typography>
                        </Box>
                    </form>
                </Paper>
            </div>
        </div>
    );
}

export default Register;