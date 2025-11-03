import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';
import { toast } from 'react-toastify';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  paper: {
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002';

function Register() {
  const classes = useStyles();
  const history = useHistory();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
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
      const response = await axios.post(`${API_URL}/api/auth/register`, formData);
      
      // Store token and user info in localStorage
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userId', response.data.user.userId.toString());
      localStorage.setItem('username', response.data.user.username);
      
      setSuccess('Registration successful! Redirecting...');
      toast.success('Registration successful!');
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        history.push('/');
      }, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'An error occurred during registration';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <div className={classes.container}>
        <Paper className={classes.paper}>
          <Typography component="h1" variant="h5">
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
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
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
              helperText="Must be at least 8 characters with uppercase, lowercase, and number"
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
    </Container>
  );
}

export default Register;
