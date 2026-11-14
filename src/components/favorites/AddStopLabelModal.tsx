import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, TextInput } from 'react-native-paper';
import { COLORS } from '@/constants/colors';

export interface AddStopLabelModalProps {
  visible: boolean;
  /** Pre-filled label (existing favourite's label, if any). */
  initialLabel?: string;
  stopName: string;
  onCancel: () => void;
  onConfirm: (label: string) => void;
  onRemove?: () => void;
}

/**
 * Prompts for a custom label for a favourited stop (e.g. 'Cerca del trabajo').
 * Falls back to the stop name when the label is left blank.
 *
 * The draft is seeded from `initialLabel` while the modal is closed, and remounted
 * (via `key`) each time it opens, so it never shows a stale value without needing
 * an effect to sync state.
 */
export function AddStopLabelModal({
  visible,
  initialLabel = '',
  stopName,
  onCancel,
  onConfirm,
  onRemove,
}: AddStopLabelModalProps) {
  const [draft, setDraft] = useState({
    source: initialLabel,
    label: initialLabel,
  });

  // Re-seed the draft when a new initial value arrives while closed.
  const label = draft.source === initialLabel ? draft.label : initialLabel;

  const handleConfirm = () => {
    onConfirm(label.trim() || stopName);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Guardar parada</Text>
            <IconButton
              icon='close'
              onPress={onCancel}
              accessibilityLabel='Close'
            />
          </View>

          <Text style={styles.stopName}>{stopName}</Text>

          <TextInput
            mode='outlined'
            label='Etiqueta'
            placeholder='Ej. Cerca del trabajo'
            value={label}
            onChangeText={(text) =>
              setDraft({ source: initialLabel, label: text })
            }
            style={styles.input}
            accessibilityLabel='Stop label'
            maxLength={40}
          />

          <View style={styles.actions}>
            {onRemove && (
              <Button mode='text' textColor={COLORS.error} onPress={onRemove}>
                Quitar
              </Button>
            )}
            <View style={styles.actionSpacer} />
            <Button mode='outlined' onPress={onCancel}>
              Cancelar
            </Button>
            <Button mode='contained' onPress={handleConfirm}>
              Guardar
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  stopName: {
    fontSize: 14,
    color: COLORS.outline,
  },
  input: {
    backgroundColor: COLORS.surface,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionSpacer: {
    flex: 1,
  },
});
