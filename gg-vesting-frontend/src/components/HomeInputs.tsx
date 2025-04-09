import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { isAddress } from "viem";
import { useRouterUserAddress } from "~/hooks/useRouterUserAddress";
import { api } from "~/utils/api";

export const HomeInputs = () => {
  const router = useRouter();
  const userRouterAddress = useRouterUserAddress();
  const [input, setInput] = useState("");
  const utils = api.useUtils();
  
  useEffect(() => {
    setInput(userRouterAddress);
  }, [router.isReady])

  return (
    <>
      <div className="flex flex-row gap-2 font-bold text-3xl text-gray-300 justify-center w-full items-center h-[10%]">
        <div>ggvesting.sanleo.dev</div>
        <div className="text-lg"></div>
      </div>
      <div className="flex flex-row gap-2 justify-center text-white w-full h-max">
        <input className="p-4 text-lg w-[80%] md:w-[60%] lg:w-[40%] xl:w-[25%] text-black text-center bg-white rounded-lg" placeholder="Address" value={input} onChange={e => setInput(e.target.value)}/>
        <Link href={`/user/[address]`} as={`/user/${input}`} onClick={e => {
          if (!isAddress(input, { strict: false })) {
            e.preventDefault();
          }
          utils.invalidate();
        }}>
          <button className="p-4 text-2xl text-white bg-slate-900 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-75" disabled={!isAddress(input, { strict: false })}>Search</button>
        </Link>
      </div>
    </>
  )
}