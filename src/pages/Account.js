import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Grid
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
    maxWidth: 600,
    width: '100%',
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  backButton: {
    marginTop: theme.spacing(2),
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

function Account() {
  const classes = useStyles();
  const history = useHistory();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAccountInfo = React.useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      history.push('/login');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setFormData({
        username: response.data.user.username,
        email: response.data.user.email,
      });
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('authToken');
        toast.error('Session expired. Please login again.');
        history.push('/login');
      } else {
        const errorMsg = 'Failed to load account information';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setFetchLoading(false);
    }
  }, [history]);

  useEffect(() => {
    fetchAccountInfo();
  }, [fetchAccountInfo]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('authToken');
    
    try {
      const response = await axios.put(
        `${API_URL}/api/account`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setSuccess('Account updated successfully!');
      toast.success('Account updated successfully!');
      
      // Update localStorage with new username if changed
      if (response.data.user.username !== localStorage.getItem('username')) {
        localStorage.setItem('username', response.data.user.username);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('authToken');
        toast.error('Session expired. Please login again.');
        history.push('/login');
      } else {
        const errorMsg = err.response?.data?.error || 'An error occurred while updating account';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    toast.success('Logged out successfully');
    history.push('/login');
  };

  const handleBack = () => {
    history.push('/');
  };

  if (fetchLoading) {
    return (
      <Container component="main" maxWidth="xs">
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <div className={classes.container}>
        <Paper className={classes.paper}>
          <Typography component="h1" variant="h5">
            Account Settings
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
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Update Account'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleBack}
              className={classes.backButton}
            >
              Back to Home
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={handleLogout}
              style={{ marginTop: '8px' }}
            >
              Logout
            </Button>
          </form>
        </Paper>
      </div>
    </Container>
  );
}

export default Account;
