import { View, ScrollView } from "react-native";
import {
  Text,
  Button,
  useTheme,
  Snackbar,
  IconButton,
} from "react-native-paper";
import {
  useSharedValue,
  withTiming,
  withRepeat,
} from "react-native-reanimated";

import { layout } from "../../styles/layout";
import { formatDateTimer } from "../../utils/HelperFunctions";
import React, { useState } from "react";
import { useAudioPlayer } from "expo-audio";
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

  const [intervals, setIntervals] = useState<Interval[]>([
    {
      id: 1,
      durationSecs: 30,
      name: "Active",
      unit: "Seconds" as Unit,
      sound: "beep.mp3",
      pingPoint: 30000,
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

  const multiplier: Record<Unit, number> = {
    Seconds: 1,
    Minutes: 60,
    Hours: 3600,
  };

  // interval end sound
  const beepSource = require("../../assets/sounds/beep.mp3");
  const beepPlayer = useAudioPlayer(beepSource);

  // countdown ping sound
  const countdownBeep = require("../../assets/sounds/countdown_beep_v3.mp3");
  const cdping = useAudioPlayer(countdownBeep);

  const playBeep = () => {
    if (beepPlayer) {
      beepPlayer.seekTo(0);
      beepPlayer.play();
    }
  };

  const playPing = () => {
    if (cdping) {
      cdping.seekTo(0);
      cdping.play();
    }
  };

  const counterRef = React.useRef(0);
  const intervalStartRef = React.useRef(0);
  const hasPlayedRef = React.useRef(false);

  const startInterval = () => {
    clearInterval(timerRef.current);
    counterRef.current = 0;
    const first = intervalsRef.current[0];

    intervalStartRef.current = Date.now();
    setStrokeColor(intervalColors[first.name]);

    progress.value = 1;
    // full circle at start
    setTimer(first.durationSecs * multiplier[first.unit] * 1000);

    pulse.value = withRepeat(withTiming(1.4, { duration: 800 }), -1, true);

    timerRef.current = setInterval(tick, 50);
  };

  const togglePause = () => {
    if (!isPaused) {
      clearInterval(timerRef.current);
      setIsPaused(true);
      pulse.value = withTiming(1, { duration: 300 });
    } else {
      const current = intervalsRef.current[counterRef.current];
      const currentDuration =
        current.durationSecs * multiplier[current.unit] * 1000;

      intervalStartRef.current = Date.now() - (currentDuration - timer);
      timerRef.current = setInterval(tick, 50);
      setIsPaused(false);
      pulse.value = withRepeat(withTiming(1.4, { duration: 800 }), -1, true);
    }
  };

  const tick = () => {
    const now = Date.now();
    const current = intervalsRef.current[counterRef.current];
    // Control pulse based on interval type
    // Pulse only when timer is running

    const currentDuration =
      current.durationSecs * multiplier[current.unit] * 1000;

    const localTime = now - intervalStartRef.current;
    const remaining = currentDuration - localTime;
    const intervalFinished = remaining <= 0;

    setTimer(Math.max(remaining, 0));

    // progress should count DOWN
    progress.value = remaining / currentDuration;

    if (remaining < 50 && !hasPlayedRef.current) {
      playBeep();
      hasPlayedRef.current = true;
    }

    const cdPingTimes = [3000, 2000, 1000]; // countdown timer ping times

    cdPingTimes.forEach((t) => {
      if (remaining < t && remaining > t - 60) {
        playPing();
      }
    });

    if (intervalFinished) {
      hasPlayedRef.current = false; // Reset for next interval
      counterRef.current += 1;

      if (counterRef.current >= intervalsRef.current.length) {
        const first = intervalsRef.current[0];
        counterRef.current = 0;
        intervalStartRef.current = Date.now();
        setStrokeColor(intervalColors[first.name]);
        progress.value = 1;
        // full circle for new interval
        setTimer(first.durationSecs * multiplier[first.unit] * 1000);
        return;
      }

      const next = intervalsRef.current[counterRef.current];
      intervalStartRef.current = now;
      setStrokeColor(intervalColors[next.name]);
      progress.value = 1;
    }
  };

  const stopTimer = async () => {
    setTimer(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
      progress.value = 0;
      pulse.value = withTiming(1, { duration: 300 });
    }
    setIsPaused(false);
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
