import { View, NativeModules, DeviceEventEmitter } from "react-native";
import { Button, useTheme, IconButton } from "react-native-paper";
import { useSharedValue } from "react-native-reanimated";
import { layout } from "../../styles/layout";
import {
  formatDateTimer,
  getTimerFontSize,
  lightenColor,
  convertToMs,
  getUrgencyColor,
} from "../../utils/HelperFunctions";
import React, { useState } from "react";
import NumberWithDropdown from "@/components/NumbersWithDropdown";
import NumbersWithSelect from "@/components/NumbersWithSelect";
import ErrorSnackbar from "@/components/errorSnackBar";
import CircularTimer from "@/components/CircularTimer";
const INTERVAL_NAMES = ["Active", "Pause", "Transition"] as const;

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
    sound: string;
    pingPoint: number;
  }

  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [isPaused, setIsPaused] = useState(true);
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);
  const progress = useSharedValue(0);
  const { IntervalServiceModule } = NativeModules;
  const { main, ms } = formatDateTimer(timer);
  const [intervals, setIntervals] = useState<Interval[]>([
    {
      id: 1,
      durationSecs: 10,
      name: "Active",
      unit: "Seconds" as Unit,
      sound: "beep.mp3",
      pingPoint: 10000,
    },
    {
      id: 2,
      name: "Pause",
      durationSecs: 10,
      unit: "Seconds" as Unit,
      sound: "beep.mp3",
      pingPoint: 10000,
    },
  ]);

  const [strokeColor, setStrokeColor] = useState(theme.colors.primary);
  const currentStrokeColor = getUrgencyColor(timer, isPaused);

  React.useEffect(() => {
    const subUpdate = DeviceEventEmitter.addListener(
      "IntervalUpdate",
      (data: IntervalUpdateEvent) => {
        const { intervalName: name, remainingMs } = data;
        setTimer(remainingMs);

        const idx = intervals.findIndex((i) => i.name === name);
        if (idx !== -1) {
          const interval = intervals[idx];
          const duration = convertToMs(interval.durationSecs, interval.unit);

          // Compute progress (1 → 0)
          const t = remainingMs / duration;

          setStrokeColor(getUrgencyColor(remainingMs, isPaused));

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
      setIsPaused(false);
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

  const removeLastInterval = () => setIntervals((prev) => prev.slice(0, -1));

  const addNewInterval = () => {
    if (intervals.length > 2) return;
    setIntervals((prev) => [
      ...prev,
      {
        id: intervals.length + 1,
        name: INTERVAL_NAMES[intervals.length],
        durationSecs: 10,
        unit: "Seconds",
        sound: "beep.mp3",
        pingPoint: 10000,
      },
    ]);
  };
  return (
    <View
      style={[
        layout.outerContainer,
        {
          backgroundColor: theme.colors.background,
          position: "relative",
          justifyContent: "space-between",
        },
      ]}
    >
      <CircularTimer
        radius={125}
        strokeWidth={10}
        baseStrokeColor={theme.colors.onSurface}
        strokeColor={currentStrokeColor}
        gradientColors={[
          currentStrokeColor,
          lightenColor(currentStrokeColor, 0.8),
        ]}
        mainTime={main}
        msPart={ms}
        fontSize={getTimerFontSize(timer)}
        isPaused={isPaused}
      />

      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
          paddingVertical: 16,
          width: "100%",
          gap: 16,
          position: "relative",
        }}
      >
        {intervals.map((interval) => (
          <NumbersWithSelect
            key={interval.id}
            label={interval.name + ` interval`}
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
          />
        ))}

        <View
          style={[
            layout.buttonRow,
            {
              flexDirection: "row",
              justifyContent: "flex-end",
              width: "100%",
              position: "absolute",
              top: -30,
              right: 0,
              zIndex: 1,
            },
          ]}
        >
          <IconButton
            icon="add"
            mode="contained"
            disabled={intervals.length > 2}
            size={24}
            onPress={addNewInterval}
          />

          <IconButton
            icon="remove"
            mode="contained"
            disabled={intervals.length <= 1}
            size={24}
            onPress={removeLastInterval}
          />
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <View
        style={[layout.footer, { position: "absolute", zIndex: 1, bottom: 16 }]}
      >
        {!timer && <View style={layout.buttonRow}></View>}

        {!timer ? (
          <View style={layout.buttonRow}>
            <Button
              icon="swap-horizontal-sharp"
              mode="contained"
              onPress={startInterval}
              style={[layout.marginBottom, layout.primaryButton]}
              labelStyle={{ fontSize: 20 }}
            >
              Start interval
            </Button>
          </View>
        ) : (
          <View style={layout.buttonRow}>
            <Button
              icon={isPaused ? "play" : "pause-outline"}
              mode="contained"
              onPress={togglePause}
              style={[layout.marginBottom, layout.flexButton]}
            >
              {isPaused ? "Resume" : "Pause"}
            </Button>
            <Button
              icon="stop-outline"
              mode="contained"
              onPress={stopTimer}
              style={[
                layout.marginBottom,
                layout.flexButton,
                { backgroundColor: theme.colors.error },
              ]}
            >
              Stop timer
            </Button>
          </View>
        )}
      </View>
      <ErrorSnackbar
        visible={isSnackbarVisible}
        message={error}
        onDismiss={() => setIsSnackbarVisible(false)}
        color={theme.colors.error}
        textColor={theme.colors.onError}
      />
    </View>
  );
}
