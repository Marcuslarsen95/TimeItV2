import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
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
  isPro: boolean;
  themeColor: string;
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
  isPro: false,
  themeColor: "#e9b570",
  interval: {
    segments: [
      { id: 1, durationSecs: 30, name: "Active", unit: "Seconds" },
      { id: 2, durationSecs: 10, name: "Recovery", unit: "Seconds" },
      { id: 3, durationSecs: 0, name: "Transition", unit: "Seconds" },
    ],
  },
  countdown: { duration: 25 },
  random: { minSecs: 60, maxSecs: 300 },
};

interface PreferencesContextValue {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) => Promise<void>;
  isLoading: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function UserPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaults);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<UserPreferences>;
          setPreferences({ ...defaults, ...parsed });
        }
      } catch (e) {
        console.warn("Failed to load preferences", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const updatePreference = useCallback(
    async <K extends keyof UserPreferences>(
      key: K,
      value: UserPreferences[K],
    ) => {
      try {
        setPreferences((prev) => {
          const updated = { ...prev, [key]: value };
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(
            (e) => console.warn("Failed to save preferences", e),
          );
          return updated;
        });
      } catch (e) {
        console.warn("Failed to save preferences", e);
      }
    },
    [],
  );

  return React.createElement(
    PreferencesContext.Provider,
    { value: { preferences, updatePreference, isLoading } },
    children,
  );
}

export function useUserPreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider",
    );
  }
  return ctx;
}
