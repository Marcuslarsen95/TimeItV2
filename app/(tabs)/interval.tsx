import { View, NativeModules, DeviceEventEmitter } from "react-native";
import { useTheme, Button } from "react-native-paper";
import { useSharedValue } from "react-native-reanimated";
import { layout } from "@/styles/layout";
import { formatDateTimer, convertToMs } from "../../utils/HelperFunctions";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { useState } from "react";
import ActionButtonsRow from "@/components/ActionButtonsRow";
import TimerDisplay from "@/components/TimerDisplay";
import StatusBadge from "@/components/StatusBadge";
import AppSnackbar from "@/components/AppSnackBar";
import DraggableSettings from "@/components/DraggableSetting";
import IntervalSegmentPicker from "@/components/IntervalSegmentPicker";
import SavePresetDialog from "@/components/SavePresetDialog";
import PresetList from "@/components/PresetList";

import { Interval, useUserPreferences } from "@/hooks/use-user-preferences";
import { useWorkoutPresets, WorkoutPreset } from "@/hooks/use-workout-presets";

export default function IntervalScreen() {
  const theme = useTheme();
  type IntervalName = "Active" | "Pause" | "Transition";

  interface IntervalUpdateEvent {
    intervalName: IntervalName;
    remainingMs: number;
    timerType: string;
  }

  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    isError: false,
  });
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [currentInterval, setCurrentInterval] =
    useState<IntervalName>("Active");
  const progress = useSharedValue(0);
  const { IntervalServiceModule } = NativeModules;
  const { main } = formatDateTimer(timer, false);
  const { preferences, updatePreference } = useUserPreferences();
  const intervals = preferences.interval.segments;
  const [editingId, setEditingId] = useState(1);
  const { presets, savePreset, deletePreset } = useWorkoutPresets();
  const intervalPresets = presets.filter((p) => p.type === "interval");
  const presetsHeight = intervalPresets.length * 0.07;
  const sheetHeight = isEditingTime ? 0.8 : 0.5 + presetsHeight;

  const setIntervals = (updater: (prev: Interval[]) => Interval[]) => {
    updatePreference("interval", { segments: updater(intervals) });
  };

  const showSnackbar = (message: string, isError = false) => {
    setSnackbar({ visible: true, message, isError });
  };

  const handleSavePreset = async (name: string) => {
    await savePreset(name, "interval", {
      segments: preferences.interval.segments,
    });
    showSnackbar("Preset saved!");
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

  const getStatus = () => {
    if (!timer && isPaused) return statusConfig.inactive;
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
        if (state.timerType !== "interval") return;
        if (!state.isRunning) return;
        if (state.isRunning || !state.isPaused) setIsPaused(state.isPaused);
      },
    );
  }, []);

  const counterRef = React.useRef(0);

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
          progress.value = remainingMs / duration;
        }
      },
    );

    const subPause = DeviceEventEmitter.addListener(
      "IntervalPaused",
      (data) => {
        if (data?.timerType !== "interval") return;
        setIsPaused(true);
      },
    );

    const subResume = DeviceEventEmitter.addListener(
      "IntervalResumed",
      (data) => {
        if (data?.timerType !== "interval") return;
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

  const startInterval = () => {
    const activeIntervals = intervals.filter((i) => i.active);
    if (activeIntervals.length === 0) {
      showSnackbar("Please enable at least one interval.", true);
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

  const togglePause = () => IntervalServiceModule.toggle();
  const stopTimer = () => {
    setIsPaused(true);
    IntervalServiceModule.stop();
  };
  const pressSkip = () => {
    IntervalServiceModule.skip();
    setIsPaused(false);
  };

  const toggleInterval = (id: number) => {
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
      <View style={{ flex: 1 }}>
        <View style={[layout.mainContainer]}>
          <StatusBadge
            statusLabel={currentStatus.label}
            statusColor={currentStatus.color}
            statusIcon={currentStatus.icon}
          />
          <TimerDisplay time={main} isPaused={isPaused} isRunning={!!timer} />
          <ActionButtonsRow
            timerActive={!!timer}
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
          <AppSnackbar
            visible={snackbar.visible}
            message={snackbar.message}
            onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
            color={snackbar.isError ? theme.colors.error : theme.colors.primary}
            textColor={
              snackbar.isError ? theme.colors.onError : theme.colors.onPrimary
            }
          />
        </View>
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
          <Button onPress={() => setShowSaveDialog(true)}>
            Save as Preset
          </Button>
          <PresetList
            presets={intervalPresets}
            onLoad={(preset) => {
              updatePreference("interval", {
                segments: preset.config.segments ?? [],
              });
              showSnackbar("Preset loaded!");
            }}
            onDelete={(id) => {
              deletePreset(id);
              showSnackbar("Preset deleted!");
            }}
          />
        </DraggableSettings>
      </View>
      <SavePresetDialog
        visible={showSaveDialog}
        onDismiss={() => setShowSaveDialog(false)}
        onSave={handleSavePreset}
      />
    </GestureHandlerRootView>
  );
}
