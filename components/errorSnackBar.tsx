import React from "react";
import { Snackbar, Text } from "react-native-paper";

interface Props {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  color: string;
  textColor: string;
}

export default function ErrorSnackbar({
  visible,
  message,
  onDismiss,
  color,
  textColor,
}: Props) {
  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      style={{ backgroundColor: color }}
      wrapperStyle={{ bottom: -50 }}
    >
      <Text style={{ color: textColor }}>{message}</Text>
    </Snackbar>
  );
}
