import { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '@/constants/themes';
import type { AppColors } from '@/constants/colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

interface FallbackProps {
  error?: Error;
  fallback?: ReactNode;
  onRetry: () => void;
}

/**
 * Themed fallback UI. A function component so it can read the theme via hooks
 * and the current locale (a class component cannot call hooks).
 */
function ErrorFallback({ error, fallback, onRetry }: FallbackProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('error', { ns: 'translation' })}</Text>
      {error?.message && <Text style={styles.message}>{error.message}</Text>}
      <Button onPress={onRetry} mode="contained">
        {t('tryAgain', { ns: 'translation' })}
      </Button>
      {fallback}
    </View>
  );
}

/**
 * Error boundary that catches rendering errors in its child tree and displays
 * a retry UI instead of crashing the whole app.
 *
 * Usage:
 *   <ErrorBoundary fallback={<Text>Something went wrong</Text>}>
 *     <MyComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      return <ErrorFallback error={error} fallback={fallback} onRetry={this.reset} />;
    }

    return children;
  }
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 16,
  },
});