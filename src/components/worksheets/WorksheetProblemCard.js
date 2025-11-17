import React, { Component } from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Box,
    Chip
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';

const styles = (theme) => ({
    card: {
        position: 'relative'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing(2)
    },
    problemNumber: {
        fontWeight: 'bold',
        color: theme.palette.primary.main
    },
    statusChip: {
        fontWeight: 'bold'
    },
    inputSection: {
        marginTop: theme.spacing(2),
        display: 'flex',
        gap: theme.spacing(2),
        alignItems: 'flex-start'
    },
    textField: {
        flex: 1
    },
    feedbackBox: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius
    },
    feedbackIcon: {
        verticalAlign: 'middle',
        marginRight: theme.spacing(1)
    }
});

class WorksheetProblemCard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            userAnswer: props.problem.user_answer || '',
            submitting: false
        };
    }

    handleAnswerChange = (event) => {
        this.setState({ userAnswer: event.target.value });
    };

    /**
     * Check if answer is correct using basic comparison
     * TODO: Integrate with your existing checkAnswer utility for production
     */
    checkAnswerCorrectness = (userAnswer, correctAnswer) => {
        if (!userAnswer || !correctAnswer) return false;

        const userStr = String(userAnswer).trim().toLowerCase();
        const correctStr = String(correctAnswer).trim().toLowerCase();

        // Exact match
        if (userStr === correctStr) return true;

        // Numeric comparison
        const userNum = parseFloat(userStr);
        const correctNum = parseFloat(correctStr);

        if (!isNaN(userNum) && !isNaN(correctNum)) {
            return Math.abs(userNum - correctNum) < 0.0001;
        }

        return false;
    };

    handleSubmit = async () => {
        const { problem, onSubmit } = this.props;
        const { userAnswer } = this.state;

        if (!userAnswer.trim()) {
            return;
        }

        this.setState({ submitting: true });

        try {
            // Check correctness on frontend
            const isCorrect = this.checkAnswerCorrectness(userAnswer, problem.correct_answer);

            // Submit with correctness determination
            await onSubmit(problem.problem_order, userAnswer, problem, isCorrect);
        } finally {
            this.setState({ submitting: false });
        }
    };

    render() {
        const { classes, problem } = this.props;
        const { userAnswer, submitting } = this.state;

        const isChecked = problem.status === 'checked';
        const isCorrect = problem.is_correct;

        // Dynamic card border style
        const cardStyle = isChecked ? {
            borderLeft: `4px solid ${isCorrect ? '#4caf50' : '#f44336'}`
        } : {};

        // Dynamic feedback background
        const feedbackStyle = isChecked ? {
            backgroundColor: isCorrect ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'
        } : {};

        return (
            <Card className={classes.card} style={cardStyle} elevation={3}>
                <CardContent>
                    {/* Header */}
                    <Box className={classes.header}>
                        <Typography variant="h6" className={classes.problemNumber}>
                            Problem {problem.problem_order}
                        </Typography>
                        {isChecked && (
                            <Chip
                                icon={isCorrect ? <CheckCircleIcon /> : <CancelIcon />}
                                label={isCorrect ? 'Correct' : 'Incorrect'}
                                color={isCorrect ? 'primary' : 'secondary'}
                                className={classes.statusChip}
                            />
                        )}
                    </Box>

                    {/* Problem Info */}
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Problem ID: {problem.problem_id}
                    </Typography>
                    {problem.skill_name && (
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Skill: {problem.skill_name}
                        </Typography>
                    )}

                    {/* Answer Input */}
                    {!isChecked && (
                        <Box className={classes.inputSection}>
                            <TextField
                                className={classes.textField}
                                label="Your Answer"
                                variant="outlined"
                                value={userAnswer}
                                onChange={this.handleAnswerChange}
                                disabled={submitting}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        this.handleSubmit();
                                    }
                                }}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={this.handleSubmit}
                                disabled={!userAnswer.trim() || submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit'}
                            </Button>
                        </Box>
                    )}

                    {/* Feedback */}
                    {isChecked && (
                        <Box className={classes.feedbackBox} style={feedbackStyle}>
                            <Typography variant="body1">
                                {isCorrect ? (
                                    <>
                                        <CheckCircleIcon
                                            className={classes.feedbackIcon}
                                            style={{ color: '#4caf50' }}
                                        />
                                        Correct! Your answer: <strong>{problem.user_answer}</strong>
                                    </>
                                ) : (
                                    <>
                                        <CancelIcon
                                            className={classes.feedbackIcon}
                                            style={{ color: '#f44336' }}
                                        />
                                        Incorrect. Your answer: <strong>{problem.user_answer}</strong>
                                        <br />
                                        Correct answer: <strong>{problem.correct_answer}</strong>
                                    </>
                                )}
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    }
}

export default withStyles(styles)(WorksheetProblemCard);