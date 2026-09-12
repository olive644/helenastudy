export async function cleanExpiredRooms(
  root: string,
  token: string,
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<number> {
  let removed = 0;
  for (const path of ["rooms", "private-rooms", "room-limits"]) {
    const url = `${root}/${path}.json?orderBy=${encodeURIComponent('"expiresAt"')}&startAt=0&endAt=${now}&limitToFirst=100`;
    const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error("Não foi possível consultar registros expirados.");
    const entries = (await response.json()) as Record<string, unknown> | null;
    for (const key of Object.keys(entries ?? {})) {
      const entryUrl = `${root}/${path}/${encodeURIComponent(key)}.json`;
      const snapshot = await fetchImpl(entryUrl, {
        headers: { Authorization: `Bearer ${token}`, "X-Firebase-ETag": "true" },
      });
      if (!snapshot.ok) throw new Error("Não foi possível conferir expiração.");
      const entry = (await snapshot.json()) as { expiresAt?: number } | null;
      if (!entry || typeof entry.expiresAt !== "number" || entry.expiresAt > now) continue;
      const version = snapshot.headers.get("etag");
      if (!version) throw new Error("Versão ausente na limpeza.");
      const deletion = await fetchImpl(entryUrl, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "if-match": version },
      });
      if (deletion.ok) removed++;
      else if (deletion.status !== 412)
        throw new Error("Não foi possível remover registro expirado.");
    }
  }
  return removed;
}
