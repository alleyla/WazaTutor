import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import EmojiEventsIcon from '@material-ui/icons/EmojiEvents';
import AssignmentIcon from '@material-ui/icons/Assignment';

const useStyles = makeStyles((theme) => ({
    dialogContent: {
        padding: theme.spacing(4),
        textAlign: 'center'
    },
    icon: {
        fontSize: 80,
        color: theme.palette.primary.main,
        marginBottom: theme.spacing(2)
    },
    title: {
        textAlign: 'center'
    },
    buttonGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
        padding: theme.spacing(2, 3)
    }
}));

const CheckpointModal = ({
                             open,
                             problemsCompleted,
                             onContinueDigital,
                             onStartPaper
                         }) => {
    const classes = useStyles();

    const handleClose = (event, reason) => {
        // Prevent closing on backdrop click or escape key
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            return;
        }
    };

    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            onClose={handleClose}
        >
            <DialogTitle className={classes.title} style={{ marginTop: 28 }}>
                🎉 Checkpoint Reached! 🎉
            </DialogTitle>
            <DialogContent className={classes.dialogContent}>
                <EmojiEventsIcon className={classes.icon} />
                <Typography variant="h6" gutterBottom>
                    Great Progress!
                </Typography>
                <Typography variant="body1" paragraph>
                    You've successfully completed <strong>{problemsCompleted}</strong> problems!
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                    You can now start your paper practice or continue with online practice
                    to work toward 100% mastery.
                </Typography>
            </DialogContent>
            <DialogActions className={classes.buttonGroup}>
                <Button
                    onClick={onStartPaper}
                    color="primary"
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={<AssignmentIcon />}
                >
                    Start Paper Practice
                </Button>
                <Button
                    onClick={onContinueDigital}
                    color="default"
                    variant="outlined"
                    size="large"
                    fullWidth
                >
                    Continue Online Practice
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CheckpointModal;