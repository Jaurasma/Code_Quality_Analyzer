// pages/api/protected-route.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Proceed with your logic using session.accessToken
  res.status(200).json({ message: "You are authenticated!" });
}
