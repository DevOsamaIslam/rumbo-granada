import { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/constants/colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
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
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { t } = useTranslation();

    if (hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>{t('error', { ns: 'translation' })}</Text>
          {error?.message && (
            <Text style={styles.message}>{error.message}</Text>
          )}
          <Button
            onPress={this.reset}
            mode="contained"
          >
            {t('tryAgain', { ns: 'translation' })}
          </Button>
          {fallback}
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 16,
  },
});