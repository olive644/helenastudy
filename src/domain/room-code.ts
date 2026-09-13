export const LOCAL_ROOM_JOIN_PARAM = "sala";
const LOCAL_ROOM_PROJECTOR_PATTERN = /^\/sala\/([A-HJ-NP-Z2-9]{5})\/projetor\/?$/i;

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

export function readLocalRoomProjectorCodeFromUrl(href: string): string | undefined {
  const match = new URL(href).pathname.match(LOCAL_ROOM_PROJECTOR_PATTERN);
  return match?.[1] ? normalizeLocalRoomCode(match[1]) : undefined;
}
