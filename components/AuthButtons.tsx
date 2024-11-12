// components/AuthButtons.tsx
import { useSession } from "next-auth/react";
import SignInButton from "./SignInButton";
import SignOutButton from "./SignOutButton";

const AuthButtons = () => {
  const { data: session, status } = useSession();
  console.log("session & status ", session, status);
  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return session ? <SignOutButton /> : <SignInButton />;
};

export default AuthButtons;
