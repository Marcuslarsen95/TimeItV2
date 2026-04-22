import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Unit = "Seconds" | "Minutes" | "Hours";

export interface Interval {
  id: number;
  name: string;
  durationSecs: number;
  unit: Unit;
}

export interface UserPreferences {
  hasCompletedSetup: boolean;
  interval: {
    segments: Interval[];
  };
  countdown: {
    duration: number;
  };
  random: {
    minSecs: number;
    maxSecs: number;
  };
}

const STORAGE_KEY = "userPreferences";

const defaults: UserPreferences = {
  hasCompletedSetup: false,
  interval: {
    segments: [
      {
        id: 1,
        durationSecs: 30,
        name: "Active",
        unit: "Seconds",
      },
      {
        id: 2,
        durationSecs: 10,
        name: "Recovery",
        unit: "Seconds",
      },
      {
        id: 3,
        durationSecs: 0,
        name: "Transition",
        unit: "Seconds",
      },
    ],
  },
  countdown: {
    duration: 25,
  },
  random: {
    minSecs: 60,
    maxSecs: 300,
  },
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaults);
  const [isLoading, setIsLoading] = useState(true);

  // Load from storage on mount
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPreferences(JSON.parse(stored));
        }
      } catch (e) {
        console.warn("Failed to load preferences", e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const updatePreference = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) => {
    try {
      const updated = { ...preferences, [key]: value };
      setPreferences(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save preferences", e);
    }
  };

  return { preferences, updatePreference, isLoading };
}
