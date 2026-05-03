import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  NativeModules,
  DeviceEventEmitter,
  Pressable,
} from "react-native";
import { OPEN_SETTINGS_EVENT } from "@/components/SettingsTrigger";
import {
  useTheme,
  Button,
  Modal,
  Portal,
  IconButton,
  SegmentedButtons,
  Text,
  TextInput,
} from "react-native-paper";
import { useSharedValue } from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { layout } from "@/styles/layout";
import { formatDateTimer, convertToMs } from "../../utils/HelperFunctions";
import { Interval, useUserPreferences } from "@/hooks/use-user-preferences";
import { useProStatus } from "@/hooks/use-pro-status";
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

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [currentInterval, setCurrentInterval] =
    useState<IntervalName>("Active");
  const [editingId, setEditingId] = useState(1);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    isError: boolean;
    action?: { label: string; onPress: () => void };
    secondaryAction?: { label: string; onPress: () => void };
  }>({
    visible: false,
    message: "",
    isError: false,
  });
  const [repeatCountInput, setRepeatCountInput] = useState("1");
  const [editingRepeat, setIsEditingRepeat] = useState(false);
  const [currentRepeatPass, setCurrentRepeatPass] = useState(0);
  const [currentTotalPass, setCurrentTotalPass] = useState(0);

  // --- Hooks ---
  const { preferences, updatePreference } = useUserPreferences();
  const { isPro } = useProStatus();
  const { presets, savePreset, canSavePreset, deletePreset } =
    useWorkoutPresets();
  const progress = useSharedValue(0);
  const counterRef = useRef(0);

  const intervals = preferences.interval.segments;
  const storedRepeatCount = preferences.interval.repeatCount ?? 1;

  useEffect(() => {
    if (!editingRepeat) {
      setRepeatCountInput(storedRepeatCount.toString());
    }
  }, [storedRepeatCount, editingRepeat]);
  // The first active interval's duration, in ms
  const firstActive = intervals.find((i) => i.durationSecs > 0);
  const firstIntervalMs = firstActive
    ? convertToMs(firstActive.durationSecs, firstActive.unit)
    : 0;

  const { main } = formatDateTimer(isRunning ? timer : firstIntervalMs, false);
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
  const showSnackbar = (
    message: string,
    isError = false,
    action?: { label: string; onPress: () => void },
    secondaryAction?: { label: string; onPress: () => void },
  ) =>
    setSnackbar({ visible: true, message, isError, action, secondaryAction });

  // --- Interval helpers ---
  const setIntervals = (updater: (prev: Interval[]) => Interval[]) =>
    updatePreference("interval", {
      ...preferences.interval,
      segments: updater(intervals),
    });

  const commitRepeatCount = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, "");
    const parsed = parseInt(cleaned, 10);
    const num = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    setRepeatCountInput(num.toString());
    if (num !== storedRepeatCount) {
      updatePreference("interval", {
        ...preferences.interval,
        repeatCount: num,
      });
    }
  };

  const handleRepeatChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setRepeatCountInput(cleaned);
    // Write through to prefs whenever we have a valid >=1 value;
    // empty string is allowed mid-edit and is normalised on blur.
    if (cleaned !== "") {
      const num = Math.max(1, parseInt(cleaned, 10) || 1);
      if (num !== storedRepeatCount) {
        updatePreference("interval", {
          ...preferences.interval,
          repeatCount: num,
        });
      }
    }
  };

  // --- Timer controls ---
  const startInterval = () => {
    const activeIntervals = intervals.filter((i) => i.durationSecs > 0);
    if (activeIntervals.length === 0) {
      showSnackbar("Please enable at least one interval.", true);
      return;
    }
    try {
      setIsRunning(true);
      setIsPaused(false);
      setTimer(0);
      counterRef.current = 0;
      const repeatCountNum = Math.max(
        1,
        parseInt(repeatCountInput, 10) || storedRepeatCount,
      );
      IntervalServiceModule.startSequence(
        JSON.stringify(
          activeIntervals.map((i) => ({
            name: i.name,
            durationMs: convertToMs(i.durationSecs, i.unit),
          })),
        ),
        true,
        "interval",
        isPro && preferences.voicePromptsEnabled,
        repeatCountNum,
      );
    } catch (e) {
      // Roll back the optimistic isRunning flip if the native call threw.
      setIsRunning(false);
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
  const handleSavePresetClick = () => {
    if (!canSavePreset("interval", isPro)) {
      // Free-tier limit hit — surface the upsell snackbar with two
      // routes out: jump to the Pro section, or open the existing
      // presets list to delete one and make room.
      showSnackbar(
        "Free plan: 3 presets per timer. Upgrade for unlimited.",
        false,
        {
          label: "Upgrade",
          onPress: () => DeviceEventEmitter.emit(OPEN_SETTINGS_EVENT),
        },
        {
          label: "Manage",
          onPress: () => setIsPresetsOpen(true),
        },
      );
      return;
    }
    setShowSaveDialog(true);
  };

  const handleSavePreset = async (name: string) => {
    const result = await savePreset(
      name,
      "interval",
      {
        segments: preferences.interval.segments,
        repeatCount: preferences.interval.repeatCount,
      },
      isPro,
    );
    if (!result.ok) {
      showSnackbar("Couldn't save preset — Pro limit reached.", true);
      return;
    }
    showSnackbar("Preset saved!");
  };

  const openPresets = () => {
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
          setIsRunning(true);
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
      currentPass: number;
      totalPasses: number;
    }

    const subUpdate = DeviceEventEmitter.addListener(
      "IntervalUpdate",
      (data: IntervalUpdateEvent) => {
        if (data.timerType !== "interval") return;
        setCurrentInterval(data.intervalName);
        setTimer(data.remainingMs);
        setCurrentRepeatPass(data.currentPass);
        setCurrentTotalPass(data.totalPasses);
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
        setIsRunning(false);
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
          {!isRunning && (
            <TimerInfoBar
              type="interval"
              segments={intervals}
              currentInterval={currentInterval}
              isRunning={isRunning}
              repeatCount={preferences.interval.repeatCount}
            />
          )}
          <View style={styles.mainArea}>
            {isRunning ? (
              <View style={{ flexDirection: "column", alignItems: "center" }}>
                <TimerDisplay
                  time={main}
                  isPaused={isPaused}
                  isRunning={isRunning}
                />
                <Text variant="labelMedium">
                  Set {currentRepeatPass}/{currentTotalPass}
                </Text>
              </View>
            ) : (
              <View style={{ width: "100%", alignItems: "center" }}>
                <View
                  style={{
                    width: "100%",
                    position: "relative",
                    gap: 40,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
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
                      <Text variant="labelSmall" style={[layout.helperText]}>
                        Scroll to 0 to disable interval
                      </Text>
                    </View>

                    {selectedInterval.durationSecs === 0 && (
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
                          left: 50,
                          right: 50,
                          top: "52%",
                          transform: [{ translateY: -20 }],
                          height: 40,
                          backgroundColor: theme.colors.background,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.onBackground,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: theme.colors.onBackground,
                            fontSize: 12,
                            opacity: 1,
                          }}
                        >
                          Disabled (tap to activate)
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <View
                    style={{
                      width: "100%",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      variant="labelSmall"
                      style={[layout.helperText, { marginBottom: 0 }]}
                    >
                      Choose each interval and set time for each above.
                    </Text>
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
                          label:
                            i.durationSecs === 0 ? `${i.name} (off)` : i.name,
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
                      style={{ width: "100%" }}
                    />
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text variant="bodySmall" style={{ marginBottom: 5 }}>
                      Sets:
                    </Text>
                    <TextInput
                      mode="outlined"
                      value={repeatCountInput}
                      onChangeText={handleRepeatChange}
                      keyboardType="number-pad"
                      maxLength={3}
                      selectTextOnFocus
                      onBlur={() => {
                        commitRepeatCount(repeatCountInput);
                        setIsEditingRepeat(false);
                      }}
                      onFocus={() => {
                        setIsEditingRepeat(true);
                      }}
                      style={{
                        width: 75,
                        height: 40,
                        textAlign: "center",
                      }}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {!isRunning && (
            <View style={styles.presetRow}>
              <Button icon="save-outline" onPress={handleSavePresetClick}>
                Save for later
              </Button>
              <Button icon="bookmarks-outline" onPress={openPresets}>
                Load saved
              </Button>
            </View>
          )}

          <ActionButtonsRow
            timerActive={isRunning}
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
            color={snackbar.isError ? theme.colors.error : undefined}
            textColor={snackbar.isError ? theme.colors.onError : undefined}
            action={snackbar.action}
            secondaryAction={snackbar.secondaryAction}
            duration={snackbar.action || snackbar.secondaryAction ? 5000 : 2000}
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
                    repeatCount: preset.config.repeatCount ?? 1,
                  });
                  showSnackbar("Preset loaded!");
                  setIsPresetsOpen(false);
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
