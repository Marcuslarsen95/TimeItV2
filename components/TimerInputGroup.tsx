import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput as RNTextInput } from "react-native";
import { Text, useTheme, IconButton, Surface } from "react-native-paper";

interface Props {
  label: string;
  initialValueInSeconds: number;
  onDurationChange: (totalSeconds: number) => void;
  isActive: boolean;
  onToggle: () => void;
  isRemoveable: boolean;
  isLast: boolean;
}

export default function TimerInputGroup({
  label,
  initialValueInSeconds,
  onDurationChange,
  isActive,
  onToggle,
  isRemoveable,
  isLast,
}: Props) {
  const theme = useTheme();

  const [mins, setMins] = useState(
    Math.floor(initialValueInSeconds / 60)
      .toString()
      .padStart(2, "0"),
  );
  const [secs, setSecs] = useState(
    (initialValueInSeconds % 60).toString().padStart(2, "0"),
  );
  const [focusedField, setFocusedField] = useState<"m" | "s" | null>(null);

  useEffect(() => {
    // Ensure we always have a valid number before calculating
    const parsedMins = parseInt(mins, 10);
    const parsedSecs = parseInt(secs, 10);

    const validMins = isNaN(parsedMins) ? 0 : parsedMins;
    const validSecs = isNaN(parsedSecs) ? 0 : parsedSecs;

    const total = validMins * 60 + validSecs;

    // Only call parent if the value is actually a number
    onDurationChange(total);
  }, [mins, secs]);

  const handleTextChange = (text: string, setter: (val: string) => void) => {
    // Regex: only allow digits, no hyphens or dots
    const cleaned = text.replace(/[^0-9]/g, "");
    // Limit to 2 digits for MM:SS format
    setter(cleaned.slice(0, 2));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.contentWrapper, { opacity: isActive ? 1 : 0.38 }]}>
        <Text
          variant="labelLarge"
          style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
        >
          {label}
        </Text>

        {/* Use Surface for the main pill to get automatic elevation tinting in Dark Mode */}
        <Surface
          elevation={1}
          style={[
            styles.pillContainer,
            { backgroundColor: theme.colors.primaryContainer + "50" },
          ]}
        >
          {/* MINUTES INPUT */}
          <View
            style={[
              styles.unitPill,
              {
                backgroundColor: theme.colors.primary,
                borderColor:
                  focusedField === "m" ? theme.colors.primary : "transparent",
                borderTopLeftRadius: 36,
                borderBottomLeftRadius: 36,
              },
            ]}
          >
            <RNTextInput
              value={mins}
              onChangeText={(t) =>
                setMins(t.replace(/[^0-9]/g, "").slice(0, 2))
              }
              onFocus={() => setFocusedField("m")}
              onBlur={() => setFocusedField(null)}
              keyboardType="numeric"
              style={[styles.input, { color: theme.colors.onPrimary }]}
              selectionColor={theme.colors.primary}
            />
            <Text
              style={[styles.unitIndicator, { color: theme.colors.onPrimary }]}
            >
              Mins
            </Text>
          </View>

          <Text style={[styles.colon, { color: theme.colors.primary }]}>:</Text>

          {/* SECONDS INPUT */}
          <View
            style={[
              styles.unitPill,
              {
                backgroundColor: theme.colors.primary,
                borderColor:
                  focusedField === "s" ? theme.colors.primary : "transparent",
                borderTopRightRadius: 36,
                borderBottomRightRadius: 36,
              },
            ]}
          >
            <RNTextInput
              value={secs}
              onChangeText={(t) =>
                setSecs(t.replace(/[^0-9]/g, "").slice(0, 2))
              }
              onFocus={() => setFocusedField("s")}
              onBlur={() => setFocusedField(null)}
              keyboardType="numeric"
              style={[styles.input, { color: theme.colors.onPrimary }]}
              selectionColor={theme.colors.primary}
            />
            <Text
              style={[styles.unitIndicator, { color: theme.colors.onPrimary }]}
            >
              Secs
            </Text>
          </View>
        </Surface>
      </View>

      <View style={styles.actionButtonContainer}>
        {(isActive && isRemoveable && label !== "Active") ||
        (!isActive && isLast) ? (
          <IconButton
            icon={isActive ? "remove" : "add"}
            mode="contained"
            containerColor={theme.colors.surface}
            iconColor={isActive ? theme.colors.error : theme.colors.primary}
            size={20}
            onPress={onToggle}
            style={[
              styles.actionButton,
              { borderColor: theme.colors.outlineVariant },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
    alignItems: "center",
    marginVertical: 10,
  },
  contentWrapper: { alignItems: "center" },
  label: {
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontSize: 10,
    fontWeight: "800",
  },
  pillContainer: {
    flexDirection: "row",
    height: 96,
    width: "100%",
    maxWidth: 280,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  unitPill: {
    flexDirection: "row",
    alignItems: "center",
    height: 76,
    width: 100,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    fontSize: 36,
    fontWeight: "900",
    textAlign: "center",
    padding: 0,
  },
  unitIndicator: {
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 2,
    opacity: 0.7,
  },
  colon: { fontSize: 36, fontWeight: "900", marginHorizontal: 6 },
  actionButtonContainer: {
    position: "absolute",
    right: "3%",
    top: 35,
    zIndex: 20,
  },
  actionButton: { elevation: 3, borderWidth: 1, margin: 0 },
});
