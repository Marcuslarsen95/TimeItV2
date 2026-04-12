import React from "react";
import { View, StyleSheet } from "react-native";
import {
  SegmentedButtons,
  useTheme,
  Text,
  Button,
  Switch,
} from "react-native-paper";
import TimeWheelPicker from "@/components/TimeWheelPicker";

interface Interval {
  id: number;
  name: string;
  durationSecs: number;
  active: boolean;
}

interface Props {
  intervals: Interval[];
  editingId: number;
  setEditingId: (id: number) => void;
  onDurationChange: (id: number, newSeconds: number) => void;
  onToggle: (id: number) => void;
  onInputFocusChange?: (isFocused: boolean) => void;
}

export default function IntervalSegmentPicker({
  intervals,
  editingId,
  setEditingId,
  onDurationChange,
  onToggle,
  onInputFocusChange,
}: Props) {
  const theme = useTheme();
  const selectedInterval =
    intervals.find((i) => i.id === editingId) || intervals[0];

  return (
    <View style={styles.container}>
      {/* 1. THE SELECTOR - 'disabled' removed to allow clicking inactive segments */}
      <SegmentedButtons
        value={editingId.toString()}
        onValueChange={(val) => setEditingId(parseInt(val))}
        buttons={intervals.map((i) => {
          const isSelected = editingId === i.id;

          const getBackgroundColor = () => {
            if (isSelected) {
              return i.active
                ? theme.colors.primary
                : theme.colors.primaryContainer; // Tinted selection for disabled
            }
            return i.active
              ? theme.colors.secondary
              : theme.colors.surfaceDisabled;
          };

          const getTextColor = () => {
            if (isSelected) {
              return i.active
                ? theme.colors.onPrimary
                : theme.colors.onPrimaryContainer;
            }
            return i.active
              ? theme.colors.onSecondary
              : theme.colors.onSurfaceDisabled;
          };

          return {
            value: i.id.toString(),
            label: i.name,
            checkedColor: getTextColor(),
            uncheckedColor: getTextColor(),
            style: {
              borderColor: isSelected
                ? theme.colors.primary
                : theme.colors.outlineVariant,
              borderWidth: isSelected ? 2 : 1, // Make the selection border thicker
              backgroundColor: getBackgroundColor(),
              opacity: i.active ? 1 : 0.8, // Slightly higher opacity so we can see the selection
            },
            labelStyle: {
              fontWeight: isSelected ? "900" : "600",
              fontSize: 12,
              // Ensure text is visible
              color: getTextColor(),
            },
          };
        })}
        style={styles.segments}
      />

      {/* 2. THE TOGGLE ROW - Controls the currently selected segment */}
      <View
        style={[
          styles.toggleRow,
          { backgroundColor: theme.colors.surfaceVariant + "33" },
        ]}
      >
        <Text
          variant="labelMedium"
          style={{ color: theme.colors.onSurfaceVariant, fontWeight: "700" }}
        >
          ENABLE {selectedInterval.name.toUpperCase()}
        </Text>
        <Switch
          value={selectedInterval.active}
          onValueChange={() => onToggle(selectedInterval.id)}
          color={theme.colors.primary}
        />
      </View>

      {/* 3. THE MASTER INPUT */}
      <View
        style={[
          styles.inputContainer,
          { opacity: selectedInterval.active ? 1 : 0.4 },
        ]}
      >
        <TimeWheelPicker
          label={`${selectedInterval.name} duration`}
          valueInSeconds={selectedInterval.durationSecs}
          onChange={(newSeconds) =>
            onDurationChange(selectedInterval.id, newSeconds)
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
    alignItems: "center",
  },
  segments: {
    width: "100%",
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  inputContainer: {
    width: "100%",
    alignItems: "center",
  },
  inputWrapper: { marginTop: 20, alignItems: "center", width: "100%" },
  wheelContainer: {
    borderRadius: 50,
    width: "100%",
    paddingHorizontal: 10,
  },
});
