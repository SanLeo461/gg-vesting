import Head from "next/head";
import Link from "next/link";
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useRouter } from "next/router";
import { useRouterUserAddress } from "~/hooks/useRouterUserAddress";

import { api } from "~/utils/api";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useBlockNumber, useEnsResolver } from "wagmi";
import { normalize } from "viem/ens";
import { isAddress } from "viem";
import { HomeInputs } from "~/components/HomeInputs";
import { Layout } from "~/components/Layout";

export default function Index() {
  return (
    <Layout>
      <HomeInputs />
    </Layout>
  );
}
