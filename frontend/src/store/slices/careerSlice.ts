import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CareerPath, SkillGap, Course, Recommendation, ResumeAnalysis } from '../../types';
import { careerService } from '../../services/careerService';

interface CareerState {
  careerPaths: CareerPath[];
  skillGaps: SkillGap[];
  courses: Course[];
  recommendations: Recommendation | null;
  resumeAnalysis: ResumeAnalysis | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CareerState = {
  careerPaths: [],
  skillGaps: [],
  courses: [],
  recommendations: null,
  resumeAnalysis: null,
  isLoading: false,
  error: null,
};

export const getCareerRecommendations = createAsyncThunk(
  'career/getRecommendations',
  async (resumeId: string, { rejectWithValue }) => {
    try {
      const response = await careerService.getCareerRecommendations(resumeId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get recommendations');
    }
  }
);

export const getSkillGapAnalysis = createAsyncThunk(
  'career/getSkillGapAnalysis',
  async (resumeId: string, { rejectWithValue }) => {
    try {
      const response = await careerService.getSkillGapAnalysis(resumeId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get skill gap analysis');
    }
  }
);

export const getCourseRecommendations = createAsyncThunk(
  'career/getCourseRecommendations',
  async (resumeId: string, { rejectWithValue }) => {
    try {
      const response = await careerService.getCourseRecommendations(resumeId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get course recommendations');
    }
  }
);

export const getResumeAnalysis = createAsyncThunk(
  'career/getResumeAnalysis',
  async (resumeId: string, { rejectWithValue }) => {
    try {
      const response = await careerService.getResumeAnalysis(resumeId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get resume analysis');
    }
  }
);

const careerSlice = createSlice({
  name: 'career',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearRecommendations: (state) => {
      state.recommendations = null;
      state.resumeAnalysis = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCareerRecommendations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCareerRecommendations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.careerPaths = action.payload;
      })
      .addCase(getCareerRecommendations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(getSkillGapAnalysis.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSkillGapAnalysis.fulfilled, (state, action) => {
        state.isLoading = false;
        state.skillGaps = action.payload;
      })
      .addCase(getSkillGapAnalysis.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(getCourseRecommendations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCourseRecommendations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload;
      })
      .addCase(getCourseRecommendations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(getResumeAnalysis.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getResumeAnalysis.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resumeAnalysis = action.payload;
        state.recommendations = action.payload.recommendations;
      })
      .addCase(getResumeAnalysis.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearRecommendations } = careerSlice.actions;
export default careerSlice.reducer;
