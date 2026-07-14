import statesRaw from '@/constants/json/states.json';

function normalizeList(raw: unknown, possibleKeys: string[]): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        for (const key of possibleKeys) {
          const val = (item as Record<string, unknown>)[key];
          if (typeof val === 'string') return val;
        }
      }
      return null;
    })
    .filter((v): v is string => Boolean(v));
}

export function getAllStateNames(): string[] {
  const names = normalizeList(statesRaw, ['name', 'state', 'state_name']);
  return Array.from(new Set(names)).sort();
}
