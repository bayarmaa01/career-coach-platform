/**
 * Create CV Page - AI-powered CV builder (Tailwind CSS version)
 * Step-by-step wizard for generating professional CVs
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface CVData {
  name: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    description: string;
    start_date: string;
    end_date: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    start_date: string;
    end_date: string;
  }>;
  interests: string[];
  target_role: string;
}

const CreateCVPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCV, setGeneratedCV] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  const [cvData, setCVData] = useState<CVData>({
    name: '',
    skills: [],
    experience: [],
    education: [],
    interests: [],
    target_role: '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  const steps = [
    { title: 'Personal Info', description: 'Basic information' },
    { title: 'Skills', description: 'Your technical and soft skills' },
    { title: 'Experience', description: 'Work experience' },
    { title: 'Education', description: 'Educational background' },
    { title: 'Interests', description: 'Professional interests' },
    { title: 'Generate', description: 'Create your CV' },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const addSkill = () => {
    if (skillInput.trim() && !cvData.skills.includes(skillInput.trim())) {
      setCVData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setCVData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addInterest = () => {
    if (interestInput.trim() && !cvData.interests.includes(interestInput.trim())) {
      setCVData(prev => ({
        ...prev,
        interests: [...prev.interests, interestInput.trim()]
      }));
      setInterestInput('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setCVData(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }));
  };

  const addExperience = () => {
    setCVData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        title: '',
        company: '',
        description: '',
        start_date: '',
        end_date: '',
      }]
    }));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    setCVData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (index: number) => {
    setCVData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setCVData(prev => ({
      ...prev,
      education: [...prev.education, {
        degree: '',
        institution: '',
        start_date: '',
        end_date: '',
      }]
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setCVData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setCVData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const generateCV = async () => {
    setIsGenerating(true);
    
    try {
      const response = await api.post('/api/ai/generate-cv', cvData);
      
      if (response.data.success) {
        setGeneratedCV(response.data);
        showToastMessage('CV Generated Successfully!', 'success');
        handleNext();
      } else {
        throw new Error(response.data.error || 'Failed to generate CV');
      }
    } catch (error: any) {
      showToastMessage(error.message || 'Failed to generate CV. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCV = (format: 'markdown' | 'text') => {
    if (!generatedCV) return;
    
    const content = format === 'markdown' ? generatedCV.markdown_cv : generatedCV.formatted_cv;
    const blob = new Blob([content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cvData.name.replace(/\s+/g, '_')}_CV.${format === 'markdown' ? 'md' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Info
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={cvData.name}
                onChange={(e) => setCVData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Role
              </label>
              <input
                type="text"
                value={cvData.target_role}
                onChange={(e) => setCVData(prev => ({ ...prev, target_role: e.target.value }))}
                placeholder="e.g., Software Engineer, Data Analyst"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 1: // Skills
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Skills
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Enter a skill"
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
            </div>
            
            <div className="flex flex-wrap gap-2">
              {cvData.skills.map((skill, index) => (
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
            
            {cvData.skills.length === 0 && (
              <p className="text-gray-500 italic">
                Add your technical and soft skills (e.g., JavaScript, Python, Communication)
              </p>
            )}
          </div>
        );

      case 2: // Experience
        return (
          <div className="space-y-4">
            <button
              onClick={addExperience}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Experience
            </button>
            
            {cvData.experience.map((exp, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        placeholder="e.g., Software Developer"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        placeholder="e.g., Tech Corp"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      placeholder="Describe your responsibilities and achievements"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="month"
                        value={exp.start_date}
                        onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="month"
                        value={exp.end_date}
                        onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeExperience(index)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            
            {cvData.experience.length === 0 && (
              <p className="text-gray-500 italic">
                Add your work experience, including internships and volunteer work
              </p>
            )}
          </div>
        );

      case 3: // Education
        return (
          <div className="space-y-4">
            <button
              onClick={addEducation}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Education
            </button>
            
            {cvData.education.map((edu, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Degree
                      </label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        placeholder="e.g., Bachelor of Science in Computer Science"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institution
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                        placeholder="e.g., University Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="month"
                        value={edu.start_date}
                        onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="month"
                        value={edu.end_date}
                        onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeEducation(index)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            
            {cvData.education.length === 0 && (
              <p className="text-gray-500 italic">
                Add your educational background, including degrees and certifications
              </p>
            )}
          </div>
        );

      case 4: // Interests
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Professional Interests
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  placeholder="Enter an interest"
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
            </div>
            
            <div className="flex flex-wrap gap-2">
              {cvData.interests.map((interest, index) => (
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
            
            <p className="text-gray-500 italic">
              Add your professional interests (e.g., Machine Learning, Web Development, Data Science)
            </p>
          </div>
        );

      case 5: // Generate
        return (
          <div className="space-y-6">
            {isGenerating ? (
              <div className="text-center space-y-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p>Generating your professional CV...</p>
                <p className="text-sm text-gray-500">
                  This may take a few moments as our AI creates a tailored CV for you
                </p>
              </div>
            ) : generatedCV ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">Your CV has been generated successfully!</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Download Options</h3>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => downloadCV('markdown')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Download Markdown
                    </button>
                    <button
                      onClick={() => downloadCV('text')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Download Text
                    </button>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-md font-semibold mb-2">Preview</h4>
                    <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {generatedCV.formatted_cv?.substring(0, 1000)}
                        {generatedCV.formatted_cv?.length > 1000 && '...'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">
                    Ready to generate your CV! Click the button below to create your professional CV.
                  </p>
                </div>
                
                <button
                  onClick={generateCV}
                  disabled={!cvData.name || cvData.skills.length === 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Generate CV
                </button>
                
                {(!cvData.name || cvData.skills.length === 0) && (
                  <p className="text-red-500 text-sm">
                    Please fill in your name and add at least one skill before generating
                  </p>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="space-y-8">
          <h1 className="text-3xl font-bold text-center">
            Create Your Professional CV with AI
          </h1>
          
          {/* Stepper */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="ml-2">
                  <p className={`text-sm font-medium ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Content Card */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="p-6">
              <div className="space-y-6">
                {renderStepContent()}
                
                <div className="flex justify-between">
                  <button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {currentStep < steps.length - 1 && (
                    <button
                      onClick={handleNext}
                      disabled={
                        (currentStep === 0 && !cvData.name) ||
                        (currentStep === 1 && cvData.skills.length === 0)
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  )}
                  
                  {currentStep === steps.length - 1 && generatedCV && (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Go to Dashboard
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
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

export default CreateCVPage;
