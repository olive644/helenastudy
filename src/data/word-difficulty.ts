export type WordDifficulty = "easy" | "medium" | "hard";

export type DifficultyResult = {
  difficulty: WordDifficulty;
  frequency: number;
  source: "local" | "datamuse" | "estimated";
};

type FrequencyMap = Record<string, number>;
type DatamuseWord = { word?: string; tags?: string[] };

const CACHE_KEY = "helena-study:word-frequency:v1";
let localFrequencyPromise: Promise<FrequencyMap> | undefined;

function normalize(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z' -]/g, "")
    .replace(/\s+/g, " ");
}

export function difficultyFromZipf(frequency: number): WordDifficulty {
  if (frequency >= 5) return "easy";
  if (frequency >= 4) return "medium";
  return "hard";
}

function loadLocalFrequency(): Promise<FrequencyMap> {
  localFrequencyPromise ??= fetch("/en-frequency-10k.json")
    .then((response) => (response.ok ? response.json() : {}))
    .catch(() => ({})) as Promise<FrequencyMap>;
  return localFrequencyPromise;
}

function loadCache(storage: Storage): FrequencyMap {
  try {
    return JSON.parse(storage.getItem(CACHE_KEY) ?? "{}") as FrequencyMap;
  } catch {
    return {};
  }
}

function saveCache(storage: Storage, values: FrequencyMap) {
  try {
    storage.setItem(CACHE_KEY, JSON.stringify(values));
  } catch {
    // Difficulty still works when private browsing blocks storage.
  }
}

function frequencyPerMillionToZipf(value: number): number {
  return Math.log10(Math.max(value, 0.000001)) + 3;
}

async function queryDatamuse(word: string): Promise<number | undefined> {
  const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&qe=sp&md=f&max=1`;
  const response = await fetch(url);
  if (!response.ok) return undefined;
  const results = (await response.json()) as DatamuseWord[];
  const exact = results.find((item) => normalize(item.word ?? "") === word);
  const tag = exact?.tags?.find((item) => item.startsWith("f:"));
  const frequency = tag ? Number(tag.slice(2)) : Number.NaN;
  return Number.isFinite(frequency) ? frequencyPerMillionToZipf(frequency) : undefined;
}

export async function classifyWordDifficulty(
  value: string,
  storage: Storage = window.localStorage,
): Promise<DifficultyResult> {
  const word = normalize(value);
  const local = await loadLocalFrequency();
  const localValue = local[word];
  if (typeof localValue === "number")
    return { difficulty: difficultyFromZipf(localValue), frequency: localValue, source: "local" };

  const cache = loadCache(storage);
  const cachedValue = cache[word];
  if (typeof cachedValue === "number")
    return {
      difficulty: difficultyFromZipf(cachedValue),
      frequency: cachedValue,
      source: "datamuse",
    };

  try {
    const remoteValue = await queryDatamuse(word);
    if (typeof remoteValue === "number") {
      cache[word] = remoteValue;
      saveCache(storage, cache);
      return {
        difficulty: difficultyFromZipf(remoteValue),
        frequency: remoteValue,
        source: "datamuse",
      };
    }
  } catch {
    // Fall through to the deterministic offline estimate.
  }

  const estimated = Math.max(2.5, 5.4 - word.length * 0.12 - (word.includes(" ") ? 0.35 : 0));
  return { difficulty: difficultyFromZipf(estimated), frequency: estimated, source: "estimated" };
}
