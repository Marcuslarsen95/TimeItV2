import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Unit = "Seconds" | "Minutes" | "Hours";

export interface Interval {
  id: number;
  name: string;
  durationSecs: number;
  unit: Unit;
  active: boolean;
}

export interface WorkoutPreset {
  id: string;
  name: string;
  type: "interval" | "countdown" | "random";
  config: {
    //intevals
    segments?: Interval[];
    //countdown timers
    duration?: number;
    // random
    minSecs?: number;
    maxSecs?: number;
  };
}

const PRESETS_KEY = "workoutPresets";

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

  const savePreset = async (
    name: string,
    type: WorkoutPreset["type"],
    config: WorkoutPreset["config"],
  ) => {
    const newPreset: WorkoutPreset = {
      id: Date.now().toString(),
      name,
      type,
      config,
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
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

  return { presets, savePreset, updatePreset, deletePreset, isLoading };
}
