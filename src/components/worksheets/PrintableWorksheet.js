import React, { Component } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { ThemeContext, findLessonById } from '../../config/config';
import { renderText, chooseVariables } from '../../platform-logic/renderText';
import { IS_STAGING_OR_DEVELOPMENT } from '../../util/getBuildType';

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
    problemId: {
        fontSize: '0.7rem',
        color: '#999',
        fontFamily: 'monospace',
        marginBottom: theme.spacing(1),
    },
    problemContent: {
        marginBottom: theme.spacing(2),
        '& img': {
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            margin: '8px 0'
        }
    },
    workSpace: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
        backgroundColor: '#fafafa',
        border: '1px solid #ddd',
        borderRadius: 4,
        minHeight: 120
    },
    workSpaceLabel: {
        fontSize: '0.75rem',
        color: '#888',
        fontStyle: 'italic',
        marginBottom: theme.spacing(1)
    },
    answerSpace: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
        backgroundColor: '#fff',
        border: '2px dashed #999',
        borderRadius: 4,
        minHeight: 60
    },
    answerLabel: {
        fontSize: '0.875rem',
        fontWeight: 600,
        color: '#333',
        marginBottom: theme.spacing(0.5)
    }
});

class PrintableWorksheet extends Component {
    static contextType = ThemeContext;

    render() {
        const { classes, worksheet, problemsData } = this.props;
        const lesson = findLessonById(worksheet.lesson_id);

        return (
            <Container className={classes.printContainer}>
                <Box className={classes.header}>
                    <Typography variant="h4" gutterBottom>
                        Paper Practice Worksheet
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
                    <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
                        Name: _____________________________ Date: ______________
                    </Typography>
                </Box>

                {/* Problems */}
                {problemsData.map((problemItem) => {
                    const { problemData, seed, problem_order, problem_id } = problemItem;
                    const vars = chooseVariables(problemData.variabilization, seed);

                    return (
                        <Paper key={problem_order} className={classes.problemItem} elevation={1}>
                            <Typography className={classes.problemNumber}>
                                Problem {problem_order}
                            </Typography>

                            {IS_STAGING_OR_DEVELOPMENT && (
                                <Typography className={classes.problemId}>
                                    Problem ID: {problem_id}
                                </Typography>
                            )}

                            {problemData.title && (
                                <Box className={classes.problemContent}>
                                    <Typography variant="h6" style={{ marginBottom: 8 }}>
                                        {renderText(problemData.title, problem_id, vars, this.context)}
                                    </Typography>
                                </Box>
                            )}

                            {problemData.body && (
                                <Box className={classes.problemContent}>
                                    {renderText(problemData.body, problem_id, vars, this.context)}
                                </Box>
                            )}

                            {problemData.steps && problemData.steps.length > 0 && (
                                <Box className={classes.problemContent}>
                                    {problemData.steps.map((step, stepIdx) => (
                                        <Box key={stepIdx} style={{ marginBottom: 12 }}>
                                            {renderText(
                                                step.stepTitle + " : " + step.stepBody,
                                                problem_id,
                                                vars,
                                                this.context
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            <Box className={classes.workSpace}>
                                <Typography className={classes.workSpaceLabel}>
                                    Show your work here:
                                </Typography>
                            </Box>

                            <Box className={classes.answerSpace}>
                                <Typography className={classes.answerLabel}>
                                    Final Answer:
                                </Typography>
                            </Box>
                        </Paper>
                    );
                })}

                <Box style={{ marginTop: 40, textAlign: 'center', display: 'none' }} className="print-only">
                    <Typography variant="body2" color="textSecondary">
                        When completed, log back in to enter your answers and check your work.
                    </Typography>
                </Box>
            </Container>
        );
    }
}

export default withStyles(styles)(PrintableWorksheet);