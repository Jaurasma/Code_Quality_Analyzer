// app/layout.tsx
"use client"; // Important to indicate this is a client component

import "../styles/globals.css";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
