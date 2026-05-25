import { apiSlice } from "./apiSlice";

export const patentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserDrafts: builder.query({
      query: () => "/patents/user/all",
      providesTags: ["Draft"],
    }),
    getDraftById: builder.query({
      query: (id) => `/patents/${id}`,
      providesTags: (result, error, id) => [{ type: "Draft", id }],
    }),
    // We'll add mutations (updateSection, generateDiagram) here later
  }),
});

export const { useGetUserDraftsQuery, useGetDraftByIdQuery } = patentApi;
