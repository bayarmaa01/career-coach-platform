import dotenv from 'dotenv';

// Clear any cached environment variables
delete process.env.GEMINI_API_KEY;
delete process.env.AI_MODEL_API_KEY;
delete process.env.GEMINI_PROJECT_NAME;
delete process.env.GEMINI_PROJECT_NUMBER;

dotenv.config({ path: '../.env.production' });

export interface AIConfig {
  geminiApiKey: string;
  geminiProjectName: string;
  geminiProjectNumber: string;
  aiModelApiKey: string;
}

const aiConfig: AIConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.AI_MODEL_API_KEY || '',
  geminiProjectName: process.env.GEMINI_PROJECT_NAME || '',
  geminiProjectNumber: process.env.GEMINI_PROJECT_NUMBER || '',
  aiModelApiKey: process.env.AI_MODEL_API_KEY || '',
};

// Validate configuration
const validateConfig = (): void => {
  if (!aiConfig.geminiApiKey) {
    console.warn('Warning: GEMINI_API_KEY or AI_MODEL_API_KEY is not set in environment variables');
  }
  if (!aiConfig.geminiProjectName) {
    console.warn('Warning: GEMINI_PROJECT_NAME is not set in environment variables');
  }
  if (!aiConfig.geminiProjectNumber) {
    console.warn('Warning: GEMINI_PROJECT_NUMBER is not set in environment variables');
  }
};

// Log configuration (without exposing sensitive data)
console.log('AI Configuration:', {
  hasGeminiApiKey: !!aiConfig.geminiApiKey,
  geminiProjectName: aiConfig.geminiProjectName || 'not-set',
  geminiProjectNumber: aiConfig.geminiProjectNumber || 'not-set',
  hasAiModelApiKey: !!aiConfig.aiModelApiKey,
});

validateConfig();

export default aiConfig;
