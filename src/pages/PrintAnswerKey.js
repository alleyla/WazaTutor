import React, { Component } from 'react';
import {
    Container,
    Typography,
    CircularProgress,
    Box,
    Paper,
    Button,
    Chip
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import PrintIcon from '@material-ui/icons/Print';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import worksheetService from '../services/worksheetService';
import { findLessonById, ThemeContext } from '../config/config';
import { IS_STAGING_OR_DEVELOPMENT } from '../util/getBuildType';
import { renderText, chooseVariables } from '../platform-logic/renderText';

const styles = (theme) => ({
        printContainer: {
            padding: theme.spacing(3),
            maxWidth: 800,
            margin: '0 auto',
            '@media print': {
                padding: 0,
                maxWidth: 'none'
            }
        },
        noPrint: {
            '@media print': {
                display: 'none'
            }
        },
        header: {
            textAlign: 'center',
            marginBottom: theme.spacing(4),
            paddingBottom: theme.spacing(2),
            borderBottom: '2px solid #333'
        },
        lessonTitle: {
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: theme.spacing(0.5),
        },
        lessonSubtitle: {
            fontSize: '1rem',
            color: '#666',
            marginBottom: theme.spacing(0.5),
        },
        lessonId: {
            fontSize: '0.75rem',
            color: '#999',
            fontFamily: 'monospace',
            marginTop: theme.spacing(0.5),
        },
        problemItem: {
            marginBottom: theme.spacing(3),
            padding: theme.spacing(2),
            border: '1px solid #ddd',
            borderRadius: 4,
            pageBreakInside: 'avoid'
        },
        problemNumber: {
            fontWeight: 'bold',
            fontSize: '1.1rem',
            marginBottom: theme.spacing(1)
        },
        problemTitle: {
            fontSize: '1rem',
            fontWeight: 500,
            marginTop: theme.spacing(1),
            marginBottom: theme.spacing(0.5),
        },
        problemBody: {
            marginBottom: theme.spacing(1.5),
    fontSize: '0.95rem',
    color: '#333',
    '& img': {
    display: 'none', // Hide images in answer key
}
},
problemId: {
    fontSize: '0.7rem',
        color: '#999',
        fontFamily: 'monospace',
        marginBottom: theme.spacing(1),
},
answerBox: {
    marginTop: theme.spacing(1.5),
    padding: theme.spacing(1.5),
        backgroundColor: '#e8f5e9',
        border: '1px solid #4caf50',
        borderRadius: 4
},
answerLabel: {
    fontSize: '0.75rem',
        color: '#666',
        marginBottom: theme.spacing(0.5),
        fontWeight: 600,
        textTransform: 'uppercase'
},
mathDisplay: {
    display: 'inline-block',
        fontSize: '1.4rem',
        '& math-field': {
        border: 'none',
            padding: '4px 8px',
            minHeight: 'auto',
            fontSize: 'inherit',
            backgroundColor: 'transparent'
    }
},
loading: {
    display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh'
},
buttonGroup: {
    display: 'flex',
        gap: theme.spacing(2),
        marginBottom: theme.spacing(3),
        justifyContent: 'center'
}
});

class PrintAnswerKey extends Component {
    static contextType = ThemeContext;

    constructor(props, context) {
        super(props);

        const worksheetId = props.match?.params?.worksheetId;

        this.state = {
            worksheetId,
            worksheet: null,
            problemsData: [],
            loading: true,
            error: null
        };

        this.problemIndex = null;
    }

    async componentDidMount() {
        // Load problem pool
        try {
            const problemPoolModule = await import(`@generated/processed-content-pool/${this.context.CONTENT_SOURCE || 'wazatutor'}.json`);
            this.problemIndex = {
                problems: problemPoolModule.default || problemPoolModule
            };
        } catch (error) {
            console.error('Error loading problem pool:', error);
            this.setState({
                error: 'Failed to load problem pool',
                loading: false
            });
            return;
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

            // Match worksheet problems with full problem data from problem pool
            const problemsData = worksheet.problems.map(worksheetProblem => {
                const fullProblem = this.problemIndex.problems.find(
                    p => p.id === worksheetProblem.problem_id
                );

                if (!fullProblem) {
                    console.warn(`Problem ${worksheetProblem.problem_id} not found in problem pool`);
                    return {
                        ...worksheetProblem,
                        problemData: null,
                        seed: `worksheet-${this.state.worksheetId}-${worksheetProblem.problem_order}`
                    };
                }

                return {
                    ...worksheetProblem,
                    problemData: fullProblem,
                    seed: `worksheet-${this.state.worksheetId}-${worksheetProblem.problem_order}`
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
        }
    };

    handlePrint = () => {
        window.print();
    };

    handleBack = () => {
        this.props.history.goBack();
    };

    // Render LaTeX as math using MathLive
    renderMath = (latex) => {
        if (!latex) return <span>—</span>;

        const cleanLatex = latex.replace(/\$\$/g, '').trim();

        return (
            <math-field
                read-only
                style={{
                    border: 'none',
                    padding: '4px 8px',
                    fontSize: '1.4rem',
                    backgroundColor: 'transparent'
                }}
            >
                {cleanLatex}
            </math-field>
        );
    };

    render() {
        const { classes } = this.props;
        const { worksheet, problemsData, loading, error } = this.state;

        if (loading) {
            return (
                <Container className={classes.loading}>
                    <CircularProgress size={60} />
                </Container>
            );
        }

        if (error || !worksheet) {
            return (
                <Container className={classes.printContainer}>
                    <Typography variant="h5" color="error">
                        {error || 'Worksheet not found'}
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this.handleBack}
                        style={{ marginTop: 20 }}
                    >
                        Go Back
                    </Button>
                </Container>
            );
        }

        const lesson = findLessonById(worksheet.lesson_id);

        return (
            <>
                {/* Print Controls (hidden when printing) */}
                <Box className={classes.noPrint}>
                    <Container>
                        <Box className={classes.buttonGroup} style={{ marginTop: 20 }}>
                            <Button
                                variant="outlined"
                                onClick={this.handleBack}
                            >
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<PrintIcon />}
                                onClick={this.handlePrint}
                            >
                                Print Answer Key
                            </Button>
                        </Box>
                    </Container>
                </Box>

                {/* Printable Content */}
                <Container className={classes.printContainer}>
                    <Box className={classes.header}>
                        <Typography variant="h4" gutterBottom>
                            Answer Key
                        </Typography>
                        {lesson ?  (
                            <>
                                <Typography className={classes.lessonTitle}>
                                    {lesson.name}
                                </Typography>
                                <Typography className={classes.lessonSubtitle}>
                                    {lesson.topics}
                                </Typography>
                                {IS_STAGING_OR_DEVELOPMENT && (
                                    <Typography className={classes.lessonId}>
                                        Lesson ID: {worksheet.lesson_id}
                                    </Typography>
                                )}
                            </>
                        ) : (
                            <Typography variant="subtitle1" color="textSecondary">
                                Lesson: {worksheet.lesson_id}
                            </Typography>
                        )}
                        <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
                            Total Problems: {worksheet.total_problems}
                        </Typography>
                    </Box>

                    {/* Answers */}
                    {problemsData.map((problemItem) => {
                        const { problemData, seed, problem_order } = problemItem;

                        // Generate variables for this problem
                        const vars = problemData?.variabilization
                            ? chooseVariables(problemData.variabilization, seed)
                            : {};

                        return (
                            <Paper key={problem_order} className={classes.problemItem} elevation={1}>
                                <Typography className={classes.problemNumber}>
                                    Problem {problem_order}
                                </Typography>

                                {/* Problem Title */}
                                {problemData?.title && (
                                    <Typography className={classes.problemTitle}>
                                        {renderText(problemData.title, problemData.id, vars, this.context)}
                                    </Typography>
                                )}

                                {/* Problem Body (no images) */}
                                {problemData?.body && (
                                    <Box className={classes.problemBody}>
                                        {renderText(problemData.body, problemData.id, vars, this.context)}
                                    </Box>
                                )}

                                {/* Problem ID (Dev Mode Only) */}
                                {IS_STAGING_OR_DEVELOPMENT && (
                                    <Typography className={classes.problemId}>
                                        Problem ID: {problemItem.problem_id}
                                    </Typography>
                                )}

                                {/* Answer Box */}
                                <Box className={classes.answerBox}>
                                    <Typography variant="caption" className={classes.answerLabel}>
                                        Answer
                                    </Typography>
                                    <Box className={classes.mathDisplay}>
                                        {this.renderMath(problemItem.correct_answer)}
                                    </Box>
                                </Box>
                            </Paper>
                        );
                    })}
                </Container>
            </>
        );
    }
}

export default withStyles(styles)(PrintAnswerKey);