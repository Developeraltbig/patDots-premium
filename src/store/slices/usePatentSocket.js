import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { setIsGenerating } from "./patentSlice";
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

    const handleGenerationFinished = (data) => {
      if (data?.error) {
        dispatch(setIsGenerating(false));
        toast.error(data.error);
        return;
      }

      if (!roomId) {
        dispatch(setIsGenerating(false));
        return;
      }

      if (String(data.draftId) === String(roomId)) {
        const drafts = getPendingDrafts();

        dispatch(
          patentApi.util.invalidateTags([{ type: "Draft", id: roomId }]),
        );

        dispatch(setIsGenerating(false));

        // FIX: If it is a newly generated draft, it will be in pendingDrafts.
        // New drafts MUST go to the preview page to trigger the paywall checkout.
        // If it's NOT in pending drafts, it's a regeneration from inside the dashboard.
        if (drafts[data.draftId]) {
          removePendingDraft(data.draftId);
          navigate(`/preview/${roomId}`);
        } else {
          navigate(`/draft/${roomId}`);
        }
      }
    };

    if (roomId) {
      socket.emit("join-patent-room", roomId);
    }

    socket.on("generation-finished", handleGenerationFinished);
    socket.on("non-provisional-generation-finished", handleGenerationFinished);
    socket.on("normal-search-generation-finished", handleGenerationFinished);

    return () => {
      socket.off("generation-finished", handleGenerationFinished);
      socket.off(
        "non-provisional-generation-finished",
        handleGenerationFinished,
      );
      socket.off("normal-search-generation-finished", handleGenerationFinished);
    };
  }, [roomId, dispatch, navigate]);
};
