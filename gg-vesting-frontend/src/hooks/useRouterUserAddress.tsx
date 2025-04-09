import { useRouter } from "next/router";

export const useRouterUserAddress = () => {
  const router = useRouter();
  console.log(router.query);
  const address = router.pathname === "/user/[address]" ? 
  (
    router.query.address ? router.query.address as string : ""
  ).toLowerCase() :
  "";
  console.log(address);
  
  return address;
}