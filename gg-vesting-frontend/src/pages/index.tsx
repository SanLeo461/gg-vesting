
import { HomeInputs } from "~/components/HomeInputs";
import { Layout } from "~/components/Layout";
import { GlobalVesting } from "~/components/GlobalVesting";

export default function Index() {
  return (
    <Layout>
      <HomeInputs />
      <GlobalVesting />
    </Layout>
  );
}
