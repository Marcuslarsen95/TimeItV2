import { View, StyleSheet, AppState } from "react-native";
import {
  Surface,
  Text,
  Button,
  Switch,
  useTheme,
  Snackbar,
} from "react-native-paper";
import { layout } from "../../styles/layout";

import DurationPicker from "../../components/DurationPicker";
import React, { useState } from "react";
import { formatDateTimer } from "../../utils/HelperFunctions";
// import { useAudioPlayer } from "expo-audio";
import HandleNotification from "@/utils/HandleNotification";
import * as Notifications from "expo-notifications";

export default function Index() {
  const [appState, setAppState] = useState(AppState.currentState);
  const [inputTime, setInputtime] = useState(10000);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [isSnackbarVisible, setIsSnackbarVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedRemaining, setPausedRemaining] = useState(0); // Stores time left
  const [displayTimer, setDisplayTimer] = useState(true);
  const theme = useTheme();
  const timerRef = React.useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );
  const audioSource = require("../../assets/sounds/beep.mp3");
  // const player = useAudioPlayer(audioSource);
  const notifIdRef = React.useRef<string>("null");
  const step = 7;

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current); // clears interval
    };
  }, []);

  React.useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      setAppState(next);
    });
    return () => sub.remove();
  }, []);

  const startTimer = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (inputTime > 0) {
      const endTime = Date.now() + inputTime;
      setTimer(inputTime);
      const notificationId = await HandleNotification(
        "Time out",
        "Time has run out!",
        inputTime / 1000,
        "notif_3",
        "beep.mp3",
      );
      notifIdRef.current = notificationId;

      timerRef.current = setInterval(async () => {
        const remaining = endTime - Date.now();

        if (remaining <= 500) {
          await Notifications.cancelScheduledNotificationAsync(
            notifIdRef.current,
          );
        }
        if (remaining <= 0) {
          if (appState === "active") {
            // player.play();
          }
          setTimer(0);
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = undefined;

          stopTimer();
        } else {
          setTimer(remaining);
        }
      }, step);
    }
  };

  const togglePause = async () => {
    // PAUSING
    if (!isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPausedRemaining(timer);
      setIsPaused(true);
      await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
    } else {
      // RESUMING
      setIsPaused(false);
      const newEndTime = Date.now() + pausedRemaining;

      if (newEndTime - Date.now() > 0) {
        const notificationId = await HandleNotification(
          "Time out",
          "Time has run out!",
          pausedRemaining / 1000,
          "notif_3",
          "beep.mp3",
        );
        notifIdRef.current = notificationId;
      }
      timerRef.current = setInterval(async () => {
        const remaining = newEndTime - Date.now();

        if (remaining <= 500) {
          await Notifications.cancelScheduledNotificationAsync(
            notifIdRef.current,
          );
        }

        if (remaining <= 0) {
          // if (appState === "active") player.play();
          setTimer(0);
          clearInterval(timerRef.current);
        } else {
          setTimer(remaining);
        }
      }, step);
    }
  };

  const stopTimer = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }

    setTimer(0);
    setIsPaused(false); // Reset pause state
    setPausedRemaining(0); // explicitly clear the pause
    await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
  };

  return (
    <View
      style={[
        layout.outerContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Surface
        style={[
          layout.container,
          {
            borderWidth: 1,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
        elevation={1}
      >
        <Surface
          elevation={0}
          style={[
            layout.timerSurface,
            {
              backgroundColor: theme.colors.surfaceVariant, // Let the outer container show through
              borderWidth: 1,
              borderColor: theme.colors.outlineVariant, // Subtle green-tinted border
              borderRadius: 12,
            },
          ]}
        >
          <Text variant="headlineLarge">{formatDateTimer(timer)}</Text>
        </Surface>
        <DurationPicker
          label="Set timer"
          onTimeChange={(val) => setInputtime(val)}
          initialValue={inputTime} // Pass the default state here
        />
      </Surface>
      <View style={layout.footer}>
        {!timer ? (
          <View style={layout.buttonRow}>
            <Button
              icon="timer-outline"
              mode="contained"
              onPress={startTimer}
              style={layout.primaryButton}
              labelStyle={{ fontSize: 20 }}
            >
              Start timer!
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
