import React, { Component } from 'react';
import {
    Container,
    Typography,
    Button,
    CircularProgress,
    Grid,
    Paper,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    AppBar,
    Toolbar
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom';
import PrintableWorksheet from '../components/worksheets/PrintableWorksheet';
import PrintableAnswerKey from '../components/worksheets/PrintableAnswerKey';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
import PrintIcon from '@material-ui/icons/Print';
import worksheetService from '../services/worksheetService';
import progressService from '../services/progressService';
import { ThemeContext, findLessonById } from '../config/config';
import { toast } from 'react-toastify';
import WorksheetProblemCard from '../components/worksheets/WorksheetProblemCard';
import update from '../models/BKT/BKT-brain';
import BrandLogoNav from '@components/BrandLogoNav';
import { IS_STAGING_OR_DEVELOPMENT } from '../util/getBuildType';

const styles = (theme) => ({
    root: {
        backgroundColor: '#F6F6F6',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
    },
    printOnly: {
        display: 'none',
        '@media print': {
            display: 'block'
        }
    },
    noPrint: {
        '@media print': {
            display: 'none'
        }
    },
    pageHeader: {
        padding: theme.spacing(3),
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    pageTitle: {
        fontSize: '1.5rem',
        fontWeight: 600,
        color: theme.palette.text.primary,
        textAlign: 'center',
    },
    container: {
        padding: theme.spacing(4),
        maxWidth: 900,
        flex: 1,
    },
    header: {
        marginBottom: theme.spacing(4),
    },
    lessonInfo: {
        marginBottom: theme.spacing(3),
    },
    lessonTitle: {
        fontSize: '1.3rem',
        fontWeight: 600,
        color: theme.palette.text.primary,
        marginBottom: theme.spacing(0.5),
    },
    lessonSubtitle: {
        fontSize: '1rem',
        color: theme.palette.text.secondary,
    },
    lessonId: {
        fontSize: '0.875rem',
        color: theme.palette.text.disabled,
        fontFamily: 'monospace',
        marginTop: theme.spacing(0.5),
    },
    actionButtons: {
        display: 'flex',
        gap: theme.spacing(2),
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
    },
    progress: {
        marginBottom: theme.spacing(2)
    },
    problemsGrid: {
        marginTop: theme.spacing(3)
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh'
    },
    completionIcon: {
        fontSize: 80,
        color: theme.palette.success.main
    }
});

class EnterWorksheetAnswers extends Component {
    static contextType = ThemeContext;

    constructor(props) {
        super(props);

        const worksheetId = props.match?.params?.worksheetId || props.worksheetId;

        this.state = {
            worksheetId,
            worksheet: null,
            problemsData: [],
            loading: true,
            error: null,
            showCompletionDialog: false,
            printMode: null
        };
    }

    async componentDidMount() {
        // Load problem pool
        try {
            const problemPoolModule = await import(`@generated/processed-content-pool/${this.context. CONTENT_SOURCE || 'wazatutor'}.json`);
            this. problemIndex = {
                problems: problemPoolModule.default || problemPoolModule
            };
        } catch (error) {
            console. error('Error loading problem pool:', error);
        }

        await this.loadWorksheet();
    }

    loadWorksheet = async () => {
        this.setState({ loading: true, error: null });

        try {
            const worksheet = await worksheetService.getWorksheet(this.state.worksheetId);

            if (!worksheet) {
                this.setState({
                    error: 'Worksheet not found',
                    loading: false
                });
                return;
            }

            //Match worksheet problems with full problem data
            const problemsData = worksheet.problems.map(worksheetProblem => {
                const fullProblem = this.problemIndex?.problems.find(
                    p => p.id === worksheetProblem.problem_id
                );

                return {
                    ...worksheetProblem,
                    problemData: fullProblem || null,
                    seed: `worksheet-${this.state. worksheetId}-${worksheetProblem.problem_order}`
                };
            });

            this.setState({
                worksheet,
                problemsData,
                loading: false
            });
        } catch (error) {
            console.error('Error loading worksheet:', error);
            this.setState({
                error: 'Failed to load worksheet',
                loading: false
            });
            toast.error('Failed to load worksheet');
        }
    };

    handleSubmitAnswer = async (problemOrder, userAnswer, problemData, isCorrect) => {
        const { worksheetId } = this.state;

        try {
            // Submit to server with correctness already determined
            const result = await worksheetService.submitAnswer(
                worksheetId,
                problemOrder,
                userAnswer,
                isCorrect
            );

            if (!result.success) {
                toast.error(result.error || 'Failed to submit answer');
                return { success: false };
            }

            // Update BKT if skill name is available
            // Check both the server response AND the local problemData
            const skillName = result.problem?.skill_name ||
                              result.problem?.skillName ||
                              problemData?.skill_name ||
                              problemData?.skillName;
            console.log('BKT Update Log:', {
                skillName,
                isCorrect,
                hasBktParams: !!this.context.bktParams,
                bktParam: this.context.bktParams?.[skillName]
            });

            // Update BKT if skill name is available
            if (skillName && this.context.bktParams) {
                const skillParam = this.context.bktParams[result.problem.skillName];
                if (skillParam) {
                    // Update BKT model
                    update(skillParam, isCorrect);
                    console.log('✅ BKT updated.  New mastery:', skillParam.probMastery);
                    // Sync to server
                    await progressService.syncSkillMastery(this.context.bktParams);
                } else {
                    console.warn('⚠️ Skill not found in bktParams:', skillName);
                }
            } else {
                console.warn('⚠️ Missing data for BKT update:', {
                    skillName,
                    hasBktParams: !!this. context.bktParams
                });
            }

            // Update local state
            this.setState(prevState => {
                const updatedProblems = prevState.worksheet.problems.map(p => {
                    if (p.problem_order === problemOrder) {
                        return {
                            ...p,
                            user_answer: userAnswer,
                            is_correct: isCorrect,
                            status: 'checked',
                            checked_at: new Date().toISOString()
                        };
                    }
                    return p;
                });

                return {
                    worksheet: {
                        ...prevState.worksheet,
                        problems: updatedProblems,
                        problems_checked: result.problemsChecked
                    },
                    showCompletionDialog: result.allComplete
                };
            });

            // Show feedback
            /* Comment out for now, too confusing and redundant
            if (isCorrect) {
                toast.success('Correct!');
            } else {
                toast.error('Incorrect');
            }*/

            return {
                success: true,
                isCorrect: isCorrect,
                allComplete: result.allComplete
            };
        } catch (error) {
            console.error('Error submitting answer:', error);
            toast.error('Failed to submit answer');
            return { success: false };
        }
    };

    handlePrintWorksheet = () => {
        this.setState({ printMode: 'worksheet' }, () => {
            // Small delay to ensure render completes
            setTimeout(() => {
                window. print();
                this.setState({ printMode: null });
            }, 100);
        });
    };

    handlePrintAnswerKey = () => {
        this.setState({ printMode: 'answerKey' }, () => {
            window. print();
            this.setState({ printMode: null });
        });
    };

    handleGoToDashboard = () => {
        this.props.history.push('/dashboard');
    };

    render() {
        const { classes } = this.props;
        const { worksheet, problemsData = [], loading, error, showCompletionDialog, printMode } = this.state;


        if (loading) {
            return (
                <div className={classes.root}>
                    {/* Navigation Bar */}
                    <AppBar position="static">
                        <Toolbar>
                            <BrandLogoNav />
                        </Toolbar>
                    </AppBar>

                    <Container className={classes.loading}>
                        <CircularProgress size={60} />
                    </Container>
                </div>
            );
        }

        if (error || ! worksheet) {
            return (
                <div className={classes.root}>
                    {/* Navigation Bar */}
                    <AppBar position="static">
                        <Toolbar>
                            <BrandLogoNav />
                        </Toolbar>
                    </AppBar>

                    <Container className={classes.container}>
                        <Typography variant="h5" color="error">
                            {error || 'Worksheet not found'}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={this.handleGoToDashboard}
                            style={{ marginTop: 20 }}
                        >
                            Go to Dashboard
                        </Button>
                    </Container>
                </div>
            );
        }

        const progress = (worksheet.problems_checked / worksheet.total_problems) * 100;
        const lesson = findLessonById(worksheet.lesson_id);
        return (
            <div className={classes.root}>
                {/* Screen Content */}
                <div className={classes.noPrint}>
                    {/* Navigation Bar */}
                    <AppBar position="static">
                        <Toolbar>
                            <BrandLogoNav />
                        </Toolbar>
                    </AppBar>

                    {/* Page Header */}
                    <Box className={classes.pageHeader}>
                        <Container maxWidth="lg">
                            <Typography className={classes.pageTitle}>
                                Enter Your Worksheet Answers
                            </Typography>
                        </Container>
                    </Box>

                    {/* Content */}
                    <Container className={classes.container}>
                        {/* Header with Lesson Info */}
                        <Box className={classes.header}>
                            <Box className={classes.lessonInfo}>
                                {lesson ?  (
                                    <>
                                        <Typography className={classes.lessonTitle}>
                                            {lesson.name} - {lesson.topics}
                                        </Typography>
                                        {IS_STAGING_OR_DEVELOPMENT && (
                                            <Typography className={classes.lessonId}>
                                                Lesson ID: {worksheet.lesson_id}
                                            </Typography>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Typography className={classes.lessonTitle}>
                                            Lesson: {worksheet.lesson_id}
                                        </Typography>
                                        {IS_STAGING_OR_DEVELOPMENT && (
                                            <Typography className={classes.lessonId}>
                                                (Lesson details not found)
                                            </Typography>
                                        )}
                                    </>
                                )}
                            </Box>
                            <div className={classes.actionButtons}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<PrintIcon />}
                                    onClick={this.handlePrintWorksheet}
                                >
                                    Print Worksheet
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<PrintIcon />}
                                    onClick={this.handlePrintAnswerKey}
                                >
                                    Print Answer Key
                                </Button>
                            </div>
                        </Box>

                        {/* Progress */}
                        <Paper className={classes.progress} elevation={2}>
                            <Box p={2}>
                                <Typography variant="body1" gutterBottom>
                                    Progress: {worksheet.problems_checked} / {worksheet.total_problems} problems checked
                                </Typography>
                                <Box
                                    width="100%"
                                    bgcolor="grey.300"
                                    borderRadius={5}
                                    height={10}
                                >
                                    <Box
                                        width={`${progress}%`}
                                        bgcolor="primary.main"
                                        borderRadius={5}
                                        height="100%"
                                        style={{ transition: 'width 0.3s ease' }}
                                    />
                                </Box>
                            </Box>
                        </Paper>

                        {/* Problems Grid */}
                        <Grid container spacing={3} className={classes.problemsGrid}>
                            {worksheet.problems.map((problem) => (
                                <Grid item xs={12} key={problem.problem_order}>
                                    <WorksheetProblemCard
                                        problem={problem}
                                        onSubmit={this.handleSubmitAnswer}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Container>

                    {/* Completion Dialog */}
                    <Dialog
                        open={showCompletionDialog}
                        onClose={() => this.setState({ showCompletionDialog: false })}
                        maxWidth="sm"
                        fullWidth
                    >
                        <DialogContent style={{ textAlign: 'center', padding: '32px' }}>
                            <AssignmentTurnedInIcon className={classes.completionIcon} />
                            <Typography variant="h6" gutterBottom style={{ marginTop: 26 }}>
                                All answers submitted!
                            </Typography>
                            <Typography variant="body1" color="textSecondary">
                                Thanks for practicing and entering your answers.
                                Your progress has been updated!
                            </Typography>
                        </DialogContent>
                        <DialogActions style={{ padding: '16px 24px', justifyContent: 'center' }}>
                            <Button
                                onClick={this.handleGoToDashboard}
                                color="primary"
                                variant="contained"
                                size="large"
                            >
                                Check Your Progress
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>

                {/* Print-Only Content */}
                <div className={classes.printOnly}>
                    {worksheet && problemsData && problemsData.length > 0 && (
                        <>
                            {printMode === 'worksheet' && (
                                <PrintableWorksheet
                                    worksheet={worksheet}
                                    problemsData={problemsData}
                                />
                            )}
                            {printMode === 'answerKey' && (
                                <PrintableAnswerKey
                                    worksheet={worksheet}
                                    problemsData={problemsData}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }
}

export default withRouter(withStyles(styles)(EnterWorksheetAnswers));