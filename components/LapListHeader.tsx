import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";

export default function LapListHeader() {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 20,
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outlineVariant,
      }}
    >
      <Text style={{ fontFamily: "ChivoMono", fontSize: 16 }}>Lap</Text>
      <Text style={{ fontFamily: "ChivoMono", fontSize: 16 }}>Split</Text>
      <Text style={{ fontFamily: "ChivoMono", fontSize: 16 }}>Total time</Text>
    </View>
  );
}
