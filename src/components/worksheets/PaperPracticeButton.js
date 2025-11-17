import React, { Component } from 'react';
import { Button } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { withRouter } from 'react-router-dom';
import worksheetService from '../../services/worksheetService';
import storageService from '../../services/storageService';

const styles = (theme) => ({
    button: {
        margin: theme.spacing(1)
    }
});

class PaperPracticeButton extends Component {
    handleClick = async () => {
        const { lessonId, history } = this.props;

        // Check authentication
        if (!storageService.isAuthenticated()) {
            history.push('/login');
            return;
        }

        // Check for pending worksheet
        const pending = await worksheetService.checkPendingWorksheet();

        if (pending) {
            // Go to enter answers page
            history.push(`/worksheets/${pending.id}/enter-answers`);
        } else {
            // Go to generate worksheet page
            history.push(`/lessons/${lessonId}/generate-worksheet`);
        }
    };

    render() {
        const { classes, variant = 'outlined', color = 'primary' } = this.props;

        return (
            <Button
                className={classes.button}
                variant={variant}
                color={color}
                startIcon={<AssignmentIcon />}
                onClick={this.handleClick}
            >
                Paper Practice
            </Button>
        );
    }
}

export default withRouter(withStyles(styles)(PaperPracticeButton));