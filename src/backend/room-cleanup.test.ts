import { it, expect, vi } from "vitest";
import { cleanExpiredRooms } from "./room-cleanup";

it("remove projeções vencidas sem apagar uma sala renovada", async () => {
  const fetchImpl = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ OLD: {}, NEW: {} }))
    .mockResolvedValueOnce(Response.json({ expiresAt: 10 }, { headers: { etag: '"old"' } }))
    .mockResolvedValueOnce(new Response(null, { status: 200 }))
    .mockResolvedValueOnce(Response.json({ expiresAt: 300 }))
    .mockResolvedValueOnce(Response.json({ OLD: {} }))
    .mockResolvedValueOnce(Response.json({ expiresAt: 10 }, { headers: { etag: '"race"' } }))
    .mockResolvedValueOnce(new Response(null, { status: 412 }))
    .mockResolvedValueOnce(Response.json(null));
  expect(await cleanExpiredRooms("https://db.example", "token", fetchImpl, 100)).toBe(1);
  expect(fetchImpl.mock.calls[2]![1]).toMatchObject({
    method: "DELETE",
    headers: { "if-match": '"old"' },
  });
  expect(fetchImpl.mock.calls.filter((call) => call[1]?.method === "DELETE")).toHaveLength(2);
});
