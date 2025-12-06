import React from "react";
import { AppBar, Toolbar } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import ProblemWrapper from "@components/problem-layout/ProblemWrapper.js";
import LessonSelectionWrapper from "@components/problem-layout/LessonSelectionWrapper.js";
import { withRouter } from "react-router-dom";
import progressService from '../services/progressService';
import storageService from '../services/storageService';
import CheckpointModal from '../components/worksheets/CheckpointModal';
import PaperPracticeButton from '../components/worksheets/PaperPracticeButton';
import { WORKSHEET_CONFIG } from '../config/config';
import worksheetService from '../services/worksheetService';

import {
    coursePlans,
    findLessonById,
    LESSON_PROGRESS_STORAGE_KEY,
    MIDDLEWARE_URL,
    SITE_NAME,
    ThemeContext,
    MASTERY_THRESHOLD,
} from "../config/config.js";
import to from "await-to-js";
import { toast } from "react-toastify";
import ToastID from "../util/toastIds";
import BrandLogoNav from "@components/BrandLogoNav";
import LessonInfoBar from "@components/LessonInfoBar";
import { cleanArray } from "../util/cleanObject";
import ErrorBoundary from "@components/ErrorBoundary";
import { CONTENT_SOURCE } from "@common/global-config";
import withTranslation from '../util/withTranslation';

let problemPool = require(`@generated/processed-content-pool/${CONTENT_SOURCE}.json`);

let seed = Date.now().toString();
console.log("Generated seed");

class Platform extends React.Component {
    static contextType = ThemeContext;

    constructor(props, context) {
        super(props);
        
        this.problemIndex = {
            problems: problemPool,
        };
        this.completedProbs = new Set();
        this.lesson = null;

        this.user = context.user || {};
        console.debug("USER: ", this.user)
        this.isPrivileged = !!this.user.privileged;
        this.context = context;

        // Add each Q Matrix skill model attribute to each step
        for (const problem of this.problemIndex.problems) {
            for (
                let stepIndex = 0;
                stepIndex < problem.steps.length;
                stepIndex++
            ) {
                const step = problem.steps[stepIndex];
                step.knowledgeComponents = cleanArray(
                    context.skillModel[step.id] || []
                );
            }
        }
        if (this.props.lessonID == null) {
            this.state = {
                currProblem: null,
                status: "courseSelection",
                seed: seed,
                showCheckpointModal: false,
                checkpointReached: false,
                problemsCompletedInSession: 0
            };
        } else {
            this.state = {
                currProblem: null,
                status: "courseSelection",
                seed: seed,
                showCheckpointModal: false,
                checkpointReached: false,
                problemsCompletedInSession: 0
            };
        }

        this.selectLesson = this.selectLesson.bind(this);
        this.saveLessonProgress = this.saveLessonProgress.bind(this);
        this.setCurrentLesson = this.setCurrentLesson.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
        if (this.props.lessonID != null) {
            console.log("calling selectLesson from componentDidMount...") 
            const lesson = findLessonById(this.props.lessonID)
            console.debug("lesson: ", lesson)
            this.selectLesson(lesson).then(
                (_) => {
                    console.debug(
                        "loaded lesson " + this.props.lessonID,
                        this.lesson
                    );
                }
            );

            const { setLanguage } = this.props;
            const defaultLocale = localStorage.getItem('defaultLocale');
            setLanguage(defaultLocale)
        } else if (this.props.courseNum != null) {
            this.selectCourse(coursePlans[parseInt(this.props.courseNum)]);
        }
        this.onComponentUpdate(null, null, null);
    }

    componentWillUnmount() {
        this._isMounted = false;
        this.context.problemID = "n/a";
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.onComponentUpdate(prevProps, prevState, snapshot);
    }

    
    onComponentUpdate(prevProps, prevState, snapshot) {
        if (
            Boolean(this.state.currProblem?.id) &&
            this.context.problemID !== this.state.currProblem.id
        ) {
            this.context.problemID = this.state.currProblem.id;
        }
        if (this.state.status !== "learning") {
            this.context.problemID = "n/a";
        }
    }
    
