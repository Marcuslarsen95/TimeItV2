import { View, StyleSheet } from "react-native";
import { TextInput, Menu, useTheme, Button, Text } from "react-native-paper";
import React from "react";

interface Props {
  label: string;
  onValueChange: (value: number) => void;
  onUnitChange: (value: string) => void;
  initialValue: string;
}

export default function NumbersWithSelect({
  label,
  onValueChange,
  onUnitChange,
  initialValue,
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
    <View
      style={{
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Text variant="labelMedium">{label}</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderColor: theme.colors.surfaceVariant,
          height: 50,
          minWidth: 300,
          marginVertical: 8,
        }}
      >
        <TextInput
          value={value}
          onChangeText={handleChange}
          keyboardType="numeric"
          mode="outlined"
          outlineStyle={{
            borderWidth: 1,
            borderColor: focused
              ? theme.colors.primary
              : theme.colors.outlineVariant,

            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
          style={{
            height: 50,
            width: 80,
            backgroundColor: theme.colors.surfaceVariant,
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <View style={{ width: 150, flex: 1, flexDirection: "row" }}>
          <Button
            onPress={() => handleUnitChange(true)}
            mode={isSeconds ? "contained" : "outlined"}
            icon={isSeconds ? "checkmark" : ""}
            style={[
              styles.button,
              isSeconds && styles.selected,
              {
                flex: 1,
                borderLeftWidth: 0,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                backgroundColor: isSeconds
                  ? theme.colors.primary
                  : theme.colors.surface,
              },
            ]}
            contentStyle={{
              height: "100%", // ensures full height
            }}
          >
            Seconds
          </Button>
          <Button
            onPress={() => handleUnitChange(false)}
            mode={isSeconds ? "contained" : "outlined"}
            icon={!isSeconds ? "checkmark" : ""}
            style={[
              styles.button,
              {
                flex: 1,
                borderLeftWidth: 0,
                backgroundColor: !isSeconds
                  ? theme.colors.primary
                  : theme.colors.surface,
              },
            ]}
            contentStyle={{
              // forces internal content to stretch
              height: "100%", // ensures full height
            }}
            labelStyle={{
              color: !isSeconds ? theme.colors.onPrimary : theme.colors.primary,
            }}
          >
            Minutes
          </Button>
        </View>
      </View>
    </View>
  );
}
