import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Hash } from "viem";
import { useWaitForTransactionReceipt } from "wagmi";

export function useToastTransaction() {
  const [currentTx, setCurrentTx] = useState<{ hash: Hash, resolve: () => Promise<void>, reject: () => Promise<void> } | undefined>(undefined);
  const result = useWaitForTransactionReceipt(
    {
      hash: currentTx?.hash,
    }
  );
  useEffect(() => {
    if (result?.isSuccess) {
      currentTx?.resolve().catch(console.error);
    } else if (result?.isError) {
      currentTx?.reject().catch(console.error);
    }
  }, [result]);

  return {
    listen: (tx: Hash, refetch?: () => Promise<any>) => {
      const toastPromise = new Promise<void>((resolve, reject) => {
        setCurrentTx({ 
          hash: tx, 
          resolve: async () => {
            await refetch?.();
            setCurrentTx(undefined);
            resolve();
          },
          reject: async () => {
            await refetch?.();
            setCurrentTx(undefined);
            reject(Error("Transaction failed"));
          }
        })
      });
      toast.promise(
        toastPromise,
        {
          loading:  "Executing transaction...",
          success: "Transaction executed!",
          error: "Failed to execute transaction"
        },
        {
          position: "bottom-right",
          success: {
            duration: 10_000
          },
          error: {
            duration: 30_000
          }
        }
      ).catch(console.error);
      return toastPromise;
    }
  }
}