import { View, NativeModules, DeviceEventEmitter } from "react-native";
import { useTheme, Text } from "react-native-paper";
import { useSharedValue } from "react-native-reanimated";
import { layout } from "../../styles/layout";
import { formatDateTimer, convertToMs } from "../../utils/HelperFunctions";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { useState } from "react";
import NumbersWithSelect from "@/components/NumbersWithSelect";
import ActionButtonsRow from "@/components/ActionButtonsRow";
import TimerDisplay from "@/components/TimerDisplay";
import StatusBadge from "@/components/StatusBadge";
import ErrorSnackbar from "@/components/errorSnackBar";
import DraggableSettings from "@/components/DraggableSetting";
import TimerInputGroup from "@/components/TimerInputGroup";
import IntervalSegmentPicker from "@/components/IntervalSegmentPicker";

export default function Interval() {
  const theme = useTheme();
  type Unit = "Seconds" | "Minutes" | "Hours";
  type IntervalName = "Active" | "Pause" | "Transition";

  interface IntervalUpdateEvent {
    intervalName: IntervalName;
    remainingMs: number;
  }

  interface Interval {
    id: number;
    name: string;
    durationSecs: number;
    unit: Unit;
    active: boolean;
  }

  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [isPaused, setIsPaused] = useState(true);
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);
  const [currentInterval, setCurrentInterval] =
    useState<IntervalName>("Active");
  const progress = useSharedValue(0);
  const { IntervalServiceModule } = NativeModules;
  const { main, ms } = formatDateTimer(timer, false);
  const [intervals, setIntervals] = useState<Interval[]>([
    {
      id: 1,
      durationSecs: 30,
      name: "Active",
      unit: "Seconds" as Unit,
      active: true,
    },
    {
      id: 2,
      name: "Recovery",
      durationSecs: 10,
      unit: "Seconds" as Unit,
      active: true,
    },
    {
      id: 3,
      name: "Transition",
      durationSecs: 10,
      unit: "Seconds" as Unit,
      active: false,
    },
  ]);

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
  const selectedInterval =
    intervals.find((i) => i.id === editingId) || intervals[0];

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
    const subUpdate = DeviceEventEmitter.addListener(
      "IntervalUpdate",
      (data: IntervalUpdateEvent) => {
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

    const subPause = DeviceEventEmitter.addListener("IntervalPaused", () => {
      setIsPaused(true);
    });

    const subResume = DeviceEventEmitter.addListener("IntervalResumed", () => {
      setIsPaused(false);
    });

    const subStop = DeviceEventEmitter.addListener("IntervalStopped", () => {
      setIsPaused(true);
      setTimer(0);
      counterRef.current = 0;
    });

    return () => {
      subUpdate.remove();
      subPause.remove();
      subResume.remove();
      subStop.remove();
    };
  }, []);

  const counterRef = React.useRef(0);

  const startInterval = () => {
    setIsPaused(false);
    setTimer(0);
    counterRef.current = 0;

    IntervalServiceModule.startSequence(
      JSON.stringify(
        intervals.map((i) => ({
          name: i.name,
          durationMs: convertToMs(i.durationSecs, i.unit),
        })),
      ),
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

  const firstInactiveIndex = intervals.findIndex((i) => !i.active);
  const lastActiveIndex = intervals.findLastIndex((i) => i.active);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[layout.outerContainer]}>
        <View
          style={{
            flex: 1,
            justifyContent: "flex-start",
            alignItems: "center",
            width: "100%",
            paddingVertical: 76,
            gap: 76,
          }}
        >
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
          />
        </View>
        {/* {!timer && (
          <HidablePanel visible={!timer}>
            <View
              style={{
                backgroundColor: theme.colors.surfaceVariant + "55",
                borderRadius: 28,
                padding: 16,
                width: "100%",
                marginTop: "auto",
                opacity: !timer ? 1 : 0.5,
              }}
            >
              <Text
                variant="titleMedium"
                style={{ alignSelf: "center", marginBottom: 8, opacity: 0.7 }}
              >
                Interval Settings
              </Text>
              {intervals.map((interval, index) => {
                const isNextToEnable = index === firstInactiveIndex;
                const isLastActive = index === lastActiveIndex;
                return (
                  <NumbersWithSelect
                    key={interval.id}
                    label={interval.name}
                    onValueChange={(val) =>
                      setIntervals((prev) =>
                        prev.map((i) =>
                          i.id === interval.id
                            ? { ...i, durationSecs: val }
                            : i,
                        ),
                      )
                    }
                    onUnitChange={(unit) =>
                      setIntervals((prev) =>
                        prev.map((i) =>
                          i.id === interval.id
                            ? { ...i, unit: unit as Unit }
                            : i,
                        ),
                      )
                    }
                    initialValue={interval.durationSecs.toString()}
                    isActive={interval.active}
                    onToggle={() => toggleInterval(interval.id)}
                    isLast={isNextToEnable}
                    isRemoveable={isLastActive}
                  />
                );
              })}
            </View>
          </HidablePanel>
        )} */}

        {/* <DraggableSettings isTimerRunning={!!timer}>
          {intervals.map((interval, index) => (
            <NumbersWithSelect
              key={interval.id}
              label={interval.name}
              onValueChange={(val) =>
                setIntervals((prev) =>
                  prev.map((i) =>
                    i.id === interval.id ? { ...i, durationSecs: val } : i,
                  ),
                )
              }
              onUnitChange={(unit) =>
                setIntervals((prev) =>
                  prev.map((i) =>
                    i.id === interval.id ? { ...i, unit: unit as Unit } : i,
                  ),
                )
              }
              initialValue={interval.durationSecs.toString()}
              isActive={interval.active}
              onToggle={() => toggleInterval(interval.id)}
              isLast={index === firstInactiveIndex}
              isRemoveable={index === lastActiveIndex}
            />
          ))}
        </DraggableSettings> */}

        {/* <DraggableSettings isTimerRunning={!!timer}>
          {intervals.map((interval, index) => {
            // Logic for showing the Add/Remove buttons
            const isNextToEnable = index === firstInactiveIndex;
            const isLastActive = index === lastActiveIndex;

            // Convert existing data to total seconds for the new component
            const totalSeconds =
              convertToMs(interval.durationSecs, interval.unit) / 1000;

            return (
              <TimerInputGroup
                key={interval.id}
                label={interval.name}
                initialValueInSeconds={totalSeconds}
                isActive={interval.active}
                isLast={isNextToEnable}
                isRemoveable={isLastActive}
                onToggle={() => toggleInterval(interval.id)}
                onDurationChange={(newTotalSeconds) => {
                  // Update the state back to your original format
                  setIntervals((prev) =>
                    prev.map((i) =>
                      i.id === interval.id
                        ? {
                            ...i,
                            durationSecs: newTotalSeconds,
                            unit: "Seconds" as Unit, // We simplify to Seconds as the component handles the math
                          }
                        : i,
                    ),
                  );
                }}
              />
            );
          })}
        </DraggableSettings> */}

        <DraggableSettings isTimerRunning={!!timer}>
          <IntervalSegmentPicker
            intervals={intervals}
            editingId={editingId}
            setEditingId={setEditingId}
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
