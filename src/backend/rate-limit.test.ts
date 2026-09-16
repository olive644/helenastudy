import { expect, it } from "vitest";
import { checkRateLimit } from "./rate-limit";
import { createMemoryRoomStore } from "./room-transaction";

it("permite ate o limite e bloqueia a partir dele, por identidade", async () => {
  const store = createMemoryRoomStore();
  for (let i = 0; i < 3; i++) {
    expect(await checkRateLimit(store, "test-limit", "1.2.3.4", 3, 60)).toBe(true);
  }
  expect(await checkRateLimit(store, "test-limit", "1.2.3.4", 3, 60)).toBe(false);

  expect(await checkRateLimit(store, "test-limit", "5.6.7.8", 3, 60)).toBe(true);
});

it("nao mistura contadores de namespaces diferentes", async () => {
  const store = createMemoryRoomStore();
  for (let i = 0; i < 2; i++) {
    expect(await checkRateLimit(store, "namespace-a", "1.2.3.4", 2, 60)).toBe(true);
  }
  expect(await checkRateLimit(store, "namespace-b", "1.2.3.4", 2, 60)).toBe(true);
});
