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
                    {worksheet.problems.map((problem) => (
                        <Paper key={problem.problem_order} className={classes.problemItem} elevation={1}>
                            <Typography className={classes.problemNumber}>
                                Problem {problem.problem_order}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Problem ID: {problem.problem_id}
                            </Typography>
                            {problem.skill_name && (
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Skill: {problem.skill_name}
                                </Typography>
                            )}

                            {/* TODO: Render actual problem content here */}
                            <Box style={{ margin: '20px 0' }}>
                                <Typography variant="body1">
                                    [Problem content will be rendered here - integrate with your problem rendering logic]
                                </Typography>
                            </Box>

                            <Box className={classes.answerSpace}>
                                <Typography variant="body2" color="textSecondary">
                                    Answer:
                                </Typography>
                            </Box>
                        </Paper>
                    ))}

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