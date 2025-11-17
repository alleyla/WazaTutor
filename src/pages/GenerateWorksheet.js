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
    MenuItem
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import PrintIcon from '@material-ui/icons/Print';
import AssignmentIcon from '@material-ui/icons/Assignment';
import worksheetService from '../services/worksheetService';
import { ThemeContext } from '../config/config';
import { WORKSHEET_CONFIG } from '../config/config';
import { toast } from 'react-toastify';
import { findLessonById } from '../config/config';

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
    }
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

            //toast.success('Worksheet generated successfully!');
            this.setState({
                generating: false,
                generatedWorksheet: result.worksheet
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
        const { generatedWorksheet } = this.state;
        if (generatedWorksheet) {
            this.props.history.push(`/worksheets/${generatedWorksheet.id}/print`);
        }
    };

    handlePrintAnswerKey = () => {
        const { generatedWorksheet } = this.state;
        if (generatedWorksheet) {
            this.props.history.push(`/worksheets/${generatedWorksheet.id}/print-answers`);
        }
    };

    handleGoToDashboard = () => {
        this.props.history.push('/dashboard');
    };

    render() {
        const { classes } = this.props;
        const { generating, generatedWorksheet, error, loading } = this.state;

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
            <Container className={classes.container}>
                <Typography variant="h4" gutterBottom>
                    Generate Paper Practice Worksheet
                </Typography>

                {!generatedWorksheet ? (
                    <Paper className={classes.paper}>
                        <Box className={classes.centerContent}>
                            <AssignmentIcon className={classes.icon} />
                            <Typography variant="h6" gutterBottom>
                                Ready for Paper Practice
                            </Typography>
                            <Typography variant="body1" color="textSecondary" paragraph>
                                You're ready for some paper practice. Generate a new personalized worksheet?
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
                                onClick={this.handleGoToDashboard}
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

                        <Box className={classes.buttonGroup}>
                            <Button
                                variant="text"
                                onClick={this.handleGoToDashboard}
                            >
                                Go to Dashboard
                            </Button>
                        </Box>
                    </Paper>
                )}
            </Container>
        );
    }
}

export default withStyles(styles)(GenerateWorksheet);