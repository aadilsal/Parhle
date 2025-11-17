-- Create tables for Quiz feature
-- Requires uuid-ossp extension (project already enables it in other migrations)

-- quizzes table: metadata about generated or authored quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')) DEFAULT 'medium',
  title TEXT,
  description TEXT,
  ai_generated BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- quiz_questions: store questions for quizzes
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mcq','tf','short','essay','image','audio')),
  question TEXT NOT NULL,
  options TEXT[] DEFAULT '{}',
  correct_answer TEXT,
  rationale TEXT,
  ai_generated BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- quiz_attempts: record of user attempts and graded results
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score NUMERIC DEFAULT 0,
  max_score NUMERIC DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optionally separate quiz categories (you can reuse existing categories table instead)
CREATE TABLE IF NOT EXISTS quiz_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);

-- RLS: enable and simple owner-only policies similar to notes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quizzes policies
CREATE POLICY IF NOT EXISTS "Quizzes: owner can select" ON quizzes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Quizzes: owner can insert" ON quizzes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Quizzes: owner can update" ON quizzes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Quizzes: owner can delete" ON quizzes
  FOR DELETE USING (auth.uid() = user_id);

-- Quiz questions policies: owners (quiz owners) can manage; readers can view if they own the quiz
CREATE POLICY IF NOT EXISTS "QuizQuestions: owner can select" ON quiz_questions
  FOR SELECT USING (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "QuizQuestions: owner can insert" ON quiz_questions
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = new.quiz_id AND quizzes.user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "QuizQuestions: owner can update" ON quiz_questions
  FOR UPDATE USING (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "QuizQuestions: owner can delete" ON quiz_questions
  FOR DELETE USING (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.user_id = auth.uid()));

-- Quiz attempts policies: users can insert their own attempts and view their own attempts
CREATE POLICY IF NOT EXISTS "QuizAttempts: owner can select" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "QuizAttempts: owner can insert" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "QuizAttempts: owner can update" ON quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "QuizAttempts: owner can delete" ON quiz_attempts
  FOR DELETE USING (auth.uid() = user_id);

-- Simple helper index for full-text (optional in future):
-- CREATE INDEX IF NOT EXISTS idx_quiz_questions_text_search ON quiz_questions USING GIN(to_tsvector('english', coalesce(question, '')));

-- Done
