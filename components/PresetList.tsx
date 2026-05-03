import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutPreset } from "@/hooks/use-workout-presets";
import { summarizePreset } from "@/utils/HelperFunctions";

interface Props {
  presets: WorkoutPreset[];
  type: "interval" | "countdown" | "random";
  onLoad: (preset: WorkoutPreset) => void;
  onDelete: (id: string) => void;
}

export default function PresetList({ presets, onLoad, onDelete, type }: Props) {
  const theme = useTheme();

  if (presets.length === 0) return null; // don't render anything if no presets

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={{ opacity: 0.5, marginBottom: 4 }}>
        Saved Presets
      </Text>
      {presets.map((preset) => (
        <Pressable
          key={preset.id}
          onPress={() => onLoad(preset)}
          android_ripple={{ color: theme.colors.primary + "22" }}
          style={({ pressed }) => [
            styles.row,
            {
              borderColor: theme.colors.outline,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: theme.colors.secondary, fontWeight: "600" }}>
              {preset.name}
            </Text>
            <View style={{ flexDirection: "row" }}>
              <Text
                variant="labelSmall"
                style={{
                  color: theme.colors.onSurface,
                  opacity: 0.7,
                  flex: 1,
                }}
              >
                {summarizePreset(preset)}
              </Text>
              {type === "interval" && (
                <Text
                  variant="labelSmall"
                  style={{
                    color: theme.colors.onSurface,
                    opacity: 0.7,
                  }}
                >
                  ({preset.config.repeatCount})
                </Text>
              )}
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable
              onPress={() => onDelete(preset.id)}
              style={styles.iconButton}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={theme.colors.error}
              />
            </Pressable>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    width: "100%",
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 10,
  },
  iconButton: {
    padding: 4,
  },
});
