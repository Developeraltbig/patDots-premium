const STORAGE_KEY = "pendingDrafts";

export const getPendingDrafts = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
};

export const setPendingDrafts = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const addPendingDraft = (draftId) => {
  const drafts = getPendingDrafts();
  drafts[draftId] = { status: "pending", createdAt: Date.now() };
  setPendingDrafts(drafts);
};

export const removePendingDraft = (draftId) => {
  const drafts = getPendingDrafts();
  delete drafts[draftId];
  setPendingDrafts(drafts);
};
