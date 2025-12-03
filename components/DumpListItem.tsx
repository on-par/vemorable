import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Dump } from '@/types';
import { TagCloud } from './TagCloud';

interface DumpListItemProps {
  dump: Dump;
  onPress: () => void;
  showSimilarity?: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function DumpListItem({ dump, onPress, showSimilarity }: DumpListItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(dump.created_at)}</Text>
        {showSimilarity !== undefined && (
          <View style={styles.similarityBadge}>
            <Text style={styles.similarityText}>
              {Math.round(showSimilarity * 100)}% match
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.insight} numberOfLines={2}>
        {dump.one_thing}
      </Text>

      <Text style={styles.transcript} numberOfLines={2}>
        {dump.transcript}
      </Text>

      {dump.tags.length > 0 && (
        <View style={styles.tags}>
          <TagCloud tags={dump.tags.slice(0, 3)} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    color: '#71717a',
    fontSize: 12,
  },
  similarityBadge: {
    backgroundColor: '#22c55e20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  similarityText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '600',
  },
  insight: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 8,
  },
  transcript: {
    color: '#a1a1aa',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tags: {
    marginTop: 4,
  },
});
