import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { InsightCard, TagCloud } from '@/components';
import { useDumpStore } from '@/stores/dumpStore';

export default function ResultScreen() {
  const router = useRouter();
  const selectedDump = useDumpStore((state) => state.selectedDump);

  if (!selectedDump) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No dump to display</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success indicator */}
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={styles.successBadge}
        >
          <Text style={styles.successText}>Captured!</Text>
        </Animated.View>

        {/* The One Thing */}
        <InsightCard
          insight={selectedDump.one_thing}
          mode={selectedDump.insight_mode}
        />

        {/* Tags */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(300)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Tags</Text>
          <TagCloud tags={selectedDump.tags} />
        </Animated.View>

        {/* Transcript */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(400)}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Transcript</Text>
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcript}>{selectedDump.transcript}</Text>
          </View>
        </Animated.View>

        {/* Duration */}
        {selectedDump.duration_seconds && (
          <Animated.View
            entering={FadeInUp.duration(400).delay(500)}
            style={styles.metaContainer}
          >
            <Text style={styles.metaText}>
              Duration: {Math.floor(selectedDump.duration_seconds / 60)}:
              {(selectedDump.duration_seconds % 60).toString().padStart(2, '0')}
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.primaryButtonText}>New Dump</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/archive')}
        >
          <Text style={styles.secondaryButtonText}>View Archive</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 100,
  },
  successBadge: {
    alignSelf: 'center',
    backgroundColor: '#22c55e20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  successText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#71717a',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  transcriptContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  transcript: {
    color: '#a1a1aa',
    fontSize: 15,
    lineHeight: 24,
  },
  metaContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  metaText: {
    color: '#71717a',
    fontSize: 13,
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  secondaryButtonText: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
});
