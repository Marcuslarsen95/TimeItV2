import React from "react";
import { Snackbar } from "react-native-paper";

interface Props {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  color?: string;
  textColor?: string;
}

export default function AppSnackbar({
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
      duration={2000}
      style={{ backgroundColor: color }}
      theme={{ colors: { inverseSurface: textColor } }}
    >
      {message}
    </Snackbar>
  );
}
