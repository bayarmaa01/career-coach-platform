import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState, AppDispatch } from '../store/store';
import { getUserResumes } from '../store/slices/resumeSlice';
import { Resume } from '../types';
import { 
  FileText, 
  TrendingUp, 
  BarChart3, 
  Upload,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { resumes, isLoading } = useSelector((state: RootState) => state.resume);

  useEffect(() => {
    dispatch(getUserResumes());
  }, [dispatch]);

  const getStatusIcon = (status: Resume['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Resume['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Here's an overview of your career coaching journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Resumes</p>
              <p className="text-2xl font-bold text-gray-900">{resumes.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Analyzed</p>
              <p className="text-2xl font-bold text-gray-900">
                {resumes.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Career Paths</p>
              <p className="text-2xl font-bold text-gray-900">
                {resumes.filter(r => r.status === 'completed').length * 3}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Skill Gaps</p>
              <p className="text-2xl font-bold text-gray-900">
                {resumes.filter(r => r.status === 'completed').length * 5}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Resumes</h2>
            <Link
              to="/resume-upload"
              className="btn btn-primary btn-sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </Link>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No resumes uploaded yet</p>
              <Link
                to="/resume-upload"
                className="btn btn-primary"
              >
                Upload Your First Resume
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {resumes.slice(0, 5).map((resume) => (
                <div key={resume.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(resume.status)}
                    <div>
                      <p className="font-medium text-gray-900">{resume.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(resume.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(resume.status)}`}>
                      {resume.status}
                    </span>
                    {resume.status === 'completed' && (
                      <Link
                        to={`/career-recommendations`}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      >
                        View Analysis
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="space-y-4">
            <Link
              to="/resume-upload"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-8 w-8 text-primary-600 mr-4" />
              <div>
                <p className="font-medium text-gray-900">Upload Resume</p>
                <p className="text-sm text-gray-600">Add a new resume for analysis</p>
              </div>
            </Link>

            <Link
              to="/career-recommendations"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="font-medium text-gray-900">Career Recommendations</p>
                <p className="text-sm text-gray-600">Explore career paths based on your skills</p>
              </div>
            </Link>

            <Link
              to="/skill-gap-analysis"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <p className="font-medium text-gray-900">Skill Gap Analysis</p>
                <p className="text-sm text-gray-600">Identify skills to develop</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
