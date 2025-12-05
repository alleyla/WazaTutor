import React, { Component } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    Chip,
    Divider
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import { checkAnswer } from "../../platform-logic/checkAnswer.js";
import { IS_STAGING_OR_DEVELOPMENT } from '../../util/getBuildType';


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
        marginBottom: theme.spacing(2)
    },
    mathFieldLabel: {
        marginBottom: theme.spacing(1),
        display: 'block',
        fontWeight: 500,
        fontSize: '0.95rem'
    },
    mathFieldWrapper: {
        marginBottom: theme.spacing(2),
        '& math-field': {
            display: 'block',
            width: '100%',
            minHeight: '56px',
            fontSize: '20px',
            padding: '12px',
            border: '2px solid #ccc',
            borderRadius: '4px',
            backgroundColor: '#fff',
            fontFamily: 'inherit',
            '&:focus': {
                borderColor: theme.palette.primary.main,
                outline: 'none',
                boxShadow: `0 0 0 3px ${theme.palette.primary.main}33`
            }
        }
    },
    submitButton: {
        width: '100%',
        padding: theme.spacing(1.5)
    },
    feedbackBox: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius
    },
    feedbackIcon: {
        verticalAlign: 'middle',
        marginRight: theme.spacing(1)
    },
    answerDisplay: {
        fontFamily: 'monospace',
        padding: theme.spacing(0.5, 1),
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
        display: 'inline-block'
    },
    devScriptBody: {
        fontSize: '0.875rem',
        color: theme.palette.text.disabled,
        fontFamily: 'monospace',
        marginTop: theme.spacing(0.5),
    },
});

class WorksheetProblemCard extends Component {
    constructor(props) {
        super(props);
        this.mathFieldRef = React.createRef();
        this.state = {
            userAnswer: props.problem.user_answer || '',
            submitting: false,
            mathLiveReady: false
        };
    }

    componentDidMount() {
        // Wait for MathLive to load
        this.checkMathLiveReady();
    }

    checkMathLiveReady = () => {
        if (typeof window !== 'undefined' && window.MathfieldElement) {
            this.setState({ mathLiveReady: true });
            this.initializeMathField();
        } else {
            // Try again in 100ms
            setTimeout(this.checkMathLiveReady, 100);
        }
    };

    initializeMathField = () => {
        if (this.mathFieldRef.current) {
            const mathField = this.mathFieldRef.current;

            // Set initial value
            if (this.state.userAnswer) {
                mathField.value = this.state.userAnswer;
            }

            // Configure virtual keyboard
            if (window.mathVirtualKeyboard) {
                try {
                    window.mathVirtualKeyboard.layouts = ["numeric", "symbols", "alphabetic"];
                } catch (e) {
                    console.warn('Could not set keyboard layout:', e);
                }
            }
        }
    };

    handleInput = (evt) => {
        const mathField = evt.target;
        const latexValue = mathField.value;
        console.log('MathField input:', latexValue);
        this.setState({ userAnswer: latexValue });
    };

    checkAnswerCorrectness = (userAnswer, problem) => {
        if (!userAnswer || !problem.correct_answer) {
            return false;
        }

        try {
            // Clean the correct answer from database (remove $$ delimiters)
            const correctAnswer = problem.correct_answer.replace(/\$\$/g, '').trim();

            console.log('Checking answer:', {
                userAnswer: userAnswer,
                correctAnswer: correctAnswer,
                problemId: problem.problem_id
            });

            // Use the existing checkAnswer utility (same as ProblemCard.js)
            const [parsed, isCorrect, reason] = checkAnswer({
                attempt: userAnswer.trim(),
                actual: correctAnswer,
                answerType: 'math',
                precision: 3,
                variabilization: {},
                questionText: problem.problem_id || ''
            });

            console.log('Answer check result:', {
                parsed,
                isCorrect,
                reason,
                userSubmitted: userAnswer,
                expectedAnswer: correctAnswer
            });

            return isCorrect;

        } catch (error) {
            console.error('Error checking answer:', error);

            // Fallback: normalize both answers
            const normalizeLatex = (str) => {
                return str
                    .replace(/\$\$/g, '')
                    .replace(/\s+/g, '')
                    .replace(/\\left/g, '')
                    .replace(/\\right/g, '')
                    .replace(/\{/g, '')
                    .replace(/\}/g, '')
                    .toLowerCase()
                    .trim();
            };

            const userNormalized = normalizeLatex(userAnswer);
            const correctNormalized = normalizeLatex(problem.correct_answer);

            console.log('Fallback comparison:', {
                original: { user: userAnswer, correct: problem.correct_answer },
                normalized: { user: userNormalized, correct: correctNormalized },
                match: userNormalized === correctNormalized
            });

            return userNormalized === correctNormalized;
        }
    };

