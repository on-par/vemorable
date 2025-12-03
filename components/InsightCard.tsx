import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { InsightMode } from '@/types';
import { INSIGHT_MODES } from '@/constants/insightModes';

interface InsightCardProps {
  insight: string;
  mode: InsightMode;
  onPress?: () => void;
}

export function InsightCard({ insight, mode, onPress }: InsightCardProps) {
  const modeConfig = INSIGHT_MODES[mode];

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(200)}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
        disabled={!onPress}
      >
        <View style={styles.header}>
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>{modeConfig.name}</Text>
          </View>
          <Text style={styles.label}>The One Thing</Text>
        </View>

        <Text style={styles.insight}>{insight}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  modeBadgeText: {
    color: '#fafafa',
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    color: '#71717a',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  insight: {
    color: '#fafafa',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '500',
  },
});
