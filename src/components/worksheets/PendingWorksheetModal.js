import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import AssignmentIcon from '@material-ui/icons/Assignment';

const useStyles = makeStyles((theme) => ({
    dialogContent: {
        padding: theme.spacing(3),
        textAlign: 'center'
    },
    icon: {
        fontSize: 60,
        color: theme.palette.primary.main,
        marginBottom: theme.spacing(2)
    },
    title: {
        textAlign: 'center'
    }
}));

const PendingWorksheetModal = ({ open, worksheet, onEnterAnswers, onDismiss }) => {
    const classes = useStyles();

    return (
        <Dialog
            open={open && !!worksheet}
            onClose={onDismiss}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle className={classes.title}>
                Pending Paper Practice
            </DialogTitle>
            <DialogContent className={classes.dialogContent}>
                <AssignmentIcon className={classes.icon} />
                <Typography variant="h6" gutterBottom>
                    You have a pending worksheet!
                </Typography>
                {worksheet && (
                    <>
                        <Typography variant="body1" color="textSecondary" paragraph>
                            You have {worksheet.problems_checked} of {worksheet.total_problems} problems checked.
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Would you like to enter your worksheet answers now?
                        </Typography>
                    </>
                )}
            </DialogContent>
            <DialogActions style={{ padding: '24px', justifyContent: 'center' }}>
                <Button onClick={onDismiss} color="default" style={{ padding: '10px', justifyContent: 'center' }}>
                    Not Now
                </Button>
                <Button
                    onClick={onEnterAnswers}
                    color="primary"
                    variant="contained"
                    style={{ padding: '10px', justifyContent: 'center' }}
                    autoFocus
                >
                    Yes, Enter Answers
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PendingWorksheetModal;