    async selectLesson(lesson, updateServer=true) {
        const context = this.context;
        console.debug("lesson: ", context)
        console.debug("update server: ", updateServer)
        console.debug("context: ", context)
        if (!this._isMounted) {
            console.debug("component not mounted, returning early (1)");
            return;
        }
        if (this.isPrivileged) {
            // from canvas or other LTI Consumers
            console.log("valid privilege")
            let err, response;
            [err, response] = await to(
                fetch(`${MIDDLEWARE_URL}/setLesson`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token: context?.jwt || this.context?.jwt || "",
                        lesson,
                    }),
                })
            );
            if (err || !response) {
                toast.error(
                    `Error setting lesson for assignment "${this.user.resource_link_title}"`
                );
                console.debug(err, response);
                return;
            } else {
                if (response.status !== 200) {
                    switch (response.status) {
                        case 400:
                            const responseText = await response.text();
                            let [message, ...addInfo] = responseText.split("|");
                            if (
                                Array.isArray(addInfo) &&
                                addInfo[0].length > 1
                            ) {
                                addInfo = JSON.parse(addInfo[0]);
                            }
                            switch (message) {
                                case "resource_already_linked":
                                    toast.error(
                                        `${addInfo.from} has already been linked to lesson ${addInfo.to}. Please create a new assignment.`,
                                        {
                                            toastId:
                                                ToastID.set_lesson_duplicate_error.toString(),
                                        }
                                    );
                                    return;
                                default:
                                    toast.error(`Error: ${responseText}`, {
                                        toastId:
                                            ToastID.expired_session.toString(),
                                        closeOnClick: true,
                                    });
                                    return;
                            }
                        case 401:
                            toast.error(
                                `Your session has either expired or been invalidated, please reload the page to try again.`,
                                {
                                    toastId: ToastID.expired_session.toString(),
                                }
                            );
                            this.props.history.push("/session-expired");
                            return;
                        case 403:
                            toast.error(
                                `You are not authorized to make this action. (Are you an instructor?)`,
                                {
                                    toastId: ToastID.not_authorized.toString(),
                                }
                            );
                            return;
                        default:
                            toast.error(
                                `Error setting lesson for assignment "${this.user.resource_link_title}." If reloading does not work, please contact us.`,
                                {
                                    toastId:
                                        ToastID.set_lesson_unknown_error.toString(),
                                }
                            );
                            return;
                    }
                } else {
                    toast.success(
                        `Successfully linked assignment "${this.user.resource_link_title}" to lesson ${lesson.id} "${lesson.topics}"`,
                        {
                            toastId: ToastID.set_lesson_success.toString(),
                        }
                    );
                    const responseText = await response.text();
                    let [message, ...addInfo] = responseText.split("|");
                    this.props.history.push(
                        `/assignment-already-linked?to=${addInfo.to}`
                    );
                }
            }
        }

        this.lesson = lesson;
        await this.setCurrentLesson(lesson.id);

        const loadLessonProgress = async () => {
            // Try server first if authenticated
            if (storageService.isAuthenticated()) {
                try {
                    const serverProgress = await progressService.loadLessonProgress(lesson.id);
                    if (serverProgress && serverProgress.completed_problems) {
                        console.debug('Loaded lesson progress from server:', serverProgress);
                        return serverProgress.completed_problems;
                    }
                } catch (err) {
                    console.warn('Failed to load lesson progress from server:', err);
                }
            }

            // Fallback to local storage
            const { getByKey } = this.context.browserStorage;
            return await getByKey(
                LESSON_PROGRESS_STORAGE_KEY(lesson.id)
            ).catch((err) => {
                console.debug('No local lesson progress found:', err);
                return null;
            });
        };

        const [, prevCompletedProbs] = await Promise.all([
            this.props.loadBktProgress(),
            loadLessonProgress(),
        ]);
        if (!this._isMounted) {
            console.debug("component not mounted, returning early (2)");
            return;
        }
        if (prevCompletedProbs) {
            console.debug(
                "student has already made progress w/ problems in this lesson before",
                prevCompletedProbs
            );
            this.completedProbs = new Set(prevCompletedProbs);
        }
        this.setState(
            {
                currProblem: this._nextProblem(
                    this.context ? this.context : context
                ),
            },
            () => {
                console.log(this.state.currProblem);
                console.log(this.lesson);
            }
        );
    }

    selectCourse = (course, context) => {
        this.course = course;
        this.setState({
            status: "lessonSelection",
        });
    };

    _nextProblem = async (context) => {
        seed = Date.now().toString();
        this.setState({ seed: seed });
        await this.props.saveProgress();

        if (this.lesson && this.completedProbs.size > 0) {
            const problemsArray = Array.from(this.completedProbs);
            const totalProblems = this.lesson.learningObjectives ?
                Object.keys(this.lesson.learningObjectives).length : 0;
            const completionPercentage = totalProblems > 0 ?
                (problemsArray.length / totalProblems) * 100 : 0;

            this.saveLessonProgress(
                problemsArray,
                totalProblems,
                completionPercentage,
                this.state.currProblem?.id
            ).catch(err => {
                console.error('Failed to save lesson progress:', err);
            });
        }

        const problems = this.problemIndex.problems.filter(
            ({ courseName }) => !courseName.toString().startsWith("!!")
        );
        let chosenProblem;

        console.debug(
            "Platform.js: sample of available problems",
            problems.slice(0, 10)
        );

        for (const problem of problems) {
            // Calculate the mastery for this problem
            let probMastery = 1;
            let isRelevant = false;
            for (const step of problem.steps) {
                if (typeof step.knowledgeComponents === "undefined") {
                    continue;
                }
                for (const kc of step.knowledgeComponents) {
                    if (typeof context.bktParams[kc] === "undefined") {
                        console.log("BKT Parameter " + kc + " does not exist.");
                        continue;
                    }
                    if (kc in this.lesson.learningObjectives) {
                        isRelevant = true;
                    }
                    // Multiply all the mastery priors
                    if (!(kc in context.bktParams)) {
                        console.log("Missing BKT parameter: " + kc);
                    }
                    probMastery *= context.bktParams[kc].probMastery;
                }
            }
            if (isRelevant) {
                problem.probMastery = probMastery;
            } else {
                problem.probMastery = null;
            }
        }

        console.debug(
            `Platform.js: available problems ${problems.length}, completed problems ${this.completedProbs.size}`
        );
        chosenProblem = context.heuristic(problems, this.completedProbs);
        console.debug("Platform.js: chosen problem", chosenProblem);

        const objectives = Object.keys(this.lesson.learningObjectives);
        console.debug("Platform.js: objectives", objectives);
        let score = objectives.reduce((x, y) => {
            return x + context.bktParams[y].probMastery;
        }, 0);
        score /= objectives.length;
        this.displayMastery(score);
        //console.log(Object.keys(context.bktParams).map((skill) => (context.bktParams[skill].probMastery <= this.lesson.learningObjectives[skill])));

        // There exists a skill that has not yet been mastered (a True)
        // Note (number <= null) returns false
        if (
            !Object.keys(context.bktParams).some(
                (skill) =>
                    context.bktParams[skill].probMastery <= MASTERY_THRESHOLD
            )
        ) {
            this.setState({ status: "graduated" });
            console.log("Graduated");
            return null;
        } else if (chosenProblem == null) {
            console.debug("no problems were chosen");
            // We have finished all the problems
            if (this.lesson && !this.lesson.allowRecycle) {
                // If we do not allow problem recycle then we have exhausted the pool
                this.setState({ status: "exhausted" });
                return null;
            } else {
                this.completedProbs = new Set();
                chosenProblem = context.heuristic(
                    problems,
                    this.completedProbs
                );
            }
        }

        if (chosenProblem) {
            this.setState({ currProblem: chosenProblem, status: "learning" });
            // console.log("Next problem: ", chosenProblem.id);
            console.debug("problem information", chosenProblem);
            this.context.firebase.startedProblem(
                chosenProblem.id,
                chosenProblem.courseName,
                chosenProblem.lesson,
                this.lesson.learningObjectives
            );
            return chosenProblem;
        } else {
            console.debug("still no chosen problem..? must be an error");
        }
    };

    problemComplete = async (context) => {
        this.completedProbs.add(this.state.currProblem.id);
        const { setByKey } = this.context.browserStorage;
        await setByKey(
            LESSON_PROGRESS_STORAGE_KEY(this.lesson.id),
            Array.from(this.completedProbs)
        ).catch((error) => {
            this.context.firebase.submitSiteLog(
                "site-error",
                `componentName: Platform.js`,
                {
                    errorName: error.name || "n/a",
                    errorCode: error.code || "n/a",
                    errorMsg: error.message || "n/a",
                    errorStack: error.stack || "n/a",
                },
                this.state.currProblem.id
            );
        });

        if (this.lesson) {
            const problemsArray = Array.from(this.completedProbs);
            const totalProblems = this.lesson.learningObjectives ?
                Object.keys(this.lesson.learningObjectives).length : 0;
            const completionPercentage = totalProblems > 0 ?
                (problemsArray.length / totalProblems) * 100 : 0;

            await this.saveLessonProgress(
                problemsArray,
                totalProblems,
                completionPercentage,
                this.state.currProblem.id
            ).catch(err => {
                console.error('Failed to save lesson progress:', err);
            });
        }
        // Increment problems completed in this session
        this.setState(
            prevState => ({
                problemsCompletedInSession: prevState.problemsCompletedInSession + 1
            }),
            () => {
                // Check for checkpoint after state update
                this.checkForCheckpoint();
            }
        );
        await this._nextProblem(context);
    };

    checkForCheckpoint = async () => {
        const { problemsCompletedInSession, checkpointReached } = this.state;

        if (checkpointReached || !storageService.isAuthenticated()) return;

        // Check if checkpoint reached
        if (problemsCompletedInSession >= WORKSHEET_CONFIG.CHECKPOINT_PROBLEM_COUNT) {
            try {
                const pending = await worksheetService.checkPendingWorksheet();
                if (!pending) {
                    this.setState({
                        showCheckpointModal: true,
                        checkpointReached: true
                    });
                }
            } catch (error) {
                console.error('Error checking for pending worksheet:', error);
                // Don't block user - just skip checkpoint modal
            }
        }
    };

    handleContinueDigital = () => {
        this.setState({ showCheckpointModal: false });
    };

    handleStartPaper = () => {
        const lessonID = this.props.lessonID;
        this.setState({ showCheckpointModal: false });
        this.props.history.push(`/lessons/${lessonID}/generate-worksheet`);
    };

    displayMastery = (mastery) => {
        this.setState({ mastery: mastery });
        if (mastery >= MASTERY_THRESHOLD) {
            toast.success("You've successfully completed this assignment!", {
                toastId: ToastID.successfully_completed_lesson.toString(),
            });
        }
    };

    /**
     * Save lesson progress to both localStorage and server
     */
    saveLessonProgress = async (completedProblems, totalProblems, completionPercentage, lastProblemId) => {
        if (!this.lesson) return;

        const lessonId = this.lesson.id;

        const progressData = {
            completedProblems,
            totalProblems,
            completionPercentage,
            lastProblemId,
            updatedAt: new Date().toISOString()
        };

        // Save to localStorage
        storageService.setLessonProgress(lessonId, progressData);

        // Sync to server if authenticated
        if (storageService.isAuthenticated()) {
            await progressService.saveLessonProgress(
                lessonId,
                completedProblems,
                totalProblems,
                completionPercentage,
                lastProblemId
            ).catch(err => {
                console.error('Failed to sync lesson progress to server:', err);
                // Don't throw - allow app to continue with localStorage
            });
        }
    };

    /**
     * Set the current lesson user is working on
     */
    setCurrentLesson = async (lessonId) => {
        // Save to localStorage
        storageService.setCurrentLesson(lessonId);

        // Sync to server if authenticated
        if (storageService.isAuthenticated()) {
            await progressService.saveCurrentLesson(lessonId).catch(err => {
                console.error('Failed to sync current lesson to server:', err);
            });
        }
    };

    render() {
        const { translate } = this.props;
        this.studentNameDisplay = this.context.studentName
        ? decodeURIComponent(this.context.studentName) + " | "
        : " ";
        const { showCheckpointModal, problemsCompletedInSession } = this.state; // or destructure from state
        const { lessonID } = this.props;

        const lessonInfo = findLessonById(lessonID);
        const showLessonInfo = this.state.status !== "courseSelection" &&
            this.state.status !== "lessonSelection" &&
            lessonInfo;
        const showMastery = showLessonInfo &&
            (this.lesson?.showStuMastery == null || this.lesson?.showStuMastery);

        return (
            <div
                style={{
                    backgroundColor: "#F6F6F6",
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Main Navigation Bar */}
                <AppBar position="static">
                    <Toolbar>
                        <BrandLogoNav isPrivileged={this.isPrivileged} />
                    </Toolbar>
                </AppBar>

                {/* Secondary Lesson Info Bar */}
                {showLessonInfo && (
                    <LessonInfoBar
                        lessonName={lessonInfo.name}
                        lessonTopics={lessonInfo.topics}
                        mastery={showMastery ? this.state.mastery : null}
                        lessonId={this.props.lessonID}
                    />
                )}
                <div style={{ flex: 1, paddingBottom: 20 }}>
                {this.state.status === "courseSelection" ? (
                    <LessonSelectionWrapper
                        selectLesson={this.selectLesson}
                        selectCourse={this.selectCourse}
                        history={this.props.history}
                        removeProgress={this.props.removeProgress}
                    />
                ) : (
                    ""
                )}
                {this.state.status === "lessonSelection" ? (
                    <LessonSelectionWrapper
                        selectLesson={this.selectLesson}
                        removeProgress={this.props.removeProgress}
                        history={this.props.history}
                        courseNum={this.props.courseNum}
                    />
                ) : (
                    ""
                )}
                {this.state.status === "learning" ? (
                    <ErrorBoundary
                        componentName={"Problem"}
                        descriptor={"problem"}
                    >
                        <ProblemWrapper
                            problem={this.state.currProblem}
                            problemComplete={this.problemComplete}
                            lesson={this.lesson}
                            seed={this.state.seed}
                            lessonID={this.props.lessonID}
                            displayMastery={this.displayMastery}
                        />
                    </ErrorBoundary>
                ) : (
                    ""
                )}
                {this.state.status === "exhausted" ? (
                    <center>
                        <h2>
                            Thank you for learning with {SITE_NAME}. You have
                            finished all problems.
                        </h2>
                    </center>
                ) : (
                    ""
                )}
                {this.state.status === "graduated" ? (
                    <center>
                        <h2>
                            Thank you for learning with {SITE_NAME}. You have
                            mastered all the skills for this session!
                        </h2>
                    </center>
                ) : (
                    ""
                )}
                </div>
                <CheckpointModal
                    open={showCheckpointModal}
                    problemsCompleted={problemsCompletedInSession}
                    onContinueDigital={this.handleContinueDigital} // or {handleContinueDigital} for functional
                    onStartPaper={this.handleStartPaper} // or {handleStartPaper} for functional
                />
            </div>
        );
    }
}

export default withRouter(withTranslation(Platform));
