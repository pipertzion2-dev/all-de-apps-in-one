export type DoHAnswer = {
  name: string;
  type: number;
  TTL: number;
  data: string;
};

export async function queryDns(name: string, type: string): Promise<DoHAnswer[]> {
  const u = new URL("https://dns.google/resolve");
  u.searchParams.set("name", name);
  u.searchParams.set("type", type);
  const res = await fetch(u.toString());
  if (!res.ok) throw new Error(`DNS query failed (${res.status})`);
  const j = (await res.json()) as { Answer?: DoHAnswer[]; Status: number };
  if (j.Status !== 0 && !j.Answer?.length) return [];
  return j.Answer ?? [];
}
