import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput as RNTextInput } from "react-native";
import { Text, useTheme, Surface } from "react-native-paper";

interface Props {
  label: string;
  initialValueInSeconds: number;
  onDurationChange: (totalSeconds: number) => void;
  isActive: boolean;
  onFocusChange?: (isFocused: boolean) => void;
  size?: number;
}

export default function TimerInputGroup({
  label,
  initialValueInSeconds,
  onDurationChange,
  isActive,
  onFocusChange,
  size = 200,
}: Props) {
  const theme = useTheme();

  const [mins, setMins] = useState("");
  const [secs, setSecs] = useState("");
  const [focusedField, setFocusedField] = useState<"m" | "s" | null>(null);

  useEffect(() => {
    const m = Math.floor(initialValueInSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (initialValueInSeconds % 60).toString().padStart(2, "0");
    setMins(m);
    setSecs(s);
  }, [initialValueInSeconds]);

  const syncParent = (mStr: string, sStr: string) => {
    const mNum = parseInt(mStr, 10) || 0;
    const sNum = parseInt(sStr, 10) || 0;
    onDurationChange(mNum * 60 + sNum);
  };

  const handleMinsChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 2);
    setMins(cleaned);
    syncParent(cleaned, secs);
  };

  const handleSecsChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 2);
    setSecs(cleaned);
    syncParent(mins, cleaned);
  };

  const handleFocus = (field: "m" | "s") => {
    setFocusedField(field);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    setMins((prev) => (prev === "" ? "00" : prev.padStart(2, "0")));
    setSecs((prev) => (prev === "" ? "00" : prev.padStart(2, "0")));
    setFocusedField(null);
    onFocusChange?.(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <Text variant="labelLarge" style={styles.label}>
          {label}
        </Text>

        <Surface
          elevation={isActive ? 1 : 0}
          style={[
            styles.pillContainer,
            {
              backgroundColor: theme.colors.secondary,
              height: size,
              width: size,
              borderRadius: size / 2,
            },
          ]}
        >
          {/* MINUTES */}
          <View
            style={[
              styles.unitPill,
              {
                borderColor:
                  focusedField === "m" ? theme.colors.primary : "transparent",
                borderRadius: 24,
                backgroundColor:
                  focusedField === "m"
                    ? theme.colors.surface + "22"
                    : "transparent",
                height: size / 3,
                width: size / 2,
              },
            ]}
          >
            <RNTextInput
              value={mins}
              editable={isActive}
              onChangeText={handleMinsChange}
              onFocus={() => handleFocus("m")}
              onBlur={handleBlur}
              keyboardType="numeric"
              style={[
                styles.input,
                {
                  color: theme.colors.onPrimary,
                  fontSize: size / 5,
                },
              ]}
              selectionColor={theme.colors.primary}
              selectTextOnFocus={true}
            />
            <Text
              style={[styles.unitIndicator, { color: theme.colors.onPrimary }]}
            >
              Mins
            </Text>
          </View>
          <View
            style={{
              width: 60,
              height: 1.5,
              backgroundColor: theme.colors.onPrimary,
              opacity: 0.3,
            }}
          />

          {/* SECONDS - Fixed focusedField check below */}
          <View
            style={[
              styles.unitPill,
              {
                borderColor:
                  focusedField === "s" ? theme.colors.primary : "transparent",
                borderRadius: 24,
                backgroundColor:
                  focusedField === "s"
                    ? theme.colors.surface + "22"
                    : "transparent",
                height: size / 3,
                width: size / 2,
              },
            ]}
          >
            <RNTextInput
              value={secs}
              editable={isActive}
              onChangeText={handleSecsChange}
              onFocus={() => handleFocus("s")}
              onBlur={handleBlur}
              keyboardType="numeric"
              style={[
                styles.input,
                { color: theme.colors.onPrimary, fontSize: size / 5 },
              ]}
              selectionColor={theme.colors.primary}
              selectTextOnFocus={true}
            />
            <Text
              style={[styles.unitIndicator, { color: theme.colors.onPrimary }]}
            >
              Secs
            </Text>
          </View>
        </Surface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", alignItems: "center" },
  contentWrapper: { alignItems: "center" },
  label: {
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontSize: 10,
    fontWeight: "800",
  },
  pillContainer: {
    flexDirection: "column", // stack vertically
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    // subtle ring
  },
  unitPill: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 10,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    fontWeight: "900",
    textAlign: "center",
  },
  unitIndicator: {
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 2,
    opacity: 0.7,
  },
  colon: { fontSize: 36, fontWeight: "900", marginHorizontal: 6 },
});
