import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { useSessions } from "./sessions";
import { useAuth } from "./auth";

export function useVideoStream() {
  const query = useQuery({
    queryKey: ["mediaStream"],
    queryFn: async () => {
      const stream = await startScreenCapture();
      if (!stream) {
        throw new Error("No video feed");
      }

      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      return {
        stream,
        video,
      };
    },
    enabled: false,
    retry: false,
  });

  return query;
}

async function handleStream(data: {
  stream: MediaStream;
  video: HTMLVideoElement;
  focusId: number;
  socialId: string;
}) {
  try {
    if (data.video.readyState < 2) {
      await new Promise((resolve) => {
        data.video.onloadedmetadata = () => resolve(true);
      });
    }

    const canvas = document.createElement("canvas");
    canvas.width = data.video.videoWidth;
    canvas.height = data.video.videoHeight;
    const ctx = canvas.getContext("2d");

    ctx?.drawImage(data.video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (blob) {
        sendBlobToServer(blob, data.focusId, data.socialId);
      }
    }, "image/png");
  } catch (e) {
    console.error("Failed to capture screen: " + e);
    toast.error("Failed to capture screen: " + e);
  }
}

export function useVideo({ interval = 1000 * 60 }: { interval?: number }) {
  const {
    refetch: fetchVideoStreamAsync,
    data: videoStream,
    isSuccess,
  } = useVideoStream();

  const { mutate } = useMutation({
    mutationKey: ["video"],
    mutationFn: handleStream,
    onError: (error) => {
      toast.error("Monitoring disabled");
      console.error("Monitoring disabled: " + error);
    },
  });
  const { currentFocusId } = useSessions();

  const { data: auth } = useAuth();

  useEffect(() => {
    if (isSuccess && videoStream && currentFocusId && auth?.socialId) {
      console.log("videoStream: " + videoStream);

      const ref = setInterval(() => {
        if (auth?.socialId) {
          mutate({
            stream: videoStream.stream,
            video: videoStream.video,
            focusId: currentFocusId,
            socialId: auth.socialId,
          });
        }
      }, interval);
      if (auth?.socialId) {
        mutate({
          stream: videoStream.stream,
          video: videoStream.video,
          focusId: currentFocusId,
          socialId: auth.socialId,
        });
      }
      return () => {
        videoStream.video.pause();
        videoStream.stream.getTracks().forEach((track) => {
          track.stop();
        });
        clearInterval(ref);
      };
    }
  }, [
    interval,
    isSuccess,
    videoStream,
    currentFocusId,
    mutate,
    auth?.socialId,
  ]);

  return {
    fetchVideoStreamAsync,
    videoStream,
  };
}

async function sendBlobToServer(blob: Blob, focusId: number, socialId: string) {
  const formData = new FormData();
  formData.append("file", blob);

  try {
    const req = await fetch(
      `/gemini/image?focusId=${focusId}&socialId=${socialId}`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!req.ok) {
      console.error("Failed to send screen capture: " + (await req.text()));
      toast.error("Failed to send screen capture: " + (await req.text()));
      return null;
    }

    const data = await req.json();
    if (data.error) {
      console.error("Failed to send screen capture: " + data.error);
      toast.error("Failed to send screen capture: " + data.error);
      return null;
    }

    return data;
  } catch (e) {
    console.error("Failed to send screen capture: " + e);
    toast.error("Failed to send screen capture: " + e);
  }
}

export async function startScreenCapture() {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
  });
  return stream;
}
