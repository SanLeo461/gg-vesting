import { ConnectButton } from "@rainbow-me/rainbowkit";
import Head from "next/head";

type LayoutProps = {
  children: React.ReactNode
};

export const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <Head>
        <title>GG Vesting Dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-row w-full justify-end items-center bg-slate-600 pt-4 pr-4">
        <ConnectButton />
      </div>
      <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-slate-600 gap-4 font-ubuntu">
        {children}
      </main>
    </>
  )
};
