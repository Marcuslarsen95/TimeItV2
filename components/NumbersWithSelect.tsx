import { View, StyleSheet } from "react-native";
import {
  TextInput,
  Menu,
  useTheme,
  Button,
  Text,
  IconButton,
} from "react-native-paper";
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
  const [focused, setFocused] = React.useState(false);

  const handleChange = (text: string) => {
    setValue(text);

    const num = Number(text);
    if (!isNaN(num)) {
      onValueChange(num);
    }
  };

  const handleUnitChange = (toSeconds: boolean) => {
    setIsSeconds(toSeconds);
    onUnitChange(toSeconds ? "Seconds" : "Minutes");
  };

  const styles = StyleSheet.create({
    button: {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
    selected: {
      backgroundColor: theme.colors.surfaceDisabled,
    },
  });

  return (
    <View style={{ position: "relative" }}>
      <View style={{ opacity: isActive ? 1 : 0.2 }}>
        <View style={{ alignItems: "center", marginVertical: 12 }}>
          <Text variant="labelMedium" style={{ marginBottom: 4 }}>
            {label}
          </Text>

          <View
            style={{
              flexDirection: "row",
              height: 56,
              width: "90%", // Responsive width
              maxWidth: 320, // Prevents it looking stretched on tablets
              alignItems: "stretch", // Ensures children fill the 56 height
            }}
          >
            <View style={{ flex: 1, maxWidth: 100 }}>
              <TextInput
                value={value}
                onChangeText={handleChange}
                keyboardType="numeric"
                mode="outlined"
                textColor={theme.colors.background}
                outlineStyle={{
                  borderWidth: focused ? 2 : 1,
                  borderColor: focused
                    ? theme.colors.outlineVariant
                    : theme.colors.outlineVariant,
                  borderTopLeftRadius: 16,
                  borderBottomLeftRadius: 16,
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                }}
                selectionColor={theme.colors.outlineVariant}
                cursorColor={theme.colors.outlineVariant}
                style={{
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: "700",
                  backgroundColor: theme.colors.secondary,
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>

            {/* Buttons Container - Flex 2 (Gives buttons more room for text) */}
            <View style={{ flex: 1, flexDirection: "row" }}>
              <Button
                onPress={() => handleUnitChange(true)}
                mode="text" // 'text' allows us to control the bg color via style
                style={[
                  styles.button,
                  {
                    flex: 1,
                    borderLeftWidth: 0,
                    borderRadius: 0, // Middle button stays square
                    backgroundColor: isSeconds
                      ? theme.colors.primary
                      : theme.colors.surface,
                  },
                ]}
                contentStyle={{ height: "100%" }}
                labelStyle={{
                  color: isSeconds
                    ? theme.colors.onPrimary
                    : theme.colors.primary,
                }}
              >
                Seconds
              </Button>

              <Button
                onPress={() => handleUnitChange(false)}
                mode="text"
                style={[
                  styles.button,
                  {
                    flex: 1,
                    borderLeftWidth: 0,
                    borderTopRightRadius: 16,
                    borderBottomRightRadius: 16,
                    backgroundColor: !isSeconds
                      ? theme.colors.primary
                      : theme.colors.surface,
                  },
                ]}
                contentStyle={{ height: "100%" }}
                labelStyle={{
                  color: !isSeconds
                    ? theme.colors.onPrimary
                    : theme.colors.primary,
                }}
              >
                Minutes
              </Button>
            </View>
          </View>
        </View>
      </View>
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          zIndex: 10, // Ensures it stays on top
        }}
      >
        {isActive && isRemoveable && label !== "Active" && (
          <IconButton
            mode="contained-tonal"
            onPress={onToggle}
            icon={isActive ? "remove" : "add"}
            containerColor={theme.colors.secondaryContainer}
            iconColor={theme.colors.onSecondaryContainer}
            style={{ elevation: 4 }}
          />
        )}

        {!isActive && isLast && (
          <IconButton
            mode="contained-tonal"
            containerColor={theme.colors.tertiaryContainer}
            iconColor={theme.colors.onTertiaryContainer}
            onPress={onToggle}
            icon={isActive ? "remove" : "add"}
            style={{ elevation: 4 }}
          />
        )}
      </View>
    </View>
  );
}
