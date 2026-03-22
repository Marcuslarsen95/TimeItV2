import React from "react";
import { View, StyleSheet } from "react-native";
import { SegmentedButtons, useTheme, Text } from "react-native-paper";
import TimerInputGroup from "./TimerInputGroup";

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
}

export default function IntervalSegmentPicker({
  intervals,
  editingId,
  setEditingId,
  onDurationChange,
}: Props) {
  const theme = useTheme();
  const selectedInterval =
    intervals.find((i) => i.id === editingId) || intervals[0];

  return (
    <View style={styles.container}>
      {/* 1. THE SELECTOR */}
      <SegmentedButtons
        value={editingId.toString()}
        onValueChange={(val) => setEditingId(parseInt(val))}
        buttons={intervals.map((i) => {
          const isSelected = editingId === i.id;

          // Logic for background color
          const getBgColor = () => {
            if (!i.active) return theme.colors.surfaceDisabled;
            return isSelected ? theme.colors.primary : theme.colors.secondary;
          };

          // Logic for text/icon color
          const getTextColor = () => {
            if (!i.active) return theme.colors.onSurfaceDisabled;
            return isSelected
              ? theme.colors.onPrimary
              : theme.colors.onSecondary;
          };

          return {
            value: i.id.toString(),
            label: i.name,
            disabled: !i.active, // Keeps the button un-pressable if inactive
            checkedColor: getTextColor(),
            uncheckedColor: getTextColor(),
            style: {
              borderColor: theme.colors.outlineVariant,
              backgroundColor: getBgColor(),
              // We can keep a slight opacity drop to reinforce the 'disabled' look
              opacity: i.active ? 1 : 0.7,
            },
            labelStyle: {
              fontWeight: isSelected ? "900" : "600",
              textTransform: "uppercase",
              fontSize: 12,
            },
          };
        })}
        style={styles.segments}
      />

      {/* 2. THE MASTER INPUT */}
      <View style={styles.inputContainer}>
        <TimerInputGroup
          label={`Set ${selectedInterval.name} Time`}
          initialValueInSeconds={selectedInterval.durationSecs}
          isActive={selectedInterval.active}
          isLast={false}
          isRemoveable={false}
          onToggle={() => {}}
          onDurationChange={(newSeconds: number) =>
            onDurationChange(editingId, newSeconds)
          }
        />
      </View>

      {!selectedInterval.active && (
        <View style={styles.helperContainer}>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.error, fontWeight: "700" }}
          >
            THIS INTERVAL IS CURRENTLY DISABLED
          </Text>
        </View>
      )}
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
    marginBottom: 24,
  },
  inputContainer: {
    width: "100%",
    alignItems: "center",
  },
  helperContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent", // Space for layout consistency
  },
});
