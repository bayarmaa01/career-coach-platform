
export interface AIConfig {
  geminiApiKey: string;
  demoMode: boolean;
}

const aiConfig: AIConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  demoMode: process.env.DEMO_MODE === 'true',
};

// Debug logging
console.log("GEMINI KEY:", process.env.GEMINI_API_KEY ? "SET" : "NOT SET");
console.log("DEMO MODE:", aiConfig.demoMode ? "ENABLED" : "DISABLED");

// Validate configuration
const validateConfig = (): void => {
  if (!aiConfig.geminiApiKey) {
    console.warn('Warning: GEMINI_API_KEY is not set in environment variables');
  }
  
  if (aiConfig.demoMode) {
    console.log('🤖 Demo AI mode is enabled - using mock responses');
  }
};

validateConfig();

export default aiConfig;
