import { createSlice } from "@reduxjs/toolkit";

// The initial state of our authentication
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Action to run when the user logs in successfully
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
    },
    // Action to run when the user logs out
    logOut: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;

export default authSlice.reducer;
