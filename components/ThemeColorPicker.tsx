import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { THEME_COLORS } from "@/constants/theme-colors";

interface Props {
  selectedColor: string;
  onSelect: (color: string) => void;
  disabled?: boolean;
}

const SWATCH_SIZE = 44;

const ThemeColorPicker = ({ selectedColor, onSelect, disabled }: Props) => {
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      {THEME_COLORS.map((c) => {
        const selected = c.color.toLowerCase() === selectedColor.toLowerCase();
        return (
          <Pressable
            key={c.id}
            onPress={() => !disabled && onSelect(c.color)}
            hitSlop={4}
            style={[
              styles.swatch,
              {
                backgroundColor: c.color,
                borderColor: selected ? theme.colors.onSurface : "transparent",
                opacity: disabled ? 0.4 : 1,
              },
            ]}
          >
            {selected && <Ionicons name="checkmark" size={20} color="#fff" />}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ThemeColorPicker;
