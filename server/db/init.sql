-- Drop tables if they exist to ensure a clean slate
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_practice_sessions CASCADE;
DROP TABLE IF EXISTS user_problem_attempts CASCADE;
DROP TABLE IF EXISTS user_skill_mastery CASCADE;
DROP TABLE IF EXISTS user_current_lesson CASCADE;
DROP TABLE IF EXISTS user_lesson_progress CASCADE;
DROP TABLE IF EXISTS user_worksheets CASCADE;
DROP TABLE IF EXISTS user_worksheet_problems CASCADE;

-- Create the users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ***** ADD THIS LINE HERE *****
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- *****************************

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Table to store skill mastery state per user
CREATE TABLE user_skill_mastery (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        skill_name VARCHAR(255) NOT NULL,
        prob_mastery DECIMAL(5, 4) NOT NULL DEFAULT 0.1000,
        prob_slip DECIMAL(5, 4) NOT NULL DEFAULT 0.1000,
        prob_guess DECIMAL(5, 4) NOT NULL DEFAULT 0.2500,
        prob_transit DECIMAL(5, 4) NOT NULL DEFAULT 0.1000,
        last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, skill_name),
        CHECK (prob_mastery >= 0 AND prob_mastery <= 1),
        CHECK (prob_slip >= 0 AND prob_slip <= 1),
        CHECK (prob_guess >= 0 AND prob_guess <= 1),
        CHECK (prob_transit >= 0 AND prob_transit <= 1)
);

CREATE INDEX idx_user_skill_mastery_user_id ON user_skill_mastery(user_id);
CREATE INDEX idx_user_skill_mastery_skill_name ON user_skill_mastery(skill_name);
CREATE INDEX idx_user_skill_mastery_last_updated ON user_skill_mastery(last_updated);

-- Table to store individual problem attempts (for analytics and stats)
CREATE TABLE user_problem_attempts (
       id SERIAL PRIMARY KEY,
       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       problem_id VARCHAR(255) NOT NULL,
       step_id VARCHAR(255),
       skill_name VARCHAR(255),
       is_correct BOOLEAN NOT NULL,
       time_spent_seconds INTEGER,
       hint_count INTEGER DEFAULT 0,
       attempt_number INTEGER DEFAULT 1,
       completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
       session_id VARCHAR(255),
       lesson_id VARCHAR(255),
       course_name VARCHAR(255)
);

CREATE INDEX idx_problem_attempts_user_id ON user_problem_attempts(user_id);
CREATE INDEX idx_problem_attempts_completed_at ON user_problem_attempts(completed_at);
CREATE INDEX idx_problem_attempts_user_date ON user_problem_attempts(user_id, completed_at DESC);
CREATE INDEX idx_problem_attempts_skill ON user_problem_attempts(user_id, skill_name);

-- Table to store daily practice sessions (for streak calculation)
CREATE TABLE user_practice_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        practice_date DATE NOT NULL,
        problems_solved INTEGER NOT NULL DEFAULT 0,
        total_time_seconds INTEGER NOT NULL DEFAULT 0,
        problems_attempted INTEGER NOT NULL DEFAULT 0,
        lesson_ids TEXT[],
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, practice_date)
);

CREATE INDEX idx_practice_sessions_user_id ON user_practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_user_date ON user_practice_sessions(user_id, practice_date DESC);


-- Table for tracking user's current/last active lesson
CREATE TABLE user_current_lesson (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    lesson_id VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for tracking lesson-level progress (overall completion %, completed problems, etc.)
CREATE TABLE user_lesson_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id VARCHAR(255) NOT NULL,
    completed_problems TEXT[], -- Array of completed problem IDs
    total_problems INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_problem_id VARCHAR(255),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_user_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX idx_user_lesson_progress_lesson ON user_lesson_progress(lesson_id);
CREATE INDEX idx_user_current_lesson_user ON user_current_lesson(user_id);


-- ==================== PAPER PRACTICE WORKSHEETS ====================

-- Main worksheet table
CREATE TABLE user_worksheets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed'
    total_problems INTEGER NOT NULL DEFAULT 0,
    problems_checked INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Worksheet problems (ordered list)
CREATE TABLE user_worksheet_problems (
    id SERIAL PRIMARY KEY,
    worksheet_id INTEGER NOT NULL REFERENCES user_worksheets(id) ON DELETE CASCADE,
    problem_id VARCHAR(255) NOT NULL,
    problem_order INTEGER NOT NULL, -- 1, 2, 3, etc.
    skill_name VARCHAR(255),
    correct_answer TEXT,
    user_answer TEXT,
    is_correct BOOLEAN,
    status VARCHAR(50) NOT NULL DEFAULT 'unchecked', -- 'unchecked', 'checked'
    checked_at TIMESTAMP,
    CONSTRAINT unique_worksheet_problem UNIQUE (worksheet_id, problem_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_worksheets_user_status ON user_worksheets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_worksheets_user_lesson ON user_worksheets(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_worksheet_problems_worksheet ON user_worksheet_problems(worksheet_id);

-- Partial unique index for pending worksheets (PostgreSQL 9.5+)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_worksheet 
    ON user_worksheets(user_id, lesson_id) 
    WHERE status = 'pending';
