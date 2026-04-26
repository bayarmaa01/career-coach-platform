
export interface AIConfig {
  geminiApiKey: string;
  geminiProjectName: string;
  geminiProjectNumber: string;
  aiModelApiKey: string;
  demoMode: boolean;
}

const aiConfig: AIConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.AI_MODEL_API_KEY || '',
  geminiProjectName: process.env.GEMINI_PROJECT_NAME || '',
  geminiProjectNumber: process.env.GEMINI_PROJECT_NUMBER || '',
  aiModelApiKey: process.env.AI_MODEL_API_KEY || '',
  demoMode: process.env.DEMO_MODE === 'true',
};

// Debug logging
console.log("GEMINI KEY:", process.env.GEMINI_API_KEY ? "SET" : "NOT SET");
console.log("DEMO MODE:", aiConfig.demoMode ? "ENABLED" : "DISABLED");

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
  
  if (aiConfig.demoMode) {
    console.log('🤖 Demo AI mode is enabled - using mock responses');
  }
};

validateConfig();

export default aiConfig;
