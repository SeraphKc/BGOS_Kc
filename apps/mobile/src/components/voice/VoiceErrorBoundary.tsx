import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@bgos/shared-logic';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for voice agent components.
 * Catches React errors and displays a fallback UI instead of crashing the app.
 */
export class VoiceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 VoiceErrorBoundary caught error:', error);
    console.error('🔴 Component stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.icon}>!</Text>
            <Text style={styles.title}>Voice Agent Error</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    color: '#FF4444',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.WHITE_1,
    fontFamily: 'Styrene-B',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Styrene-B',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#FFD700',
    borderRadius: 24,
  },
  buttonText: {
    color: '#212121',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Styrene-B',
    textAlign: 'center',
  },
});
