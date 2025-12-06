/**
 * Service for managing user progress and skill mastery persistence
 */
import storageService from './storageService';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class ProgressService {
    constructor() {
        this.syncInProgress = false;
        this.pendingSync = null;
    }

    /**
     * Sync skill mastery to server after BKT updates
     * Debounced to avoid excessive API calls
     * @param {Object} skillsMap - Map of skill names to BKT model objects
     */
    async syncSkillMastery(skillsMap) {
        if (!storageService.isAuthenticated()) {
            console.debug('User not authenticated, skipping server sync');
            return { success: false, reason: 'not_authenticated' };
        }

        // Convert skillsMap to array format
        const skills = Object.entries(skillsMap).map(([skillName, model]) => ({
            skillName,
            probMastery: model.probMastery,
            probSlip: model.probSlip,
            probGuess: model.probGuess,
            probTransit: model.probTransit
        }));

        if (skills.length === 0) {
            console.debug('No skills to sync');
            return { success: false, reason: 'no_skills' };
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.post(
                `${API_BASE_URL}/progress/mastery/update`,
                { skills },
                {
                    headers: { 'x-auth-token': token },
                    timeout: 10000
                }
            );

            console.debug(`Skill mastery synced to server (${skills.length} skills)`);
            return { success: true, count: skills.length };
        } catch (error) {
            console.error('Failed to sync skill mastery:', error.message);
            // Don't throw - app should continue with local storage
            return { success: false, error: error.message };
        }
    }

    /**
     * Load skill mastery from server (on login or page load)
     * @returns {Object|null} Map of skill names to BKT models
     */
    async loadSkillMastery() {
        if (!storageService.isAuthenticated()) {
            return null;
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.get(
                `${API_BASE_URL}/progress/mastery`,
                {
                    headers: { 'x-auth-token': token },
                    timeout: 10000
                }
            );

            if (response.data.success && response.data.skills) {
                // Convert array to map format expected by the app
                const skillsMap = {};
                response.data.skills.forEach(skill => {
                    skillsMap[skill.skill_name] = {
                        probMastery: parseFloat(skill.prob_mastery),
                        probSlip: parseFloat(skill.prob_slip),
                        probGuess: parseFloat(skill.prob_guess),
                        probTransit: parseFloat(skill.prob_transit)
                    };
                });

                console.debug(`Loaded ${Object.keys(skillsMap).length} skills from server`);
                return skillsMap;
            }
        } catch (error) {
            console.error('Failed to load skill mastery:', error.message);
        }

        return null;
    }

    /**
     * Log a problem attempt to the server
     */
    async logProblemAttempt({
                                problemId,
                                stepId,
                                skillName,
                                isCorrect,
                                timeSpentSeconds,
                                hintCount = 0,
                                attemptNumber = 1,
                                sessionId,
                                lessonId,
                                courseName
                            }) {
        if (!storageService.isAuthenticated()) {
            return { success: false, reason: 'not_authenticated' };
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.post(
                `${API_BASE_URL}/progress/attempts`,
                {
                    problemId,
                    stepId,
                    skillName,
                    isCorrect,
                    timeSpentSeconds,
                    hintCount,
                    attemptNumber,
                    sessionId,
                    lessonId,
                    courseName
                },
                {
                    headers: { 'x-auth-token': token },
                    timeout: 5000
                }
            );

            return response.data;
        } catch (error) {
            console.error('Failed to log problem attempt:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user statistics
     * @param {number} days - Number of days to look back
     * @param {number} streakMinProblems - Minimum problems per day for streak
     * @param {number} masteryThreshold - Threshold for considering a skill mastered
     */
    async getUserStats(days = 7, streakMinProblems = 1, masteryThreshold = 0.95) {
        if (!storageService.isAuthenticated()) {
            return null;
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.get(
                `${API_BASE_URL}/progress/stats`,
                {
                    params: { days, streakMinProblems, masteryThreshold },
                    headers: { 'x-auth-token': token },
                    timeout: 10000
                }
            );

            return response.data.success ? response.data.stats : null;
        } catch (error) {
            console.error('Failed to fetch user stats:', error.message);
            return null;
        }
    }

    /**
     * Get detailed skill breakdown
     * @param {number} masteryThreshold - Threshold for mastery categorization
     */
    async getSkillBreakdown(masteryThreshold = 0.95) {
        if (!storageService.isAuthenticated()) {
            return null;
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.get(
                `${API_BASE_URL}/progress/skills/breakdown`,
                {
                    params: { masteryThreshold },
                    headers: { 'x-auth-token': token },
                    timeout: 10000
                }
            );

            return response.data.success ? response.data.skills : null;
        } catch (error) {
            console.error('Failed to fetch skill breakdown:', error.message);
            return null;
        }
    }

    /**
     * Get practice history for visualization
     * @param {number} days - Number of days to retrieve
     */
    async getPracticeHistory(days = 30) {
        if (!storageService.isAuthenticated()) {
            return null;
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.get(
                `${API_BASE_URL}/progress/practice-history`,
                {
                    params: { days },
                    headers: { 'x-auth-token': token },
                    timeout: 10000
                }
            );

            return response.data.success ? response.data.history : null;
        } catch (error) {
            console.error('Failed to fetch practice history:', error.message);
            return null;
        }
    }

    /**
     * Clear all progress data from the server
     * WARNING: This is a destructive operation!
     * @param {boolean} includeAttempts - Whether to also delete attempt history
     * @returns {Promise<Object>} Result object with success status
     */
    async clearProgress(includeAttempts = false) {
        if (!storageService.isAuthenticated()) {
            return { success: false, reason: 'not_authenticated' };
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.delete(
                `${API_BASE_URL}/progress/clear`,
                {
                    params: {
                        confirm: 'true',
                        includeAttempts: includeAttempts ? 'true' : 'false'
                    },
                    headers: { 'x-auth-token': token },
                    timeout: 10000
                }
            );

            if (response.data.success) {
                console.log('Progress cleared from server:', response.data.deleted);
                return {
                    success: true,
                    deleted: response.data.deleted
                };
            }

            return { success: false, error: 'Server returned unsuccessful response' };
        } catch (error) {
            console.error('Failed to clear progress from server:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get recent attempts
     * @param {number} limit - Maximum number of attempts to retrieve
     */
    async getRecentAttempts(limit = 20) {
        if (!storageService.isAuthenticated()) {
            return null;
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.get(
                `${API_BASE_URL}/progress/attempts/recent`,
                {
                    params: { limit },
                    headers: { 'x-auth-token': token },
                    timeout: 10000
                }
            );

            return response.data.success ? response.data.attempts : null;
        } catch (error) {
            console.error('Failed to fetch recent attempts:', error.message);
            return null;
        }
    }

    /**
     * Save current lesson to server
     */
    async saveCurrentLesson(lessonId) {
        if (!storageService.isAuthenticated()) {
            return { success: false, reason: 'not_authenticated' };
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.post(
                `${API_BASE_URL}/progress/current-lesson`,
                { lessonId },
                {
                    headers: { 'x-auth-token': token },
                    timeout: 5000
                }
            );
            return response.data;
        } catch (error) {
            console.error('Failed to save current lesson:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load current lesson from server
     */
    async loadCurrentLesson() {
        if (!storageService.isAuthenticated()) {
            return null;
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.get(
                `${API_BASE_URL}/progress/current-lesson`,
                {
                    headers: { 'x-auth-token': token },
                    timeout: 5000
                }
            );
            return response.data.success ? response.data.currentLesson : null;
        } catch (error) {
            console.error('Failed to load current lesson:', error.message);
            return null;
        }
    }

    /**
     * Save lesson progress to server
     */
    async saveLessonProgress(lessonId, completedProblems, lastProblemId) {
        if (!storageService.isAuthenticated()) {
            return { success: false, reason: 'not_authenticated' };
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.post(
                `${API_BASE_URL}/progress/lesson`,
                {
                    lessonId,
                    completedProblems,
                    lastProblemId
                },
                {
                    headers: { 'x-auth-token': token },
                    timeout: 5000
                }
            );
            return response.data;
        } catch (error) {
            console.error('Failed to save lesson progress:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load lesson progress from server
     */
    async loadLessonProgress(lessonId) {
        if (!storageService.isAuthenticated()) {
            return null;
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.get(
                `${API_BASE_URL}/progress/lesson/${lessonId}`,
                {
                    headers: { 'x-auth-token': token },
                    timeout: 5000
                }
            );
            return response.data.success ? response.data.progress : null;
        } catch (error) {
            console.error('Failed to load lesson progress:', error.message);
            return null;
        }
    }

    /**
     * Load all lesson progress from server
     */
    async loadAllLessonProgress() {
        if (!storageService.isAuthenticated()) {
            return null;
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.get(
                `${API_BASE_URL}/progress/lessons`,
                {
                    headers: { 'x-auth-token': token },
                    timeout: 10000
                }
            );
            return response.data.success ? response.data.lessons : null;
        } catch (error) {
            console.error('Failed to load all lesson progress:', error.message);
            return null;
        }
    }
}

export default new ProgressService();