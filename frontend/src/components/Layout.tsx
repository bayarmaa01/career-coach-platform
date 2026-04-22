import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { User, LogOut, Home, FileText, TrendingUp, BarChart3, Settings, MessageSquare, Sparkles, Target } from 'lucide-react';

const Layout: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">AI Career Coach</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/resume-upload"
                className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                <FileText className="h-4 w-4" />
                <span>Resume</span>
              </Link>
              <Link
                to="/career-recommendations"
                className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Career Paths</span>
              </Link>
              <Link
                to="/skill-gap-analysis"
                className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Skill Analysis</span>
              </Link>
              <Link
                to="/create-cv"
                className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Sparkles className="h-4 w-4" />
                <span>Create CV</span>
              </Link>
              <Link
                to="/career-chat"
                className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                <MessageSquare className="h-4 w-4" />
                <span>AI Chat</span>
              </Link>
              <Link
                to="/skill-recommendations"
                className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Target className="h-4 w-4" />
                <span>Recommendations</span>
              </Link>
              
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
              
              <div className="flex items-center space-x-2 border-l pl-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
