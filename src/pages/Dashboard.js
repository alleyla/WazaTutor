import React, { useEffect, useState } from 'react';
import progressService from '../services/progressService';
import { 
    Card, 
    CardContent, 
    Typography, 
    Button, 
    ButtonGroup, 
    CircularProgress, 
    Box,
    Container,
    Grid,
    Paper,
    AppBar,
    Toolbar
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import TimerIcon from '@material-ui/icons/Timer';
import AssignmentIcon from '@material-ui/icons/Assignment';
import WhatshotIcon from '@material-ui/icons/Whatshot';
import BrandLogoNav from '../components/BrandLogoNav';
import storageService from '../services/storageService';

const useStyles = makeStyles((theme) => ({
    root: {
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        paddingBottom: theme.spacing(4),
    },
    header: {
        marginBottom: theme.spacing(4),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dashboardGrid: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
    },
    welcomeSection: {
        padding: theme. spacing(4, 3, 3, 3),
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme. palette.divider}`,
    },
    welcomeText: {
        fontSize: '1.75rem',
        fontWeight: 500,
        color: theme.palette.text.primary,
    },
    statCard: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
        },
    },
    statValue: {
        fontSize: '3rem',
        fontWeight: 'bold',
        color: theme.palette.primary.main,
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
    statLabel: {
        color: theme.palette.text.secondary,
        fontSize: '0.875rem',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statDetail: {
        color: theme.palette.text.secondary,
        fontSize: '0.9rem',
        marginTop: theme.spacing(0.5),
    },
    timeRangeSelector: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
    },
    streakIcon: {
        fontSize: '4rem',
        marginTop: theme.spacing(1),
    },
    loadingContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
    },
    iconHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
    cardIcon: {
        color: theme.palette.primary.main,
        fontSize: '2rem',
    }
}));

export default function Dashboard() {
    const classes = useStyles();
    const history = useHistory();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(7);
    const [error, setError] = useState(null);

    // Get user name from storage
    const userName = storageService.getAuthUserName() || 'Learner';


    useEffect(() => {
        loadDashboard();
    }, [timeRange]);

    const loadDashboard = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await progressService.getUserStats(timeRange, 1, 0.95);
            setDashboardData(data);
        } catch (err) {
            setError('Failed to load dashboard');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStreakEmoji = (streak) => {
        if (streak === 0) return '💤';
        if (streak >= 30) return '🔥🔥🔥';
        if (streak >= 7) return '🔥🔥';
        return '🔥';
    };

    if (loading) {
        return (
            <div className={classes.root}>
                <AppBar position="static">
                    <Toolbar>
                        <BrandLogoNav />
                    </Toolbar>
                </AppBar>
                {/* Welcome Section */}
                <Box className={classes.welcomeSection}>
                    <Typography className={classes. welcomeText}>
                        Welcome, {userName}!
                    </Typography>
                </Box>
                <Container maxWidth="lg">
                    <Box className={classes.loadingContainer}>
                        <CircularProgress size={60} />
                    </Box>
                </Container>
            </div>
        );
    }

    if (error) {
        return (
            <div className={classes.root}>
                <AppBar position="static">
                    <Toolbar>
                        <BrandLogoNav />
                    </Toolbar>
                </AppBar>
                <Container maxWidth="lg">
                    {/* Welcome Section */}
                    <Box className={classes.welcomeSection}>
                        <Typography className={classes.welcomeText}>
                            Welcome, {userName}!
                        </Typography>
                    </Box>
                    <Paper style={{ padding: 24, textAlign: 'center' }}>
                        <Typography color="error" variant="h6">{error}</Typography>
                        <Button 
                            onClick={loadDashboard} 
                            variant="contained" 
                            color="primary"
                            style={{ marginTop: 16 }}
                        >
                            Retry
                        </Button>
                    </Paper>
                </Container>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className={classes.root}>
                <AppBar position="static">
                    <Toolbar>
                        <BrandLogoNav />
                    </Toolbar>
                </AppBar>
                <Container maxWidth="lg">
                    {/* Welcome Section */}
                    <Box className={classes.welcomeSection}>
                        <Typography className={classes.welcomeText}>
                            Welcome, {userName}!
                        </Typography>
                    </Box>
                    <Paper style={{ padding: 24, textAlign: 'center' }}>
                        <Typography variant="h6">
                            No data available yet.
                        </Typography>
                        <Typography color="textSecondary" style={{ marginTop: 8 }}>
                            Start practicing to see your progress!
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            style={{ marginTop: 16 }}
                            onClick={() => history.push('/')}
                        >
                            Start Practicing
                        </Button>
                    </Paper>
                </Container>
            </div>
        );
    }

    return (
        <div className={classes.root}>
            <AppBar position="static">
                <Toolbar>
                    <BrandLogoNav />
                </Toolbar>
            </AppBar>
            <Container maxWidth="lg">
                {/* Welcome Section */}
                <Box className={classes.welcomeSection}>
                    <Typography className={classes.welcomeText}>
                        Welcome, {userName}!
                    </Typography>
                </Box>
                <Box className={classes.timeRangeSelector}>
                    <ButtonGroup color="primary" size="large">
                        <Button 
                            onClick={() => setTimeRange(1)}
                            variant={timeRange === 1 ? 'contained' : 'outlined'}
                        >
                            Today
                        </Button>
                        <Button 
                            onClick={() => setTimeRange(7)}
                            variant={timeRange === 7 ? 'contained' : 'outlined'}
                        >
                            7 Days
                        </Button>
                        <Button 
                            onClick={() => setTimeRange(30)}
                            variant={timeRange === 30 ? 'contained' : 'outlined'}
                        >
                            30 Days
                        </Button>
                        <Button 
                            onClick={() => setTimeRange(365)}
                            variant={timeRange === 365 ? 'contained' : 'outlined'}
                        >
                            Year
                        </Button>
                    </ButtonGroup>
                </Box>

                <Grid container spacing={3} className={classes.dashboardGrid}>
                    {/* Skills Mastered */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Card className={classes.statCard} elevation={3}>
                            <CardContent>
                                <div className={classes.iconHeader}>
                                    <CheckCircleIcon className={classes.cardIcon} />
                                    <Typography variant="h6">
                                        Skills Mastered
                                    </Typography>
                                </div>
                                <Typography className={classes.statValue}>
                                    {dashboardData.skillsMastered}
                                </Typography>
                                <Typography className={classes.statDetail}>
                                    out of {dashboardData.totalSkillsPracticed} practiced
                                </Typography>
                                <Typography className={classes.statDetail}>
                                    Avg: {(dashboardData.averageMastery * 100).toFixed(1)}%
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Practice Streak */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Card className={classes.statCard} elevation={3}>
                            <CardContent>
                                <div className={classes.iconHeader}>
                                    <WhatshotIcon className={classes.cardIcon} />
                                    <Typography variant="h6">
                                        Practice Streak
                                    </Typography>
                                </div>
                                <Typography className={classes.statValue}>
                                    {dashboardData.practiceStreak.currentStreak}
                                </Typography>
                                <Typography className={classes.statDetail}>
                                    consecutive days
                                </Typography>
                                <div className={classes.streakIcon}>
                                    {getStreakEmoji(dashboardData.practiceStreak.currentStreak)}
                                </div>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Time on Task */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Card className={classes.statCard} elevation={3}>
                            <CardContent>
                                <div className={classes.iconHeader}>
                                    <TimerIcon className={classes.cardIcon} />
                                    <Typography variant="h6">
                                        Time Practiced
                                    </Typography>
                                </div>
                                <Typography className={classes.statValue}>
                                    {dashboardData.timeOnTask.totalMinutes}
                                </Typography>
                                <Typography className={classes.statDetail}>
                                    minutes
                                </Typography>
                                <Typography className={classes.statDetail}>
                                    in the last {dashboardData.timeOnTask.days} day{dashboardData.timeOnTask.days !== 1 ? 's' : ''}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Problems Solved */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Card className={classes.statCard} elevation={3}>
                            <CardContent>
                                <div className={classes.iconHeader}>
                                    <AssignmentIcon className={classes.cardIcon} />
                                    <Typography variant="h6">
                                        Problems Solved
                                    </Typography>
                                </div>
                                <Typography className={classes.statValue}>
                                    {dashboardData.problemsSolved.count}
                                </Typography>
                                <Typography className={classes.statDetail}>
                                    problems completed
                                </Typography>
                                <Typography className={classes.statDetail}>
                                    in the last {dashboardData.problemsSolved.days} day{dashboardData.problemsSolved.days !== 1 ? 's' : ''}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Motivational Message */}
                {dashboardData.practiceStreak.currentStreak > 0 && (
                    <Paper style={{ marginTop: 24, padding: 16, textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                            🎉 Keep up the great work!
                        </Typography>
                        <Typography color="textSecondary">
                            You're on a {dashboardData.practiceStreak.currentStreak}-day streak!
                        </Typography>
                    </Paper>
                )}
            </Container>
        </div>
    );
}
