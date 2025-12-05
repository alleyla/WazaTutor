import React from "react";
import "./App.css";
import Platform from "./platform-logic/Platform.js";
import DebugPlatform from "./platform-logic/DebugPlatform.js";
import Firebase from "@components/Firebase.js";
import { LocalizationProvider } from "./util/LocalizationContext";
import storageService from './services/storageService';
import {
    AB_TEST_MODE
} from "./config/config.js";

import { HashRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import NotFound from "@components/NotFound.js";

import {
    DO_FOCUS_TRACKING,
    PROGRESS_STORAGE_KEY,
    SITE_VERSION,
    ThemeContext,
} from "./config/config.js";
import {
    createTheme,
    responsiveFontSizes,
    ThemeProvider,
} from "@material-ui/core/styles";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import parseJwt from "./util/parseJWT";
import AssignmentNotLinked from "./pages/AssignmentNotLinked";
import AssignmentAlreadyLinked from "./pages/AssignmentAlreadyLinked";
import SessionExpired from "./pages/SessionExpired";
import { Posts } from "./pages/Posts/Posts";
import loadFirebaseEnvConfig from "./util/loadFirebaseEnvConfig";
import generateRandomInt from "./util/generateRandomInt";
import { cleanObjectKeys } from "./util/cleanObject";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";
import { IS_STAGING_OR_DEVELOPMENT } from "./util/getBuildType";
import TabFocusTrackerWrapper from "./components/TabFocusTrackerWrapper";
import ViewAllProblems from "./components/problem-layout/ViewAllProblems";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Dashboard from "./pages/Dashboard";
import Lessons from "./pages/Lessons";
import EnterWorksheetAnswers from './pages/EnterWorksheetAnswers';
import GenerateWorksheet from './pages/GenerateWorksheet';
import PrintWorksheet from './pages/PrintWorksheet';
import PrintAnswerKey from './pages/PrintAnswerKey';
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";

// ### BEGIN CUSTOMIZABLE IMPORTS ###
import config from "./config/firebaseConfig.js";
import skillModel from "./content-sources/wazatutor/skillModel.json";
import defaultBKTParams from "./content-sources/wazatutor/bkt-params/defaultBKTParams.json";
import experimentalBKTParams from "./content-sources/wazatutor/bkt-params/experimentalBKTParams.json";
import { heuristic as defaultHeuristic } from "./models/BKT/problem-select-heuristics/defaultHeuristic.js";
import { heuristic as experimentalHeuristic } from "./models/BKT/problem-select-heuristics/experimentalHeuristic.js";
import BrowserStorage from "./util/browserStorage";
import progressService from './services/progressService';
// ### END CUSTOMIZABLE IMPORTS ###

loadFirebaseEnvConfig(config);

let theme = createTheme();
theme = responsiveFontSizes(theme);

const queryParamToContext = {
    token: "jwt",
    lis_person_name_full: "studentName",
    to: "alreadyLinkedLesson",
    use_expanded_view: "use_expanded_view",
    do_not_restore: "noRestore",
    locale: "locale",
};

const queryParamsToKeep = ["use_expanded_view", "to", "do_not_restore", "locale"];

let treatmentMapping;

if (!AB_TEST_MODE) {
    treatmentMapping = {
        bktParams: cleanObjectKeys(defaultBKTParams),
        heuristic: defaultHeuristic,
        hintPathway: "DefaultPathway"
    };
} else {
    treatmentMapping = {
        bktParams: { 0: cleanObjectKeys(defaultBKTParams), 1: cleanObjectKeys(experimentalBKTParams) },
        heuristic: { 0: defaultHeuristic, 1: experimentalHeuristic },
        hintPathway: { 0: "DefaultPathway", 1: "DefaultPathway" }
    };
}

class App extends React.Component {
    constructor(props) {
        super(props);
        // UserID creation/loading - check for authenticated user first
        let userId = storageService.getCurrentUserId(); // Check authenticated user
        if (!userId) {
            // For anonymous users only - not security-critical
            // Authenticated users will use ids from database
            userId = generateRandomInt().toString();
            storageService.setAnonymousUserId(userId);
        }
        this.userID = userId;
        this.bktParams = this.getTreatmentObject(treatmentMapping.bktParams);

        this.originalBktParams = JSON.parse(
            JSON.stringify(this.getTreatmentObject(treatmentMapping.bktParams))
        );

        this.state = {
            additionalContext: {},
            sessionId: this.generateSessionId(),
            serverDataReady: false,
        };

        if (IS_STAGING_OR_DEVELOPMENT) {
            document["oats-meta-site-hash"] = process.env.REACT_APP_COMMIT_HASH;
            document["oats-meta-site-updatetime"] =
                process.env.REACT_APP_BUILD_TIMESTAMP;
        }

        const onLocationChange = () => {
            const additionalContext = {};
            const search =
                window.location.search ||
                window.location.hash.substr(
                    window.location.hash.indexOf("?") + 1
                );
            const sp = new URLSearchParams(search);

            Object.keys(queryParamToContext).forEach((qp) => {
                const ctxKey = queryParamToContext[qp];
                const ctxValue = sp.get(qp);
                if (ctxValue !== null) {
                    additionalContext[ctxKey] = ctxValue;
                }
            });

            if (additionalContext?.jwt) {
                const user = parseJwt(additionalContext.jwt);
                additionalContext["user"] = user;
                additionalContext["studentName"] = user.full_name;
            }

            // Firebase creation
            this.firebase = new Firebase(
                this.userID,
                config,
                this.getTreatment(),
                SITE_VERSION,
                additionalContext.user
            );

            let targetLocation = window.location.href.split("?")[0];

            const contextToKeep = queryParamsToKeep.map(
                (qp) => queryParamToContext[qp] || qp
            );
            const contextToParam = Object.fromEntries(
                Object.entries(queryParamToContext).map(([key, val]) => [
                    val,
                    key,
                ])
            );
            const keptQueryParamsObj = Object.fromEntries(
                Object.entries(additionalContext)
                    .filter(([key, _]) => contextToKeep.includes(key))
                    .map(([key, val]) => [contextToParam[key] || key, val])
            );
            const keptQueryParams = new URLSearchParams(keptQueryParamsObj);

            if (Object.keys(keptQueryParamsObj).length > 0) {
                targetLocation += `?${keptQueryParams.toString()}`;
            }

            if (this.mounted) {
                this.setState((prev) => ({
                    additionalContext: {
                        ...prev.additionalContext,
                        ...additionalContext,
                    },
                }));
                window.history.replaceState({}, document.title, targetLocation);
            } else if (this.mounted === undefined) {
                this.state = {
                    ...this.state,
                    additionalContext,
                };
                window.history.replaceState({}, document.title, targetLocation);
            }
        };
        window.addEventListener("popstate", onLocationChange);
        onLocationChange();

        this.browserStorage = new BrowserStorage(this);

        this.saveProgress = this.saveProgress.bind(this);
        this.reloadUserData = this.reloadUserData.bind(this);
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async componentDidMount() {
        this.mounted = true;

        console.log('🔍 [DEBUG] App.componentDidMount');
        console.log('🔍 [DEBUG] isAuthenticated:', storageService.isAuthenticated());
        console.log('🔍 [DEBUG] authToken:', storageService.getAuthToken());

        // Load skill mastery from server if authenticated
        if (storageService.isAuthenticated()) {
            // Update userID if it changed (e.g., after registration)
            const currentUserId = storageService.getCurrentUserId();
            if (currentUserId && currentUserId !== this.userID) {
                console.log('🔄 [DEBUG] UserID changed, updating from', this.userID, 'to', currentUserId);
                this.userID = currentUserId;
            }
            console.log('🔍 [DEBUG] Loading skill mastery from server...');
            await this.loadSkillMasteryFromServer();
            console.log('🔍 [DEBUG] Server load complete');
            await this.restoreLastLesson();
        } else {
            console.log('⚠️ [DEBUG] Not authenticated - skipping server load');
            this.setState({ serverDataReady: true });
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    /**
     * Reload user data after authentication change
     * Called after login/register to load server data without page reload
     */
    async reloadUserData() {
        console.log('🔄 [RELOAD] Reloading user data...');

        // Update user ID
        const userId = storageService.getCurrentUserId();
        if (userId) {
            this.userID = userId;
        }

        // If authenticated, load from server
        if (storageService.isAuthenticated()) {
            this.setState({ serverDataReady: false }); // Show loading

            await this.loadSkillMasteryFromServer();
            await this.restoreLastLesson();

            console.log('✅ [RELOAD] User data reloaded successfully');
        } else {
            // Reset to anonymous state
            const anonymousId = generateRandomInt(). toString();
            storageService.setAnonymousUserId(anonymousId);
            this.userID = anonymousId;
            this.bktParams = this.getTreatmentObject(treatmentMapping.bktParams);
            this.setState({ serverDataReady: true });
        }
    }

    /**
     * Restore user's last active lesson
     */
    async restoreLastLesson() {
        try {
            const currentLessonData = await progressService.loadCurrentLesson();
            if (currentLessonData && currentLessonData.lessonId) {
                // Optionally navigate to last lesson
                // this.props.history.push(`/lessons/${currentLessonData.lessonId}`);
                console.log('Last lesson:', currentLessonData.lessonId);
            }
        } catch (error) {
            console.error('Failed to restore last lesson:', error);
        }
    }

    /**
     * Load skill mastery from server (optimistic)
     */
    async loadSkillMasteryFromServer() {
        console.log('🚀 [DEBUG] loadSkillMasteryFromServer CALLED!');
        console.log('🚀 [DEBUG] Current bktParams count:', Object.keys(this.bktParams).length);

        const { getByKey } = this.browserStorage;

        console.log('🔍 [DEBUG] Starting loadSkillMasteryFromServer');
        console.log('🔍 [DEBUG] Initial bktParams sample:', {
            skill: Object.keys(this.bktParams)[0],
            value: this.bktParams[Object.keys(this.bktParams)[0]]?.probMastery
        });

        // Only load from localStorage if not authenticated
        if (!storageService.isAuthenticated()) {
            const localProgress = await getByKey(PROGRESS_STORAGE_KEY).catch(() => null);
            if (localProgress && typeof localProgress === "object" && Object.keys(localProgress).length > 0) {
                Object.assign(this.bktParams, cleanObjectKeys(localProgress));
            }
        }

        // Fetch from server
        try {
            console.log('Fetching from server...');
            const serverMastery = await progressService.loadSkillMastery();

            if (serverMastery && Object.keys(serverMastery).length > 0) {
                console.log(`Server returned ${Object.keys(serverMastery).length} skills`);
                console.log('[DEBUG] Sample server value:', {
                    skill: Object.keys(serverMastery)[0],
                    value: serverMastery[Object.keys(serverMastery)[0]]?.probMastery
                });

                // Replace with server data
                Object.keys(serverMastery).forEach(skillName => {
                    this.bktParams[skillName] = serverMastery[skillName];
                });

                console.log('[DEBUG] After server merge:', {
                    skill: Object.keys(this.bktParams)[0],
                    value: this.bktParams[Object.keys(this.bktParams)[0]]?.probMastery,
                    totalSkills: Object.keys(this.bktParams).length
                });
            } else {
                console.log('No server data returned');
            }
        } catch (error) {
            console.error('Server load failed:', error);
        }

        this.setState({ serverDataReady: true });

        console.log('[DEBUG] loadSkillMasteryFromServer complete');
    }

    getTreatment = () => {
        return this.userID % 2;
    };

    getTreatmentObject = (targetObject) => {
        if (!AB_TEST_MODE) {
            return targetObject;
        }
        return targetObject[this.getTreatment()];
    };

    removeProgress = async () => {

        // Show confirmation dialog
        const confirmed = window.confirm(
            'Are you sure you want to clear all your progress? This action cannot be undone.\n\n' +
            'This will reset:\n' +
            '- All skill mastery levels\n' +
            '- Practice streak data\n' +
            '- Daily progress statistics\n\n' +
            '(Note: Your problem attempt history will be preserved)'
        );

        if (!confirmed) {
            return; // User cancelled
        }

        const { getKeys, removeByKey } = this.browserStorage;

        // Clear local storage
        await removeByKey(PROGRESS_STORAGE_KEY);

        // Clear current lesson
        storageService.clearCurrentLesson();

        // Clear all lesson progress
        const existingKeys = (await getKeys()) || [];
        const lessonStorageKeys = existingKeys.filter((key) =>
            key.startsWith(PROGRESS_STORAGE_KEY)
        );
        await Promise.allSettled(
            lessonStorageKeys.map(async (key) => await removeByKey(key))
        );

        // Reset local BKT params
        this.bktParams = this.getTreatmentObject(treatmentMapping.bktParams);

        // Clear server-side progress for authenticated users
        if (storageService.isAuthenticated()) {
            try {
                const result = await progressService.clearProgress(false); // false = keep attempt history
                if (result.success) {
                    console.log('Server progress cleared:', result.deleted);
                    toast.success('Progress reset successfully!', {
                        toastId: 'progress_cleared',
                    });
                } else {
                    console.warn('Failed to clear server progress:', result.error);
                    toast.warn('Progress cleared locally, but server sync failed', {
                        toastId: 'server_clear_failed',
                    });
                }
            } catch (error) {
                console.error('Error clearing server progress:', error);
                // Don't block the reload if server clear fails
            }
        } else {
            toast.success('Progress reset successfully!', {
                toastId: 'progress_cleared',
            });
        }

        // Reload after a brief delay to show the toast
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    /**
     * Save progress TO server and localStorage
     * This happens AFTER bktParams are updated locally
     */
    saveProgress = async () => {
        console.debug("saving progress");

        const progressedBktParams = Object.fromEntries(
            Object.entries(this.bktParams || {}).filter(([key, val]) => {
                return (
                    this.originalBktParams[key]?.probMastery !== val.probMastery
                );
            })
        );

        // Save to localStorage
        const { setByKey } = this.browserStorage;
        try {
            await setByKey(PROGRESS_STORAGE_KEY, progressedBktParams);
            console.debug("Saved to localStorage");
        } catch (err) {
            console.debug("Save to localStorage error: ", err);
        }

        // Sync TO server (one-way: local → server)
        if (storageService.isAuthenticated()) {
            try {
                const result = await progressService.syncSkillMastery(this.bktParams);
                if (result.success) {
                    console.debug(`Synced ${result.count} skills TO server`);
                }
            } catch (error) {
                console.error('Error syncing to server:', error);
            }
        }
    };

    /**
     * Load BKT progress from local storage
     * For authenticated users, server data is loaded in componentDidMount
     * and takes precedence
     */
    loadBktProgress = async () => {
        // For authenticated users, server is the source of truth - NEVER load from localStorage
        if (storageService.isAuthenticated()) {
            console.debug('Authenticated user - skipping localStorage, using server data');
            return;
        }

        // Only anonymous users should load from localStorage
        console.debug('Loading BKT progress from localStorage (anonymous user)');
        const { getByKey } = this.browserStorage;
        const progress = await getByKey(PROGRESS_STORAGE_KEY).catch((_e) => {
            console.debug("error with getting previous progress", _e);
        });

        if (
            progress == null ||
            typeof progress !== "object" ||
            Object.keys(progress).length === 0
        ) {
            console.debug(
                "resetting progress... obtained progress was invalid: ",
                progress
            );
            this.bktParams = this.getTreatmentObject(
                treatmentMapping.bktParams
            );
        } else {
            console.debug(
                "restoring progress from local storage: ",
                progress
            );
            Object.assign(this.bktParams, cleanObjectKeys(progress));
        }
    };

    render() {
        // Add this loading check at the very beginning
        if (storageService.isAuthenticated() && !this.state.serverDataReady) {
            return (
                <ThemeProvider theme={theme}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        <div className="spinner" style={{
                            border: '4px solid #f3f3f3',
                            borderTop: '4px solid #3498db',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <p>Loading your progress...</p>
                        <style>
                            {`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}
                        </style>
                    </div>
                </ThemeProvider>
            );
        }
        return (
            <ThemeProvider theme={theme}>
                <ThemeContext.Provider
                    value={{
                        userID: this.userID,
                        firebase: this.firebase,
                        getTreatment: this.getTreatment,
                        bktParams: this.bktParams,
                        heuristic: this.getTreatmentObject(
                            treatmentMapping.heuristic
                        ),
                        hintPathway: this.getTreatmentObject(
                            treatmentMapping.hintPathway
                        ),
                        skillModel,
                        credentials: config,
                        debug: false,
                        studentName: "",
                        alreadyLinkedLesson: "",
                        jwt: "",
                        user: {},
                        problemID: "n/a",
                        problemIDs: null,
                        ...this.state.additionalContext,
                        sessionId: this.state.sessionId,
                        browserStorage: this.browserStorage,
                        reloadUserData: this.reloadUserData,
                    }}
                >
                <LocalizationProvider>
                    <GlobalErrorBoundary>
                        <Router>
                            <div className="Router">
                                <Switch>
                                    <Route
                                        exact
                                        path="/"
                                        render={() => {
                                            if (storageService.isAuthenticated()) {
                                                return <Redirect to="/dashboard" />;
                                            }
                                            return <Redirect to="/register" />;
                                        }}
                                    />
                                    {/* Lessons page route */}
                                    <ProtectedRoute
                                        exact
                                        path="/lessons"
                                        component={Lessons}
                                    />
                                    <Route
                                        path="/courses/:courseNum"
                                        render={(props) => (
                                            <Platform
                                                key={Date.now()}
                                                saveProgress={() =>
                                                    this.saveProgress()
                                                }
                                                loadBktProgress={
                                                    this.loadBktProgress
                                                }
                                                removeProgress={
                                                    this.removeProgress
                                                }
                                                courseNum={
                                                    props.match.params.courseNum
                                                }
                                                {...props}
                                            />
                                        )}
                                    />
                                    <Route
                                      exact
                                      path="/lessons/:lessonID/problems"
                                        component={ViewAllProblems}
                                    />
                                    <Route
                                    exact
                                        path="/lessons/:lessonID"
                                        render={(props) => (
                                            <Platform
                                                key={Date.now()}
                                                saveProgress={() =>
                                                    this.saveProgress()
                                                }
                                                loadBktProgress={
                                                    this.loadBktProgress
                                                }
                                                removeProgress={
                                                    this.removeProgress
                                                }
                                                lessonID={
                                                    props.match.params.lessonID
                                                }
                                                {...props}
                                            />
                                        )}
                                    />
                                    <Route
                                        path="/debug/:problemID"
                                        render={(props) => (
                                            <DebugPlatform
                                                key={Date.now()}
                                                saveProgress={() =>
                                                    this.saveProgress()
                                                }
                                                loadBktProgress={
                                                    this.loadBktProgress
                                                }
                                                removeProgress={
                                                    this.removeProgress
                                                }
                                                problemID={
                                                    props.match.params.problemID
                                                }
                                                {...props}
                                            />
                                        )}
                                    />
                                    <Route
                                        path="/posts"
                                        render={(props) => (
                                            <Posts
                                                key={Date.now()}
                                                {...props}
                                            />
                                        )}
                                    />
                                    <Route
                                        exact
                                        path="/assignment-not-linked"
                                        render={(props) => (
                                            <AssignmentNotLinked
                                                key={Date.now()}
                                                {...props}
                                            />
                                        )}
                                    />
                                    <Route
                                        exact
                                        path="/assignment-already-linked"
                                        render={(props) => (
                                            <AssignmentAlreadyLinked
                                                key={Date.now()}
                                                {...props}
                                            />
                                        )}
                                    />
                                    <Route
                                        exact
                                        path="/session-expired"
                                        render={(props) => (
                                            <SessionExpired
                                                key={Date.now()}
                                                {...props}
                                            />
                                        )}
                                    />
                                    {/* Protected Routes - Only accessible when logged in */}
                                    <ProtectedRoute
                                        exact
                                        path="/account"
                                        component={Account}
                                    />
                                    <ProtectedRoute
                                        exact
                                        path="/dashboard"
                                        component={Dashboard}
                                    />
                                    {/* Worksheet Routes */}
                                    <ProtectedRoute
                                        exact
                                        path="/worksheets/:worksheetId/enter-answers"
                                        component={EnterWorksheetAnswers}
                                    />
                                    <ProtectedRoute
                                        exact
                                        path="/lessons/:lessonId/generate-worksheet"
                                        component={GenerateWorksheet}
                                    />
                                    <ProtectedRoute
                                        exact
                                        path="/worksheets/:worksheetId/print"
                                        component={PrintWorksheet}
                                    />
                                    <ProtectedRoute
                                        exact
                                        path="/worksheets/:worksheetId/print-answers"
                                        component={PrintAnswerKey}
                                    />
                                    {/* Guest Routes - Only accessible when NOT logged in */}
                                    <GuestRoute
                                        exact
                                        path="/login"
                                        component={Login}
                                    />
                                    <GuestRoute
                                        exact
                                        path="/register"
                                        component={Register}
                                    />
                                    <Route component={NotFound} />
                                </Switch>
                            </div>
                            {DO_FOCUS_TRACKING && <TabFocusTrackerWrapper />}
                        </Router>
                        <ToastContainer
                            position="top-right"
                            autoClose={5000}
                            hideProgressBar={false}
                            newestOnTop={true}
                            closeOnClick={true}
                            rtl={false}
                            pauseOnFocusLoss={true}
                            draggable={true}
                            pauseOnHover={false}
                            theme="light"
                        />
                    </GlobalErrorBoundary>
                    </LocalizationProvider>
                </ThemeContext.Provider>
            </ThemeProvider>
        );
    }
}

export default App;
