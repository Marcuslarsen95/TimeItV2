import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import {
  Button,
  Dialog,
  IconButton,
  Modal,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { layout } from "@/styles/layout";
import { formatDateTimer } from "@/utils/HelperFunctions";
import { SavedRun } from "@/hooks/use-lap-history";
import LapRow from "./LapRow";
import LapListHeader from "./LapListHeader";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  runs: SavedRun[];
  onDelete: (id: string) => void;
}

const formatSavedAt = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Renders the lap breakdown for an expanded saved run, with the same
 * fastest-split-green / slowest-split-red highlighting that the live
 * LapList uses on the stopwatch screen.
 */
function ExpandedLaps({ laps }: { laps: number[] }) {
  const splits = laps.map((t, i) => t - (laps[i - 1] ?? 0));
  const min = Math.min(...splits);
  const max = Math.max(...splits);

  // Highlighting only kicks in once there are at least 3 laps —
  // otherwise "fastest" and "slowest" don't really mean anything.
  const getColor = (ms: number): string | undefined => {
    if (splits.length < 3) return undefined;
    if (ms === min) return "#4a8a5c";
    if (ms === max) return "#c06060";
    return undefined;
  };

  return (
    <View style={{ marginTop: 4, paddingHorizontal: 4 }}>
      <LapListHeader />
      {laps.map((totalMs, i) => {
        const split = splits[i];
        return (
          <LapRow
            key={i}
            lapNum={i + 1}
            splitMs={split}
            totalMs={totalMs}
            color={getColor(split)}
          />
        );
      })}
    </View>
  );
}

export default function LapHistoryModal({
  visible,
  onDismiss,
  runs,
  onDelete,
}: Props) {
  const theme = useTheme();
  // Currently expanded run (showing its full lap breakdown). Only one
  // expanded at a time keeps the layout tidy.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Pending-delete confirmation target.
  const [pendingDelete, setPendingDelete] = useState<SavedRun | null>(null);

  const close = () => {
    setExpandedId(null);
    setPendingDelete(null);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={close}
        contentContainerStyle={[
          layout.presetModalContainer,
          {
            backgroundColor: theme.colors.secondaryContainer,
            maxHeight: "85%",
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Text
            variant="titleMedium"
            style={{
              color: theme.colors.onSecondaryContainer,
              fontWeight: "700",
            }}
          >
            Saved runs
          </Text>
          <IconButton icon="close" size={20} onPress={close} />
        </View>

        {runs.length === 0 ? (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <Ionicons
              name="archive-outline"
              size={36}
              color={theme.colors.onSecondaryContainer}
              style={{ opacity: 0.5, marginBottom: 8 }}
            />
            <Text
              style={{
                color: theme.colors.onSecondaryContainer,
                opacity: 0.7,
                textAlign: "center",
              }}
            >
              No saved runs yet. Record some laps and tap{"\n"}
              <Text style={{ fontWeight: "700" }}>Save run</Text> to keep them.
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {runs.map((run) => {
              const isOpen = expandedId === run.id;
              const total = formatDateTimer(run.totalDurationMs, true);
              return (
                <View
                  key={run.id}
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.outlineVariant,
                    paddingVertical: 8,
                  }}
                >
                  <Pressable
                    onPress={() => setExpandedId(isOpen ? null : run.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: theme.colors.onSecondaryContainer,
                          fontWeight: "600",
                          fontSize: 15,
                        }}
                      >
                        {run.name}
                      </Text>
                      <Text
                        style={{
                          color: theme.colors.onSecondaryContainer,
                          opacity: 0.6,
                          fontSize: 12,
                        }}
                      >
                        {formatSavedAt(run.savedAt)} · {run.laps.length} lap
                        {run.laps.length === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: "ChivoMono",
                        fontSize: 14,
                        color: theme.colors.onSecondaryContainer,
                      }}
                    >
                      {total.main}.{total.ms}
                    </Text>
                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={theme.colors.onSecondaryContainer}
                    />
                    <IconButton
                      icon="trash-outline"
                      size={18}
                      onPress={() => setPendingDelete(run)}
                    />
                  </Pressable>

                  {isOpen && run.laps.length > 0 && (
                    <ExpandedLaps laps={run.laps} />
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </Modal>

      {/* Delete-confirmation dialog. Lives inside the same Portal so it
          stacks above the modal correctly. */}
      <Dialog
        visible={!!pendingDelete}
        onDismiss={() => setPendingDelete(null)}
      >
        <Dialog.Title>Delete run?</Dialog.Title>
        <Dialog.Content>
          <Text>
            {`"${pendingDelete?.name}" will be permanently removed from your history.`}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setPendingDelete(null)}>Cancel</Button>
          <Button
            textColor={theme.colors.error}
            onPress={() => {
              if (pendingDelete) onDelete(pendingDelete.id);
              setPendingDelete(null);
            }}
          >
            Delete
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
