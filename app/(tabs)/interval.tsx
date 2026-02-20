import {
  View,
  ScrollView,
  NativeModules,
  DeviceEventEmitter,
} from "react-native";
import {
  Text,
  Button,
  useTheme,
  Snackbar,
  IconButton,
} from "react-native-paper";
import { useSharedValue } from "react-native-reanimated";

import { layout } from "../../styles/layout";
import { formatDateTimer } from "../../utils/HelperFunctions";
import React, { useState } from "react";
import NumberWithDropdown from "@/components/NumbersWithDropdown";
import CircularProgress from "@/components/CircularProgress";

export default function Interval() {
  const theme = useTheme();
  type Unit = "Seconds" | "Minutes" | "Hours";
  const intervalName = ["Active", "Pause", "Transition"];
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
  const [isPaused, setIsPaused] = useState(false);
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);
  const progress = useSharedValue(0);
  const pulse = useSharedValue(1); // <-- add this
  const { IntervalServiceModule } = NativeModules;

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
  const intervalsRef = React.useRef(intervals);

  const intervalColors: Record<string, string> = {
    Active: theme.colors.primary,
    Pause: theme.colors.secondary,
    Transition: theme.colors.tertiary,
  };

  const [strokeColor, setStrokeColor] = useState(intervalColors.Active);

  React.useEffect(() => {
    intervalsRef.current = intervals;
  }, [intervals]);

  const timerRef = React.useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const subUpdate = DeviceEventEmitter.addListener(
      "IntervalUpdate",
      (data) => {
        const { intervalName, remainingMs } = data;

        setTimer(remainingMs);
        setStrokeColor(intervalColors[intervalName]);

        // Update progress based on the interval that matches the name
        const idx = intervalsRef.current.findIndex(
          (i) => i.name === intervalName,
        );
        if (idx !== -1) {
          const duration = intervalsRef.current[idx].durationSecs * 1000;
          progress.value = remainingMs / duration;
          counterRef.current = idx; // <-- keep JS in sync with native
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
      progress.value = 0;
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
    progress.value = 0;
    counterRef.current = 0;
    setStrokeColor(intervalColors.Active);

    IntervalServiceModule.startService();
    IntervalServiceModule.startSequence(
      JSON.stringify(
        intervals.map((i) => ({
          name: i.name,
          durationMs: i.durationSecs * 1000,
        })),
      ),
    );
  };

  const togglePause = () => {
    IntervalServiceModule.toggle();
  };

  const stopTimer = async () => {
    IntervalServiceModule.stop();
  };

  const removeLastInterval = () => setIntervals((prev) => prev.slice(0, -1));

  const addNewInterval = () =>
    setIntervals((prev) => [
      ...prev,
      {
        id: intervals.length + 1,
        name: intervalName[intervals.length],
        durationSecs: 10,
        unit: "Seconds",
        sound: "beep.mp3",
        pingPoint: 10000,
      },
    ]);

  return (
    <View
      style={[
        layout.outerContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <CircularProgress
        progress={progress}
        radius={100}
        pulse={pulse}
        strokeWidth={16}
        baseStrokeColor={theme.colors.onSurface}
        strokeColor={strokeColor}
        gradientColors={[theme.colors.primary, theme.colors.secondary]}
        text={formatDateTimer(timer)}
      />

      <ScrollView
        contentContainerStyle={{
          flexDirection: "column",
          paddingVertical: 16,
          width: "100%",
          gap: 16,
        }}
        showsVerticalScrollIndicator={true}
      >
        {intervals.map((interval) => (
          <NumberWithDropdown
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
            },
          ]}
        >
          <IconButton
            icon="add"
            mode="contained"
            size={24}
            onPress={addNewInterval}
          />
          <IconButton
            icon="remove"
            mode="contained"
            size={24}
            onPress={removeLastInterval}
          />
        </View>
      </ScrollView>

      <View style={layout.footer}>
        {!timer && !timerRef.current && <View style={layout.buttonRow}></View>}

        {!timer && !timerRef.current ? (
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

      <Snackbar
        visible={isSnackbarVisible}
        onDismiss={() => setIsSnackbarVisible(false)}
        style={{ backgroundColor: theme.colors.error }}
        theme={{ colors: { accent: theme.colors.onError } }}
        wrapperStyle={{ bottom: -50 }}
      >
        <Text style={{ color: theme.colors.onError }}>{error}</Text>
      </Snackbar>
    </View>
  );
}
