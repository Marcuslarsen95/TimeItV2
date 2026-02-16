import { View, StyleSheet } from "react-native";
import {
  TextInput,
  Menu,
  IconButton,
  useTheme,
  Button,
  Text,
} from "react-native-paper";
import React from "react";

interface Props {
  label: string;
  onValueChange: (value: number) => void;
  onUnitChange: (value: string) => void;
  initialValue: string;
}

export default function NumberWithDropdown({
  label,
  onValueChange,
  onUnitChange,
  initialValue,
}: Props) {
  const theme = useTheme();
  const [value, setValue] = React.useState(initialValue);
  const [timeDef, setTimeDef] = React.useState("Seconds");
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const selectMenuItem = (item: string) => {
    setTimeDef(item);
    onUnitChange(item);
    setMenuVisible(false);
  };

  const handleChange = (text: string) => {
    setValue(text);

    const num = Number(text);
    if (!isNaN(num)) {
      onValueChange(num);
    }
  };

  const openMenu = () => {
    setMenuVisible(true);
  };
  const closeMenu = () => {
    setMenuVisible(false);
  };

  const styles = StyleSheet.create({
    button: {
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderWidth: 1,

      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
  });

  return (
    <View>
      <Text variant="labelMedium">{label}</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderColor: theme.colors.surfaceVariant,
          height: 60,
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
            flex: 1,
            backgroundColor: theme.colors.surfaceVariant,
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        <Menu
          visible={menuVisible}
          key={menuVisible ? "visible" : "hidden"}
          onDismiss={closeMenu}
          anchor={
            <View style={{ width: 150, flex: 1 }}>
              <Button
                icon="caret-down"
                onPress={openMenu}
                style={[styles.button, { flex: 1, borderLeftWidth: 0 }]}
                contentStyle={{
                  // forces internal content to stretch
                  height: "100%", // ensures full height
                }}
              >
                {timeDef}
              </Button>
            </View>
          }
          anchorPosition="bottom"
          contentStyle={[styles.button]}
        >
          <Menu.Item
            onPress={() => selectMenuItem("Seconds")}
            title="Seconds"
          />
          <Menu.Item
            onPress={() => selectMenuItem("Minutes")}
            title="Minutes"
          />
          <Menu.Item onPress={() => selectMenuItem("Hours")} title="Hours" />
        </Menu>
      </View>
    </View>
  );
}
