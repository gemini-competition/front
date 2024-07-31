import { useMutation } from "@tanstack/react-query";
import { Auth, useAuth } from "../hooks/auth";
import { queryClient } from "../main";

export function Header() {
  return (
    <header className="flex items-center justify-between p-6">
      <div className="flex items-center gap-3">
        <img src="logo.png" alt="focusmonster" />
      </div>
      <div>
        <AuthActions />
      </div>
    </header>
  );
}
function AuthActions() {
  const { data } = useAuth();
  const { mutate } = useMutation<Auth>({
    mutationKey: ["user"],
    mutationFn: async () => {
      return { session: null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  if (!data) {
    return (
      <div className="flex items-center gap-3">
        <LogIn />
        <button className="rounded-lg bg-gray-900 px-4 py-2 text-gray-50">
          Sign Up
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => mutate()}
      className="rounded-lg border-2 border-gray-900 bg-gray-50 px-4 py-2 text-gray-900"
    >
      Log Out
    </button>
  );
}
function LogIn() {
  return <button className="rounded-lg bg-gray-100 px-4 py-2">Log In</button>;
}
