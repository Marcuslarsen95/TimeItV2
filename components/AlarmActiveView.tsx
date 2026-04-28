import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

interface AlarmActiveViewProps {
  onStop: () => void;
  title?: string;
  subtitle?: string;
}

const AlarmActiveView = ({
  onStop,
  title = "Time's up!",
  subtitle = "Tap below to silence the alarm",
}: AlarmActiveViewProps) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text
        variant="displaySmall"
        style={[styles.title, { color: theme.colors.error }]}
      >
        {title}
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
      >
        {subtitle}
      </Text>
      <Button
        mode="contained"
        icon="notifications-off-outline"
        onPress={onStop}
        buttonColor={theme.colors.error}
        textColor={theme.colors.onError}
        style={styles.button}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
      >
        Stop alarm
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  title: {
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 16,
  },
  button: {
    borderRadius: 12,
    minWidth: 200,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});

export default AlarmActiveView;
