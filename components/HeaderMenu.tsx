import React, { useState } from "react";
import { Menu, IconButton, useTheme, Portal } from "react-native-paper";
import { useRouter } from "expo-router";

export default function HeaderMenu() {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const router = useRouter();

  const openMenu = () => {
    setVisible(true);
  };

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <IconButton
          icon="menu"
          iconColor={theme.colors.onBackground}
          size={30}
          onPress={openMenu}
        />
      }
      contentStyle={{
        backgroundColor: theme.colors.surfaceVariant, // or a hardcoded color like '#1e1e1e'
        borderRadius: 12,
      }}
    >
      <Menu.Item
        onPress={() => {
          router.push("/");
          setVisible(false);
        }}
        title="Timer"
        leadingIcon="timer-outline"
      />
      <Menu.Item
        onPress={() => {
          router.push("/interval");
          setVisible(false);
        }}
        title="Interval"
        leadingIcon="shuffle"
      />
      <Menu.Item
        onPress={() => {
          router.push("/random");
          setVisible(false);
        }}
        title="Random"
        leadingIcon="dice"
      />
    </Menu>
  );
}
