import { it, expect } from "vitest";
import { createRoomGuard } from "./room-guard";
import { createMemoryRoomStore } from "./room-transaction";

it("limita criação de salas de forma atômica e independente por endereço", async () => {
  const guard = createRoomGuard(createMemoryRoomStore(), "project", "app", false);
  const request = (ip: string) =>
    new Request("https://app.example/api/local-room?action=create", {
      headers: { "x-vercel-forwarded-for": ip },
    });
  const results = await Promise.all(Array.from({ length: 10 }, () => guard(request("1.2.3.4"))));
  expect(results.filter((result) => !result)).toHaveLength(6);
  expect(results.filter((result) => result?.status === 429)).toHaveLength(4);
  expect(await guard(request("5.6.7.8"))).toBeUndefined();
});

it("exige App Check quando habilitado e recusa configuração incompleta", async () => {
  const request = new Request("https://app.example/api/local-room?action=create");
  expect(
    (await createRoomGuard(createMemoryRoomStore(), "project", "app", true)(request))?.status,
  ).toBe(403);
  expect(
    (await createRoomGuard(createMemoryRoomStore(), "project", "", true)(request))?.status,
  ).toBe(503);
});
