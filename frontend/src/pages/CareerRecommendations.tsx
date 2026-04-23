import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { getCareerRecommendations, getResumeAnalysis } from '../store/slices/careerSlice';
import { getUserResumes } from '../store/slices/resumeSlice';
import { TrendingUp, DollarSign, Users, Star, AlertCircle } from 'lucide-react';

const CareerRecommendations: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { careerPaths, isLoading, recommendations, resumeAnalysis } = useSelector((state: RootState) => state.career);
  const { resumes } = useSelector((state: RootState) => state.resume);
  const [selectedResume, setSelectedResume] = useState<string>('');

  useEffect(() => {
    // Load resumes on component mount
    dispatch(getUserResumes());
  }, [dispatch]);

  useEffect(() => {
    // Auto-select first completed resume if no resume is selected
    if (!selectedResume && resumes.length > 0) {
      const completedResume = resumes.find(resume => resume.status === 'completed');
      if (completedResume) {
        setSelectedResume(completedResume.id);
      }
    }
  }, [resumes, selectedResume]);

  useEffect(() => {
    if (selectedResume) {
      dispatch(getResumeAnalysis(selectedResume));
      dispatch(getCareerRecommendations(selectedResume));
    }
  }, [dispatch, selectedResume]);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Career Recommendations</h1>
        <p className="mt-2 text-gray-600">
          Discover career paths that match your skills and experience
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (!recommendations || !recommendations.careerPaths || recommendations.careerPaths.length === 0) ? (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
          <p className="text-gray-600 mb-4">Upload and analyze your resume to get career recommendations</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.careerPaths.map((path: any, index: number) => (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{path.title}</h3>
                  <p className="text-gray-600 text-sm">{path.description}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">Salary Range</span>
                    </div>
                    <span className="font-medium text-gray-900">{path.salary_range || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Industry Demand</span>
                    </div>
                    <span className="font-medium text-gray-900">{path.industry_demand || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-gray-600">Match Score</span>
                    </div>
                    <span className="font-medium text-gray-900">{path.match_score || 0}%</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {path.required_skills?.slice(0, 3).map((skill: any, skillIndex: number) => (
                      <span
                        key={skillIndex}
                        className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {path.required_skills?.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{path.required_skills?.length - 3 || 0} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Skill Gaps Section */}
          {recommendations.skillGaps && recommendations.skillGaps.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Skill Gaps to Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.skillGaps.map((skill: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-gray-700">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CareerRecommendations;
