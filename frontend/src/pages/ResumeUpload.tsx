import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import { RootState, AppDispatch } from '../store/store';
import { uploadResume, setUploadProgress } from '../store/slices/resumeSlice';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';

const ResumeUpload: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, uploadProgress } = useSelector((state: RootState) => state.resume);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (uploadedFile) {
      try {
        await dispatch(uploadResume(uploadedFile)).unwrap();
        setUploadedFile(null);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Resume</h1>
        <p className="mt-2 text-gray-600">
          Upload your resume to get AI-powered career recommendations and skill analysis
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="card">
          {!uploadedFile ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop your resume here' : 'Drag and drop your resume here'}
              </p>
              <p className="text-sm text-gray-600 mb-4">or</p>
              <button className="btn btn-primary">Browse Files</button>
              <p className="text-xs text-gray-500 mt-4">
                Supported formats: PDF, DOC, DOCX, TXT (Max size: 10MB)
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={isLoading}
                className="w-full btn btn-primary disabled:opacity-50"
              >
                {isLoading ? 'Uploading...' : 'Upload Resume'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What happens next?</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                  1
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">AI Analysis</p>
                <p className="text-sm text-gray-600">
                  Our AI analyzes your resume to extract skills, experience, and qualifications
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                  2
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Career Recommendations</p>
                <p className="text-sm text-gray-600">
                  Get personalized career path suggestions based on your profile
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                  3
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Skill Gap Analysis</p>
                <p className="text-sm text-gray-600">
                  Identify skills to develop and get course recommendations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;
