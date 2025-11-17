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
    answerBox: {
        marginTop: theme.spacing(1),
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
    constructor(props) {
        super(props);

        const worksheetId = props.match?.params?.worksheetId;

        this.state = {
            worksheetId,
            worksheet: null,
            loading: true,
            error: null
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
        const { worksheet, loading, error } = this.state;

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
                        <Typography variant="subtitle1" color="textSecondary">
                            Lesson: {worksheet.lesson_id}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Total Problems: {worksheet.total_problems}
                        </Typography>
                    </Box>

                    {/* Answers */}
                    {worksheet.problems.map((problem) => (
                        <Paper key={problem.problem_order} className={classes.problemItem} elevation={1}>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography className={classes.problemNumber}>
                                    Problem {problem.problem_order}
                                </Typography>
                            </Box>

                            {problem.skill_name && (
                                <Typography variant="caption" color="textSecondary" style={{ marginTop: 8, display: 'block' }}>
                                    Skill: {problem.skill_name}
                                </Typography>
                            )}

                            <Typography variant="caption" color="textSecondary" gutterBottom>
                                Problem id: {problem.problem_id}
                            </Typography>

                            <Box className={classes.answerBox}>
                                <Typography variant="caption" className={classes.answerLabel}>
                                    Answer
                                </Typography>
                                <Box className={classes.mathDisplay}>
                                    {this.renderMath(problem.correct_answer)}
                                </Box>
                            </Box>


                        </Paper>
                    ))}
                </Container>
            </>
        );
    }
}

export default withStyles(styles)(PrintAnswerKey);