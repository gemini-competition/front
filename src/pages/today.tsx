import { useAuth } from "@/hooks/auth";
import Folder from "../components/folder";
import Loading from "@/components/loading";
import { useSessions, Session } from "@/hooks/sessions";
import { SessionCard } from "./session-card";
import { FocusDialog } from "./focus-dialog";
import { Character } from "@/components/character";
import { useQuery } from "@tanstack/react-query";

export default function Today() {
  const { data: auth } = useAuth();
  const { isLoading, todaysSessions } = useSessions();

  return (
    <>
      <div className="flex min-h-1 grow flex-row gap-8 px-6">
        <div className="w-full grow">
          <Folder
            title={
              <div
                style={{
                  backgroundImage: "url(/word-border.png)",
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
                className="absolute bottom-[30%] left-[50%] z-20 w-fit min-w-[200px] -translate-x-1/2 -translate-y-1/2 px-8 py-4 text-center"
              >
                <span className="text-2xl font-bold">{auth?.nickname}</span>
                {" / "}
                <span>Lv{auth?.level ?? 0}</span>
              </div>
            }
            insert={
              <div className="absolute left-[50%] top-[30%] -translate-x-1/2 -translate-y-1/2">
                <Character className="aspect-auto w-60" />
              </div>
            }
          />
          <TotalFocusTime />
        </div>
        <div className="flex w-full grow flex-col gap-6 overflow-y-scroll">
          {isLoading ? (
            <Loading />
          ) : (
            todaysSessions?.map((session) => {
              if (session.focusStatus === "FOCUSING") return null;

              return <SessionCard key={session.id} session={session} />;
            })
          )}
        </div>
      </div>
      <FocusDialog />
    </>
  );
}

export function Time({ session }: { session: Session }) {
  const fromTo =
    new Date(session.createdDateTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }) +
    " ~ " +
    new Date(session.lastModifiedDateTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const timeDiff =
    new Date(session.lastModifiedDateTime).getTime() -
    new Date(session.createdDateTime).getTime();

  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  let Duration = () => <></>;

  if (session.focusStatus === "SUCCEED") {
    Duration = () => (
      <span className="text-green-500">
        {" (Focused for "}
        {hours}h {minutes}m{")"}
      </span>
    );
  }

  if (session.focusStatus === "FAILED") {
    Duration = () => (
      <span className="text-neutral-500">
        {" (Focused for "}
        {hours}h {minutes}m{" but got distracted)"}
      </span>
    );
  }

  return (
    <>
      {fromTo} <Duration />
    </>
  );
}

function TotalFocusTime() {
  const { data: auth } = useAuth();
  const { data, isLoading } = useQuery<{
    hours: number;
    minutes: number;
  }>({
    queryKey: ["totalFocusTime"],
    queryFn: async () => {
      const response = await fetch(
        `/api/focus/today-time?socialId=${auth?.socialId}`,
      );
      return response.json();
    },
  });
  if (isLoading) return null;
  return (
    <div className="absolute bottom-10 left-24 flex items-end justify-center gap-4 font-semibold">
      <span className="">TOTAL FOCUS TIME</span>
      <span className="text-4xl">
        {data?.hours} h {data?.minutes} m
      </span>
    </div>
  );
}
