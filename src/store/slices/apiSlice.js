import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "./authSlice";

// 1. Create native fetchBaseQuery
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

// 2. Custom wrapper to handle credentials and 401 Unauthorized globally
const customBaseQuery = async (args, api, extraOptions) => {
  const fetchArgs =
    typeof args === "string"
      ? { url: args, credentials: "include" }
      : { ...args, credentials: "include" };

  let result = await baseQuery(fetchArgs, api, extraOptions);

  // Handle Unauthorized / Session Expiry
  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
    localStorage.removeItem("persist:root");
    window.location.href = "/login";
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: customBaseQuery,
  tagTypes: ["User", "Draft", "Payment"],
  endpoints: () => ({}),
});
