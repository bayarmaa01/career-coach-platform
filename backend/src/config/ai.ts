
export interface AIConfig {
  geminiApiKey: string;
}

const aiConfig: AIConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};

// Debug logging
console.log("GEMINI KEY:", process.env.GEMINI_API_KEY ? "SET" : "NOT SET");

// Validate configuration
const validateConfig = (): void => {
  if (!aiConfig.geminiApiKey) {
    console.warn('Warning: GEMINI_API_KEY is not set in environment variables');
  }
};

validateConfig();

export default aiConfig;
