import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
    },
    logOut: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;

export default authSlice.reducer;
