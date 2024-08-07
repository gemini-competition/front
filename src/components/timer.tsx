import { cn } from "@/lib/utils";
import { queryClient } from "@/main";
import { useMutation } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/auth";
import { useBannedSites } from "../hooks/banned-sites";
import { useSessions } from "@/hooks/sessions";

/**
 *  "socialId": "116618166312500650927",
    "duration": {
        "hours": 2,
        "minutes": 30
    },
    "banedSites": [
    "YouTube", "WhatsApp"
    ],
    "task": "개발 1시간, 피그마 1시간 30분"
 */

type SessionStart = {
  socialId: string;
  duration: {
    hours: number;
    minutes: number;
  };
  bannedSites: string[];
  task: string;
};

export default function Timer() {
  const [time, setTime] = useState({
    hours: 0,
    minutes: 15,
  });
  const [task, setTask] = useState("");
  const { data } = useAuth();

  const bannedSites = useBannedSites((state) =>
    Object.entries(state.bannedSites)
      .filter((v) => v[1])
      .map((v) => v[0]),
  );

  const { isLoading: isSessionLoading, isFocusing } = useSessions();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await fetch("/api/focus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          socialId: data?.socialId,
          duration: time,
          task: task,
          bannedSites: bannedSites,
        } as SessionStart),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });

  function handleClick() {
    if (time.hours === 0) {
      if (time.minutes < 15) {
        alert("Minimum focus time is 15 minutes!");
        return;
      }
    }
    if (time.hours >= 5) {
      alert("Maximum focus time is 5 hours!");
      return;
    }
    if (time.minutes >= 60) {
      alert("Minutes should be less than or equal to 60");
    }
    mutate();
  }

  return (
    <div className="flex items-center justify-center gap-6 px-6">
      <div className="flex w-fit flex-shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-neutral-900 bg-neutral-50 px-4 py-2">
        <span className="flex-shrink-0">Set Duration:</span>
        <input
          className="w-14 rounded-lg border border-neutral-400 px-2 py-1"
          id="hour"
          type="number"
          placeholder="0"
          min="0"
          max="4"
          value={time.hours}
          onChange={(e) => {
            if (isFocusing) return;
            setTime((prev) => ({ ...prev, hours: Number(e.target.value) }));
          }}
        />
        <label htmlFor="hour">h</label>
        <input
          className="w-14 rounded-lg border border-neutral-400 px-2 py-1"
          id="minutes"
          type="number"
          placeholder="15"
          min="0"
          max="59"
          step="5"
          value={time.minutes}
          onChange={(e) => {
            if (isFocusing) return;
            setTime((prev) => ({ ...prev, minutes: Number(e.target.value) }));
          }}
        />
        <label htmlFor="minutes">m</label>
      </div>
      <div className="flex w-fit grow items-center gap-2 rounded-lg border-2 border-neutral-900 bg-neutral-50 px-4 py-2">
        <input
          className="w-full rounded-lg border border-neutral-400 px-2 py-1"
          id="task"
          type="text"
          placeholder="What is your task for this session? (optional)"
          onChange={(e) => {
            if (isFocusing) return;
            setTask(e.target.value);
          }}
        />
      </div>
      <button
        className={cn(
          "flex w-[180px] items-center justify-center gap-4 rounded-lg bg-neutral-900 px-6 py-3 text-lg text-neutral-50",
          isPending && "cursor-not-allowed bg-neutral-600",
          isFocusing && "bg-red-500",
        )}
        onClick={handleClick}
        disabled={isPending || isSessionLoading}
      >
        <ButtonText isPending={isPending} sessionStarted={isFocusing} />
      </button>
    </div>
  );
}

function ButtonText({
  isPending,
  sessionStarted,
}: {
  isPending: boolean;
  sessionStarted: boolean;
}) {
  if (isPending) {
    return (
      <>
        Starting...
        <LoaderCircle className="animate-spin" />
      </>
    );
  }

  if (sessionStarted) {
    return "Focusing...";
  }

  return "Focus Now!";
}
