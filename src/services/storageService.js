/**
 * Centralized localStorage management for user authentication and anonymous tracking
 */
import { USER_ID_STORAGE_KEY, CURRENT_LESSON_STORAGE_KEY, PROGRESS_STORAGE_KEY, LESSON_PROGRESS_STORAGE_KEY } from '../config/config';


// Storage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'authToken',
    USER_ID: 'userId',           // Authenticated user ID from database
    USER_NAME: 'name',            // Authenticated user name
    // Anonymous users (backward compatible with existing config)
    ANONYMOUS_ID: USER_ID_STORAGE_KEY,
    // Application state (backward compatible)
    PROGRESS: PROGRESS_STORAGE_KEY,
    CURRENT_LESSON: CURRENT_LESSON_STORAGE_KEY,
    LOCALE: 'locale',
    DEFAULT_LOCALE: 'defaultLocale',
    BIO_INFO: 'bioInfo',
};

class StorageService {
    // ============ Auth User Methods ============

    /**
     * Save authenticated user data after login/register
     */
    setAuthUser(token, userId, name) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER_ID, userId.toString());
        localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
    }

    /**
     * Get authenticated user token
     */
    getAuthToken() {
        return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }

    /**
     * Get authenticated user ID (returns null if not authenticated)
     */
    getAuthUserId() {
        return localStorage.getItem(STORAGE_KEYS.USER_ID);
    }

    /**
     * Get authenticated user name
     */
    getAuthUserName() {
        return localStorage.getItem(STORAGE_KEYS.USER_NAME);
    }

    /**
     * Update only the user name (after account update)
     */
    updateAuthUserName(name) {
        localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getAuthToken();
    }

    /**
     * Clear authenticated user data (logout)
     */
    clearAuthUser() {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_ID);
        localStorage.removeItem(STORAGE_KEYS.USER_NAME);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_LESSON);
        // Note: Don't clear anonymous ID - let App.js handle that
    }

    /**
     * Clear only invalid token (for token verification failures)
     * Preserves userId for potential anonymous user fallback
     */
    clearInvalidToken() {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_NAME);
        // Don't remove userId - App.js will handle the fallback logic
    }

    // ============ Anonymous User Methods ============

    /**
     * Get anonymous user ID
     */
    getAnonymousUserId() {
        return localStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID);
    }

    /**
     * Set anonymous user ID
     */
    setAnonymousUserId(id) {
        localStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, id.toString());
    }

    // ============ Combined User ID (for App.js) ============

    /**
     * Get current user ID - checks authenticated first, then anonymous
     * This matches the logic in App.js
     */
    getCurrentUserId() {
        // Check authenticated user first
        let userId = this.getAuthUserId();
        if (userId) return userId;

        // Fallback to anonymous user
        userId = this.getAnonymousUserId();
        return userId;
    }

    // ============ Other Storage Methods ============

    setLocale(locale) {
        localStorage.setItem(STORAGE_KEYS.LOCALE, locale);
    }

    getLocale() {
        return localStorage.getItem(STORAGE_KEYS.LOCALE);
    }

    setDefaultLocale(locale) {
        localStorage.setItem(STORAGE_KEYS.DEFAULT_LOCALE, locale);
    }

    getProgress() {
        return localStorage.getItem(STORAGE_KEYS.PROGRESS);
    }

    setProgress(progress) {
        localStorage.setItem(STORAGE_KEYS.PROGRESS, progress);
    }

    removeProgress() {
        localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    }

    /**
     * Get user's current active lesson ID
     * @returns {string}
     */
    getCurrentLesson() {
        return localStorage.getItem(STORAGE_KEYS.CURRENT_LESSON);
    }

    setCurrentLesson(lessonId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_LESSON, lessonId);
    }
    /**
     * Clear current lesson (on logout)
     */
    clearCurrentLesson() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_LESSON);
    }

    getLessonProgress(lessonId) {
        const key = LESSON_PROGRESS_STORAGE_KEY(lessonId);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    setLessonProgress(lessonId, progressData) {
        const key = LESSON_PROGRESS_STORAGE_KEY(lessonId);
        localStorage.setItem(key, JSON.stringify(progressData));
    }
}

// Export singleton instance
export default new StorageService();