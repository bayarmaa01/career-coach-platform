import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { getSkillGapAnalysis } from '../store/slices/careerSlice';
import { BarChart3, AlertTriangle, TrendingUp, BookOpen } from 'lucide-react';

const SkillGapAnalysis: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { skillGaps, isLoading } = useSelector((state: RootState) => state.career);
  const [selectedResume, setSelectedResume] = useState<string>('');

  useEffect(() => {
    if (selectedResume) {
      dispatch(getSkillGapAnalysis(selectedResume));
    }
  }, [dispatch, selectedResume]);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGapWidth = (gap: number) => {
    return Math.min(gap * 20, 100);
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Skill Gap Analysis</h1>
        <p className="mt-2 text-gray-600">
          Identify areas for improvement and get personalized learning recommendations
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : skillGaps.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No skill analysis yet</h3>
          <p className="text-gray-600 mb-4">Upload and analyze your resume to get skill gap analysis</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills to Develop</h2>
            <div className="space-y-4">
              {skillGaps.map((gap, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">{gap.skill}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImportanceColor(gap.importance)}`}>
                        {gap.importance} priority
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500">Current</p>
                        <p className="font-medium text-gray-900">{gap.currentLevel}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Required</p>
                        <p className="font-medium text-gray-900">{gap.requiredLevel}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Gap Analysis</span>
                      <span>{gap.gap} levels</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-red-500 h-2 rounded-full"
                        style={{ width: `${getGapWidth(gap.gap)}%` }}
                      ></div>
                    </div>
                  </div>

                  {gap.importance === 'high' && (
                    <div className="flex items-start space-x-2 text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4 mt-0.5" />
                      <p>This skill is critical for your target career path</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Learning Path</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Based on your skill gaps, we recommend focusing on high-priority skills first.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <span className="text-sm text-gray-700">Complete high-priority skill gaps</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <span className="text-sm text-gray-700">Address medium-priority gaps</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <span className="text-sm text-gray-700">Enhance low-priority skills</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Quick Tips</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>Focus on one skill at a time for better retention</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>Practice skills through real-world projects</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>Seek mentorship in areas where you have large gaps</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>Set realistic timelines for skill development</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillGapAnalysis;
