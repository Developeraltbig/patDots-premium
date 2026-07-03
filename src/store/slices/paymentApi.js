import { apiSlice } from "./apiSlice"; // Import from the same folder

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (data) => ({
        url: "/api/payments/create-order",
        method: "POST",
        body: data,
      }),
    }),

    verifyPayment: builder.mutation({
      query: (data) => ({
        url: "/api/payments/verify-payment",
        method: "POST",
        body: data,
      }),
      // Invalidating tags here forces RTK Query to refetch the user and draft data
      // so the UI immediately reflects the "Paid" status and unlocks features.
      invalidatesTags: ["Draft", "User"],
    }),
  }),
});

export const { useCreateOrderMutation, useVerifyPaymentMutation } = paymentApi;
