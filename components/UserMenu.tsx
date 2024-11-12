// components/UserMenu.tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
const UserMenu = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("github")}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
      >
        Sign in with GitHub
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {session.user?.image && (
        <img
          src={session.user.image}
          alt="User Avatar"
          className="w-8 h-8 rounded-full"
        />
      )}
      <div className="text-right">
        <p className="text-xs text-gray-500">Signed in as</p>
        <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
          {session.user?.name}
        </p>
      </div>
      <button
        onClick={() => signOut()}
        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-xs"
      >
        Sign Out
      </button>
    </div>
  );
};

export default UserMenu;
