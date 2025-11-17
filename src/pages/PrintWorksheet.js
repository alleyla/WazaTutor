import React, { Component } from 'react';
import {
    Container,
    Typography,
    CircularProgress,
    Box,
    Paper,
    Button
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import PrintIcon from '@material-ui/icons/Print';
import worksheetService from '../services/worksheetService';
import { ThemeContext } from '../config/config';
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
    printOnly: {
        display: 'none',
        '@media print': {
            display: 'block'
        }
    },
    header: {
        textAlign: 'center',
        marginBottom: theme.spacing(4),
        paddingBottom: theme.spacing(2),
        borderBottom: '2px solid #333'
    },
    problemItem: {
        marginBottom: theme.spacing(4),
        padding: theme.spacing(2),
        border: '1px solid #ddd',
        borderRadius: 4,
        pageBreakInside: 'avoid'
    },
    problemNumber: {
        fontWeight: 'bold',
        fontSize: '1.2rem',
        marginBottom: theme.spacing(1)
    },
    answerSpace: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
        backgroundColor: '#f9f9f9',
        border: '1px dashed #ccc',
        minHeight: 60
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

class PrintWorksheet extends Component {
    static contextType = ThemeContext;

    constructor(props) {
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
        // Load problem pool (same as GenerateWorksheet does)
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
                    return null;
                }

                return {
                    ...worksheetProblem,
                    problemData: fullProblem,
                    // Use consistent seed for reproducible problem generation
                    seed: `worksheet-${this.state.worksheetId}-${worksheetProblem.problem_order}`
                };
            }).filter(Boolean); // Remove any null entries

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
                                Print
                            </Button>
                        </Box>
                    </Container>
                </Box>

                {/* Printable Content */}
                <Container className={classes.printContainer}>
                    <Box className={classes.header}>
                        <Typography variant="h4" gutterBottom>
                            Paper Practice Worksheet
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            Lesson: {worksheet.lesson_id}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Total Problems: {worksheet.total_problems}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
                            Name: _____________________________ Date: ______________
                        </Typography>
                    </Box>

                    {/* Problems */}
                    {problemsData.map((problemItem) => {
                        const { problemData, seed, problem_order } = problemItem;
                        const vars = chooseVariables(problemData.variabilization, seed);

                        return (
                            <Paper key={problem_order} className={classes.problemItem} elevation={1}>
                                <Typography className={classes.problemNumber}>
                                    Problem {problem_order}
                                </Typography>

                                {/* Problem Title */}
                                {problemData.title && (
                                    <Box className={classes.problemContent}>
                                        <Typography variant="h6" style={{ marginBottom: 8 }}>
                                            {renderText(problemData.title, problemData.id, vars, this.context)}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Problem Body/Instructions */}
                                {problemData.body && (
                                    <Box className={classes.problemContent}>
                                        {renderText(problemData.body, problemData.id, vars, this.context)}
                                    </Box>
                                )}

                                {/* Problem Steps */}
                                {problemData.steps && problemData.steps.length > 0 && (
                                    <Box className={classes.problemContent}>
                                        {problemData.steps.map((step, stepIdx) => (
                                            <Box key={stepIdx} style={{ marginBottom: 12 }}>
                                                {renderText(
                                                    step.stepTitle + " : " + step.stepBody,
                                                    `${problemData.id}-${step.id}`,
                                                    vars,
                                                    this.context
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                )}

                                {/* Answer Space */}
                                <Box className={classes.answerSpace}>
                                    <Typography variant="body2" color="textSecondary">
                                        Answer:
                                    </Typography>
                                </Box>
                            </Paper>
                        );
                    })}

                    {/* Footer */}
                    <Box className={classes.printOnly} style={{ marginTop: 40, textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary">
                            When completed, log back in to enter your answers and check your work.
                        </Typography>
                    </Box>
                </Container>
            </>
        );
    }
}

export default withStyles(styles)(PrintWorksheet);