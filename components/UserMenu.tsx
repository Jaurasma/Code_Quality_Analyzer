// components/UserMenu.tsx
"use client";

import Image from "next/image";
import SignInButton from "./SignInButton";
import SignOutButton from "./SignOutButton";
import { useSession } from "next-auth/react";

const UserMenu = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (!session) {
    return <SignInButton />;
  }

  return (
    <div className="flex items-center space-x-3">
      {session.user?.image && (
        <Image
          src={session.user.image}
          alt={`${session.user.name}'s Avatar`}
          width={32}
          height={32}
          className="rounded-full w-8 h-8 sm:w-10 sm:h-10"
        />
      )}
      <div className="text-right">
        <p className="text-xs text-gray-500">Signed in as</p>
        <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
          {session.user?.name}
        </p>
      </div>
      <SignOutButton />
    </div>
  );
};

export default UserMenu;
