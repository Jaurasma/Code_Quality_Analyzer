// pages/_app.tsx
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import "../styles/globals.css";

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  console.log(session);
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
