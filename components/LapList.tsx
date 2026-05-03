import React from "react";
import { View, ScrollView } from "react-native";
import { Text, useTheme, Button } from "react-native-paper";
import { formatDateTimer } from "../utils/HelperFunctions";
import LapRow from "@/components/LapRow";
import LapListHeader from "./LapListHeader";

interface LapListProps {
  laps: number[];
  height?: number;
  onClear: () => void;
  /**
   * Optional handler to save the current run. When provided, a
   * "Save run" button is rendered alongside "Clear laps".
   */
  onSave?: () => void;
}

export default function LapList({
  laps,
  height = 280,
  onClear,
  onSave,
}: LapListProps) {
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
          <LapListHeader />

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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {onSave && (
              <Button icon="save-outline" onPress={onSave}>
                Save run
              </Button>
            )}
            <Button icon="trash-outline" onPress={onClear}>
              Clear laps
            </Button>
          </View>
        </>
      )}
    </View>
  );
}
