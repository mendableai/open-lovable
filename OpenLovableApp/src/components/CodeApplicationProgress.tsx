import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export interface CodeApplicationState {
  stage: 'analyzing' | 'installing' | 'applying' | 'complete' | null;
  packages?: string[];
  installedPackages?: string[];
  filesGenerated?: string[];
  message?: string;
}

interface CodeApplicationProgressProps {
  state: CodeApplicationState;
}

export default function CodeApplicationProgress({ state }: CodeApplicationProgressProps) {
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    spin.start();

    return () => spin.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!state.stage || state.stage === 'complete') return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Rotating loading indicator */}
        <Animated.View style={[styles.loadingIcon, { transform: [{ rotate: spin }] }]}>
          <View style={styles.circle}>
            <View style={styles.circleInner} />
          </View>
        </Animated.View>

        {/* Loading text */}
        <Text style={styles.loadingText}>
          Applying to sandbox...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingIcon: {
    width: 16,
    height: 16,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#374151',
    borderTopColor: 'transparent',
  },
  circleInner: {
    flex: 1,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});