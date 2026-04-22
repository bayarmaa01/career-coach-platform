/**
 * Skill Recommendations Page - AI-powered recommendations without CV (Tailwind CSS version)
 * Generates career paths, learning roadmap, and job suggestions based on skills and interests
 */

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface RecommendationsRequest {
  skills: string[];
  interests: string[];
  target_role?: string;
  experience_level?: string;
  chat_history?: string[];
  preferences?: any;
}

interface RecommendationsResponse {
  success: boolean;
  career_paths?: Array<{
    title: string;
    description: string;
    required_skills: string[];
    existing_skills: string[];
    missing_skills: string[];
    salary_range: string;
    growth_potential: string;
    industry_demand: string;
    match_score: number;
  }>;
  learning_roadmap?: Array<{
    month: string;
    focus_area: string;
    skills_to_learn: string[];
    resources: Array<{
      type: string;
      title: string;
      provider: string;
      duration: string;
      difficulty: string;
    }>;
    projects: string[];
    time_commitment: string;
    outcomes: string[];
  }>;
  job_suggestions?: Array<{
    job_title: string;
    company_type: string;
    responsibilities: string[];
    skills_match: {
      matched: string[];
      missing: string[];
      match_percentage: number;
    };
    salary_range: string;
    location_options: string[];
    application_tips: string[];
    urgency: string;
  }>;
  skill_gaps?: string[];
  error?: string;
}

const SkillRecommendationsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const experienceLevels = [
    { value: 'entry-level', label: 'Entry Level (0-2 years)' },
    { value: 'mid-level', label: 'Mid Level (2-5 years)' },
    { value: 'senior-level', label: 'Senior Level (5-10 years)' },
    { value: 'executive-level', label: 'Executive Level (10+ years)' },
  ];

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills(prev => [...prev, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };

  const addInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests(prev => [...prev, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setInterests(prev => prev.filter(interest => interest !== interestToRemove));
  };

  const generateRecommendations = async () => {
    if (skills.length === 0 || interests.length === 0) {
      showToastMessage('Please add at least one skill and one interest.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const request: RecommendationsRequest = {
        skills,
        interests,
        target_role: targetRole || undefined,
        experience_level: experienceLevel || undefined,
      };

      const response = await api.post('/ai/recommendations-lite', request);

      if (response.data.success) {
        setRecommendations(response.data);
        showToastMessage('Recommendations Generated!', 'success');
      } else {
        throw new Error(response.data.error || 'Failed to generate recommendations');
      }
    } catch (error: any) {
      showToastMessage(error.message || 'Failed to generate recommendations. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getGrowthColor = (potential: string) => {
    switch (potential.toLowerCase()) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">AI-Powered Career Recommendations</h1>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
              Get personalized career paths, learning roadmaps, and job suggestions based on your skills and interests - no CV required!
            </p>
          </div>

          {/* Input Form */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-6">Tell Us About Yourself</h2>
              <div className="space-y-6">
                {/* Skills Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Skills
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Enter a skill (e.g., JavaScript, Python, Communication)"
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={addSkill}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Interests Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Interests
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      placeholder="Enter an interest (e.g., Web Development, Data Science)"
                      onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={addInterest}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interests.map((interest, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {interest}
                        <button
                          onClick={() => removeInterest(interest)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Role (Optional)
                    </label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g., Software Engineer, Data Analyst"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Level (Optional)
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select experience level</option>
                      {experienceLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={generateRecommendations}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Generating Recommendations...' : 'Generate Recommendations'}
                </button>
              </div>
            </div>
          </div>

          {/* Recommendations Results */}
          {recommendations && (
            <div className="space-y-8">
              {/* Career Paths */}
              {recommendations.career_paths && recommendations.career_paths.length > 0 && (
                <div className="bg-white shadow-sm rounded-lg">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-6 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Recommended Career Paths
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {recommendations.career_paths.map((path, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold">{path.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(path.match_score)}`}>
                                {path.match_score}% Match
                              </span>
                            </div>
                            
                            <p className="text-gray-600 text-sm">{path.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{path.salary_range}</span>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${getGrowthColor(path.growth_potential)}`}>
                                {path.growth_potential} Growth
                              </span>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium mb-2">Skills Match:</p>
                              <div className="flex flex-wrap gap-1">
                                {path.existing_skills.map((skill, i) => (
                                  <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                    {skill}
                                  </span>
                                ))}
                                {path.missing_skills.map((skill, i) => (
                                  <span key={i} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded border border-red-200">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Learning Roadmap */}
              {recommendations.learning_roadmap && recommendations.learning_roadmap.length > 0 && (
                <div className="bg-white shadow-sm rounded-lg">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-6 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Learning Roadmap
                    </h2>
                    <div className="space-y-4">
                      {recommendations.learning_roadmap.map((month, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg">
                          <div
                            className="p-4 cursor-pointer hover:bg-gray-50"
                            onClick={() => setExpandedMonth(expandedMonth === index ? null : index)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-semibold">{month.month}</h3>
                                <p className="text-sm text-gray-600">{month.focus_area}</p>
                              </div>
                              <svg
                                className={`w-5 h-5 transform transition-transform ${expandedMonth === index ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          
                          {expandedMonth === index && (
                            <div className="px-4 pb-4 border-t">
                              <div className="space-y-4 pt-4">
                                <div className="flex items-center text-sm">
                                  <svg className="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>{month.time_commitment}</span>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium mb-2">Skills to Learn:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {month.skills_to_learn.map((skill, i) => (
                                      <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium mb-2">Resources:</p>
                                  <div className="space-y-2">
                                    {month.resources.map((resource, i) => (
                                      <div key={i} className="flex items-start">
                                        <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                          <p className="text-sm font-medium">{resource.title}</p>
                                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                                            <span className="px-2 py-1 bg-gray-100 rounded">{resource.type}</span>
                                            <span className="px-2 py-1 bg-gray-100 rounded">{resource.difficulty}</span>
                                            <span>{resource.duration}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium mb-1">Expected Outcomes:</p>
                                  <ul className="text-sm space-y-1">
                                    {month.outcomes.map((outcome, i) => (
                                      <li key={i} className="flex items-center">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {outcome}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Job Suggestions */}
              {recommendations.job_suggestions && recommendations.job_suggestions.length > 0 && (
                <div className="bg-white shadow-sm rounded-lg">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-6 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Job Suggestions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {recommendations.job_suggestions.map((job, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold">{job.job_title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(job.urgency)}`}>
                                {job.urgency} Urgency
                              </span>
                            </div>
                            
                            <p className="text-gray-600 text-sm">{job.company_type}</p>
                            
                            <div className="flex items-center text-sm">
                              <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{job.salary_range}</span>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium mb-2">Skills Match:</p>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    job.skills_match.match_percentage >= 70 ? 'bg-green-600' : 'bg-yellow-600'
                                  }`}
                                  style={{ width: `${job.skills_match.match_percentage}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-600">
                                {job.skills_match.match_percentage}% match
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium mb-2">Application Tips:</p>
                              <ul className="text-sm space-y-1">
                                {job.application_tips.map((tip, i) => (
                                  <li key={i} className="flex items-start">
                                    <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Skill Gaps */}
              {recommendations.skill_gaps && recommendations.skill_gaps.length > 0 && (
                <div className="bg-white shadow-sm rounded-lg">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-6 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Skill Gaps to Address
                    </h2>
                    <ul className="space-y-2">
                      {recommendations.skill_gaps.map((gap, index) => (
                        <li key={index} className="flex items-center">
                          <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          toastType === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-800' 
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default SkillRecommendationsPage;
