import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Resume } from '../../types';
import { resumeService } from '../../services/resumeService';

interface ResumeState {
  resumes: Resume[];
  currentResume: Resume | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
}

const initialState: ResumeState = {
  resumes: [],
  currentResume: null,
  isLoading: false,
  error: null,
  uploadProgress: 0,
};

export const uploadResume = createAsyncThunk(
  'resume/upload',
  async (file: File, { rejectWithValue }) => {
    try {
      const response = await resumeService.uploadResume(file);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Upload failed');
    }
  }
);

export const getUserResumes = createAsyncThunk(
  'resume/getUserResumes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await resumeService.getUserResumes();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get resumes');
    }
  }
);

export const deleteResume = createAsyncThunk(
  'resume/deleteResume',
  async (resumeId: string, { rejectWithValue }) => {
    try {
      await resumeService.deleteResume(resumeId);
      return resumeId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete resume');
    }
  }
);

export const analyzeResume = createAsyncThunk(
  'resume/analyzeResume',
  async (resumeId: string, { rejectWithValue }) => {
    try {
      const response = await resumeService.analyzeResume(resumeId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Analysis failed');
    }
  }
);

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    setCurrentResume: (state, action: PayloadAction<Resume | null>) => {
      state.currentResume = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadResume.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resumes.push(action.payload);
        state.currentResume = action.payload;
        state.uploadProgress = 100;
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(getUserResumes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserResumes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resumes = action.payload;
      })
      .addCase(getUserResumes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteResume.fulfilled, (state, action) => {
        state.resumes = state.resumes.filter(resume => resume.id !== action.payload);
        if (state.currentResume?.id === action.payload) {
          state.currentResume = null;
        }
      })
      .addCase(analyzeResume.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(analyzeResume.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentResume) {
          state.currentResume.status = 'completed';
          state.currentResume.processedAt = new Date().toISOString();
        }
      })
      .addCase(analyzeResume.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        if (state.currentResume) {
          state.currentResume.status = 'failed';
        }
      });
  },
});

export const { clearError, setUploadProgress, setCurrentResume } = resumeSlice.actions;
export default resumeSlice.reducer;
