import React, {
    useEffect,
    useState,
    useMemo,
    useContext,
} from 'react';
import { useParams } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Container,
    Grid,
    Box,
    Typography,
    makeStyles,
} from '@material-ui/core';

import BrandLogoNav from '@components/BrandLogoNav';
import ProblemWrapper from '@components/problem-layout/ProblemWrapper';
import { findLessonById, ThemeContext, SHOW_COPYRIGHT, SITE_NAME } from '../../config/config.js';
import { CONTENT_SOURCE } from '@common/global-config';
import withTranslation from '../../util/withTranslation.js';

const useStyles = makeStyles(theme => ({
        root: {
            backgroundColor: theme.palette.background.default,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
        },
        container: {
            flexGrow: 1,
            padding: theme.spacing(4, 0),
        },
        lessonHeader: {
            textAlign: 'center',
            marginBottom: theme.spacing(4),
            color: theme.palette.primary.main,
        },
        textSecondary: {
            color: theme.palette.primary.main,
        },
        problemCard: {
            position: 'relative',
            marginBottom: theme.spacing(4),
        },
        noFooterWrapper: {
            '& footer': {
                display: 'none',
            },
            '& div[width="100%"]': {
                display: 'none',
            },
        },
        loadingBox: {
            textAlign: 'center',
            padding: theme.spacing(2),
        },
        footer: {
            marginTop: 'auto',
            padding: theme.spacing(2),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        idBadge: {
            position: 'absolute',
            top: theme.spacing(1),
            right: theme.spacing(1),
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
},
}));

const ViewAllProblems = ({ translate }) => {
    const classes = useStyles();
    const { lessonID } = useParams();
    const context = useContext(ThemeContext);

    const [lesson, setLesson] = useState(null);
    const [problemPool, setProblemPool] = useState([]);
    const [filteredProblems, setFilteredProblems] = useState([]);
    const [visibleProblems, setVisibleProblems] = useState([]);
    const [seed] = useState(() => Date.now().toString());

    // no-op handlers for ProblemWrapper
    const displayMastery = () => {};
    const problemComplete = () => {};

    // Load pool
    useEffect(() => {
        import(`@generated/processed-content-pool/${CONTENT_SOURCE}.json`)
            .then(m => setProblemPool(m.default || []))
            .catch(console.error);
    }, []);

    // Find lesson
    useEffect(() => {
        const found = findLessonById(lessonID);
        if (found) setLesson(found);
    }, [lessonID]);

    // Filter by objectives
    const memoFiltered = useMemo(() => {
        if (!lesson || problemPool.length === 0) return [];
        const pool = problemPool.filter(problem =>
            problem.steps.some(step =>
                (context.skillModel[step.id] || []).some(kc => kc in lesson.learningObjectives)
            )
        );

        return pool;
    }, [lesson, problemPool, context.skillModel]);

    useEffect(() => {
        setFilteredProblems(memoFiltered);
    }, [memoFiltered]);

    // Chunk rendering
    useEffect(() => {
        setVisibleProblems(filteredProblems);
    }, [filteredProblems]);

    // Safely build topics string
    const topicsText = lesson?.topics
        ?  Array.isArray(lesson.topics)
            ? lesson.topics.join(', ')
            : String(lesson.topics)
        : '';

    return (
        <Box className={classes.root}>
            <AppBar position="static">
                <Toolbar>
                    <BrandLogoNav />
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" className={classes.container}>
                {/* Lesson Title - Centered */}
                {lesson && (
                    <Box className={classes.lessonHeader}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {lesson.name}
                        </Typography>
                        {topicsText && (
                            <Typography variant="h6" color="textSecondary">
                                {topicsText}
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Problems List */}
                {visibleProblems.length ?  visibleProblems.map(problem => (
                    <Box key={problem.id} className={classes.problemCard}>
                        {/* ID badge */}
                        <Box className={classes.idBadge}>
                            <Typography variant="caption" color="textSecondary">
                                {problem.id}
                            </Typography>
                        </Box>
                        <Box className={classes.noFooterWrapper}>
                            <ProblemWrapper
                                autoScroll={false}
                                problem={problem}
                                lesson={lesson}
                                seed={seed}
                                clearStateOnPropChange={lessonID}
                                displayMastery={displayMastery}
                                problemComplete={problemComplete}
                            />
                        </Box>
                    </Box>
                )) : (
                    <Box className={classes.loadingBox}>
                        <Typography>{translate('loadingProblems') || 'Loading problems…'}</Typography>
                    </Box>
                )}
            </Container>

            {/* Footer */}
            <Box className={classes.footer}>
                {SHOW_COPYRIGHT && (
                    <Typography variant="body2" color="textSecondary">
                        © {new Date().getFullYear()} {SITE_NAME}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default withTranslation(ViewAllProblems);