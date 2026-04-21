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
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const url = `${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`;

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

    try {
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
    } catch (error) {
      console.error('Gemini API error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Gemini API request failed: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw error;
    }
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
}

export default new GeminiService();
