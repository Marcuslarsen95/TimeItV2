import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Button,
  IconButton,
  Modal,
  Portal,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useProStatus } from "@/hooks/use-pro-status";
import { DEFAULT_THEME_COLOR } from "@/constants/theme-colors";
import ThemeColorPicker from "./ThemeColorPicker";

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const SettingsModal = ({ visible, onDismiss }: Props) => {
  const theme = useTheme();
  const { preferences, updatePreference } = useUserPreferences();
  const { isPro, setIsPro } = useProStatus();

  const themeColor = preferences.themeColor ?? DEFAULT_THEME_COLOR;

  const handleColorSelect = (color: string) => {
    if (!isPro) return;
    updatePreference("themeColor", color);
  };

  const handleVoicePromptsToggle = (enabled: boolean) => {
    if (!isPro) return;
    updatePreference("voicePromptsEnabled", enabled);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.secondaryContainer },
        ]}
      >
        <View style={styles.header}>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSecondaryContainer, fontWeight: "600" }}
          >
            Settings
          </Text>
          <IconButton icon="close" size={20} onPress={onDismiss} />
        </View>

        {/* Pro upsell or active state */}
        {!isPro ? (
          <View
            style={[
              styles.proCard,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <View style={styles.proHeader}>
              <Ionicons
                name="diamond-outline"
                size={18}
                color={theme.colors.onPrimaryContainer}
              />
              <Text
                variant="titleMedium"
                style={{
                  color: theme.colors.onPrimaryContainer,
                  fontWeight: "700",
                }}
              >
                Cria Pro
              </Text>
            </View>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onPrimaryContainer,
                marginVertical: 8,
                opacity: 0.9,
              }}
            >
              Unlock custom theme colors, unlimited presets, and lap history.
            </Text>
            <Button
              mode="contained"
              onPress={() => setIsPro(true)}
              style={{ borderRadius: 12 }}
              contentStyle={{ height: 44 }}
              labelStyle={{ fontWeight: "600" }}
            >
              Upgrade to Pro
            </Button>
          </View>
        ) : (
          <View
            style={[
              styles.proActiveCard,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={theme.colors.onPrimaryContainer}
            />
            <Text
              style={{
                color: theme.colors.onPrimaryContainer,
                fontWeight: "600",
                flex: 1,
              }}
            >
              Cria Pro is active
            </Text>
            {/* dev-only: revert to free */}
            <Button
              compact
              onPress={() => setIsPro(false)}
              labelStyle={{
                fontSize: 11,
                opacity: 0.6,
                color: theme.colors.onPrimaryContainer,
              }}
            >
              Revert
            </Button>
          </View>
        )}

        {/* Theme color picker */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              variant="titleSmall"
              style={{ color: theme.colors.onSecondaryContainer, fontWeight: "600" }}
            >
              Theme color
            </Text>
            {!isPro && (
              <View
                style={[
                  styles.lockTag,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={11}
                  color={theme.colors.onSurface}
                />
                <Text
                  variant="labelSmall"
                  style={{
                    color: theme.colors.onSurface,
                    fontWeight: "700",
                    letterSpacing: 0.5,
                  }}
                >
                  PRO
                </Text>
              </View>
            )}
          </View>
          <ThemeColorPicker
            selectedColor={themeColor}
            onSelect={handleColorSelect}
            disabled={!isPro}
          />
        </View>

        {/* Voice prompts toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              variant="titleSmall"
              style={{
                color: theme.colors.onSecondaryContainer,
                fontWeight: "600",
              }}
            >
              Voice prompts
            </Text>
            {!isPro && (
              <View
                style={[
                  styles.lockTag,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={11}
                  color={theme.colors.onSurface}
                />
                <Text
                  variant="labelSmall"
                  style={{
                    color: theme.colors.onSurface,
                    fontWeight: "700",
                    letterSpacing: 0.5,
                  }}
                >
                  PRO
                </Text>
              </View>
            )}
          </View>
          <View style={styles.toggleRow}>
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSecondaryContainer,
                flex: 1,
                opacity: isPro ? 1 : 0.5,
              }}
            >
              Announce 3-2-1 countdown and interval names
            </Text>
            <Switch
              value={isPro && (preferences.voicePromptsEnabled ?? false)}
              onValueChange={handleVoicePromptsToggle}
              disabled={!isPro}
            />
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  proCard: {
    borderRadius: 16,
    padding: 16,
  },
  proHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  proActiveCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lockTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

export default SettingsModal;
