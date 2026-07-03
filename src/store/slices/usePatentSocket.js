import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Removed fetchDraft from here, we only need setIsGenerating
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
        removePendingDraft(data.draftId);

        // Instead of fetching manually, we invalidate the cache.
        dispatch(
          patentApi.util.invalidateTags([{ type: "Draft", id: roomId }]),
        );

        dispatch(setIsGenerating(false));

        // If it was stored locally, user is owner, go to dashboard. Else go to preview.
        if (drafts[data.draftId]) {
          navigate(`/draft/${roomId}`);
        } else {
          navigate(`/preview/${roomId}`);
        }
      }
    };

    if (roomId) {
      socket.emit("join-patent-room", roomId);
    }

    socket.on("generation-finished", handleGenerationFinished);
    socket.on("non-provisional-generation-finished", handleGenerationFinished);

    return () => {
      socket.off("generation-finished", handleGenerationFinished);
      socket.off(
        "non-provisional-generation-finished",
        handleGenerationFinished,
      );
    };
  }, [roomId, dispatch, navigate]);
};
