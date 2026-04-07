import React, { useState } from "react";
import { Dialog, Portal, TextInput, Button } from "react-native-paper";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSave: (name: string) => void;
}

export default function SavePresetDialog({
  visible,
  onDismiss,
  onSave,
}: Props) {
  const [presetName, setPresetName] = useState("");

  const handleSave = () => {
    if (!presetName.trim()) return;
    onSave(presetName.trim());
    setPresetName("");
    onDismiss();
  };

  const handleDismiss = () => {
    setPresetName("");
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss}>
        <Dialog.Title>Save Preset</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Preset name"
            value={presetName}
            onChangeText={setPresetName}
            placeholder="e.g. Morning HIIT"
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss}>Cancel</Button>
          <Button onPress={handleSave} disabled={!presetName.trim()}>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
