import { View, StyleSheet } from "react-native";
import { Surface, Text, Button, useTheme, Snackbar } from "react-native-paper";
import React, { useState } from "react";
import DurationPicker from "../../components/DurationPicker";
import { formatDateTimer } from "../../utils/HelperFunctions";
import { layout } from "../../styles/layout";

export default function RandomScreen() {
  const [minTime, setMinTime] = useState(30000);
  const [maxTime, setMaxTime] = useState(59000);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [displayTimer, setDisplayTimer] = useState(false);
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedRemaining, setPausedRemaining] = useState(0); // Stores time left
  const theme = useTheme();
  const timerRef = React.useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const step = 7;

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current); // clears interval
    };
  }, []);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (minTime > 0 && maxTime > 0) {
      if (maxTime > minTime) {
        const randomTime = Math.floor(
          Math.random() * (maxTime - minTime) + minTime,
        );
        const endTime = Date.now() + randomTime; // set the datetime of when the timer should stop. Helps to keep timer going if app is paused or occupied
        setTimer(randomTime);

        timerRef.current = setInterval(async () => {
          const remaining = endTime - Date.now(); // Check if timer is past now

          if (remaining <= 0) {
            setTimer(0);
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = undefined;
          } else {
            setTimer(remaining);
          }
        }, step);
      } else {
        setIsSnackbarVisible(true);
        setError("Maximum timer must be higher than minimum timer.");
      }
    } else {
      setIsSnackbarVisible(true);
      setError(
        "Both timers must be set! Make sure that the maximum timer is higher than the minimum one.",
      );
    }
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    setTimer(0);
  };

  const togglePause = () => {
    // PAUSING
    if (!isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPausedRemaining(timer);
      setIsPaused(true);
    } else {
      // RESUMING
      setIsPaused(false);
      const newEndTime = Date.now() + pausedRemaining;

      timerRef.current = setInterval(() => {
        const remaining = newEndTime - Date.now();
        if (remaining <= 0) {
          setTimer(0);
          clearInterval(timerRef.current);
        } else {
          setTimer(remaining);
        }
      }, 69);
    }
  };

  return (
    <View
      style={[
        layout.outerContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Surface style={[layout.container]} elevation={2}>
        <Surface
          elevation={0}
          style={[
            layout.timerSurface,
            {
              borderWidth: 1,
              borderColor: theme.colors.outlineVariant, // Subtle green-tinted border
              borderRadius: 12,
              backgroundColor: theme.colors.surfaceVariant,
            },
          ]}
        >
          <Text variant="headlineLarge">
            {displayTimer ? formatDateTimer(timer) : "-- : -- : -- : --"}
          </Text>
        </Surface>
        <DurationPicker
          label="Minimum timer"
          onTimeChange={(val) => setMinTime(val)}
          initialValue={minTime} // Pass the default state here
        />

        <DurationPicker
          label="Maximum timer"
          onTimeChange={(val) => setMaxTime(val)}
          initialValue={maxTime} // Pass the default state here
        />
      </Surface>
      <View style={layout.footer}>
        <View style={layout.buttonRow}>
          <Button
            icon={displayTimer ? "eye-off-outline" : "eye-outline"}
            mode="contained"
            onPress={() => setDisplayTimer(!displayTimer)}
            style={[
              layout.secondaryButton,
              layout.marginBottom,
              { backgroundColor: theme.colors.tertiary },
            ]}
          >
            {displayTimer ? "Hide timer" : "Show timer"}
          </Button>
        </View>

        {!timer ? (
          <View style={layout.buttonRow}>
            <Button
              icon="timer-outline"
              mode="contained"
              onPress={startTimer}
              style={layout.primaryButton}
            >
              Start random timer!
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

const styles = StyleSheet.create({});
