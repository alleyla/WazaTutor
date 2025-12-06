import React, { useEffect, useState, useRef } from 'react';
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
    Toolbar,
    LinearProgress
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router-dom';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import TimerIcon from '@material-ui/icons/Timer';
import AssignmentIcon from '@material-ui/icons/Assignment';
import WhatshotIcon from '@material-ui/icons/Whatshot';
import BrandLogoNav from '../components/BrandLogoNav';
import storageService from '../services/storageService';
import worksheetService from '../services/worksheetService';
import PendingWorksheetModal from '../components/worksheets/PendingWorksheetModal';
import lessonService from '../services/lessonService';
import withTranslation from '../util/withTranslation';
import SchoolIcon from '@material-ui/icons/School';
import EmojiEventsIcon from '@material-ui/icons/EmojiEvents';

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
        padding: theme.spacing(3),
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    welcomeText: {
        fontSize: '1.5rem',
        fontWeight: 600,
        color: theme.palette.text.primary,
        textAlign: 'center',
    },
    statCard: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        boxShadow: theme.shadows[8]
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
        fontSize: '0.75rem',
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
        fontSize: '3rem',
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
    },

    timeRangeButton: {
        '&:hover': {
            backgroundColor: theme.palette.primary.dark,
            color: theme.palette.secondary.light,
        },
    },
    timeRangeButtonActive: {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        '&:hover': {
            backgroundColor: theme.palette.primary.dark,
        },
    },
    neonProgressBar: {
        backgroundColor: '#00f0ff ! important',
    },
    worksheetButton: {
        backgroundColor: '#ff9800 !important',
        color: 'white',
        '&:hover': {
            backgroundColor: '#ffb74d !important',
            color: 'white',
        },
    },
}));

