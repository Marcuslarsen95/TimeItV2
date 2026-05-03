import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SavedRun {
  id: string;
  name: string;
  /** Unix timestamp of when the run was saved */
  savedAt: number;
  /**
   * Lap-completion times in milliseconds since the run started.
   * Same shape as the live `laps` state in the stopwatch screen.
   */
  laps: number[];
  /** Total elapsed time (final lap or stopwatch reading at save time) */
  totalDurationMs: number;
}

export type SaveRunResult =
  | { ok: true; id: string }
  | { ok: false; reason: "pro-required" };

const STORAGE_KEY = "lapHistory";

/**
 * Persists user-saved stopwatch runs. Saving is gated behind Pro;
 * viewing/deleting is not (so a former Pro user keeps access to runs
 * they recorded before downgrading).
 */
export function useLapHistory() {
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setRuns(JSON.parse(stored));
      } catch (e) {
        console.warn("Failed to load lap history: ", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const saveRun = async (
    name: string,
    laps: number[],
    totalDurationMs: number,
    isPro: boolean,
  ): Promise<SaveRunResult> => {
    if (!isPro) {
      return { ok: false, reason: "pro-required" };
    }
    const id = Date.now().toString();
    const newRun: SavedRun = {
      id,
      name: name.trim() || new Date().toLocaleString(),
      savedAt: Date.now(),
      laps,
      totalDurationMs,
    };
    // Newest first so the history list is naturally ordered
    const updated = [newRun, ...runs];
    setRuns(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { ok: true, id };
  };

  const deleteRun = async (id: string) => {
    const updated = runs.filter((r) => r.id !== id);
    setRuns(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { runs, saveRun, deleteRun, isLoading };
}
