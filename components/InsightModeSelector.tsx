import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { InsightMode } from '@/types';
import { INSIGHT_MODES } from '@/constants/insightModes';

interface InsightModeSelectorProps {
  selectedMode: InsightMode;
  onModeSelect: (mode: InsightMode) => void;
}

const modes = Object.entries(INSIGHT_MODES) as [InsightMode, typeof INSIGHT_MODES[InsightMode]][];

export function InsightModeSelector({
  selectedMode,
  onModeSelect,
}: InsightModeSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {modes.map(([key, config]) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.modeButton,
            selectedMode === key && styles.modeButtonSelected,
          ]}
          onPress={() => onModeSelect(key)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.modeName,
              selectedMode === key && styles.modeNameSelected,
            ]}
          >
            {config.name}
          </Text>
          <Text
            style={[
              styles.modeDescription,
              selectedMode === key && styles.modeDescriptionSelected,
            ]}
            numberOfLines={1}
          >
            {config.description}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  modeButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  modeButtonSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  modeName: {
    color: '#fafafa',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeNameSelected: {
    color: '#fafafa',
  },
  modeDescription: {
    color: '#71717a',
    fontSize: 11,
  },
  modeDescriptionSelected: {
    color: '#c7d2fe',
  },
});
