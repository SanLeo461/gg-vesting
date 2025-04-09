import { HomeInputs } from "~/components/HomeInputs";
import { Layout } from "~/components/Layout";
import { UserVesting } from "~/components/UserVesting";

export default function UserPage() {
  return (
    <Layout>
      <HomeInputs />
      <UserVesting />
    </Layout>
  );
}
