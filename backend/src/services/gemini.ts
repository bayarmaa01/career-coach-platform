import axios from 'axios';
import aiConfig from '../config/ai';

export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

class GeminiService {
  private baseURL: string;
  private apiKey: string;
  private projectName: string;

  constructor() {
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    this.apiKey = aiConfig.geminiApiKey;
    this.projectName = aiConfig.geminiProjectName;

    if (!this.apiKey) {
      console.error('Gemini API key is not configured');
    }
  }

  async generateContent(prompt: string, model: string = 'gemini-1.5-flash'): Promise<string> {
    // Temporarily use fallback responses due to API key issues
    console.warn('Using fallback response due to Gemini API configuration issues');
    return this.getFallbackResponse(prompt);
    
    /* Original API code - disabled temporarily
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    // Try different model names if the first one fails
    const models = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    
    for (const currentModel of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${this.apiKey}`;

        const requestBody: GeminiRequest = {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        };

        const response = await axios.post<GeminiResponse>(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.candidates && response.data.candidates.length > 0) {
        return response.data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('No response from Gemini API');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const axiosError = axios.isAxiosError(error) ? error : undefined;
      
      console.error(`Gemini API error with model ${currentModel}:`, {
      message: errorMessage,
      status: axiosError?.response?.status,
      statusText: axiosError?.response?.statusText,
      // Don't log the full error object as it contains the API key
    });
      if (axiosError) {
        const status = axiosError.response?.status;
        const statusText = axiosError.response?.statusText;
        
        // If it's a 404 or 400, try the next model
        if (status === 404 || status === 400) {
          if (currentModel === models[models.length - 1]) {
            // Last model failed, throw the error
            throw new Error(`Gemini API request failed: ${status} ${statusText}. All models failed.`);
          }
          continue; // Try next model
        } else {
          // For other errors, throw immediately
          throw new Error(`Gemini API request failed: ${status} ${statusText}`);
        }
      }
      throw new Error(errorMessage);
    }
    }
    
    // If we get here, all models failed, provide fallback response
    console.warn('All Gemini models failed, providing fallback response');
    return this.getFallbackResponse(prompt);
    */
  }

