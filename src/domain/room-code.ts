export const LOCAL_ROOM_JOIN_PARAM = "sala";

export function normalizeLocalRoomCode(value: string): string {
  return value.replace(/[\s-]+/g, "").toUpperCase();
}

export function isValidLocalRoomCode(code: string): boolean {
  return /^[A-HJ-NP-Z2-9]{5}$/.test(normalizeLocalRoomCode(code));
}

export function readLocalRoomCodeFromUrl(href: string): string | undefined {
  const code = new URL(href).searchParams.get(LOCAL_ROOM_JOIN_PARAM);
  return code && isValidLocalRoomCode(code) ? normalizeLocalRoomCode(code) : undefined;
}
