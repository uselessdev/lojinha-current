import { env } from "~/env.mjs";

export type Key = {
  id: string;
  apiId: string;
  workspaceId: string;
  start: string;
  ownerId: string | null;
  meta: Record<string, unknown>;
  createdAt: string | Date;
  expires: string | Date | null;
};

export type UnkeyResponse = {
  keys: Key[];
  total: number;
};

export async function fetchApiKeys(owner: string) {
  const request = await fetch(
    `${env.UNKEY_APP_URL}/apis/${env.UNKEY_APP_ID}/keys?ownersId=${owner}`,
    {
      headers: {
        Authorization: `Bearer ${env.UNKEY_APP_KEY}`,
      },
    },
  );

  const data = (await request.json()) as UnkeyResponse;

  return data;
}
