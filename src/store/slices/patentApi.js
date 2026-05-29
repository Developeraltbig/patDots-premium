import { createApi } from "@reduxjs/toolkit/query/react";
import axiosInstance from "../axios";

const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: "" }) =>
  async ({ url, method, data, params, headers }) => {
    try {
      const result = await axiosInstance({
        url: baseUrl + url,
        method,
        data,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export const patentApi = createApi({
  reducerPath: "patentApi",
  baseQuery: axiosBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Draft"],
  endpoints: (builder) => ({
    getUserDrafts: builder.query({
      query: () => ({ url: "/patents/user/all", method: "GET" }),
      providesTags: ["Draft"],
    }),

    // 2. Fetch a specific draft by ID for the Dashboard editor
    getDraftById: builder.query({
      query: (id) => ({ url: `/patents/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: "Draft", id }],
    }),
  }),
});

export const { useGetUserDraftsQuery, useGetDraftByIdQuery } = patentApi;
