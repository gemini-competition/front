import { queryClient } from "@/app";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/auth";
import { Session, useSessions } from "@/hooks/sessions";
import { useVideo } from "@/hooks/video";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import {
  FC,
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";
import { ResultDialogContext } from "./result-dialog";
import { useTitle } from "@/hooks/title";

export const FocusDialogContext = createContext(
  {} as { open: boolean; setOpen: (open: boolean) => void },
);

export const FocusDialogProvider: FC<PropsWithChildren> = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <FocusDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </FocusDialogContext.Provider>
  );
};

export function FocusDialog() {
  const { open, setOpen } = useContext(FocusDialogContext);
  const { data: auth } = useAuth();
  const { isFocusing, lastSession, currentFocusId } = useSessions();
  const { setOpen: setResultOpen, setResult } = useContext(ResultDialogContext);

  const { fetchVideoStreamAsync } = useVideo({
    interval: 1000 * 60,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (result: "succeed" | "fail") => {
      if (!isFocusing) return;

      const res = await fetch(`/api/focus/${result}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          socialId: auth?.socialId,
          focusId: String(lastSession?.id),
          banedSiteAccessLog: [],
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to end session: " + (await res.text()));
      }
      return (await res.json()) as Session;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      setOpen(false);
      if (data?.focusStatus === "SUCCEED") {
        toast.success("Session ended successfully");
      } else if (data?.focusStatus === "FAILED") {
        toast.success("Session quitted successfully");
      } else {
        toast.error("Failed to end session");
      }
      if (data) {
        setResultOpen(true);
        setResult(data);

        window.postMessage({
          action: "openPopup",
          payload: JSON.stringify(data),
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (isFocusing) {
      setOpen(true);
    }
    return () => setOpen(false);
  }, [isFocusing, setOpen]);

  const [timeLeft, setTimeLeft] = useState(() =>
    calculateTimeLeft(lastSession),
  );

  useEffect(() => {
    if (!isFocusing) return;
    const ref = setInterval(() => {
      const res = calculateTimeLeft(lastSession);
      if (res.hours < 0) {
        mutate("succeed");
        clearInterval(ref);
        return;
      }
      setTimeLeft(() => {
        return res;
      });
    }, 1000);
    setTimeLeft(() => calculateTimeLeft(lastSession));
    return () => clearInterval(ref);
  }, [lastSession, currentFocusId, mutate, isFocusing]);

  function handleClick() {
    mutate("fail");
  }

  const timeEnded = timeLeft?.hours < 0;

  const timeLeftString = `${Math.abs(timeLeft?.hours + (timeEnded ? 1 : 0))} h ${Math.abs(
    timeLeft?.minutes,
  )} m`;

  useTitle(timeLeftString, isFocusing);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-fit">
        <div
          style={{
            backgroundImage: 'url("/dialog-frame.png")',
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            width: "800px",
            height: "603px",
          }}
        >
          <div className="absolute -right-[110px] bottom-[40px] -z-50 w-[160px]">
            <img
              src="/focus-monster.png"
              alt="focus monster"
              className="-z-50"
            />
          </div>
          <DialogTitle className="sr-only"></DialogTitle>
          <div className="mt-[100px] grid h-[300px] place-content-center justify-items-center gap-8">
            <div className="text-center text-2xl font-bold">
              {timeEnded ? "LEVEL UP NOW" : "UNTIL LEVEL UP"}
            </div>
            <title>
              {Math.abs(timeLeft?.hours + (timeEnded ? 1 : 0))} h{" "}
              {Math.abs(timeLeft?.minutes)} m
            </title>
            <div
              className={cn(
                "relative text-center text-9xl font-bold",
                timeLeft?.hours < 0 && "text-green-600",
              )}
            >
              {timeEnded ? (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 pt-4 text-center text-lg">
                  You are over by
                </div>
              ) : null}
              {Math.abs(timeLeft?.hours + (timeEnded ? 1 : 0))} h{" "}
              {Math.abs(timeLeft?.minutes)} m
            </div>
          </div>
          <div className="flex h-fit flex-row justify-center gap-4">
            <Button
              variant="secondary"
              onClick={handleClick}
              className={cn(
                "group flex w-fit gap-2 text-lg",
                !timeEnded && "bg-neutral-400",
              )}
              disabled={isPending}
            >
              {isPending ? <Loader className="animate-spin" /> : "Quit Session"}
            </Button>
            <Button
              variant="default"
              onClick={() => {
                fetchVideoStreamAsync();
              }}
              className="text-lg"
            >
              Change My Monitor
            </Button>
          </div>
          <div className="pt-3 text-center">
            <p>'Quit session' is considered a failure</p>
          </div>
          <div
            style={{
              backgroundImage: "url(/word-border.png)",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              width: "400px",
              height: "100px",
            }}
            className="absolute left-0 top-[200px] flex w-[400px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-[21px]"
          >
            <p>Aren't you focused right now?</p>
            <p>Hang in there a litte longer!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function calculateTimeLeft(lastSession?: Session) {
  if (lastSession) {
    const duration =
      lastSession.duration.hours * 60 * 60 * 1000 +
      lastSession.duration.minutes * 60 * 1000;
    const elapsedTime =
      new Date().getTime() -
      new Date(lastSession.createdDateTime).getTime() +
      new Date(lastSession.createdDateTime).getTimezoneOffset() * 60 * 1000;

    const timeDiff = duration - elapsedTime;

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.ceil((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes };
  }
  return { hours: 0, minutes: 0 };
}
