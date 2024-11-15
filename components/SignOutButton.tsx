// components/SignOutButton.tsx
import { signOut } from "next-auth/react";

const SignOutButton = () => (
  <button
    onClick={() => signOut()}
    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-xs"
  >
    Sign Out
  </button>
);

export default SignOutButton;
