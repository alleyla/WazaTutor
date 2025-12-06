import React, { Component } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { findLessonById, ThemeContext } from '../../config/config';
import { IS_STAGING_OR_DEVELOPMENT } from '../../util/getBuildType';
import { renderText, chooseVariables } from '../../platform-logic/renderText';

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
            display: 'none',
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
    }
});

class PrintableAnswerKey extends Component {
    static contextType = ThemeContext;

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
        const { classes, worksheet, problemsData } = this.props;
        const lesson = findLessonById(worksheet.lesson_id);

        return (
            <Container className={classes.printContainer}>
                <Box className={classes.header}>
                    <Typography variant="h4" gutterBottom>
                        Answer Key
                    </Typography>
                    {lesson ? (
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

                {problemsData.map((problemItem) => {
                    const { problemData, seed, problem_order } = problemItem;
                    const vars = problemData?.variabilization
                        ? chooseVariables(problemData.variabilization, seed)
                        : {};

                    return (
                        <Paper key={problem_order} className={classes.problemItem} elevation={1}>
                            <Typography className={classes.problemNumber}>
                                Problem {problem_order}
                            </Typography>

                            {problemData?.title && (
                                <Typography className={classes.problemTitle}>
                                    {renderText(problemData.title, problemData.id, vars, this.context)}
                                </Typography>
                            )}

                            {problemData?.body && (
                                <Box className={classes.problemBody}>
                                    {renderText(problemData.body, problemData.id, vars, this.context)}
                                </Box>
                            )}

                            {IS_STAGING_OR_DEVELOPMENT && (
                                <Typography className={classes.problemId}>
                                    Problem ID: {problemItem.problem_id}
                                </Typography>
                            )}

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
        );
    }
}

export default withStyles(styles)(PrintableAnswerKey);