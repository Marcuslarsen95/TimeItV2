import React, { useState } from "react";
import { Dialog, Portal, TextInput, Button } from "react-native-paper";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSave: (name: string) => void;
}

export default function SaveRunDialog({ visible, onDismiss, onSave }: Props) {
  const [name, setName] = useState("");

  const handleSave = () => {
    onSave(name.trim());
    setName("");
    onDismiss();
  };

  const handleDismiss = () => {
    setName("");
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss}>
        <Dialog.Title>Save run</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Run name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Tuesday 5K"
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss}>Cancel</Button>
          {/* Run name is optional — falls back to the saved-at timestamp. */}
          <Button onPress={handleSave}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
