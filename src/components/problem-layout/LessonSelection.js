import React, { Fragment } from 'react';
import { Grid, Box, Paper, Typography, Button, IconButton, Divider, Container } from '@material-ui/core';

import { withStyles } from '@material-ui/core/styles';
import styles from './common-styles.js';
import { _coursePlansNoEditor, ThemeContext, SITE_NAME, SHOW_COPYRIGHT } from '../../config/config.js';
import Spacer from "../Spacer";
import HelpOutlineOutlinedIcon from "@material-ui/icons/HelpOutlineOutlined";
import { IS_STAGING_OR_DEVELOPMENT } from "../../util/getBuildType";
import BuildTimeIndicator from "@components/BuildTimeIndicator";
import withTranslation from "../../util/withTranslation.js";
import Popup from '../Popup/Popup.js';
import About from '../../pages/Posts/About.js';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import LibraryBooksIcon from '@material-ui/icons/LibraryBooks';
import ListIcon from '@material-ui/icons/List';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';

const customStyles = (theme) => ({
        ... styles(theme),
        lessonInfoSection: {
            padding: theme.spacing(3),
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme. palette.divider}`,
        },
        lessonTitle: {
            fontSize: '1.5rem',
            fontWeight: 600,
            color: theme. palette.text.primary,
            textAlign: 'center',
        },
        pathContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(0),
            maxWidth: 600,
            margin: '0 auto',
        },
        pathItem: {
            width: '100%',
            padding: theme.spacing(3),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
                transform: 'translateX(8px)',
                boxShadow: theme.shadows[4],
            },
        },
        pathItemContent: {
            flex: 1,
            textAlign: 'left',
        },
        pathItemTitle: {
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: theme.spacing(1.5),
        color: theme.palette.text.primary,
        },
        pathItemActions: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(0.5),
            marginTop: theme.spacing(0.5),
        },
        actionIconButton: {
            padding: theme.spacing(0.75),
            color: theme.palette.primary.main,
            '&:hover': {
                backgroundColor: theme.palette.primary.light,
                color: theme.palette.primary. contrastText,
            },
        },
        actionIcon: {
            fontSize: '1.4rem',
        },

        linkIcon: {
            fontSize: '1.1rem',
        },
        pathItemMeta: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(0.5),
            fontSize: '0.9rem',
            color: theme.palette.text.secondary,
            marginTop: theme.spacing(0.5),
        },
        metaIcon: {
            fontSize: '1.1rem',
        },
        pathItemIcon: {
            color: theme.palette.primary.main,
            fontSize: '2rem',
        },
        pathConnector: {
            width: 2,
            height: 24,
            backgroundColor: theme.palette.divider,
            margin: '0 auto',
        },
        rightActions: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(1),
        },
        startButton: {
            backgroundColor: '#00F0FF',
            color: '#0F172A',
            borderRadius: 24,
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
        startButtonIcon: {
            fontSize: '1.2rem',
        },
    });

class LessonSelection extends React.Component {
    static contextType = ThemeContext;

    constructor(props, context) {
        super(props);
        const { courseNum, setLanguage } = this.props;

        if (courseNum == 6) {
            setLanguage('se')
        }

        if (props.history.location.pathname == '/') {
            const defaultLocale = localStorage.getItem('defaultLocale');
            setLanguage(defaultLocale)
        }

        this.user = context.user || {}
        this.isPrivileged = !!this.user.privileged

        this.coursePlans = _coursePlansNoEditor;
        this.togglePopup = this.togglePopup.bind(this);

        this.state = {
            preparedRemoveProgress: false,
            removedProgress: false,
            showPopup: false
        }
    }

    togglePopup = () => {
        console.log("Toggling popup visibility");
        this.setState((prevState) => ({
            showPopup: !prevState.showPopup,
        }));
    };

    removeProgress = () => {
        this.setState({ removedProgress: true });
        this.props.removeProgress();
    }

    prepareRemoveProgress = () => {
        this.setState({ preparedRemoveProgress: true });
    }

    // Helper function to get textbook URL for a lesson
    getTextbookUrl = (lesson) => {
        // You can customize this based on the lesson's course or other properties
        // For now, returning a default OpenStax PreAlgebra link
        // You might want to make this more dynamic based on lesson.courseOER or other fields
        return lesson.courseOER || 'https://openstax.org/details/books/prealgebra-2e';
    }

    render() {
        const { translate } = this.props;
        const { classes, courseNum } = this.props;
        const selectionMode = courseNum == null ?  "course" : "lesson"
        const { showPopup } = this.state;

        if (selectionMode === "lesson" && courseNum >= this.coursePlans.length) {
            return <Box width={'100%'} textAlign={'center'} pt={4} pb={4}>
                <Typography variant={'h3'}>Course <code>{courseNum}</code> is not valid! </Typography>
            </Box>
        }

        return (
            <>
                <Box className={classes.lessonInfoSection}>
                    <Container maxWidth="lg">
                        <Typography className={classes.lessonTitle}>
                            {translate('lessonSelection.select')} {selectionMode === "course" ? translate('lessonSelection.course') : translate('lessonSelection.lessonplan')}
                        </Typography>
                    </Container>
                </Box>
                <div>
                    <Grid
                        container
                        spacing={0}
                        direction="column"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Box width="90%" maxWidth="lg" role={"main"}>

                            {IS_STAGING_OR_DEVELOPMENT && (
                                <center>
                                    <BuildTimeIndicator/>
                                    <Spacer/>
                                </center>
                            )}

                            {/* Path-style layout */}
                            <div className={classes.pathContainer}>
                                {selectionMode === "course"
                                    ? this.coursePlans.map((course, i) => (
                                        <Fragment key={course.courseName}>
                                            <Paper
                                                className={classes.pathItem}
                                                onClick={() => {
                                                    this.props.history.push(`/courses/${i}`)
                                                }}
                                                elevation={2}
                                            >
                                                <div className={classes.pathItemContent}>
                                                    <div className={classes.pathItemTitle}>
                                                        {course.courseName}
                                                    </div>
                                                    <div className={classes.pathItemMeta}>
                                                        <LibraryBooksIcon className={classes.metaIcon} />
                                                        <span>{course.lessons?.length || 0} lessons</span>
                                                    </div>
                                                </div>
                                                <div className={classes.rightActions}>
                                                    <Button
                                                        className={classes.startButton}
                                                        startIcon={<PlayArrowIcon className={classes.startButtonIcon} />}
                                                        onClick={(e) => {
                                                            e. stopPropagation();
                                                            this.props.history.push(`/courses/${i}`)
                                                        }}
                                                    >
                                                        Start Course
                                                    </Button>
                                                </div>
                                            </Paper>
                                            {i < this.coursePlans.length - 1 && (
                                                <div className={classes.pathConnector} />
                                            )}
                                        </Fragment>
                                    ))
                                    : this.coursePlans[this.props.courseNum].lessons.map((lesson, i) => {
                                        const textbookUrl = this.getTextbookUrl(lesson);

                                        return (
                                            <Fragment key={lesson.id}>
                                                <Paper
                                                    className={classes.pathItem}
                                                    onClick={() => this.props.history.push(`/lessons/${lesson.id}`)}
                                                    elevation={2}
                                                >
                                                    <div className={classes.pathItemContent}>
                                                        <div className={classes.pathItemTitle}>
                                                            {lesson.name.replace(/##/g, "")} - {lesson.topics}
                                                        </div>
                                                        <div className={classes.pathItemActions}>
                                                            <IconButton
                                                                className={classes. actionIconButton}
                                                                size="small"
                                                                aria-label="View all problems"
                                                                title="View all problems"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    this.props.history.push(`/lessons/${lesson.id}/problems`);
                                                                }}
                                                            >
                                                                <ListIcon className={classes.actionIcon} />
                                                            </IconButton>
                                                            <IconButton
                                                                className={classes.actionIconButton}
                                                                size="small"
                                                                component="a"
                                                                href={textbookUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                aria-label="Learn from textbook"
                                                                title="Learn from textbook"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                }}
                                                            >
                                                                <MenuBookIcon className={classes.actionIcon} />
                                                            </IconButton>
                                                        </div>
                                                    </div>
                                                    <div className={classes.rightActions}>
                                                        <Button
                                                            className={classes.startButton}
                                                            startIcon={<PlayArrowIcon className={classes.startButtonIcon} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                this. props.history.push(`/lessons/${lesson.id}`)
                                                            }}
                                                        >
                                                            Start Lesson
                                                        </Button>
                                                    </div>
                                                </Paper>
                                                {i < this.coursePlans[this.props.courseNum].lessons.length - 1 && (
                                                    <div className={classes.pathConnector} />
                                                )}
                                            </Fragment>
                                        );
                                    })
                                }
                            </div>

                            <Spacer/>
                        </Box>
                    </Grid>
                    <Spacer/>
                    {IS_STAGING_OR_DEVELOPMENT && selectionMode !== "course" &&(
                        <>
                            <Grid container spacing={0}>
                                <Grid item xs={3} sm={3} md={5} key={1}/>
                                {! this.isPrivileged && <Grid item xs={6} sm={6} md={2} key={2}>
                                    {this.state.preparedRemoveProgress ?
                                        <Button className={classes. button} style={{ width: "100%" }} size="small"
                                                onClick={this.removeProgress}
                                                disabled={this.state.removedProgress}>{this. state.removedProgress ? translate('lessonSelection.reset') : translate('lessonSelection.aresure')}</Button> :
                                        <Button className={classes.button} style={{ width: "100%" }} size="small"
                                                onClick={this.prepareRemoveProgress}
                                                disabled={this. state.preparedRemoveProgress}>{translate('lessonSelection.resetprogress')}</Button>}
                                </Grid>}
                                <Grid item xs={3} sm={3} md={4} key={3}/>
                            </Grid>
                            <Spacer/>
                        </>
                    )}
                    <Spacer/>
                </div>
                <footer>
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                        <div style={{ marginLeft: 20, fontSize: 16 }}>
                            {SHOW_COPYRIGHT && <>© {new Date().getFullYear()} {SITE_NAME}</>}
                        </div>
                        <div style={{ display: "flex", flexGrow: 1, marginRight: 20, justifyContent: "flex-end" }}>
                            <IconButton aria-label="about" title={`About ${SITE_NAME}`}
                                        onClick={this.togglePopup}>
                                <HelpOutlineOutlinedIcon htmlColor={"#000"} style={{
                                    fontSize: 36,
                                    margin: -2
                                }}/>
                            </IconButton>
                        </div>
                        <Popup isOpen={showPopup} onClose={this.togglePopup}>
                            <About />
                        </Popup>
                    </div>
                </footer>
            </>
        )
    }
}

export default withStyles(customStyles)(withTranslation(LessonSelection));