import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../axios";

// --- Async Thunks ---
export const verifyUser = createAsyncThunk(
  "auth/verify",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/auth/verify");
      return res.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Session expired",
      );
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/auth/login", credentials);
      return res.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/auth/forgot-password", { email });
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error sending email",
      );
    }
  },
);

export const resetPasswordAction = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/auth/reset-password/${token}`, {
        password,
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Reset failed");
    }
  },
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await axios.get("/api/auth/logout");
  return null;
});

// --- Slice ---
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    logout: false,
    error: null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    setAuthUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      localStorage.removeItem("persist:root");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(verifyUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(verifyUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(logoutUser.pending, (state) => {
        state.logout = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.logout = false;
      });
  },
});

export const { setAuthUser, setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
