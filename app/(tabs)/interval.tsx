import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  NativeModules,
  DeviceEventEmitter,
  Pressable,
} from "react-native";
import {
  useTheme,
  Button,
  Modal,
  Portal,
  IconButton,
  SegmentedButtons,
  Text,
} from "react-native-paper";
import { useSharedValue } from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { layout } from "@/styles/layout";
import { formatDateTimer, convertToMs } from "../../utils/HelperFunctions";
import { Interval, useUserPreferences } from "@/hooks/use-user-preferences";
import { useWorkoutPresets } from "@/hooks/use-workout-presets";

import ActionButtonsRow from "@/components/ActionButtonsRow";
import TimerDisplay from "@/components/TimerDisplay";
import StatusBadge from "@/components/StatusBadge";
import AppSnackbar from "@/components/AppSnackBar";
import SavePresetDialog from "@/components/SavePresetDialog";
import PresetList from "@/components/PresetList";
import TimeWheelPicker from "@/components/TimeWheelPicker";
import TimerInfoBar from "@/components/TimerInfoBar";

const { IntervalServiceModule } = NativeModules;

type IntervalName = "Active" | "Pause" | "Transition";

export default function IntervalScreen() {
  const theme = useTheme();

  // --- State ---
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [currentInterval, setCurrentInterval] =
    useState<IntervalName>("Active");
  const [editingId, setEditingId] = useState(1);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    isError: false,
  });

  // --- Hooks ---
  const { preferences, updatePreference } = useUserPreferences();
  const { presets, savePreset, deletePreset } = useWorkoutPresets();
  const progress = useSharedValue(0);
  const counterRef = useRef(0);

  const intervals = preferences.interval.segments;
  // The first active interval's duration, in ms
  const firstActive = intervals.find((i) => i.durationSecs > 0);
  const firstIntervalMs = firstActive
    ? convertToMs(firstActive.durationSecs, firstActive.unit)
    : 0;

  const { main } = formatDateTimer(timer > 0 ? timer : firstIntervalMs, false);
  const intervalPresets = presets.filter((p) => p.type === "interval");
  const selectedInterval =
    intervals.find((i) => i.id === editingId) || intervals[0];

  // --- Derived status ---
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

  // --- Snackbar ---
  const showSnackbar = (message: string, isError = false) =>
    setSnackbar({ visible: true, message, isError });

  // --- Interval helpers ---
  const setIntervals = (updater: (prev: Interval[]) => Interval[]) =>
    updatePreference("interval", { segments: updater(intervals) });

  // --- Timer controls ---
  const startInterval = () => {
    const activeIntervals = intervals.filter((i) => i.durationSecs > 0);
    if (activeIntervals.length === 0) {
      showSnackbar("Please enable at least one interval.", true);
      return;
    }
    try {
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
    } catch (e) {
      showSnackbar("Failed to start timer, please try again", true);
    }
  };

  const togglePause = () => {
    try {
      IntervalServiceModule.toggle();
    } catch (e) {
      showSnackbar("Failed to pause timer", true);
    }
  };

  const stopTimer = () => {
    try {
      setIsPaused(true);
      IntervalServiceModule.stop();
    } catch (e) {
      showSnackbar("Failed to stop timer", true);
    }
  };

  const pressSkip = () => {
    try {
      IntervalServiceModule.skip();
      setIsPaused(false);
    } catch (e) {
      showSnackbar("Failed to skip interval", true);
    }
  };

  // --- Presets ---
  const handleSavePreset = async (name: string) => {
    await savePreset(name, "interval", {
      segments: preferences.interval.segments,
    });
    showSnackbar("Preset saved!");
  };

  const openPresets = () => {
    const p = presets.find((p) => p.name === "Morning hiit");
    console.log(JSON.stringify(p?.config.segments, null, 2));

    if (intervalPresets.length < 1) {
      showSnackbar("You don't have any saved presets", true);
    } else {
      setIsPresetsOpen(true);
    }
  };

  const handleDeletePreset = (id: string) => {
    deletePreset(id);
    if (intervalPresets.length <= 1) setIsPresetsOpen(false);
    showSnackbar("Preset deleted!");
  };

  // --- Effects ---
  useEffect(() => {
    IntervalServiceModule.getState()
      .then(
        (state: {
          isRunning: boolean;
          isPaused: boolean;
          timerType: string;
        }) => {
          if (state.timerType !== "interval" || !state.isRunning) return;
          setIsPaused(state.isPaused);
        },
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    interface IntervalUpdateEvent {
      intervalName: IntervalName;
      remainingMs: number;
      timerType: string;
    }

    const subUpdate = DeviceEventEmitter.addListener(
      "IntervalUpdate",
      (data: IntervalUpdateEvent) => {
        if (data.timerType !== "interval") return;
        setCurrentInterval(data.intervalName);
        setTimer(data.remainingMs);
        const idx = intervals.findIndex((i) => i.name === data.intervalName);
        if (idx !== -1) {
          const interval = intervals[idx];
          progress.value =
            data.remainingMs /
            convertToMs(interval.durationSecs, interval.unit);
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

  // --- Render ---
  return (
    <GestureHandlerRootView style={layout.GestureRoot}>
      <View style={layout.outerContainer}>
        <View style={layout.mainContainer}>
          <StatusBadge
            statusLabel={currentStatus.label}
            statusColor={currentStatus.color}
            statusIcon={currentStatus.icon}
          />
          {timer === 0 && (
            <TimerInfoBar
              type="interval"
              segments={intervals}
              currentInterval={currentInterval}
              isRunning={!!timer}
            />
          )}
          <View style={styles.mainArea}>
            {timer > 0 ? (
              <View style={{ flexDirection: "column", alignItems: "center" }}>
                <TimerDisplay
                  time={main}
                  isPaused={isPaused}
                  isRunning={!!timer}
                />
                <TimerInfoBar
                  type="interval"
                  segments={intervals}
                  currentInterval={currentInterval}
                  isRunning={!!timer}
                />
              </View>
            ) : (
              <View style={{ width: "100%", alignItems: "center" }}>
                <SegmentedButtons
                  value={editingId.toString()}
                  onValueChange={(val) => setEditingId(parseInt(val))}
                  buttons={intervals.map((i) => {
                    const isSelected = editingId === i.id;
                    const isActive = i.durationSecs > 0;

                    const bgColor = isSelected
                      ? isActive
                        ? theme.colors.primary
                        : theme.colors.primaryContainer
                      : isActive
                        ? theme.colors.secondary
                        : theme.colors.surfaceDisabled;

                    const textColor = isSelected
                      ? isActive
                        ? theme.colors.onPrimary
                        : theme.colors.onPrimaryContainer
                      : isActive
                        ? theme.colors.onSecondary
                        : theme.colors.onSurfaceDisabled;

                    return {
                      value: i.id.toString(),
                      label: i.durationSecs === 0 ? `${i.name} (off)` : i.name,
                      checkedColor: textColor,
                      uncheckedColor: textColor,
                      style: {
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.outlineVariant,
                        borderWidth: isSelected ? 2 : 1,
                        backgroundColor: bgColor,
                        opacity: i.durationSecs > 0 ? 1 : 0.8,
                        paddingHorizontal: 0,
                      },
                      labelStyle: {
                        fontWeight: isSelected ? "900" : "600",
                        fontSize: 12,
                        color: textColor,
                      },
                    };
                  })}
                  style={{ width: "100%", marginBottom: 20 }}
                />

                <View style={{ width: "100%", position: "relative" }}>
                  <View
                    style={{
                      opacity: selectedInterval.durationSecs > 0 ? 1 : 0.4,
                    }}
                  >
                    <TimeWheelPicker
                      valueInSeconds={selectedInterval.durationSecs}
                      onChange={(newSeconds) =>
                        setIntervals((prev) =>
                          prev.map((i) =>
                            i.id === selectedInterval.id
                              ? { ...i, durationSecs: newSeconds }
                              : i,
                          ),
                        )
                      }
                    />
                  </View>

                  {selectedInterval.durationSecs > 0 ? (
                    <Button
                      textColor={theme.colors.secondary}
                      mode="outlined"
                      onPress={() =>
                        setIntervals((prev) =>
                          prev.map((i) =>
                            i.id === selectedInterval.id
                              ? { ...i, durationSecs: 0 }
                              : i,
                          ),
                        )
                      }
                      style={{
                        width: 160,
                        padding: 0,
                        alignSelf: "center",
                        marginTop: 10,
                      }}
                      labelStyle={{
                        fontSize: 12,
                        lineHeight: 12,
                        color: theme.colors.secondary,
                      }}
                    >
                      Disable {selectedInterval.name} timer
                    </Button>
                  ) : (
                    <Pressable
                      onPress={() =>
                        setIntervals((prev) =>
                          prev.map((i) =>
                            i.id === selectedInterval.id
                              ? { ...i, durationSecs: 30 }
                              : i,
                          ),
                        )
                      }
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: "50%",
                        transform: [{ translateY: -20 }],
                        height: 40,
                        backgroundColor: theme.colors.surface + "EE",
                        borderRadius: 8,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.onSurface,
                          fontSize: 12,
                          opacity: 0.6,
                        }}
                      >
                        Tap here to enable {selectedInterval.name} timer
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </View>

          {timer === 0 && (
            <View style={styles.presetRow}>
              <Button
                icon="save-outline"
                onPress={() => setShowSaveDialog(true)}
              >
                Save for later
              </Button>
              <Button icon="bookmarks-outline" onPress={openPresets}>
                Load saved
              </Button>
            </View>
          )}

          <ActionButtonsRow
            timerActive={!!timer}
            isPaused={isPaused}
            pressPlay={startInterval}
            pressPause={togglePause}
            leftButtonIcon="refresh"
            leftButtonLabel="Reset"
            leftButtonPress={stopTimer}
            rightButtonIcon="play-skip-forward"
            rightButtonLabel="Skip"
            rightButtonPress={pressSkip}
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
      </View>

      <Portal>
        <Modal
          visible={isPresetsOpen}
          onDismiss={() => setIsPresetsOpen(false)}
          contentContainerStyle={[
            layout.presetModalContainer,
            { backgroundColor: theme.colors.secondaryContainer },
          ]}
        >
          {isPresetsOpen && (
            <>
              <View style={styles.modalHeader}>
                <IconButton
                  icon="close"
                  onPress={() => setIsPresetsOpen(false)}
                  style={{ position: "absolute", top: -15, right: -20 }}
                />
              </View>
              <PresetList
                presets={intervalPresets}
                type="interval"
                onLoad={(preset) => {
                  updatePreference("interval", {
                    segments: preset.config.segments ?? [],
                  });
                  showSnackbar("Preset loaded!");
                }}
                onDelete={(id) => {
                  handleDeletePreset(id);
                }}
              />
            </>
          )}
        </Modal>
      </Portal>

      <SavePresetDialog
        visible={showSaveDialog}
        onDismiss={() => setShowSaveDialog(false)}
        onSave={handleSavePreset}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  mainArea: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  presetRow: {
    flexDirection: "row",
    justifyContent: "center",
    maxWidth: 300,
    gap: 10,
  },
  modalHeader: {
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    gap: 20,
  },
});
