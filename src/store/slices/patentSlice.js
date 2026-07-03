import { createSlice } from "@reduxjs/toolkit";

const patentSlice = createSlice({
  name: "patent",
  initialState: {
    isGenerating: false,
    isFetchingLicenseReport: false,
    isFetchingFlowDiagramReport: false,
    isFetchingBlockDiagramReport: false,
    isBasicProvisionalGenerating: false,
    isBroadProvisionalGenerating: false,
    isTechnicalProvisionalGenerating: false,
    isBasicNonProvisionalGenerating: false,
    isBroadNonProvisionalGenerating: false,
    isTechnicalNonProvisionalGenerating: false,
  },
  reducers: {
    setIsGenerating: (state, action) => {
      state.isGenerating = action.payload;
    },
    setIsFetchLicenseReport: (state, action) => {
      state.isFetchingLicenseReport = action.payload;
    },
    setIsFetchFlowDiagramReport: (state, action) => {
      state.isFetchingFlowDiagramReport = action.payload;
    },
    setIsFetchBlockDiagramReport: (state, action) => {
      state.isFetchingBlockDiagramReport = action.payload;
    },
    setIsBasicProvisionalGenerating: (state, action) => {
      state.isBasicProvisionalGenerating = action.payload;
    },
    setIsBroadProvisionalGenerating: (state, action) => {
      state.isBroadProvisionalGenerating = action.payload;
    },
    setIsTechnicalProvisionalGenerating: (state, action) => {
      state.isTechnicalProvisionalGenerating = action.payload;
    },
    setIsBasicNonProvisionalGenerating: (state, action) => {
      state.isBasicNonProvisionalGenerating = action.payload;
    },
    setIsBroadNonProvisionalGenerating: (state, action) => {
      state.isBroadNonProvisionalGenerating = action.payload;
    },
    setIsTechnicalNonProvisionalGenerating: (state, action) => {
      state.isTechnicalNonProvisionalGenerating = action.payload;
    },
  },
});

export const {
  setIsGenerating,
  setIsFetchLicenseReport,
  setIsFetchFlowDiagramReport,
  setIsFetchBlockDiagramReport,
  setIsBasicProvisionalGenerating,
  setIsBroadProvisionalGenerating,
  setIsTechnicalProvisionalGenerating,
  setIsBasicNonProvisionalGenerating,
  setIsBroadNonProvisionalGenerating,
  setIsTechnicalNonProvisionalGenerating,
} = patentSlice.actions;

export default patentSlice.reducer;
