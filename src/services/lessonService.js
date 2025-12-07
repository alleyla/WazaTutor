/**
 * Service for lesson-related utilities and calculations
 */
import { findLessonById } from '../config/config';
import { CONTENT_SOURCE } from '@common/global-config';
import { cleanArray } from '../util/cleanObject';
import skillModel from "../content-sources/wazatutor/skillModel.json";

// Load problem pool and skill model once
const problemPool = require(`@generated/processed-content-pool/${CONTENT_SOURCE}.json`);


class LessonService {
    constructor() {
        // Initialize problem pool with knowledge components from skill model
        this.problemsWithKC = this._initializeProblemPool();
    }

    /**
     * Add knowledge components to steps from skill model
     * @private
     */
    _initializeProblemPool() {
        const problems = [... problemPool];

        for (const problem of problems) {
            for (let stepIndex = 0; stepIndex < problem.steps.length; stepIndex++) {
                const step = problem.steps[stepIndex];
                step.knowledgeComponents = cleanArray(skillModel[step.id] || []);
            }
        }

        return problems;
    }

    /**
     * Get display name for a skill using translation
     * @param {string} skillKey - The skill key (e.g., 'visualize_fractions')
     * @param {Function} translate - Translation function from withTranslation HOC
     * @returns {string} - Human-readable name or "Skill" as fallback
     */
    getSkillDisplayName(skillKey, translate) {
        if (!translate) {
            // Fallback if translate function not provided
            return 'Skill';
        }

        const translationKey = `skills.${skillKey}`;
        const translated = translate(translationKey);

        // If translation returns the key itself, it means it doesn't exist
        // Return "Skill" as fallback
        return translated === translationKey ? translationKey : translated;
    }

    /**
     * Get total number of problems available for a lesson
     * Counts problems that have at least one step with knowledge components
     * matching the lesson's learning objectives
     *
     * @param {string} lessonId - The lesson ID
     * @returns {number} - Total count of relevant problems
     */
    getTotalProblemsForLesson(lessonId) {
        const lesson = findLessonById(lessonId);
        if (!lesson || !lesson.learningObjectives) {
            return 0;
        }

        // Filter out editor/test problems
        const problems = this.problemsWithKC.filter(
            ({ courseName }) => ! courseName.toString().startsWith("! !")
        );

        let relevantCount = 0;

        for (const problem of problems) {
            let isRelevant = false;

            // Check if any step in this problem has knowledge components from this lesson
            for (const step of problem.steps) {
                if (! step.knowledgeComponents) continue;

                for (const kc of step.knowledgeComponents) {
                    if (lesson.learningObjectives[kc] !== undefined) {
                        isRelevant = true;
                        break;
                    }
                }

                if (isRelevant) break;
            }

            if (isRelevant) {
                relevantCount++;
            }
        }

        return relevantCount;
    }

    /**
     * Get lesson metadata by ID
     * @param {string} lessonId
     * @returns {Object|null}
     */
    getLessonById(lessonId) {
        return findLessonById(lessonId);
    }

    /**
     * Calculate completion percentage for a lesson
     * @param {Array} completedProblems - Array of completed problem IDs
     * @param {string} lessonId - The lesson ID
     * @returns {number} - Percentage (0-100)
     */
    calculateCompletionPercentage(completedProblems, lessonId) {
        const totalProblems = this.getTotalProblemsForLesson(lessonId);
        if (totalProblems === 0) return 0;

        const completedCount = Array.isArray(completedProblems) ? completedProblems.length : 0;
        return (completedCount / totalProblems) * 100;
    }
}

export default new LessonService();