import React from "react";
import { View, ScrollView } from "react-native";
import { Text, useTheme, Button } from "react-native-paper";
import { formatDateTimer } from "../utils/HelperFunctions";
import LapRow from "@/components/LapRow";

interface LapListProps {
  laps: number[];
  height?: number;
  onClear: () => void;
}

export default function LapList({ laps, height = 280, onClear }: LapListProps) {
  const theme = useTheme();

  if (laps.length === 0) return;

  const splits = laps.map((totalms, i) => totalms - (laps[i - 1] ?? 0));
  const min = Math.min(...splits);
  const max = Math.max(...splits);

  const getColor = (ms: number): string | undefined => {
    if (splits.length < 3) return undefined;
    if (ms === min) return "#4a8a5c";
    if (ms === max) return "#c06060";
    return undefined;
  };

  return (
    <View style={{ height: height, minWidth: 250 }}>
      {laps.length > 0 && (
        <>
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
            <Text
              style={{ fontFamily: "ChivoMono", fontSize: 16, opacity: 0.7 }}
            >
              total time
            </Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {[...laps].reverse().map((totalMs, i) => {
              const lapNum = laps.length - i;
              const prev = laps[laps.length - i - 2] ?? 0;

              return (
                <LapRow
                  key={lapNum}
                  lapNum={lapNum}
                  splitMs={totalMs - prev}
                  totalMs={totalMs}
                  color={getColor(totalMs - prev)}
                />
              );
            })}
          </ScrollView>
          <Button onPress={onClear}>Clear laps</Button>
        </>
      )}
    </View>
  );
}
