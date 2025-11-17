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
    DialogActions
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import PrintIcon from '@material-ui/icons/Print';
import worksheetService from '../services/worksheetService';
import progressService from '../services/progressService';
import { ThemeContext } from '../config/config';
import { toast } from 'react-toastify';
import WorksheetProblemCard from '../components/worksheets/WorksheetProblemCard';
import update from '../models/BKT/BKT-brain';

const styles = (theme) => ({
    container: {
        padding: theme.spacing(4),
        maxWidth: 1200
    },
    header: {
        marginBottom: theme.spacing(4),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: theme.spacing(2)
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
    printButtons: {
        display: 'flex',
        gap: theme.spacing(2)
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
            loading: true,
            error: null,
            showCompletionDialog: false
        };
    }

    async componentDidMount() {
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

            this.setState({
                worksheet,
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
            if (result.problem.skillName && this.context.bktParams) {
                const skillParam = this.context.bktParams[result.problem.skillName];
                if (skillParam) {
                    // Update BKT model
                    update(skillParam, isCorrect);

                    // Sync to server
                    await progressService.syncSkillMastery(this.context.bktParams);
                }
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
            if (isCorrect) {
                toast.success('Correct!');
            } else {
                toast.error('Incorrect');
            }

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
        this.props.history.push(`/worksheets/${this.state.worksheetId}/print`);
    };

    handlePrintAnswerKey = () => {
        this.props.history.push(`/worksheets/${this.state.worksheetId}/print-answers`);
    };

    handleGoToDashboard = () => {
        this.props.history.push('/dashboard');
    };

    render() {
        const { classes } = this.props;
        const { worksheet, loading, error, showCompletionDialog } = this.state;

        if (loading) {
            return (
                <Container className={classes.loading}>
                    <CircularProgress size={60} />
                </Container>
            );
        }

        if (error || !worksheet) {
            return (
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
            );
        }

        const progress = (worksheet.problems_checked / worksheet.total_problems) * 100;

        return (
            <Container className={classes.container}>
                {/* Header */}
                <Box className={classes.header}>
                    <div>
                        <Typography variant="h4" gutterBottom>
                            Enter Worksheet Answers
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            Lesson: {worksheet.lesson_id}
                        </Typography>
                    </div>
                    <div className={classes.printButtons}>
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
                        <Button
                            onClick={this.handleGoToDashboard}
                            color="primary"
                            variant="contained"
                            size="large"
                        >
                            Go to Dashboard
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

                {/* Completion Dialog */}
                <Dialog
                    open={showCompletionDialog}
                    onClose={() => this.setState({ showCompletionDialog: false })}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle style={{ textAlign: 'center' }}>
                        Congratulations!
                    </DialogTitle>
                    <DialogContent style={{ textAlign: 'center', padding: '32px' }}>
                        <CheckCircleIcon className={classes.completionIcon} />
                        <Typography variant="h6" gutterBottom style={{ marginTop: 16 }}>
                            Great job!
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                            You have completed and successfully entered all your worksheet answers.
                        </Typography>
                    </DialogContent>
                    <DialogActions style={{ padding: '16px 24px', justifyContent: 'center' }}>
                        <Button
                            onClick={this.handleGoToDashboard}
                            color="primary"
                            variant="contained"
                            size="large"
                        >
                            Go to Dashboard
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        );
    }
}

export default withStyles(styles)(EnterWorksheetAnswers);