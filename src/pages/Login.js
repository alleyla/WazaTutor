import React, { useState, useContext } from 'react';
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
import storageService from '../services/storageService';
import worksheetService from '../services/worksheetService';
import PendingWorksheetModal from '../components/worksheets/PendingWorksheetModal';
import { ThemeContext } from '../config/config';

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
}));

function Login() {
  const classes = useStyles();
  const history = useHistory();
  const context = useContext(ThemeContext);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showWorksheetModal, setShowWorksheetModal] = useState(false);
  const [pendingWorksheet, setPendingWorksheet] = useState(null);

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

    try {
      const response = await axios.post('/api/auth/login', formData);

        // Store token and user info using storageService
        storageService.setAuthUser(
            response.data.token,
            response.data.user.id,
            response.data.user.name
        );
      
      toast.success('Login successful!');

        // For EXISTING users, reload their progress from server
        if (context.reloadUserData) {
            try {
                await context.reloadUserData();
            } catch (error) {
                console.error('Failed to reload user data:', error);
                // Continue anyway - user can still use the app
            }
        }

      // Check for pending worksheet
      const pending = await worksheetService.checkPendingWorksheet();

      if (pending) {
            setPendingWorksheet(pending);
            setShowWorksheetModal(true);
      } else {
            // No pending worksheet, go to home/dashboard
            history.push('/dashboard');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'An error occurred during login';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterWorksheetAnswers = () => {
    if (pendingWorksheet) {
        history.push(`/worksheets/${pendingWorksheet.id}/enter-answers`);
    }
  };

  const handleDismissWorksheetModal = () => {
      setShowWorksheetModal(false);
      history.push('/dashboard');
  };

  return (
      <>
        <Container component="main" maxWidth="xs">
      <div className={classes.container}> 
        <Paper className={classes.paper}>
          <Typography component="h1" variant="h5">
            Sign In
          </Typography>
          <form className={classes.form} onSubmit={handleSubmit}>
            {error && (
              <Typography className={classes.errorText}>
                {error}
              </Typography>
            )}
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
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
              autoComplete="current-password"
              value={formData.password}
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
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Box mt={2}>
              <Typography variant="body2" align="center">
                Don't have an account?{' '}
                <Link to="/register" className={classes.link}>
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </div>
    </Container>
        <PendingWorksheetModal
          open={showWorksheetModal}
          worksheet={pendingWorksheet}
          onEnterAnswers={handleEnterWorksheetAnswers}
          onDismiss={handleDismissWorksheetModal}
        />
      </>
  );
}

export default Login;
