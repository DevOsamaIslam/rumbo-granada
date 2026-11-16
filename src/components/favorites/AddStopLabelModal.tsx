import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, TextInput } from 'react-native-paper';
import { COLORS } from '@/constants/colors';
import { useTranslation } from 'react-i18next';

export interface AddStopLabelModalProps {
  visible: boolean;
  /** Pre-filled label (existing favourite's label, if any). */
  initialLabel?: string;
  stopName: string;
  /** Sheet title. Defaults to the translated `saveStop` string. */
  title?: string;
  onCancel: () => void;
  onConfirm: (label: string) => void;
  onRemove?: () => void;
}

/**
 * Prompts for a custom label for a favourited stop (e.g. 'Cerca del trabajo').
 * An empty label is saved as-is (''), meaning "no label": consumers should
 * render nothing for it.
 *
 * The draft is seeded from `initialLabel` while the modal is closed, and remounted
 * (via `key`) each time it opens, so it never shows a stale value without needing
 * an effect to sync state.
 */
export function AddStopLabelModal({
  visible,
  initialLabel = '',
  stopName,
  title,
  onCancel,
  onConfirm,
  onRemove,
}: AddStopLabelModalProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('saveStop');
  const [draft, setDraft] = useState({
    source: initialLabel,
    label: initialLabel,
  });

  // Re-seed the draft when a new initial value arrives while closed.
  const label = draft.source === initialLabel ? draft.label : initialLabel;

  const handleConfirm = () => {
    onConfirm(label.trim());
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
            <Text style={styles.title}>{resolvedTitle}</Text>
            <IconButton
              icon='close'
              onPress={onCancel}
              accessibilityLabel={t('close')}
            />
          </View>

          <Text style={styles.stopName}>{stopName}</Text>

          <TextInput
            mode='outlined'
            label={t('label')}
            placeholder={t('labelExample')}
            value={label}
            onChangeText={(text) =>
              setDraft({ source: initialLabel, label: text })
            }
            style={styles.input}
            accessibilityLabel={t('stopLabel')}
            maxLength={40}
          />

          <View style={styles.actions}>
            {onRemove && (
              <Button mode='text' textColor={COLORS.error} onPress={onRemove}>
                {t('remove')}
              </Button>
            )}
            <View style={styles.actionSpacer} />
            <Button mode='outlined' color={COLORS.secondary} onPress={onCancel}>
              {t('cancel')}
            </Button>
            <Button mode='contained' color={COLORS.secondary} onPress={handleConfirm}>
              {t('save')}
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
