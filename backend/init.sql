-- Create database extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resumes table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    analysis_data JSONB
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    proficiency INTEGER CHECK (proficiency >= 1 AND proficiency <= 5),
    years_experience INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Career paths table
CREATE TABLE IF NOT EXISTS career_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    required_skills TEXT[],
    average_salary INTEGER,
    growth_rate INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    career_path_id UUID REFERENCES career_paths(id),
    match_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    provider VARCHAR(100),
    description TEXT,
    duration VARCHAR(50),
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    rating DECIMAL(3,2),
    price DECIMAL(10,2),
    url VARCHAR(500),
    skills TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(status);
CREATE INDEX IF NOT EXISTS idx_skills_resume_id ON skills(resume_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_resume_id ON recommendations(resume_id);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password, first_name, last_name, role) 
VALUES ('admin@careercoach.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample career paths
INSERT INTO career_paths (title, description, required_skills, average_salary, growth_rate) VALUES
('Senior Software Engineer', 'Lead development of complex software systems', ARRAY['JavaScript', 'React', 'Node.js', 'System Design'], 120000, 15),
('Full Stack Developer', 'Develop both frontend and backend applications', ARRAY['JavaScript', 'React', 'Node.js', 'Database'], 95000, 12),
('DevOps Engineer', 'Manage deployment pipelines and infrastructure', ARRAY['Docker', 'Kubernetes', 'CI/CD', 'AWS'], 110000, 18),
('Data Scientist', 'Analyze data and build machine learning models', ARRAY['Python', 'Machine Learning', 'Statistics'], 115000, 20),
('Product Manager', 'Lead product strategy and development', ARRAY['Product Strategy', 'Agile', 'Communication'], 105000, 14)
ON CONFLICT DO NOTHING;

-- Insert sample courses
INSERT INTO courses (title, provider, description, duration, difficulty, rating, price, url, skills) VALUES
('Kubernetes for Developers', 'Udemy', 'Learn Kubernetes from scratch', '20 hours', 'intermediate', 4.5, 89.99, 'https://udemy.com/kubernetes', ARRAY['Kubernetes', 'Docker']),
('System Design Interview', 'Coursera', 'Master system design concepts', '15 hours', 'advanced', 4.7, 79.99, 'https://coursera.com/system-design', ARRAY['System Design', 'Architecture']),
('AWS Cloud Practitioner', 'A Cloud Guru', 'Complete AWS certification', '30 hours', 'beginner', 4.6, 99.99, 'https://acloud.guru/aws', ARRAY['AWS', 'Cloud Computing'])
ON CONFLICT DO NOTHING;
