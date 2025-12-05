import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  AppBar,
  Toolbar,
  Grid
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';
import { toast } from 'react-toastify';
import storageService from '../services/storageService';
import { Link } from 'react-router-dom';
import DashboardIcon from '@material-ui/icons/Dashboard';
import BrandLogoNav from '../components/BrandLogoNav';

const useStyles = makeStyles((theme) => ({
    root: {
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
    },
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

function Account() {
  const classes = useStyles();
  const history = useHistory();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAccountInfo = useCallback(async () => {

    const token = storageService.getAuthToken();

    if (!token) {
      history.push('/login');
      return;
    }

    try {
      const response = await axios.get('/api/account', {
          headers: {
              'x-auth-token': token,
          }
      });
      
      setFormData({
        name: response.data.user.name,
        email: response.data.user.email,
      });
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        storageService.clearAuthUser();
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

    const token = storageService.getAuthToken();
    
    try {
      const response = await axios.put(
        '/api/account',
        formData,
        {
            headers: {
                'x-auth-token': token,
            },
        }
      );
      
      setSuccess('Account updated successfully!');
      toast.success('Account updated successfully!');
      
      // Update storage with new name if changed
      if (response.data.user.name !== storageService.getAuthUserName()) {
          storageService.updateAuthUserName(response.data.user.name);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        storageService.clearAuthUser();
        toast.error('Session expired. Please login again.');
        history.push('/login');
      } else {
        const errorMsg = err.response?.data?.message || 'An error occurred while updating account';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    storageService.clearAuthUser();
    toast.success('Logged out successfully');
    history.push('/login');
  };

  const handleBack = () => {
    history.push('/');
  };

  if (fetchLoading) {
    return (
        <div className={classes.root}>
            {/* ADD NAVIGATION BAR */}
            <AppBar position="static">
                <Toolbar>
                    <BrandLogoNav />
                </Toolbar>
            </AppBar>
            <Container component="main" maxWidth="xs">
                <Box display="flex" justifyContent="center" mt={8}>
                    <CircularProgress />
                </Box>
            </Container>
        </div>
    );
  }

  return (
      <div className={classes.root}>
        {/* ADD NAVIGATION BAR */}
        <AppBar position="static">
            <Toolbar>
                <BrandLogoNav />
            </Toolbar>
        </AppBar>
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
                      id="name"
                      label="Name"
                      name="name"
                      autoComplete="name"
                      value={formData.name}
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
                  {loading ? <CircularProgress size={24} /> : 'Save Settings'}
                </Button>
              </form>
            </Paper>
          </div>
        </Container>
      </div>
  );
}

export default Account;
