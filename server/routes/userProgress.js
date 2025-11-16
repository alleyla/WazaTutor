
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/database');

// ==================== INPUT VALIDATION HELPERS ====================

/**
 * Validate and sanitize integer input
 */
const validateInteger = (value, defaultValue, min = 1, max = 1000) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < min || parsed > max) {
        return defaultValue;
    }
    return parsed;
};

/**
 * Validate and sanitize float input
 */
const validateFloat = (value, defaultValue, min = 0, max = 1) => {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < min || parsed > max) {
        return defaultValue;
    }
    return parsed;
};

// ==================== SKILL MASTERY ENDPOINTS ====================

/**
 * Save/Update skill mastery after BKT update
 * POST /api/progress/mastery/update
 * Body: { skills: [{ skillName, probMastery, probSlip, probGuess, probTransit }] }
 */
router.post('/mastery/update', auth, async (req, res) => {
    const userId = req.user.id;
    const { skills } = req.body;

    if (!Array.isArray(skills) || skills.length === 0) {
        return res.status(400).json({ error: 'Skills array is required' });
    }

    // Validate skills array length to prevent DoS
    if (skills.length > 1000) {
        return res.status(400).json({ error: 'Too many skills in single request' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const skill of skills) {
            // Validate skill data
            if (!skill.skillName || typeof skill.skillName !== 'string') {
                continue;
            }

            if (skill.probMastery === undefined || typeof skill.probMastery !== 'number') {
                continue;
            }

            // Sanitize and validate probabilities
            const probMastery = validateFloat(skill.probMastery, 0, 0, 1);
            const probSlip = validateFloat(skill.probSlip, 0.1, 0, 1);
            const probGuess = validateFloat(skill.probGuess, 0.25, 0, 1);
            const probTransit = validateFloat(skill.probTransit, 0.1, 0, 1);

            // Sanitize skill name (limit length)
            const skillName = skill.skillName.substring(0, 255);

            await client.query(`
                INSERT INTO user_skill_mastery 
                    (user_id, skill_name, prob_mastery, prob_slip, prob_guess, prob_transit, last_updated)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                ON CONFLICT (user_id, skill_name) 
                DO UPDATE SET 
                    prob_mastery = EXCLUDED.prob_mastery,
                    prob_slip = EXCLUDED.prob_slip,
                    prob_guess = EXCLUDED.prob_guess,
                    prob_transit = EXCLUDED.prob_transit,
                    last_updated = NOW()
            `, [userId, skillName, probMastery, probSlip, probGuess, probTransit]);
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Mastery updated', count: skills.length });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating mastery:', error);
        res.status(500).json({ error: 'Failed to update mastery' });
    } finally {
        client.release();
    }
});

/**
 * Get all skill mastery for a user (for session restoration)
 * GET /api/progress/mastery
 */
router.get('/mastery', auth, async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT skill_name, prob_mastery, prob_slip, prob_guess, prob_transit, last_updated 
             FROM user_skill_mastery 
             WHERE user_id = $1
             ORDER BY last_updated DESC`,
            [userId]
        );

        res.json({
            success: true,
            skills: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching mastery:', error);
        res.status(500).json({ error: 'Failed to fetch mastery' });
    }
});

/**
 * Get skill mastery breakdown with categorization
 * GET /api/progress/skills/breakdown?masteryThreshold=0.95
 */
router.get('/skills/breakdown', auth, async (req, res) => {
    const userId = req.user.id;
    const masteryThreshold = validateFloat(req.query.masteryThreshold, 0.95, 0, 1);

    try {
        const result = await pool.query(`
            SELECT
                skill_name,
                prob_mastery,
                CASE
                    WHEN prob_mastery >= $2 THEN 'mastered'
                    WHEN prob_mastery >= 0.7 THEN 'proficient'
                    WHEN prob_mastery >= 0.4 THEN 'developing'
                    ELSE 'beginning'
                    END as mastery_level,
                last_updated
            FROM user_skill_mastery
            WHERE user_id = $1
            ORDER BY prob_mastery DESC
        `, [userId, masteryThreshold]);

        res.json({
            success: true,
            skills: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching skill breakdown:', error);
        res.status(500).json({ error: 'Failed to fetch skill breakdown' });
    }
});

// ==================== LESSON PROGRESS ENDPOINTS ====================

/**
 * Save/Update user's current (last active) lesson
 * POST /api/progress/current-lesson
 * Body: { lessonId }
 */
router.post('/current-lesson', auth, async (req, res) => {
    const userId = req.user.id;
    const { lessonId } = req.body;

    if (!lessonId || typeof lessonId !== 'string') {
        return res.status(400).json({ error: 'Valid lessonId is required' });
    }

    const sanitizedLessonId = lessonId.substring(0, 255);

    try {
        await pool.query(`
            INSERT INTO user_current_lesson (user_id, lesson_id, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET 
                lesson_id = EXCLUDED.lesson_id,
                updated_at = NOW()
        `, [userId, sanitizedLessonId]);

        res.json({ success: true, message: 'Current lesson updated' });
    } catch (error) {
        console.error('Error updating current lesson:', error);
        res.status(500).json({ error: 'Failed to update current lesson' });
    }
});

/**
 * Get user's current (last active) lesson
 * GET /api/progress/current-lesson
 */
router.get('/current-lesson', auth, async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            'SELECT lesson_id, updated_at FROM user_current_lesson WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.json({ success: true, currentLesson: null });
        }

        res.json({
            success: true,
            currentLesson: {
                lessonId: result.rows[0].lesson_id,
                lastUpdatedAt: result.rows[0].updated_at
            }
        });
    } catch (error) {
        console.error('Error fetching current lesson:', error);
        res.status(500).json({ error: 'Failed to fetch current lesson' });
    }
});

/**
 * Save/Update lesson progress (completed problems, completion %)
 * POST /api/progress/lesson
 * Body: { lessonId, completedProblems, totalProblems, completionPercentage, lastProblemId }
 */
router.post('/lesson', auth, async (req, res) => {
    const userId = req.user.id;
    const { lessonId, completedProblems, totalProblems, completionPercentage, lastProblemId } = req.body;

    if (!lessonId || typeof lessonId !== 'string') {
        return res.status(400).json({ error: 'Valid lessonId is required' });
    }

    if (!Array.isArray(completedProblems)) {
        return res.status(400).json({ error: 'completedProblems must be an array' });
    }

    // Sanitize inputs
    const sanitizedLessonId = lessonId.substring(0, 255);
    const sanitizedProblems = completedProblems.slice(0, 1000).map(p => String(p).substring(0, 255));
    const validatedTotalProblems = validateInteger(totalProblems, 0, 0, 10000);
    const validatedCompletion = validateFloat(completionPercentage, 0, 0, 100);
    const sanitizedLastProblemId = lastProblemId ? String(lastProblemId).substring(0, 255) : null;

    try {
        await pool.query(`
            INSERT INTO user_lesson_progress 
                (user_id, lesson_id, completed_problems, total_problems, completion_percentage, last_problem_id, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (user_id, lesson_id)
            DO UPDATE SET
                completed_problems = EXCLUDED.completed_problems,
                total_problems = EXCLUDED.total_problems,
                completion_percentage = EXCLUDED.completion_percentage,
                last_problem_id = EXCLUDED.last_problem_id,
                updated_at = NOW()
        `, [userId, sanitizedLessonId, sanitizedProblems, validatedTotalProblems, validatedCompletion, sanitizedLastProblemId]);

        res.json({ success: true, message: 'Lesson progress updated' });
    } catch (error) {
        console.error('Error updating lesson progress:', error);
        res.status(500).json({ error: 'Failed to update lesson progress' });
    }
});

/**
 * Get lesson progress for a specific lesson
 * GET /api/progress/lesson/:lessonId
 */
router.get('/lesson/:lessonId', auth, async (req, res) => {
    const userId = req.user.id;
    const { lessonId } = req.params;

    try {
        const result = await pool.query(
            `SELECT lesson_id, completed_problems, total_problems, completion_percentage, 
                    last_problem_id, started_at, updated_at
             FROM user_lesson_progress 
             WHERE user_id = $1 AND lesson_id = $2`,
            [userId, lessonId]
        );

        if (result.rows.length === 0) {
            return res.json({ success: true, progress: null });
        }

        res.json({
            success: true,
            progress: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching lesson progress:', error);
        res.status(500).json({ error: 'Failed to fetch lesson progress' });
    }
});

/**
 * Get all lesson progress for user
 * GET /api/progress/lessons
 */
router.get('/lessons', auth, async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT lesson_id, completed_problems, total_problems, completion_percentage,
                    last_problem_id, started_at, updated_at
             FROM user_lesson_progress
             WHERE user_id = $1
             ORDER BY updated_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            lessons: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching all lesson progress:', error);
        res.status(500).json({ error: 'Failed to fetch lesson progress' });
    }
});

// ==================== PROBLEM ATTEMPT LOGGING ====================

/**
 * Log a problem attempt
 * POST /api/progress/attempts
 * Body: { problemId, stepId, skillName, isCorrect, timeSpentSeconds, hintCount, attemptNumber, sessionId, lessonId, courseName }
 */
router.post('/attempts', auth, async (req, res) => {
    const userId = req.user.id;
    const {
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
    } = req.body;

    // Validate required fields
    if (!problemId || typeof problemId !== 'string') {
        return res.status(400).json({ error: 'Valid problemId is required' });
    }

    if (typeof isCorrect !== 'boolean') {
        return res.status(400).json({ error: 'isCorrect must be a boolean' });
    }

    // Sanitize and validate inputs
    const sanitizedProblemId = problemId.substring(0, 255);
    const sanitizedStepId = stepId ? stepId.substring(0, 255) : null;
    const sanitizedSkillName = skillName ? skillName.substring(0, 255) : null;
    const sanitizedSessionId = sessionId ? sessionId.substring(0, 255) : null;
    const sanitizedLessonId = lessonId ? lessonId.substring(0, 255) : null;
    const sanitizedCourseName = courseName ? courseName.substring(0, 255) : null;

    const validatedTimeSpent = validateInteger(timeSpentSeconds, 0, 0, 86400); // Max 24 hours
    const validatedHintCount = validateInteger(hintCount, 0, 0, 100);
    const validatedAttemptNumber = validateInteger(attemptNumber, 1, 1, 100);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Insert the attempt
        const attemptResult = await client.query(`
            INSERT INTO user_problem_attempts 
                (user_id, problem_id, step_id, skill_name, is_correct, time_spent_seconds, 
                 hint_count, attempt_number, session_id, lesson_id, course_name, completed_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
            RETURNING id
        `, [
            userId,
            sanitizedProblemId,
            sanitizedStepId,
            sanitizedSkillName,
            isCorrect,
            validatedTimeSpent,
            validatedHintCount,
            validatedAttemptNumber,
            sanitizedSessionId,
            sanitizedLessonId,
            sanitizedCourseName
        ]);

        // Update daily practice session
        const lessonIdForSession = sanitizedLessonId || 'unknown';
        await client.query(`
            INSERT INTO user_practice_sessions 
                (user_id, practice_date, problems_solved, total_time_seconds, problems_attempted, lesson_ids, updated_at)
            VALUES ($1, CURRENT_DATE, $2, $3, 1, ARRAY[$4]::TEXT[], NOW())
            ON CONFLICT (user_id, practice_date) 
            DO UPDATE SET 
                problems_solved = user_practice_sessions.problems_solved + EXCLUDED.problems_solved,
                total_time_seconds = user_practice_sessions.total_time_seconds + EXCLUDED.total_time_seconds,
                problems_attempted = user_practice_sessions.problems_attempted + 1,
                lesson_ids = CASE 
                    WHEN $4 = ANY(user_practice_sessions.lesson_ids) THEN user_practice_sessions.lesson_ids
                    ELSE array_append(user_practice_sessions.lesson_ids, $4)
                END,
                updated_at = NOW()
        `, [userId, isCorrect ? 1 : 0, validatedTimeSpent, lessonIdForSession]);

        await client.query('COMMIT');

        res.json({
            success: true,
            attemptId: attemptResult.rows[0].id
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error logging attempt:', error);
        res.status(500).json({ error: 'Failed to log attempt' });
    } finally {
        client.release();
    }
});

/**
 * Get recent problem attempts
 * GET /api/progress/attempts/recent?limit=20
 */
router.get('/attempts/recent', auth, async (req, res) => {
    const userId = req.user.id;
    const limit = validateInteger(req.query.limit, 20, 1, 100);

    try {
        const result = await pool.query(`
            SELECT
                problem_id, step_id, skill_name, is_correct,
                time_spent_seconds, hint_count, completed_at, lesson_id, course_name
            FROM user_problem_attempts
            WHERE user_id = $1
            ORDER BY completed_at DESC
                LIMIT $2
        `, [userId, limit]);

        res.json({
            success: true,
            attempts: result.rows
        });
    } catch (error) {
        console.error('Error fetching recent attempts:', error);
        res.status(500).json({ error: 'Failed to fetch recent attempts' });
    }
});

// ==================== USER STATISTICS ====================

/**
 * Get comprehensive user statistics
 * GET /api/progress/stats?days=7&streakMinProblems=1&masteryThreshold=0.95
 */
router.get('/stats', auth, async (req, res) => {
    const userId = req.user.id;
    const days = validateInteger(req.query.days, 7, 1, 365);
    const streakMinProblems = validateInteger(req.query.streakMinProblems, 1, 1, 100);
    const masteryThreshold = validateFloat(req.query.masteryThreshold, 0.95, 0, 1);

    try {
        // Skills mastered count
        const masteryResult = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE prob_mastery >= $2) as skills_mastered,
                COUNT(*) as total_skills_practiced,
                COALESCE(AVG(prob_mastery), 0) as average_mastery
            FROM user_skill_mastery 
            WHERE user_id = $1
        `, [userId, masteryThreshold]);

        // Calculate the interval for date queries
        const daysInterval = days - 1; // Subtract 1 because CURRENT_DATE is inclusive

        // Time on task (recent activity)
        const timeResult = await pool.query(`
            SELECT COALESCE(SUM(total_time_seconds), 0) as total_seconds
            FROM user_practice_sessions
            WHERE user_id = $1
              AND practice_date >= CURRENT_DATE - INTERVAL '1 day' * $2
        `, [userId, daysInterval]);

        // Problems solved (recent activity)
        const problemsResult = await pool.query(`
            SELECT COALESCE(SUM(problems_solved), 0) as problems_solved
            FROM user_practice_sessions
            WHERE user_id = $1
              AND practice_date >= CURRENT_DATE - INTERVAL '1 day' * $2
        `, [userId, daysInterval]);

        // Practice streak calculation
        const streakResult = await pool.query(`
            WITH RECURSIVE date_series AS (
                SELECT CURRENT_DATE as practice_date
                UNION ALL
                SELECT (practice_date - INTERVAL '1 day')::date
                FROM date_series
                WHERE practice_date > CURRENT_DATE - INTERVAL '365 days'
            ),
            user_sessions AS (
                SELECT practice_date, problems_solved
                FROM user_practice_sessions
                WHERE user_id = $1
                    AND practice_date >= CURRENT_DATE - INTERVAL '365 days'
            ),
            streak_data AS (
                SELECT 
                    ds.practice_date,
                    COALESCE(us.problems_solved, 0) >= $2 as met_threshold,
                    ROW_NUMBER() OVER (ORDER BY ds.practice_date DESC) as day_num
                FROM date_series ds
                LEFT JOIN user_sessions us ON ds.practice_date = us.practice_date
                WHERE ds.practice_date <= CURRENT_DATE
            ),
            streak_breaks AS (
                SELECT 
                    practice_date,
                    met_threshold,
                    day_num,
                    SUM(CASE WHEN NOT met_threshold THEN 1 ELSE 0 END) 
                        OVER (ORDER BY day_num) as break_group
                FROM streak_data
            )
            SELECT COUNT(*) as streak_days
            FROM streak_breaks
            WHERE break_group = 0 AND met_threshold = true
        `, [userId, streakMinProblems]);

        res.json({
            success: true,
            stats: {
                skillsMastered: parseInt(masteryResult.rows[0].skills_mastered) || 0,
                totalSkillsPracticed: parseInt(masteryResult.rows[0].total_skills_practiced) || 0,
                averageMastery: parseFloat(masteryResult.rows[0].average_mastery) || 0,
                timeOnTask: {
                    days: days,
                    totalSeconds: parseInt(timeResult.rows[0].total_seconds) || 0,
                    totalMinutes: Math.round((parseInt(timeResult.rows[0].total_seconds) || 0) / 60)
                },
                problemsSolved: {
                    days: days,
                    count: parseInt(problemsResult.rows[0].problems_solved) || 0
                },
                practiceStreak: {
                    currentStreak: parseInt(streakResult.rows[0].streak_days) || 0,
                    minProblemsPerDay: streakMinProblems
                }
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/**
 * Get practice history (for charts/visualizations)
 * GET /api/progress/practice-history?days=30
 */
router.get('/practice-history', auth, async (req, res) => {
    const userId = req.user.id;
    const days = validateInteger(req.query.days, 30, 1, 365);
    const daysInterval = days - 1;

    try {
        const result = await pool.query(`
            SELECT
                practice_date,
                problems_solved,
                total_time_seconds,
                problems_attempted,
                lesson_ids
            FROM user_practice_sessions
            WHERE user_id = $1
              AND practice_date >= CURRENT_DATE - INTERVAL '1 day' * $2
            ORDER BY practice_date DESC
        `, [userId, daysInterval]);

        res.json({
            success: true,
            history: result.rows
        });
    } catch (error) {
        console.error('Error fetching practice history:', error);
        res.status(500).json({ error: 'Failed to fetch practice history' });
    }
});


// ==================== CLEAR PROGRESS ====================

/**
 * Clear all progress data for the authenticated user
 * DELETE /api/progress/clear
 * Query params:
 *   - confirm: must be 'true' to prevent accidental deletion
 *   - includeAttempts: 'true' to also delete attempt history (default: false)
 */
router.delete('/clear', auth, async (req, res) => {
    const userId = req.user.id;
    const { confirm, includeAttempts } = req.query;

    // Require explicit confirmation to prevent accidental deletion
    if (confirm !== 'true') {
        return res.status(400).json({
            error: 'Confirmation required',
            message: 'To clear progress, add ?confirm=true to the request'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let deletedCounts = {};

        // Always delete skill mastery
        const masteryResult = await client.query(
            'DELETE FROM user_skill_mastery WHERE user_id = $1',
            [userId]
        );
        deletedCounts.skillMastery = masteryResult.rowCount;

        // Always delete practice sessions (for streak data)
        const sessionsResult = await client.query(
            'DELETE FROM user_practice_sessions WHERE user_id = $1',
            [userId]
        );
        deletedCounts.practiceSessions = sessionsResult.rowCount;

        // Always delete lesson progress
        const lessonProgressResult = await client.query(
            'DELETE FROM user_lesson_progress WHERE user_id = $1',
            [userId]
        );
        deletedCounts.lessonProgress = lessonProgressResult.rowCount;

        // Delete current lesson
        const currentLessonResult = await client.query(
            'DELETE FROM user_current_lesson WHERE user_id = $1',
            [userId]
        );
        deletedCounts.currentLesson = currentLessonResult.rowCount;

        // Delete attempt history
        if (includeAttempts === 'true') {
            const attemptsResult = await client.query(
                'DELETE FROM user_problem_attempts WHERE user_id = $1',
                [userId]
            );
            deletedCounts.problemAttempts = attemptsResult.rowCount;
        }

        await client.query('COMMIT');

        console.log(`User ${userId} cleared progress:`, deletedCounts);

        res.json({
            success: true,
            message: 'Progress cleared successfully',
            deleted: deletedCounts
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error clearing progress:', error);
        res.status(500).json({ error: 'Failed to clear progress' });
    } finally {
        client.release();
    }
});

module.exports = router;