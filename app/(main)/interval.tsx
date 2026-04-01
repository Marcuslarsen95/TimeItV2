import { View, NativeModules, DeviceEventEmitter } from "react-native";
import { useTheme, Text } from "react-native-paper";
import { useSharedValue } from "react-native-reanimated";
import { layout } from "@/styles/layout";
import { formatDateTimer, convertToMs } from "../../utils/HelperFunctions";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { useState } from "react";
import ActionButtonsRow from "@/components/ActionButtonsRow";
import TimerDisplay from "@/components/TimerDisplay";
import StatusBadge from "@/components/StatusBadge";
import ErrorSnackbar from "@/components/errorSnackBar";
import DraggableSettings from "@/components/DraggableSetting";
import IntervalSegmentPicker from "@/components/IntervalSegmentPicker";
import {
  Interval,
  Unit,
  UserPreferences,
  useUserPreferences,
} from "@/hooks/use-user-preferences";

export default function IntervalScreen() {
  const theme = useTheme();
  type IntervalName = "Active" | "Pause" | "Transition";

  interface IntervalUpdateEvent {
    intervalName: IntervalName;
    remainingMs: number;
    timerType: string;
  }

  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [isPaused, setIsPaused] = useState(true);
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const sheetHeight = isEditingTime ? 0.8 : 0.5;
  const [currentInterval, setCurrentInterval] =
    useState<IntervalName>("Active");
  const progress = useSharedValue(0);
  const { IntervalServiceModule } = NativeModules;
  const { main, ms } = formatDateTimer(timer, false);
  const { preferences, updatePreference, isLoading } = useUserPreferences();
  const intervals = preferences.interval.segments;
  const setIntervals = (updater: (prev: Interval[]) => Interval[]) => {
    updatePreference("interval", { segments: updater(intervals) });
  };

  const statusConfig = {
    active: {
      label: "WORK",
      color: theme.colors.primary,
      icon: "flash-outline",
    },
    recovery: { label: "REST", color: theme.colors.error, icon: "fitness" },
    transition: {
      label: "GET READY",
      color: theme.colors.tertiary,
      icon: "timer",
    },
    paused: {
      label: "PAUSED",
      color: theme.colors.outline,
      icon: "pause-circle",
    },
    inactive: {
      label: "INTERVAL TIMER",
      color: theme.colors.secondary,
      icon: "stopwatch-outline",
    },
  };

  const [editingId, setEditingId] = useState(1);

  const getStatus = () => {
    if (!timer && isPaused) return statusConfig.inactive; // timer is 0 and not started
    if (isPaused) return statusConfig.paused;

    const key = currentInterval.toLowerCase();
    return (
      statusConfig[key as keyof typeof statusConfig] || statusConfig.active
    );
  };

  const currentStatus = getStatus();

  React.useEffect(() => {
    IntervalServiceModule.getState().then(
      (state: { isRunning: boolean; isPaused: boolean; timerType: string }) => {
        if (state.timerType !== "interval") return; // not our timer
        if (!state.isRunning) return;
        if (state.isRunning || !state.isPaused) {
          setIsPaused(state.isPaused);
        }
      },
    );
  }, []);

  React.useEffect(() => {
    const subUpdate = DeviceEventEmitter.addListener(
      "IntervalUpdate",
      (data: IntervalUpdateEvent) => {
        if (data.timerType !== "interval") return;
        const { intervalName: name, remainingMs } = data;
        setCurrentInterval(data.intervalName);
        setTimer(remainingMs);

        const idx = intervals.findIndex((i) => i.name === name);
        if (idx !== -1) {
          const interval = intervals[idx];
          const duration = convertToMs(interval.durationSecs, interval.unit);

          // Compute progress (1 → 0)
          const t = remainingMs / duration;

          progress.value = t;
        }
      },
    );

    const subPause = DeviceEventEmitter.addListener(
      "IntervalPaused",
      (data) => {
        if (data?.timerType !== "interval") return;
        console.log("UI: Received Pause Event");
        setIsPaused(true);
      },
    );

    const subResume = DeviceEventEmitter.addListener(
      "IntervalResumed",
      (data) => {
        if (data?.timerType !== "interval") return;
        console.log("UI: Received Resume Event");
        setIsPaused(false);
      },
    );

    const subStop = DeviceEventEmitter.addListener(
      "IntervalStopped",
      (data) => {
        if (data?.timerType !== "interval") return;
        setIsPaused(true);
        setTimer(0);
        counterRef.current = 0;
      },
    );

    return () => {
      subUpdate.remove();
      subPause.remove();
      subResume.remove();
      subStop.remove();
    };
  }, []);

  const counterRef = React.useRef(0);

  const startInterval = () => {
    const activeIntervals = intervals.filter((i) => i.active);

    if (activeIntervals.length === 0) {
      setError("Please enable at least one interval.");
      setIsSnackbarVisible(true);
      return;
    }

    setIsPaused(false);
    setTimer(0);
    counterRef.current = 0;

    IntervalServiceModule.startSequence(
      JSON.stringify(
        activeIntervals.map((i) => ({
          name: i.name,
          durationMs: convertToMs(i.durationSecs, i.unit),
        })),
      ),
      true,
      "interval",
    );
  };

  const togglePause = () => {
    IntervalServiceModule.toggle();
  };

  const stopTimer = async () => {
    setIsPaused(true);
    IntervalServiceModule.stop();
  };

  const pressSkip = async () => {
    IntervalServiceModule.skip();
    setIsPaused(false);
  };

  const toggleInterval = async (id: number) => {
    setIntervals((prev) =>
      prev.map((interval) =>
        interval.id === id
          ? { ...interval, active: !interval.active }
          : interval,
      ),
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* 1. Main Root: No padding at the bottom or sides here so sheet can be flush */}
      <View style={{ flex: 1 }}>
        {/* 2. Upper Content: This handles the Timer, Badge, etc. with padding */}
        <View style={[layout.mainContainer]}>
          <StatusBadge
            statusLabel={currentStatus.label}
            statusColor={currentStatus.color}
            statusIcon={currentStatus.icon}
          />
          <TimerDisplay time={main} isPaused={isPaused} isRunning={!!timer} />
          <ActionButtonsRow
            timerActive={timer ? true : false}
            isPaused={isPaused}
            pressPlay={startInterval}
            pressPause={togglePause}
            pressStop={stopTimer}
            pressSkipToNext={pressSkip}
            firstButtonIcon="refresh"
            firstButtonLabel="Reset"
            thirdButtonIcon="play-skip-forward"
            thirdButtonLabel="Skip"
          />
        </View>

        {/* 3. Settings Tray: Sits outside the padded View above */}
        <DraggableSettings
          label="Interval Settings"
          isTimerRunning={!!timer}
          maxHeight={sheetHeight}
        >
          <IntervalSegmentPicker
            intervals={intervals}
            editingId={editingId}
            setEditingId={setEditingId}
            onInputFocusChange={(focused) => setIsEditingTime(focused)}
            onToggle={toggleInterval}
            onDurationChange={(id, newSeconds) => {
              setIntervals((prev) =>
                prev.map((i) =>
                  i.id === id ? { ...i, durationSecs: newSeconds } : i,
                ),
              );
            }}
          />
        </DraggableSettings>

        <ErrorSnackbar
          visible={isSnackbarVisible}
          message={error}
          onDismiss={() => setIsSnackbarVisible(false)}
          color={theme.colors.error}
          textColor={theme.colors.onError}
        />
      </View>
    </GestureHandlerRootView>
  );
}
