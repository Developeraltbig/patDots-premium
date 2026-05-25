import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../axios";
import { toast } from "react-toastify";

// --- Async Thunks ---
export const fetchAllDraft = createAsyncThunk(
  "patent/user/all",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/patents/user/all`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchDraft = createAsyncThunk(
  "patent/fetchDraft",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/patents/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const generateDraftAction = createAsyncThunk(
  "patent/generateDraft",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post("/api/patents/generate", formData);
      return response.data; // { draftId, sections, success }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// --- Slice ---
const patentSlice = createSlice({
  name: "patent",
  initialState: {
    currentDraft: null,
    isGenerating: false,
    isFetching: false,
    isAllFetching: false,
    drafts: [],
    draftsLoading: true,
    error: null,
  },
  reducers: {
    setIsGenerating: (state, action) => {
      state.isGenerating = action.payload;
    },
    updateDraftFromSocket: (state, action) => {
      const { type, ...payload } = action.payload;
      if (!state.currentDraft) return;

      // Can be expanded to handle diagram/license updates via socket
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate Draft
      .addCase(generateDraftAction.pending, (state) => {
        state.isGenerating = true;
      })
      .addCase(generateDraftAction.fulfilled, (state, action) => {
        state.currentDraft = action.payload;
        // isGenerating stays true because socket handles the final completion
      })
      .addCase(generateDraftAction.rejected, (state, action) => {
        toast.error(action.payload);
        state.isGenerating = false;
      })
      // Fetch Single Draft
      .addCase(fetchDraft.pending, (state) => {
        state.isFetching = true;
        state.error = null;
      })
      .addCase(fetchDraft.fulfilled, (state, action) => {
        state.currentDraft = action.payload;
        state.isFetching = false;
      })
      .addCase(fetchDraft.rejected, (state, action) => {
        state.isFetching = false;
        state.error = action.payload;
      })
      // Fetch All Drafts
      .addCase(fetchAllDraft.pending, (state) => {
        state.isAllFetching = true;
        state.draftsLoading = true;
      })
      .addCase(fetchAllDraft.fulfilled, (state, action) => {
        state.drafts = action.payload?.patents || [];
        state.isAllFetching = false;
        state.draftsLoading = false;
      })
      .addCase(fetchAllDraft.rejected, (state, action) => {
        state.isAllFetching = false;
        state.draftsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setIsGenerating, updateDraftFromSocket } = patentSlice.actions;
export default patentSlice.reducer;