    handleSubmit = async () => {
        const { problem, onSubmit } = this.props;
        const { userAnswer } = this.state;

        if (!userAnswer.trim()) {
            return;
        }

        this.setState({ submitting: true });

        try {
            const isCorrect = this.checkAnswerCorrectness(userAnswer, problem);

            console.log('Submitting answer:', {
                problemOrder: problem.problem_order,
                userAnswer,
                isCorrect
            });

            await onSubmit(problem.problem_order, userAnswer, problem, isCorrect);
        } catch (error) {
            console.error('Error submitting answer:', error);
        } finally {
            this.setState({ submitting: false });
        }
    };

    handleKeyPress = (evt) => {
        if (evt.key === 'Enter' && !evt.shiftKey) {
            evt.preventDefault();
            this.handleSubmit();
        }
    };

    // NEW METHOD: Render LaTeX as math
    renderMath = (latex) => {
        // Remove $$ delimiters if present
        const cleanLatex = latex.replace(/\$\$/g, '').trim();

        return (
            <math-field
                read-only
                style={{
                    border: 'none',
                    padding: '4px 8px',
                    fontSize: '1.2rem',
                    backgroundColor: 'transparent'
                }}
            >
                {cleanLatex}
            </math-field>
        );
    };

    render() {
        const { classes, problem } = this.props;
        const { userAnswer, submitting, mathLiveReady } = this.state;

        const isChecked = problem.status === 'checked';
        const isCorrect = problem.is_correct;

        const cardStyle = isChecked ? {
            borderLeft: `4px solid ${isCorrect ? '#4caf50' : '#f44336'}`
        } : {};

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

                    {/* Problem ID (Dev Mode Only) */}
                    {IS_STAGING_OR_DEVELOPMENT && (
                        <Typography className={classes.devScriptBody}>
                            Problem ID: {problem.problem_id}
                        </Typography>
                    )}
                    <Divider className={classes.divider} />

                    {/* Answer Input */}
                    {!isChecked && (
                        <Box className={classes.inputSection}>
                            <Typography variant="body2" className={classes.mathFieldLabel}>
                                Enter your answer:
                            </Typography>
                            {mathLiveReady ? (
                                <Box className={classes.mathFieldWrapper}>
                                    <math-field
                                        ref={this.mathFieldRef}
                                        virtual-keyboard-mode="onfocus"
                                        onInput={this.handleInput}
                                        onKeyPress={this.handleKeyPress}
                                    />
                                </Box>
                            ) : (
                                <Typography variant="body2" color="textSecondary">
                                    Loading math input...
                                </Typography>
                            )}
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={this.handleSubmit}
                                disabled={!userAnswer.trim() || submitting || !mathLiveReady}
                                className={classes.submitButton}
                                size="large"
                            >
                                {submitting ? 'Submitting...' : 'Submit Answer'}
                            </Button>
                        </Box>
                    )}

                    {/* Feedback - UPDATED TO RENDER MATH */}
                    {isChecked && (
                        <Box className={classes.feedbackBox} style={feedbackStyle}>
                            {isCorrect ? (
                                <>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <CheckCircleIcon
                                            className={classes.feedbackIcon}
                                            style={{ color: '#4caf50', fontSize: 24 }}
                                        />
                                        <Typography variant="body1" component="span">
                                            <strong>Correct!</strong>
                                        </Typography>
                                    </Box>
                                    <Box mt={1} display="flex" alignItems="center">
                                        <Typography variant="body2" component="span" style={{ marginRight: 8 }}>
                                            Your answer:
                                        </Typography>
                                        <Box className={classes.mathDisplay}>
                                            {this.renderMath(problem.user_answer)}
                                        </Box>
                                    </Box>
                                </>
                            ) : (
                                <>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <CancelIcon
                                            className={classes.feedbackIcon}
                                            style={{ color: '#f44336', fontSize: 24 }}
                                        />
                                        <Typography variant="body1" component="span">
                                            <strong>Incorrect</strong>
                                        </Typography>
                                    </Box>
                                    <Box mt={1} display="flex" alignItems="center" mb={1}>
                                        <Typography variant="body2" component="span" style={{ marginRight: 8 }}>
                                            Your answer:
                                        </Typography>
                                        <Box className={classes.mathDisplay}>
                                            {this.renderMath(problem.user_answer)}
                                        </Box>
                                    </Box>
                                    <Box display="flex" alignItems="center">
                                        <Typography variant="body2" component="span" style={{ marginRight: 8 }}>
                                            Correct answer:
                                        </Typography>
                                        <Box className={classes.mathDisplay}>
                                            {this.renderMath(problem.correct_answer)}
                                        </Box>
                                    </Box>
                                </>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>
        );
    }
}

export default withStyles(styles)(WorksheetProblemCard);