import { apiSlice } from "./apiSlice"; // Import from the same folder

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    verifyUser: builder.query({
      query: () => ({ url: "/api/auth/verify", method: "GET" }),
      providesTags: ["User"],
    }),

    loginUser: builder.mutation({
      query: (credentials) => ({
        url: "/api/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),

    logoutUser: builder.mutation({
      query: () => ({ url: "/api/auth/logout", method: "GET" }),
      invalidatesTags: ["User", "Draft"],
    }),

    sendOtp: builder.mutation({
      query: (data) => ({
        url: "/api/auth/send-otp",
        method: "POST",
        body: data,
      }),
    }),

    verifyOtp: builder.mutation({
      query: (data) => ({
        url: "/api/auth/verify-otp",
        method: "POST",
        body: data,
      }),
    }),

    forgotPassword: builder.mutation({
      query: (email) => ({
        url: "/api/auth/forgot-password",
        method: "POST",
        body: { email },
      }),
    }),

    resetPassword: builder.mutation({
      query: ({ token, password }) => ({
        url: `/api/auth/reset-password/${token}`,
        method: "PUT",
        body: { password },
      }),
    }),
  }),
});

export const {
  useVerifyUserQuery,
  useLoginUserMutation,
  useLogoutUserMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
