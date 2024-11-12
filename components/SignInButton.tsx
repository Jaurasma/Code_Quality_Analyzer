// components/SignInButton.tsx
import { signIn } from "next-auth/react";

const SignInButton = () => (
  <button onClick={() => signIn("github")} className="btn">
    Sign in with GitHub
  </button>
);

export default SignInButton;
