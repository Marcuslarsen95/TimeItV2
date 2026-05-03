import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Interval } from "./use-user-preferences";

export type Unit = "Seconds" | "Minutes" | "Hours";

export interface WorkoutPreset {
  id: string;
  name: string;
  type: "interval" | "countdown" | "random";
  config: {
    //intevals
    segments?: Interval[];
    repeatCount?: number;
    //countdown timers
    duration?: number;
    // random
    minSecs?: number;
    maxSecs?: number;
  };
}

export type SavePresetResult =
  | { ok: true }
  | { ok: false; reason: "limit" };

const PRESETS_KEY = "workoutPresets";

// Free users can save at most this many presets per timer type.
// Pro users have no limit.
export const FREE_PRESET_LIMIT_PER_TYPE = 3;

export function useWorkoutPresets() {
  const [presets, setPresets] = useState<WorkoutPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(PRESETS_KEY);
        if (stored) setPresets(JSON.parse(stored));
      } catch (e) {
        console.warn("Failed to load presets: ", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const canSavePreset = (
    type: WorkoutPreset["type"],
    isPro: boolean,
  ): boolean => {
    if (isPro) return true;
    const countForType = presets.filter((p) => p.type === type).length;
    return countForType < FREE_PRESET_LIMIT_PER_TYPE;
  };

  const savePreset = async (
    name: string,
    type: WorkoutPreset["type"],
    config: WorkoutPreset["config"],
    isPro: boolean = true,
  ): Promise<SavePresetResult> => {
    if (!canSavePreset(type, isPro)) {
      return { ok: false, reason: "limit" };
    }
    const newPreset: WorkoutPreset = {
      id: Date.now().toString(),
      name,
      type,
      config,
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
    return { ok: true };
  };

  const updatePreset = async (
    id: string,
    changes: Partial<Omit<WorkoutPreset, "id">>,
  ) => {
    const updated = presets.map((p) =>
      p.id === id ? { ...p, ...changes } : p,
    );
    setPresets(updated);
    await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
  };

  const deletePreset = async (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
  };

  return {
    presets,
    savePreset,
    canSavePreset,
    updatePreset,
    deletePreset,
    isLoading,
  };
}
