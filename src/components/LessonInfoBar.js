import React from 'react';
import { Box, Typography, Container } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    lessonInfoSection: {
        padding: theme.spacing(4, 3, 3, 3),
        backgroundColor: theme.palette. background.paper,
        borderBottom: `1px solid ${theme. palette.divider}`,
    },
    lessonTitle: {
        fontSize: '1.5rem',
        fontWeight: 700,
        color: theme.palette.text.primary,
        textAlign: 'center',
    },
    masteryText: {
        marginLeft: theme.spacing(2),
        color: theme.palette.primary.main,
    },
}));

const LessonInfoBar = ({ lessonName, lessonTopics, mastery }) => {
    const classes = useStyles();

    return (
        <Box className={classes.lessonInfoSection}>
            <Container maxWidth="lg">
                <Typography className={classes.lessonTitle}>
                    {lessonName} - {lessonTopics}
                    {mastery !== null && mastery !== undefined && (
                        <span className={classes.masteryText}>
                            • Mastery: {Math.round(mastery * 100)}%
                        </span>
                    )}
                </Typography>
            </Container>
        </Box>
    );
};

export default LessonInfoBar;