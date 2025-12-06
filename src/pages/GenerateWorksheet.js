import React, { Component } from 'react';
import {
    Container,
    Typography,
    Button,
    CircularProgress,
    Paper,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    AppBar,
    Toolbar,
    Divider
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import PrintIcon from '@material-ui/icons/Print';
import AssignmentIcon from '@material-ui/icons/Assignment';
import worksheetService from '../services/worksheetService';
import { ThemeContext } from '../config/config';
import { WORKSHEET_CONFIG } from '../config/config';
import { toast } from 'react-toastify';
import { findLessonById } from '../config/config';
import PrintableWorksheet from '../components/worksheets/PrintableWorksheet';
import PrintableAnswerKey from '../components/worksheets/PrintableAnswerKey';
import BrandLogoNav from '@components/BrandLogoNav';

const styles = (theme) => ({
    container: {
        padding: theme.spacing(4),
        maxWidth: 800
    },
    paper: {
        padding: theme.spacing(4),
        marginTop: theme.spacing(3)
    },
    formControl: {
        marginBottom: theme.spacing(3),
        minWidth: 200
    },
    buttonGroup: {
        display: 'flex',
        gap: theme.spacing(2),
        marginTop: theme.spacing(3),
        justifyContent: 'center'
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh'
    },
    icon: {
        fontSize: 80,
        color: theme.palette.primary.main,
        marginBottom: theme.spacing(2)
    },
    centerContent: {
        textAlign: 'center',
        marginBottom: theme.spacing(3)
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
        padding: theme.spacing(4, 3, 3, 3),
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    pageTitle: {
        fontSize: '1.75rem',
        fontWeight: 500,
        color: theme.palette.text.primary,
        textAlign: 'center',
    },
});

class GenerateWorksheet extends Component {
    static contextType = ThemeContext;

    constructor(props) {
        super(props);

        const lessonId = props.match?.params?.lessonId || props.lessonId;

        this.state = {
            lessonId,
            generating: false,
            generatedWorksheet: null,
            error: null,
            problemsData: [],
            printMode: null,
            loading: true  // loading state
        };

        this.problemIndex = null;
    }

    async componentDidMount() {
        // Load problem pool here where this.context is available
        try {
            const problemPoolModule = await import(`@generated/processed-content-pool/${this.context.CONTENT_SOURCE || 'wazatutor'}.json`);
            this.problemIndex = {
                problems: problemPoolModule.default || problemPoolModule
            };
            this.setState({ loading: false });
        } catch (error) {
            console.error('Error loading problem pool:', error);
            this.setState({ loading: false, error: 'Failed to load problem pool' });
        }

        // Check if there's already a pending worksheet
        const pending = await worksheetService.checkPendingWorksheet();
        if (pending) {
            toast.warning('You already have a pending worksheet');
            this.props.history.push(`/worksheets/${pending.id}/enter-answers`);
        }
    }

    handleGenerate = async () => {
        const { lessonId } = this.state;

        if (!lessonId) {
            toast.error('No lesson selected');
            return;
        }

        this.setState({ generating: true, error: null });

        try {
            const maxProblems = WORKSHEET_CONFIG.DEFAULT_WORKSHEET_PROBLEMS;
            const problemPool = this.selectProblemsForWorksheet(lessonId, maxProblems);

            if (problemPool.length === 0) {
                toast.error('No problems available for this lesson');
                this.setState({ generating: false });
                return;
            }

            // Generate worksheet on server
            const result = await worksheetService.generateWorksheet(
                lessonId,
                maxProblems,
                problemPool
            );

            if (!result.success) {
                toast.error(result.error || 'Failed to generate worksheet');
                this.setState({ generating: false, error: result.error });
                return;
            }

            // Map problems with full data for printing
            const problemsData = (result.worksheet && result.worksheet.problems && this.problemIndex)
                ? result.worksheet.problems.map(worksheetProblem => {
                    const fullProblem = this.problemIndex.problems.find(
                        p => p.id === worksheetProblem.problem_id
                    );

                    return {
                        ...worksheetProblem,
                        problemData: fullProblem || null,
                        seed: `worksheet-${result.worksheet.id}-${worksheetProblem.problem_order}`
                    };
                })
                : [];  // Return empty array if any required data is missing


            this.setState({
                generating: false,
                generatedWorksheet: result.worksheet,
                problemsData
            });
        } catch (error) {
            console.error('Error generating worksheet:', error);
            toast.error('Failed to generate worksheet');
            this.setState({ generating: false, error: error.message });
        }
    };

    selectProblemsForWorksheet = (lessonId, maxProblems) => {
        const context = this.context;

        // Use the imported findLessonById function
        const lesson = findLessonById(lessonId);
        if (!lesson) {
            console.error('Lesson not found:', lessonId);
            return [];
        }

        // Get problem pool (same as Platform.js this.problemIndex.problems)
        const problems = this.problemIndex.problems.filter(
            ({ courseName }) => !courseName.toString().startsWith("!!")
        );

        // Calculate mastery for each problem (EXACT copy from Platform.js)
        for (const problem of problems) {
            let probMastery = 1;
            let isRelevant = false;

            for (const step of problem.steps) {
                if (typeof step.knowledgeComponents === "undefined") {
                    continue;
                }
                for (const kc of step.knowledgeComponents) {
                    if (typeof lesson.learningObjectives[kc] === "undefined") {
                        continue;
                    }
                    isRelevant = true;
                    if (!(kc in context.bktParams)) {
                        console.log("Missing BKT parameter: " + kc);
                    }
                    probMastery *= context.bktParams[kc].probMastery;
                }
            }

            if (isRelevant) {
                problem.probMastery = probMastery;
            } else {
                problem.probMastery = null;
            }
        }

        // Use heuristic to select problems (same as Platform.js)
        const selectedProblems = [];
        const completedSet = new Set();

        for (let i = 0; i < maxProblems; i++) {
            const chosenProblem = context.heuristic(problems, completedSet);

            if (!chosenProblem) {
                break; // No more eligible problems
            }

            selectedProblems.push(chosenProblem);
            completedSet.add(chosenProblem.id);
        }

        // Format for worksheet
        return selectedProblems.map(problem => ({
            id: problem.id,
            skillName: problem.steps?.[0]?.knowledgeComponents?.[0] || 'unknown',
            correctAnswer: problem.steps?.[0]?.stepAnswer[0] || '',
            problemData: problem
        }));
    };

    handlePrintWorksheet = () => {
        this.setState({ printMode: 'worksheet' }, () => {
            // Small delay to ensure render completes
            setTimeout(() => {
                window.print();
                this.setState({ printMode: null });
            }, 100);
        });
    };

    handlePrintAnswerKey = () => {
        this.setState({ printMode: 'answerKey' }, () => {
            window.print();
            this.setState({ printMode: null });
        });
    };
    handleEnterAnswers = () => {
        const { generatedWorksheet } = this.state;
        if (generatedWorksheet) {
            this.props.history.push(`/worksheets/${generatedWorksheet.id}/enter-answers`);
        }
    };

    handleGoBack = () => {
        this.props.history.goBack();
    };

    render() {
        const { classes } = this.props;
        const { loading, generating, generatedWorksheet, problemsData = [], printMode, error } = this.state;

        // Add loading check
        if (loading) {
            return (
                <Container className={classes.loading}>
                    <CircularProgress size={60} />
                </Container>
            );
        }
        if (generating) {
            return (
                <Container className={classes.loading}>
                    <Box textAlign="center">
                        <CircularProgress size={60} />
                        <Typography variant="h6" style={{ marginTop: 20 }}>
                            Generating your worksheet...
                        </Typography>
                    </Box>
                </Container>
            );
        }

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
                    <Box className={classes.pageHeader}>
                        <Container maxWidth="lg">
                            <Typography className={classes.pageTitle}>
                                Generate Paper Practice Worksheet
                            </Typography>
                        </Container>
                    </Box>

                    <Container className={classes.container}>

                        {!generatedWorksheet ? (
                            <Paper className={classes.paper}>
                                <Box className={classes.centerContent}>
                                    <AssignmentIcon className={classes.icon} />
                                    <Typography variant="h4" gutterBottom>
                                        Great work so far!
                                    </Typography>
                                    <Typography variant="h6" gutterBottom>
                                        You're ready for some paper practice!
                                    </Typography>
                                    <Typography variant="body1" color="textSecondary" paragraph>
                                        Generate a new personalized worksheet?
                                    </Typography>
                                </Box>

                                {error && (
                                    <Typography color="error" paragraph>
                                        {error}
                                    </Typography>
                                )}

                                <Box className={classes.buttonGroup}>
                                    <Button
                                        variant="outlined"
                                        onClick={this.handleGoBack}
                                    >
                                        Not Now
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={this.handleGenerate}
                                        size="large"
                                    >
                                        Yes, Generate Worksheet!
                                    </Button>
                                </Box>
                            </Paper>
                        ) : (
                            <Paper className={classes.paper}>
                                <Box className={classes.centerContent}>
                                    <AssignmentIcon className={classes.icon} style={{ color: '#4caf50' }} />
                                    <Typography variant="h6" gutterBottom>
                                        Worksheet Ready!
                                    </Typography>
                                    <Typography variant="body1" color="textSecondary" paragraph>
                                        Your worksheet has been generated with {generatedWorksheet.total_problems} problems.
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Print your worksheet and complete it offline. When you're ready,
                                        log back in to enter your answers.
                                    </Typography>
                                </Box>

                                <Box className={classes.buttonGroup}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<PrintIcon />}
                                        onClick={this.handlePrintWorksheet}
                                        size="large"
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
                                </Box>
                                <Divider style={{ margin: '24px 0' }} />

                                <Box className={classes.buttonGroup}>
                                    <Button
                                        variant="outlined"
                                        onClick={this.handleBackToLesson}
                                        size="large"
                                    >
                                        Back to Lesson
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={this.handleEnterAnswers}
                                        size="large"
                                    >
                                        Enter Answers Now
                                    </Button>
                                </Box>
                            </Paper>
                        )}
                    </Container>

                </div>

                {/* Print-Only Content - ADD THIS ENTIRE SECTION */}
                <div className={classes.printOnly}>
                    {generatedWorksheet && problemsData && problemsData.length > 0 && (
                        <>
                            {printMode === 'worksheet' && (
                                <PrintableWorksheet
                                    worksheet={generatedWorksheet}
                                    problemsData={problemsData}
                                />
                            )}
                            {printMode === 'answerKey' && (
                                <PrintableAnswerKey
                                    worksheet={generatedWorksheet}
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

export default withStyles(styles)(GenerateWorksheet);