import { View, StyleSheet, TouchableOpacity } from "react-native";
import { TextInput, useTheme, Text, IconButton } from "react-native-paper";
import React from "react";

interface Props {
  label: string;
  onValueChange: (value: number) => void;
  onUnitChange: (value: string) => void;
  initialValue: string;
  isActive: boolean;
  onToggle: () => void;
  isLast: boolean;
  isRemoveable: boolean;
}

export default function NumbersWithSelect({
  label,
  onValueChange,
  onUnitChange,
  initialValue,
  isActive,
  onToggle,
  isLast,
  isRemoveable,
}: Props) {
  const theme = useTheme();
  const [value, setValue] = React.useState(initialValue);
  const [isSeconds, setIsSeconds] = React.useState(true);
  const [isFocused, setIsFocused] = React.useState(false); // Track focus

  const handleUnitChange = (toSeconds: boolean) => {
    setIsSeconds(toSeconds);
    onUnitChange(toSeconds ? "Seconds" : "Minutes");
  };

  return (
    <View style={{ width: "100%", position: "relative" }}>
      <View style={[styles.wrapper, { opacity: isActive ? 1 : 0.4 }]}>
        <Text variant="labelLarge" style={styles.label}>
          {label}
        </Text>

        <View
          style={[
            styles.mainContainer,
            { backgroundColor: theme.colors.primary + "55" },
          ]}
        >
          {/* NESTED PILL: The Number Input */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: theme.colors.surface,
                borderWidth: 1.5,
                borderColor: isFocused
                  ? theme.colors.primary
                  : theme.colors.outlineVariant,
                // Subtle "inner shadow" effect for depth
                elevation: isFocused ? 4 : 1,
              },
            ]}
          >
            <TextInput
              value={value}
              onChangeText={(text) => {
                setValue(text);
                onValueChange(Number(text));
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              keyboardType="numeric"
              mode="flat"
              left={
                <TextInput.Icon
                  icon="time-outline"
                  size={20}
                  color={theme.colors.onSurface}
                />
              }
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              style={[styles.input, { backgroundColor: "transparent" }]}
              textColor={theme.colors.onSurface}
            />
          </View>

          {/* Minimal Divider - subtle enough to not break the flow */}
          <View
            style={[styles.divider, { backgroundColor: theme.colors.surface }]}
          />

          {/* NESTED PILL: The Toggle */}
          <View
            style={[
              styles.toggleContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <TouchableOpacity
              onPress={() => handleUnitChange(true)}
              style={[
                styles.unitButton,
                isSeconds && { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.unitText,
                  isSeconds && { color: theme.colors.onPrimary },
                ]}
              >
                Seconds
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleUnitChange(false)}
              style={[
                styles.unitButton,
                !isSeconds && { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.unitText,
                  !isSeconds && { color: theme.colors.onPrimary },
                ]}
              >
                M
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Action Button */}
      <View style={styles.actionButtonContainer}>
        {(isActive && isRemoveable && label !== "Active") ||
        (!isActive && isLast) ? (
          <IconButton
            icon={isActive ? "remove" : "add"}
            mode="contained"
            iconColor={isActive ? theme.colors.error : theme.colors.primary}
            containerColor={theme.colors.surface}
            size={24}
            onPress={onToggle}
            style={{ elevation: 4 }}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 12,
    alignItems: "center",
    width: "100%",
  },
  label: {
    marginBottom: 10,
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontSize: 12,
    fontWeight: "700",
  },
  mainContainer: {
    flexDirection: "row",
    height: 70, // Slightly taller for better touch targets
    width: "100%",
    maxWidth: 300,
    borderRadius: 35, // Perfect Pill shape
    alignItems: "center",
    paddingHorizontal: 8,
  },
  inputWrapper: {
    flex: 1,
    height: 54,
    borderRadius: 27, // Nested Pill
    justifyContent: "center",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    height: 54,
  },
  divider: {
    width: 1,
    height: "40%",
    marginHorizontal: 12,
    opacity: 0.5,
  },
  toggleContainer: {
    flexDirection: "row",
    height: 54,
    borderRadius: 27, // Matches the inputWrapper shape
    padding: 4,
    alignItems: "center",
    elevation: 2,
  },
  unitButton: {
    paddingHorizontal: 12,
    height: 46, // Internal button slightly smaller
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
  },
  unitText: {
    fontSize: 11,
    fontWeight: "900",
  },
  actionButtonContainer: {
    position: "absolute",
    right: 0,
    top: 45,
    elevation: 10,
  },
});
