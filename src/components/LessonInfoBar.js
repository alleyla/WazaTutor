import React from 'react';
import { Box, Typography, Container } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import PaperPracticeButton from './worksheets/PaperPracticeButton';
import storageService from '../services/storageService';

const useStyles = makeStyles((theme) => ({
    lessonInfoSection: {
        padding: theme.spacing(3),
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    lessonInfoContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    lessonContent: {
        flex: 1,
        textAlign: 'center',
    },
    lessonTitle: {
        fontSize: '1.5rem',
        fontWeight: 600,
        color: theme.palette.text.primary,
    },
    masteryText: {
        marginLeft: theme.spacing(2),
        color: theme.palette.primary.light,
    },
    actionButtons: {
        position: 'absolute',
        right: 0,
    },
}));

const LessonInfoBar = ({ lessonName, lessonTopics, mastery, lessonId }) => {
    const classes = useStyles();
    const isAuthenticated = storageService.isAuthenticated();

    return (
        <Box className={classes.lessonInfoSection}>
            <Container maxWidth="lg">
                <Box className={classes.lessonInfoContainer}>
                    <Box className={classes.lessonContent}>
                        <Typography className={classes.lessonTitle}>
                            {lessonName} - {lessonTopics}
                            {mastery !== null && mastery !== undefined && (
                                <span className={classes.masteryText}>
                                    • Mastery: {Math.round(mastery * 100)}%
                                </span>
                            )}
                        </Typography>
                    </Box>

                    {/* Paper Practice Button on the right */}
                    {isAuthenticated && lessonId && (
                        <Box className={classes.actionButtons}>
                            <PaperPracticeButton
                                lessonId={lessonId}
                                variant="contained"
                                color="primary"
                            />
                        </Box>
                    )}
                </Box>
            </Container>
        </Box>
    );
};

export default LessonInfoBar;