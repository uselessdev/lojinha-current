import { auth } from "@clerk/nextjs";
import { fetchApiKeys } from "./utils/fetch-api-keys";
import { ApiKeysList } from "./components/apikeys-list-table";

export default async function ApiKeysPage() {
  const { orgId } = auth();

  const data = await fetchApiKeys(orgId as string);

  return <ApiKeysList keys={data} />;
}
