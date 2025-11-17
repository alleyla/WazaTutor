/**
 * Service for managing paper practice worksheets
 */
import axios from 'axios';
import storageService from './storageService';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class WorksheetService {
    /**
     * Check if user has a pending worksheet
     * @returns {Promise<Object|null>}
     */
    async checkPendingWorksheet() {
        if (!storageService.isAuthenticated()) {
            return null;
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.get(
                `${API_BASE_URL}/worksheets/pending`,
                {
                    headers: { 'x-auth-token': token },
                    timeout: 10000
                }
            );

            if (response.data.success && response.data.hasPending) {
                return response.data.worksheet;
            }
            return null;
        } catch (error) {
            console.error('Failed to check pending worksheet:', error);
            return null;
        }
    }

    /**
     * Get full worksheet details with problems
     * @param {number} worksheetId
     * @returns {Promise<Object|null>}
     */
    async getWorksheet(worksheetId) {
        if (!storageService.isAuthenticated()) {
            return null;
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.get(
                `${API_BASE_URL}/worksheets/${worksheetId}`,
                {
                    headers: { 'x-auth-token': token },
                    timeout: 10000
                }
            );

            return response.data.success ? response.data.worksheet : null;
        } catch (error) {
            console.error('Failed to fetch worksheet:', error);
            return null;
        }
    }

    /**
     * Generate a new worksheet
     * @param {string} lessonId
     * @param {number} maxProblems
     * @param {Array} problemPool - Array of {problemId, skillName, correctAnswer}
     * @returns {Promise<Object>}
     */
    async generateWorksheet(lessonId, maxProblems, problemPool) {
        if (!storageService.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.post(
                `${API_BASE_URL}/worksheets/generate`,
                { lessonId, maxProblems, problemPool },
                {
                    headers: { 'x-auth-token': token },
                    timeout: 15000
                }
            );

            return response.data;
        } catch (error) {
            console.error('Failed to generate worksheet:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || error.message 
            };
        }
    }

    /**
     * Submit an answer for a worksheet problem
     * @param {number} worksheetId
     * @param {number} problemOrder
     * @param {string} userAnswer
     * @param {boolean} isCorrect - Correctness determined on frontend
     * @returns {Promise<Object>}
     */
    async submitAnswer(worksheetId, problemOrder, userAnswer, isCorrect) {
        if (!storageService.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.post(
                `${API_BASE_URL}/worksheets/${worksheetId}/problems/${problemOrder}/submit`,
                { userAnswer, isCorrect },
                {
                    headers: { 'x-auth-token': token },
                    timeout: 10000
                }
            );

            return response.data;
        } catch (error) {
            console.error('Failed to submit answer:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || error.message 
            };
        }
    }

    /**
     * Delete a pending worksheet
     * @param {number} worksheetId
     * @returns {Promise<Object>}
     */
    async deleteWorksheet(worksheetId) {
        if (!storageService.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }

        const token = storageService.getAuthToken();

        try {
            const response = await axios.delete(
                `${API_BASE_URL}/worksheets/${worksheetId}`,
                {
                    headers: { 'x-auth-token': token },
                    timeout: 10000
                }
            );

            return response.data;
        } catch (error) {
            console.error('Failed to delete worksheet:', error);
            return { 
                success: false, 
                error: error.response?.data?.error || error.message 
            };
        }
    }
}

export default new WorksheetService();
