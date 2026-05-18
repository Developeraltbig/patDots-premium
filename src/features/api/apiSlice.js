import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    prepareHeaders: (headers, { getState }) => {
      // We will attach JWT token here later if needed (e.g., from cookies/state)
      return headers;
    },
  }),
  tagTypes: ["Draft", "User", "Payment"], // For automated caching & invalidation
  endpoints: (builder) => ({}), // We will inject endpoints in separate files
});
