import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import {
  setIsGenerating,
  setIsFetchLicenseReport,
  setIsFetchBlockDiagramReport,
  setIsFetchFlowDiagramReport,
  setIsBasicProvisionalGenerating,
  setIsBroadProvisionalGenerating,
  setIsTechnicalProvisionalGenerating,
  setIsBasicNonProvisionalGenerating,
  setIsBroadNonProvisionalGenerating,
  setIsTechnicalNonProvisionalGenerating,
} from "./patentSlice";

import { patentApi } from "./patentApi";
import {
  getPendingDrafts,
  removePendingDraft,
} from "../../utils/draftqueueHelper";

export const socket = io(
  import.meta.env.VITE_API_URL || "http://localhost:5000",
  {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: true,
  },
);

export const usePatentSocket = (roomId) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;
    if (!socket.connected) socket.connect();

    // --- HANDLE ALL DRAFT GENERATIONS ---
    const handleGenerationFinished = (data) => {
      // 1. Turn off ALL loading states immediately
      dispatch(setIsGenerating(false));
      dispatch(setIsBasicProvisionalGenerating(false));
      dispatch(setIsBroadProvisionalGenerating(false));
      dispatch(setIsTechnicalProvisionalGenerating(false));
      dispatch(setIsBasicNonProvisionalGenerating(false));
      dispatch(setIsBroadNonProvisionalGenerating(false));
      dispatch(setIsTechnicalNonProvisionalGenerating(false));

      // 2. Handle Errors
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (!roomId) return;

      // 3. Handle Success
      if (String(data.draftId) === String(roomId)) {
        const drafts = getPendingDrafts();
        removePendingDraft(data.draftId);

        dispatch(
          patentApi.util.invalidateTags([{ type: "Draft", id: roomId }]),
        );

        if (drafts[data.draftId]) {
          navigate(`/preview/${roomId}`);
        } else {
          navigate(`/draft/${roomId}`);
        }
      }
    };

    // --- HANDLE ADD-ON COMPLETIONS ---
    const handleAddonFinished = (data) => {
      if (data?.error) {
        toast.error(data.error);
      }

      if (roomId && String(data.draftId) === String(roomId)) {
        // Invalidate Cache so Diagram/Licensee tab instantly updates with new data
        dispatch(
          patentApi.util.invalidateTags([{ type: "Draft", id: roomId }]),
        );

        // Turn off all specific add-on loading states
        dispatch(setIsFetchLicenseReport(false));
        dispatch(setIsFetchBlockDiagramReport(false));
        dispatch(setIsFetchFlowDiagramReport(false));
      }
    };

    if (roomId) {
      socket.emit("join-patent-room", roomId);
    }

    // Basic Drafts
    socket.on("generation-finished", handleGenerationFinished);
    socket.on("non-provisional-generation-finished", handleGenerationFinished);
    socket.on("normal-search-generation-finished", handleGenerationFinished);

    // Broad Drafts
    socket.on("broad-generation-finished", handleGenerationFinished);
    socket.on(
      "non-provisional-broad-generation-finished",
      handleGenerationFinished,
    );

    // Technical Drafts
    socket.on("technical-generation-finished", handleGenerationFinished);
    socket.on(
      "non-provisional-technical-generation-finished",
      handleGenerationFinished,
    );

    // Add-ons
    socket.on("diagram-generation-finished", handleAddonFinished);
    socket.on("license-generation-finished", handleAddonFinished);
    socket.on("deep-search-generation-finished", handleAddonFinished);

    // Cleanup listeners
    return () => {
      socket.off("generation-finished", handleGenerationFinished);
      socket.off(
        "non-provisional-generation-finished",
        handleGenerationFinished,
      );
      socket.off("normal-search-generation-finished", handleGenerationFinished);

      socket.off("broad-generation-finished", handleGenerationFinished);
      socket.off(
        "non-provisional-broad-generation-finished",
        handleGenerationFinished,
      );

      socket.off("technical-generation-finished", handleGenerationFinished);
      socket.off(
        "non-provisional-technical-generation-finished",
        handleGenerationFinished,
      );

      socket.off("diagram-generation-finished", handleAddonFinished);
      socket.off("license-generation-finished", handleAddonFinished);
      socket.off("deep-search-generation-finished", handleAddonFinished);
    };
  }, [roomId, dispatch, navigate]);
};
