import React from "react";
import { View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { formatDateTimer } from "../utils/HelperFunctions";

interface LapRowProps {
  lapNum: number;
  splitMs: number;
  totalMs: number;
  color?: string; // highlight color for the split value only
}

export default function LapRow({
  lapNum,
  splitMs,
  totalMs,
  color,
}: LapRowProps) {
  const theme = useTheme();
  const split = formatDateTimer(splitMs, true);
  const total = formatDateTimer(totalMs, true);

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
      <Text style={{ fontFamily: "ChivoMono", fontSize: 16, opacity: 0.5 }}>
        Lap {lapNum}
      </Text>
      <Text
        style={[
          { fontFamily: "ChivoMono", fontSize: 18, fontWeight: "600" },
          color && { color },
        ]}
      >
        +{split.main}.{split.ms}
      </Text>
      <Text
        style={{
          fontFamily: "ChivoMono",
          fontSize: 14,
          opacity: 0.5,
        }}
      >
        {total.main}.{total.ms}
      </Text>
    </View>
  );
}
