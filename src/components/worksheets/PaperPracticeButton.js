import React, { Component } from 'react';
import { Button, Badge } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import AssignmentIcon from '@material-ui/icons/Assignment';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { withRouter } from 'react-router-dom';
import worksheetService from '../../services/worksheetService';
import storageService from '../../services/storageService';

const styles = (theme) => ({
    button: {
        backgroundColor: '#00F0FF',
        color: '#0F172A',
        borderRadius: 14,
        padding: theme.spacing(1, 3),
        fontWeight: 600,
        fontSize: '0.95rem',
        textTransform: 'none',
        boxShadow: '0 2px 8px rgba(0, 240, 255, 0.3)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
            backgroundColor: '#00D4E0',
            transform: 'scale(1.05)',
            boxShadow: '0 4px 12px rgba(0, 240, 255, 0.5)',
        },
    },
    icon: {
        fontSize: '1.2rem',
        color: '${theme.palette.secondary.main}'
    },
    badge: {
        '& .MuiBadge-badge': {
            backgroundColor: theme.palette.error.main,
            color: 'white',
        }
    },
    optionButton: {
        border: `2px solid ${theme.palette.secondary.main}`,
        color: theme.palette.secondary.main,
        backgroundColor: `${theme.palette.primary.main}`,
        fontWeight: 600,
        '&:hover': {
            border: `2px solid ${theme. palette.primary.dark}`,
            backgroundColor: `${theme.palette.secondary.light}`,
            color: theme.palette.primary.dark
        }
    }
});

class PaperPracticeButton extends Component {
    state = {
        hasPending: false,
        pendingWorksheet: null,
        loading: true
    };

    async componentDidMount() {
        await this.checkPendingWorksheet();
    }

    checkPendingWorksheet = async () => {
        if (!storageService.isAuthenticated()) {
            this.setState({ loading: false });
            return;
        }

        try {
            const pending = await worksheetService.checkPendingWorksheet();
            this.setState({
                hasPending: !!pending,
                pendingWorksheet: pending,
                loading: false
            });
        } catch (error) {
            console.error('Failed to check pending worksheet:', error);
            this.setState({ loading: false });
        }
    };

    handleClick = async () => {
        const { lessonId, history } = this.props;
        const { hasPending, pendingWorksheet } = this.state;

        // Check authentication
        if (!storageService.isAuthenticated()) {
            history.push('/login');
            return;
        }

        if (hasPending && pendingWorksheet) {
            // State 2: Go to enter answers page
            history.push(`/worksheets/${pendingWorksheet.id}/enter-answers`);
        } else {
            // State 1: Go to generate worksheet page
            history.push(`/lessons/${lessonId}/generate-worksheet`);
        }
    };

    render() {
        const { classes, variant, color } = this.props;
        const { hasPending, loading } = this.state;

        // Don't render while loading
        if (loading) {
            return null;
        }

        // State 2: Pending worksheet exists - "Action" state
        if (hasPending) {
            return (
                <Badge
                    badgeContent="1"
                    className={classes.badge}
                    overlap="rectangular"
                >
                    <Button
                        className={`${classes. button} ${classes.optionButton}`}
                        variant="contained"
                        color="primary"
                        startIcon={<CheckCircleIcon />}
                        onClick={this.handleClick}
                    >
                        Submit Worksheet
                    </Button>
                </Badge>
            );
        }

        // State 1: No pending worksheet - "Option" state
        return (
            <Button
                className={`${classes. button} ${classes.optionButton}`}
                startIcon={<AssignmentIcon className={classes.icon} />}
                onClick={this.handleClick}
            >
                Switch to Paper Practice
            </Button>
        );
    }
}

export default withRouter(withStyles(styles)(PaperPracticeButton));