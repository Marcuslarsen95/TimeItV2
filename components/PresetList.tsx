import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutPreset } from "@/hooks/use-workout-presets";

interface Props {
  presets: WorkoutPreset[];
  onLoad: (preset: WorkoutPreset) => void;
  onDelete: (id: string) => void;
}

export default function PresetList({ presets, onLoad, onDelete }: Props) {
  const theme = useTheme();

  if (presets.length === 0) return null; // don't render anything if no presets

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={{ opacity: 0.5, marginBottom: 4 }}>
        Saved Presets
      </Text>
      {presets.map((preset) => (
        <View
          key={preset.id}
          style={[styles.row, { borderColor: theme.colors.outline }]}
        >
          <Text style={styles.name}>{preset.name}</Text>
          <View style={styles.actions}>
            <Pressable onPress={() => onLoad(preset)} style={styles.iconButton}>
              <Ionicons
                name="download-outline"
                size={20}
                color={theme.colors.primary}
              />
            </Pressable>
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
        </View>
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
  name: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
});
