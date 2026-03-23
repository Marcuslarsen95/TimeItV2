import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput as RNTextInput } from "react-native";
import { Text, useTheme, Surface } from "react-native-paper";

interface Props {
  label: string;
  initialValueInSeconds: number;
  onDurationChange: (totalSeconds: number) => void;
  isActive: boolean;
  onFocusChange?: (isFocused: boolean) => void;
}

export default function TimerInputGroup({
  label,
  initialValueInSeconds,
  onDurationChange,
  isActive,
  onFocusChange,
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
  }, [label]);

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
            { backgroundColor: theme.colors.secondary },
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
              style={[styles.input, { color: theme.colors.onPrimary }]}
              selectionColor={theme.colors.primary}
              selectTextOnFocus={true}
            />
            <Text
              style={[styles.unitIndicator, { color: theme.colors.onPrimary }]}
            >
              Mins
            </Text>
          </View>

          <Text style={[styles.colon, { color: theme.colors.onPrimary }]}>
            :
          </Text>

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
              style={[styles.input, { color: theme.colors.onPrimary }]}
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
  container: { width: "100%", alignItems: "center", marginVertical: 10 },
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
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  unitPill: {
    flexDirection: "row",
    alignItems: "center",
    height: 76,
    width: 100,
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
});
