import { TextInput, TextInputProps } from 'react-native-paper';
import { StyleSheet, ViewStyle } from 'react-native';

interface SearchBarProps extends Omit<TextInputProps, 'mode' | 'onChangeText'> {
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  value?: string;
}

export function SearchBar({
  onChangeText,
  placeholder = 'Search...',
  style,
  value,
  ...props
}: SearchBarProps) {
  return (
    <TextInput
      mode="outlined"
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={[styles.container, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 400,
  },
});