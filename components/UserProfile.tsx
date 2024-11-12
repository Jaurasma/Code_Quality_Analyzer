// components/UserProfile.tsx
import { useSession } from "next-auth/react";

const UserProfile = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <p>You are not signed in.</p>;
  }

  return (
    <div>
      <p>Signed in as {session.user?.email}</p>
      <img src={session.user?.image || ""} alt="User Avatar" />
    </div>
  );
};

export default UserProfile;