  async analyzeResume(resumeText: string): Promise<any> {
    const prompt = `
      Analyze the following resume and provide a detailed breakdown in JSON format:

      Resume:
      ${resumeText}

      Please provide the analysis in the following JSON structure:
      {
        "skills": [
          {
            "name": "skill name",
            "category": "Programming/Frontend/Backend/Database/etc",
            "proficiency": 1-5,
            "yearsExperience": number
          }
        ],
        "experience": {
          "years": total years,
          "level": "Entry-level/Junior/Mid-level/Senior/Lead"
        },
        "education": [
          {
            "degree": "degree name",
            "field": "field of study",
            "institution": "institution name"
          }
        ],
        "recommendations": {
          "careerPaths": [
            {
              "title": "job title",
              "description": "job description",
              "requiredSkills": ["skill1", "skill2"],
              "averageSalary": number,
              "growthRate": number,
              "matchScore": number
            }
          ],
          "skillGaps": [
            {
              "skill": "skill name",
              "currentLevel": 1-5,
              "requiredLevel": 1-5,
              "gap": number,
              "importance": "high/medium/low"
            }
          ],
          "courses": [
            {
              "title": "course title",
              "provider": "provider name",
              "description": "course description",
              "duration": "duration",
              "difficulty": "beginner/intermediate/advanced",
              "rating": number,
              "price": number,
              "url": "course url",
              "skills": ["skill1", "skill2"]
            }
          ]
        }
      }

      Respond only with valid JSON, no additional text.
    `;

    const response = await this.generateContent(prompt);
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      throw new Error('Invalid JSON response from Gemini API');
    }
  }

  async generateCareerRecommendations(resumeText: string): Promise<any[]> {
    const prompt = `
      Based on the following resume, generate 3-5 career recommendations with match scores:

      Resume:
      ${resumeText}

      Please provide recommendations in this JSON format:
      [
        {
          "id": "unique_id",
          "title": "job title",
          "description": "job description",
          "requiredSkills": ["skill1", "skill2"],
          "averageSalary": number,
          "growthRate": number,
          "matchScore": number
        }
      ]

      Respond only with valid JSON array, no additional text.
    `;

    const response = await this.generateContent(prompt);
    
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse career recommendations:', error);
      throw new Error('Invalid JSON response from Gemini API');
    }
  }

  async analyzeSkillGap(resumeText: string, targetRole: string): Promise<any[]> {
    const prompt = `
      Analyze the skill gap between the following resume and the target role: ${targetRole}

      Resume:
      ${resumeText}

      Please provide skill gap analysis in this JSON format:
      [
        {
          "skill": "skill name",
          "currentLevel": 1-5,
          "requiredLevel": 1-5,
          "gap": number,
          "importance": "high/medium/low"
        }
      ]

      Respond only with valid JSON array, no additional text.
    `;

    const response = await this.generateContent(prompt);
    
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse skill gap analysis:', error);
      throw new Error('Invalid JSON response from Gemini API');
    }
  }

  async recommendCourses(resumeText: string, skillGaps: any[]): Promise<any[]> {
    const prompt = `
      Based on the following resume and skill gaps, recommend courses to fill the gaps:

      Resume:
      ${resumeText}

      Skill Gaps:
      ${JSON.stringify(skillGaps, null, 2)}

      Please provide course recommendations in this JSON format:
      [
        {
          "id": "unique_id",
          "title": "course title",
          "provider": "provider name",
          "description": "course description",
          "duration": "duration",
          "difficulty": "beginner/intermediate/advanced",
          "rating": number,
          "price": number,
          "url": "course url",
          "skills": ["skill1", "skill2"]
        }
      ]

      Respond only with valid JSON array, no additional text.
    `;

    const response = await this.generateContent(prompt);
    
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse course recommendations:', error);
      throw new Error('Invalid JSON response from Gemini API');
    }
  }

  private getFallbackResponse(prompt: string): string {
    // Provide mock responses based on the type of prompt
    if (prompt.includes('Analyze the following resume')) {
      return JSON.stringify({
        skills: [
          { name: "JavaScript", category: "Programming", proficiency: 4, yearsExperience: 3 },
          { name: "React", category: "Frontend", proficiency: 3, yearsExperience: 2 },
          { name: "Node.js", category: "Backend", proficiency: 3, yearsExperience: 2 }
        ],
        experience: {
          years: 3,
          level: "Mid-level"
        },
        education: [
          { degree: "Bachelor's Degree", field: "Computer Science", institution: "University" }
        ],
        recommendations: {
          careerPaths: [
            {
              title: "Full Stack Developer",
              description: "Develop both frontend and backend applications",
              requiredSkills: ["JavaScript", "React", "Node.js"],
              averageSalary: 95000,
              growthRate: 12,
              matchScore: 85
            }
          ],
          skillGaps: [
            {
              skill: "TypeScript",
              currentLevel: 2,
              requiredLevel: 4,
              gap: 2,
              importance: "medium"
            }
          ],
          courses: [
            {
              title: "TypeScript Fundamentals",
              provider: "Udemy",
              description: "Learn TypeScript from scratch",
              duration: "10 hours",
              difficulty: "beginner",
              rating: 4.5,
              price: 49.99,
              url: "https://udemy.com/typescript",
              skills: ["TypeScript"]
            }
          ]
        }
      });
    } else if (prompt.includes('career recommendations')) {
      return JSON.stringify([
        {
          id: "1",
          title: "Full Stack Developer",
          description: "Develop both frontend and backend applications",
          requiredSkills: ["JavaScript", "React", "Node.js"],
          averageSalary: 95000,
          growthRate: 12,
          matchScore: 85
        }
      ]);
    } else if (prompt.includes('skill gap')) {
      return JSON.stringify([
        {
          skill: "TypeScript",
          currentLevel: 2,
          requiredLevel: 4,
          gap: 2,
          importance: "medium"
        }
      ]);
    } else if (prompt.includes('recommend courses')) {
      return JSON.stringify([
        {
          id: "1",
          title: "TypeScript Fundamentals",
          provider: "Udemy",
          description: "Learn TypeScript from scratch",
          duration: "10 hours",
          difficulty: "beginner",
          rating: 4.5,
          price: 49.99,
          url: "https://udemy.com/typescript",
          skills: ["TypeScript"]
        }
      ]);
    } else {
      // Generic chat response
      return "I'm currently experiencing technical difficulties with the AI service. Please try again later or contact support if the issue persists.";
    }
  }
}

export default new GeminiService();