function Dashboard({ translate }) {    const classes = useStyles();
    const history = useHistory();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(7);
    const [error, setError] = useState(null);
    const [showWorksheetModal, setShowWorksheetModal] = useState(false);
    //const [setPendingWorksheet] = useState(null);
    // Track if the modal has been dismissed during this session
    const modalDismissedRef = useRef(false);
    // Get user name from storage
    const userName = storageService.getAuthUserName() || 'Learner';

    useEffect(() => {
        if (dashboardData) {
            checkPendingWorksheet();
        }
    }, [dashboardData]); // Trigger when dashboardData changes

    useEffect(() => {
        loadDashboard();
    }, [timeRange]);

    // Extract current lesson data from dashboardData
    const currentLesson = dashboardData?.currentLesson;
    const currentLessonWorksheet = dashboardData?.pendingWorksheet;
    // Get actual lesson details from lesson config
    const lesson = currentLesson ?  lessonService.getLessonById(currentLesson.lessonId) : null;

    // Calculate completion percentage and worksheet progress
    const worksheetProgress = currentLessonWorksheet
        ? (currentLessonWorksheet.problems_checked / currentLessonWorksheet.total_problems) * 100
        : 0;

    const totalProblems = currentLesson ? lessonService.getTotalProblemsForLesson(currentLesson.lessonId) : 0;
    const completedProblemsCount = currentLesson?.completedProblems?.length || 0;
    const completionPercentage = currentLesson
        ? lessonService.calculateCompletionPercentage(currentLesson.completedProblems, currentLesson.lessonId)
        : 0;

    // Update checkPendingWorksheet to use data from dashboardData (lines 177-187):
    const checkPendingWorksheet = () => {
        // Only show modal if there's a worksheet and it hasn't been dismissed
        if (currentLessonWorksheet && !modalDismissedRef.current) {
            setShowWorksheetModal(true);
        }
    };

    const loadDashboard = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await progressService.getUserStats(timeRange, 1, 0.95);

            setDashboardData(data);
            console.log('📊 Dashboard data:', data);
            console.log('📝 Pending worksheet:', data?. pendingWorksheet);

        } catch (err) {
            setError('Failed to load dashboard');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnterWorksheetAnswers = () => {
        if (currentLessonWorksheet) {
            history.push(`/worksheets/${currentLessonWorksheet.id}/enter-answers`);
        }
    };

    const handleDismissWorksheetModal = () => {
        setShowWorksheetModal(false);
        // Mark the modal as dismissed for this session
        modalDismissedRef.current = true;
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
                    <Typography className={classes.welcomeText}>
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
                <Box className={classes.welcomeSection}>
                    <Container maxWidth="lg">
                        <Typography className={classes.welcomeText}>
                            Welcome, {userName}!
                        </Typography>
                    </Container>
                </Box>
                <Container maxWidth="lg">
                    {/* Welcome Section */}
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
                <Box className={classes.welcomeSection}>
                    <Container maxWidth="lg">
                        <Typography className={classes.welcomeText}>
                            Welcome, {userName}!
                        </Typography>
                    </Container>
                </Box>
                <Container maxWidth="lg">
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
            <Box className={classes.welcomeSection}>
                <Container maxWidth="lg">
                    <Typography className={classes.welcomeText}>
                        Welcome, {userName}!
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="xl" style={{ marginTop: 24 }}>
                <Grid container spacing={3}>
                    {/* LEFT COLUMN - Continue Learning */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center'}} >
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <SchoolIcon style={{ color: '#073755', fontSize: '2rem', marginRight: 8 }} />
                                <Typography variant="h5" style={{ textAlign: 'center' }}>
                                    Your Current Lesson
                                </Typography>
                            </Box>

                            {currentLesson && lesson ? (
                                <>
                                    {/* Current Lesson Info */}
                                    <Box mt={3} maxWidth={400} minWidth={400} style={{ textAlign: 'center' }}>
                                        <Typography variant="h6" color="primary">
                                            {lesson.courseName} - {lesson.name}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            {lesson.topics}
                                        </Typography>

                                        <Box mt={2} mb={1}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={completionPercentage}
                                                style={{ height: 24, borderRadius: 10 }}
                                                classes={{
                                                    bar: classes.neonProgressBar
                                                }}
                                            />
                                        </Box>

                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            {completedProblemsCount} of {totalProblems} problems completed ({completionPercentage.toFixed(0)}%)
                                        </Typography>

                                        <>
                                            {/* Mastery Progress Cards */}
                                            <Box mt={4} maxWidth={400} minWidth={400}>
                                                <Typography variant="subtitle1" color="textPrimary" gutterBottom style={{ textAlign: 'center' }}>
                                                    Skill Mastery Progress
                                                </Typography>

                                                <Grid container spacing={2} style={{ marginTop: 8 }}>
                                                    {lesson.learningObjectives && Object.entries(lesson.learningObjectives).map(([skillName, threshold]) => {
                                                        // Get mastery from dashboardData or calculate from BKT params
                                                        const skillMastery = dashboardData?.skillMasteryByName?.[skillName] || 0;
                                                        const masteryPercent = Math.round(skillMastery * 100);

                                                        return (
                                                            <Grid item xs={4} key={skillName}>
                                                                <Card
                                                                    elevation={2}
                                                                    style={{
                                                                        padding: 10,
                                                                        textAlign: 'center',
                                                                        minHeight: 100,
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        variant="caption"
                                                                        color="textSecondary"
                                                                        style={{
                                                                            fontSize: '0.7rem',
                                                                            marginBottom: 8,
                                                                            fontWeight: 500
                                                                        }}
                                                                    >
                                                                        {lessonService.getSkillDisplayName(skillName, translate)}
                                                                    </Typography>

                                                                    <Box position="relative" display="inline-flex" justifyContent="center">
                                                                        <CircularProgress
                                                                            variant="determinate"
                                                                            value={masteryPercent}
                                                                            size={60}
                                                                            thickness={5}
                                                                            style={{
                                                                                color: masteryPercent >= 95 ? '#28A745' :
                                                                                    masteryPercent >= 70 ? '#00f0ff' :
                                                                                        '#ff9800'
                                                                            }}
                                                                        />
                                                                        <Box
                                                                            top={0}
                                                                            left={0}
                                                                            bottom={0}
                                                                            right={0}
                                                                            position="absolute"
                                                                            display="flex"
                                                                            alignItems="center"
                                                                            justifyContent="center"
                                                                        >
                                                                            <Typography
                                                                                variant="caption"
                                                                                component="div"
                                                                                style={{
                                                                                    fontWeight: 'bold',
                                                                                    fontSize: '0.9rem'
                                                                                }}
                                                                            >
                                                                                {masteryPercent}%
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                </Card>
                                                            </Grid>
                                                        );
                                                    })}
                                                </Grid>
                                            </Box>
                                        </>

                                        <Box mt={2}>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="large"
                                                fullWidth
                                                onClick={() => history.push(`/lessons/${currentLesson.lessonId}`)}
                                            >
                                                Continue This Lesson
                                            </Button>
                                        </Box>
                                    </Box>
                                </>
                            ) : (
                                <Box mt={3}>
                                    <Typography variant="body1" color="textSecondary">
                                        No active lesson.  Start a new lesson to begin learning!
                                    </Typography>
                                    <Box mt={2}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="large"
                                            fullWidth
                                            onClick={() => history.push(`/lessons/`)}
                                        >
                                            Start Learning
                                        </Button>
                                    </Box>
                                </Box>
                            )}

                            {/* Divider for Pending Worksheet */}
                            {currentLessonWorksheet && (
                                <>
                                    <Box mt={3} maxWidth={400} minWidth={400} style={{ textAlign: 'center' }}>
                                        <hr style={{
                                            border: 'none',
                                            borderTop: '2px dashed #ccc',
                                            margin: '14px 0'
                                        }} />
                                    </Box>

                                    {/* Pending Worksheet Info */}
                                    <Box mt={3} maxWidth={400} minWidth={400} style={{ textAlign: 'center' }}>
                                        <Box display="flex" alignItems="center" justifyContent="center" >
                                            <AssignmentIcon style={{ color: '#ff9800', marginRight: 8 }} />
                                            <Typography variant="h6" style={{ color: '#ff9800', textAlign: 'center' }}>
                                                You Have a Pending Worksheet
                                            </Typography>
                                        </Box>

                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            You have an incomplete worksheet for this lesson
                                        </Typography>

                                        <Box mt={2} mb={1}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={worksheetProgress}
                                                style={{
                                                    height: 24,
                                                    borderRadius: 10,
                                                }}
                                                classes={{
                                                    bar: classes.neonProgressBar
                                                }}
                                            />
                                        </Box>

                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            {currentLessonWorksheet.problems_checked} of {currentLessonWorksheet.total_problems} answers entered ({worksheetProgress.toFixed(0)}%)
                                        </Typography>

                                        <Box mt={2}>
                                            <Button
                                                variant="contained"
                                                size="large"
                                                fullWidth
                                                className={classes.worksheetButton}
                                                onClick={() => history.push(`/worksheets/${currentLessonWorksheet.id}/enter-answers`)}
                                            >
                                                Enter Worksheet Answers
                                            </Button>
                                        </Box>
                                    </Box>
                                </>
                            )}
                        </Paper>
                    </Grid>

                    {/* RIGHT COLUMN - Your Progress */}
                    <Grid xs={12} md={6}>
                      <Paper elevation={5} style={{ padding: 14, textAlign: 'center' }}>
                          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                              <EmojiEventsIcon style={{ color: '#FFD700', fontSize: '2rem' , marginRight: 8}} />
                              <Typography variant="h5">
                                  Your Achievements
                              </Typography>
                          </Box>
                        {/* Motivational Message */}
                        {dashboardData.practiceStreak.currentStreak > 0 && (
                            <Paper style={{ marginTop: 20, padding: 10, textAlign: 'center' }}>
                                <Typography variant="h6" color="primary">
                                    🎉 Keep up the great work! 🎉
                                </Typography>
                                <Typography color="textSecondary">
                                    You're on a {dashboardData.practiceStreak.currentStreak}-day streak!
                                </Typography>
                            </Paper>
                        )}
                        {/* Time Range Selector */}
                        <Box className={classes.timeRangeSelector}>
                            <ButtonGroup color="primary" size="medium">
                                <Button
                                    className={timeRange === 1 ? classes.timeRangeButtonActive : classes.timeRangeButton}
                                    variant={timeRange === 1 ? 'contained' : 'outlined'}
                                    onClick={() => setTimeRange(1)}
                                >
                                    Today
                                </Button>
                                <Button
                                    className={timeRange === 7 ? classes.timeRangeButtonActive : classes.timeRangeButton}
                                    variant={timeRange === 7 ? 'contained' : 'outlined'}
                                    onClick={() => setTimeRange(7)}
                                >
                                    7 Days
                                </Button>
                                <Button
                                    className={timeRange === 30 ? classes.timeRangeButtonActive : classes.timeRangeButton}
                                    variant={timeRange === 30 ? 'contained' : 'outlined'}
                                    onClick={() => setTimeRange(30)}
                                >
                                    30 Days
                                </Button>
                                <Button
                                    className={timeRange === 90 ? classes.timeRangeButtonActive : classes.timeRangeButton}
                                    variant={timeRange === 90 ? 'contained' : 'outlined'}
                                    onClick={() => setTimeRange(90)}
                                >
                                    90 Days
                                </Button>
                            </ButtonGroup>
                        </Box>

                        {/* Existing stats cards */}
                        <Grid container spacing={3} className={classes.dashboardGrid}>
                            {/* Skills Mastered */}
                            <Grid item xs={12} sm={6} md={3}>
                                <Card className={classes.statCard} elevation={3}>
                                    <CardContent>
                                        <div className={classes.iconHeader}>
                                            <CheckCircleIcon className={classes.cardIcon} />
                                            <Typography variant="h8">
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
                                            <div>Avg Mastery:</div> {(dashboardData.averageMastery * 100).toFixed(1)}%
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
                                            <Typography variant="h8">
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
                                            <Typography variant="h8">
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
                                            <Typography variant="h8">
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
                      </Paper>
                      </Grid>
                </Grid>
            </Container>

            {/* Pending Worksheet Modal */}
            <PendingWorksheetModal
                open={showWorksheetModal}
                worksheet={currentLessonWorksheet}
                onEnterAnswers={handleEnterWorksheetAnswers}
                onDismiss={handleDismissWorksheetModal}
            />
        </div>
    );
}

export default withTranslation(Dashboard);