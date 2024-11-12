// components/SignOutButton.tsx
import { signOut } from "next-auth/react";

const SignOutButton = () => (
  <button onClick={() => signOut()} className="btn">
    Sign Out
  </button>
);

export default SignOutButton;
