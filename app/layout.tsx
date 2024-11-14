// app/layout.tsx
import "../styles/globals.css";
import Providers from "./Providers"; // We'll create this component next
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
