import React, { useState } from 'react';
import { IconButton } from '@material-ui/core';
import HelpOutlineOutlinedIcon from '@material-ui/icons/HelpOutlineOutlined';
import Popup from './Popup/Popup';
import About from '../pages/Posts/About';
import { SITE_NAME } from '../config/config';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    floatingButton: {
        position: 'fixed',
        bottom: theme.spacing(3),
        right: theme.spacing(3),
        zIndex: 1000,
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        boxShadow: theme.shadows[6],
        '&:hover': {
            backgroundColor: theme.palette.primary.dark,
            boxShadow: theme.shadows[10],
        },
    },
    icon: {
        fontSize: 28,
    },
}));

const AboutButton = () => {
    const classes = useStyles();
    const [showPopup, setShowPopup] = useState(false);

    return (
        <>
            <IconButton
                className={classes.floatingButton}
                aria-label="about"
                title={`About ${SITE_NAME}`}
                onClick={() => setShowPopup(true)}
            >
                <HelpOutlineOutlinedIcon className={classes.icon} />
            </IconButton>
            <Popup isOpen={showPopup} onClose={() => setShowPopup(false)}>
                <About />
            </Popup>
        </>
    );
};

export default AboutButton;