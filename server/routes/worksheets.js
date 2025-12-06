const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../config/database');

// ==================== VALIDATION HELPERS ====================

const validateInteger = (value, defaultValue, min = 1, max = 1000) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < min || parsed > max) {
        return defaultValue;
    }
    return parsed;
};

const validateString = (value, maxLength = 255) => {
    if (!value || typeof value !== 'string') {
        return null;
    }
    return value.substring(0, maxLength);
};

// ==================== CHECK PENDING WORKSHEET ====================

/**
 * Check if user has a pending worksheet for any lesson
 * GET /api/worksheets/pending
 */
router.get('/pending', auth, async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(`
            SELECT
                w.id,
                w.lesson_id,
                w.total_problems,
                w.problems_checked,
                w.created_at
            FROM user_worksheets w
            WHERE w.user_id = $1 AND w.status = 'pending'
            ORDER BY w.created_at DESC
                LIMIT 1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.json({ success: true, hasPending: false, worksheet: null });
        }

        res.json({
            success: true,
            hasPending: true,
            worksheet: result.rows[0]
        });
    } catch (error) {
        console.error('Error checking pending worksheet:', error);
        res.status(500).json({ error: 'Failed to check pending worksheet' });
    }
});

// ==================== GET WORKSHEET DETAILS ====================

/**
 * Get full worksheet details with problems
 * GET /api/worksheets/:worksheetId
 */
router.get('/:worksheetId', auth, async (req, res) => {
    const userId = req.user.id;
    const worksheetId = validateInteger(req.params.worksheetId, null, 1, 1000000);

    if (!worksheetId) {
        return res.status(400).json({ error: 'Valid worksheetId is required' });
    }

    const client = await pool.connect();

    try {
        // Get worksheet details
        const worksheetResult = await client.query(`
            SELECT
                w.id,
                w.lesson_id,
                w.status,
                w.total_problems,
                w.problems_checked,
                w.created_at,
                w.completed_at
            FROM user_worksheets w
            WHERE w.id = $1 AND w.user_id = $2
        `, [worksheetId, userId]);

        if (worksheetResult.rows.length === 0) {
            return res.status(404).json({ error: 'Worksheet not found' });
        }

        const worksheet = worksheetResult.rows[0];

        // Get all problems for this worksheet
        const problemsResult = await client.query(`
            SELECT
                id,
                problem_id,
                problem_order,
                skill_name,
                correct_answer,
                user_answer,
                is_correct,
                status,
                checked_at
            FROM user_worksheet_problems
            WHERE worksheet_id = $1
            ORDER BY problem_order ASC
        `, [worksheetId]);

        res.json({
            success: true,
            worksheet: {
                ...worksheet,
                problems: problemsResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching worksheet:', error);
        res.status(500).json({ error: 'Failed to fetch worksheet' });
    } finally {
        client.release();
    }
});

// ==================== GENERATE NEW WORKSHEET ====================

/**
 * Generate a new worksheet for a lesson
 * POST /api/worksheets/generate
 * Body: { lessonId, maxProblems, problemPool }
 */
router.post('/generate', auth, async (req, res) => {
    const userId = req.user.id;
    const { lessonId, maxProblems, problemPool } = req.body;

    // Validate inputs
    if (!lessonId || typeof lessonId !== 'string') {
        return res.status(400).json({ error: 'Valid lessonId is required' });
    }

    if (!Array.isArray(problemPool) || problemPool.length === 0) {
        return res.status(400).json({ error: 'problemPool must be a non-empty array' });
    }

    const sanitizedLessonId = validateString(lessonId);
    const validatedMaxProblems = validateInteger(maxProblems, 10, 1, 50);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if there's already a pending worksheet for this lesson
        const existingResult = await client.query(`
            SELECT id FROM user_worksheets
            WHERE user_id = $1 AND lesson_id = $2 AND status = 'pending'
        `, [userId, sanitizedLessonId]);

        if (existingResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: 'A pending worksheet already exists for this lesson',
                worksheetId: existingResult.rows[0].id
            });
        }

        // Select problems (take first maxProblems from the pool)
        const selectedProblems = problemPool.slice(0, validatedMaxProblems);

        // Create worksheet
        const worksheetResult = await client.query(`
            INSERT INTO user_worksheets (user_id, lesson_id, total_problems, status)
            VALUES ($1, $2, $3, 'pending')
                RETURNING id, lesson_id, total_problems, created_at
        `, [userId, sanitizedLessonId, selectedProblems.length]);

        const worksheetId = worksheetResult.rows[0].id;

        // Insert problems
        for (let i = 0; i < selectedProblems.length; i++) {
            const problem = selectedProblems[i];
            await client.query(`
                INSERT INTO user_worksheet_problems
                    (worksheet_id, problem_id, problem_order, skill_name, correct_answer)
                VALUES ($1, $2, $3, $4, $5)
            `, [
                worksheetId,
                validateString(problem.id),
                i + 1,
                validateString(problem.skillName),
                validateString(problem.correctAnswer)
            ]);
        }

        await client.query('COMMIT');

        // Fetch the complete worksheet with problems (like GET endpoint does)
        const problemsResult = await client.query(`
            SELECT
                id,
                problem_id,
                problem_order,
                skill_name,
                correct_answer,
                user_answer,
                is_correct,
                status,
                checked_at
            FROM user_worksheet_problems
            WHERE worksheet_id = $1
            ORDER BY problem_order ASC
        `, [worksheetId]);

        res.json({
            success: true,
            message: 'Worksheet generated successfully',
            worksheet: {
                ... worksheetResult.rows[0],
                status: 'pending',
                problems_checked: 0,
                problems: problemsResult.rows  // include full problems array
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error generating worksheet:', error);
        res.status(500).json({ error: 'Failed to generate worksheet' });
    } finally {
        client.release();
    }
});

// ==================== SUBMIT ANSWER FOR WORKSHEET PROBLEM ====================

/**
 * Submit an answer for a specific worksheet problem
 * POST /api/worksheets/:worksheetId/problems/:problemOrder/submit
 * Body: { userAnswer, isCorrect }
 * Note: Answer correctness is determined on the frontend
 */
router.post('/:worksheetId/problems/:problemOrder/submit', auth, async (req, res) => {
    const userId = req.user.id;
    const worksheetId = validateInteger(req.params.worksheetId, null, 1, 1000000);
    const problemOrder = validateInteger(req.params.problemOrder, null, 1, 1000);
    const { userAnswer, isCorrect } = req.body;

    if (!worksheetId || !problemOrder) {
        return res.status(400).json({ error: 'Valid worksheetId and problemOrder are required' });
    }

    if (userAnswer === undefined || userAnswer === null) {
        return res.status(400).json({ error: 'userAnswer is required' });
    }

    if (typeof isCorrect !== 'boolean') {
        return res.status(400).json({ error: 'isCorrect (boolean) is required' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verify worksheet belongs to user and is pending
        const worksheetCheck = await client.query(`
            SELECT id FROM user_worksheets
            WHERE id = $1 AND user_id = $2 AND status = 'pending'
        `, [worksheetId, userId]);

        if (worksheetCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Worksheet not found or already completed' });
        }

        // Get the problem
        const problemResult = await client.query(`
            SELECT
                id,
                problem_id,
                skill_name,
                correct_answer,
                status
            FROM user_worksheet_problems
            WHERE worksheet_id = $1 AND problem_order = $2
        `, [worksheetId, problemOrder]);

        if (problemResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Problem not found in worksheet' });
        }

        const problem = problemResult.rows[0];

        // Update problem status
        await client.query(`
            UPDATE user_worksheet_problems
            SET user_answer = $1,
                is_correct = $2,
                status = 'checked',
                checked_at = NOW()
            WHERE id = $3
        `, [String(userAnswer), isCorrect, problem.id]);

        // Update worksheet problems_checked count
        await client.query(`
            UPDATE user_worksheets
            SET problems_checked = (
                SELECT COUNT(*)
                FROM user_worksheet_problems
                WHERE worksheet_id = $1 AND status = 'checked'
            )
            WHERE id = $1
        `, [worksheetId]);

        // Check if all problems are now checked
        const completionCheck = await client.query(`
            SELECT total_problems, problems_checked
            FROM user_worksheets
            WHERE id = $1
        `, [worksheetId]);

        const { total_problems, problems_checked } = completionCheck.rows[0];
        const allComplete = total_problems === problems_checked;

        // If complete, update status
        if (allComplete) {
            await client.query(`
                UPDATE user_worksheets
                SET status = 'completed', completed_at = NOW()
                WHERE id = $1
            `, [worksheetId]);
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            isCorrect,
            allComplete,
            problemsChecked: problems_checked,
            totalProblems: total_problems,
            problem: {
                problemId: problem.problem_id,
                skillName: problem.skill_name
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting worksheet answer:', error);
        res.status(500).json({ error: 'Failed to submit answer' });
    } finally {
        client.release();
    }
});

// ==================== DELETE/CANCEL WORKSHEET ====================

/**
 * Delete a pending worksheet
 * DELETE /api/worksheets/:worksheetId
 */
router.delete('/:worksheetId', auth, async (req, res) => {
    const userId = req.user.id;
    const worksheetId = validateInteger(req.params.worksheetId, null, 1, 1000000);

    if (!worksheetId) {
        return res.status(400).json({ error: 'Valid worksheetId is required' });
    }

    try {
        const result = await pool.query(`
            DELETE FROM user_worksheets
            WHERE id = $1 AND user_id = $2 AND status = 'pending'
            RETURNING id
        `, [worksheetId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Worksheet not found or cannot be deleted' });
        }

        res.json({
            success: true,
            message: 'Worksheet deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting worksheet:', error);
        res.status(500).json({ error: 'Failed to delete worksheet' });
    }
});

module.exports = router;