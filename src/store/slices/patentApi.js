import { apiSlice } from "./apiSlice";

export const patentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // --- QUERIES (Fetching Data) ---
    getUserDrafts: builder.query({
      query: () => ({ url: "/api/patents/user/all", method: "GET" }),
      providesTags: ["Draft"],
    }),

    getDraftById: builder.query({
      query: (id) => ({ url: `/api/patents/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: "Draft", id }],
    }),

    // --- MUTATIONS (Modifying Data / Triggering Actions) ---
    generateDraft: builder.mutation({
      query: (formData) => ({
        url: "/api/patents/generate",
        method: "POST",
        body: formData, // RTK handles FormData automatically via 'body'
      }),
      invalidatesTags: ["Draft"],
    }),

    regenerateDraft: builder.mutation({
      query: ({ id, draftType, type }) => ({
        url: `/api/patents/draft/regenerate/${id}`,
        method: "PUT",
        body: { draftType, type },
      }),
    }),

    updateSection: builder.mutation({
      query: ({ id, sectionKey, content, draftType, type }) => ({
        url: `/api/patents/${id}/section`,
        method: "PUT",
        body: { sectionKey, content, draftType, type },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Draft", id }],
    }),

    saveUsptoForm: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/patents/${id}/uspto-form`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Draft", id }],
    }),

    saveNda: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/patents/${id}/nda`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Draft", id }],
    }),

    generateLicensees: builder.mutation({
      query: (id) => ({
        url: `/api/patents/${id}/licensees/generate`,
        method: "POST",
      }),
    }),

    generateDiagrams: builder.mutation({
      query: ({ id, activeType }) => ({
        url: `/api/patents/${id}/diagrams/generate`,
        method: "POST",
        body: { type: activeType },
      }),
    }),

    requestReview: builder.mutation({
      query: ({ id, message }) => ({
        url: `/api/patents/${id}/request-review`,
        method: "POST",
        body: { message },
      }),
    }),

    translateArray: builder.mutation({
      query: (data) => ({
        url: "/api/patents/translate-array",
        method: "POST",
        body: data,
      }),
    }),

    translateDocument: builder.mutation({
      query: ({ id, targetLanguage }) => ({
        url: `/api/patents/${id}/translate`,
        method: "POST",
        body: { targetLanguage },
        responseHandler: (response) => response.blob(), // REQUIRED FOR BLOB
      }),
    }),

    generateNormalSearch: builder.mutation({
      query: (id) => ({
        url: `/api/patents/${id}/normal_search/generate`,
        method: "POST",
      }),
    }),

    generateDeepSearch: builder.mutation({
      query: (id) => ({
        url: `/api/patents/${id}/deep_search/generate`,
        method: "POST",
      }),
    }),

    // --- BLOB DOWNLOADS ---
    downloadLicenseeReport: builder.mutation({
      query: (id) => ({
        url: `/api/patents/${id}/licensees/download`,
        method: "POST",
        responseHandler: (response) => response.blob(),
      }),
    }),

    downloadPatentPdf: builder.mutation({
      query: ({ id, type }) => ({
        url: `/api/patents/${id}/export/pdf/${type}`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),

    downloadPatentDocx: builder.mutation({
      query: ({ id, type }) => ({
        url: `/api/patents/${id}/export/docx/${type}`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGetUserDraftsQuery,
  useGetDraftByIdQuery,
  useGenerateDraftMutation,
  useRegenerateDraftMutation,
  useUpdateSectionMutation,
  useSaveUsptoFormMutation,
  useSaveNdaMutation,
  useGenerateLicenseesMutation,
  useGenerateDiagramsMutation,
  useRequestReviewMutation,
  useTranslateArrayMutation,
  useTranslateDocumentMutation,
  useGenerateNormalSearchMutation,
  useGenerateDeepSearchMutation,
  useDownloadLicenseeReportMutation,
  useDownloadPatentPdfMutation,
  useDownloadPatentDocxMutation,
} = patentApi;
