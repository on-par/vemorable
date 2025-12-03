import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { InsightCard, TagCloud } from '@/components';
import { useDumpStore } from '@/stores/dumpStore';

export default function DumpDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    selectedDump,
    isLoading,
    fetchDumpById,
    deleteDump,
    setSelectedDump,
  } = useDumpStore();

  useEffect(() => {
    if (id && (!selectedDump || selectedDump.id !== id)) {
      fetchDumpById(id);
    }
  }, [id, selectedDump, fetchDumpById]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Dump',
      'Are you sure you want to delete this dump? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteDump(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (isLoading || !selectedDump) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>
            {isLoading ? 'Loading...' : 'Dump not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = new Date(selectedDump.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date */}
        <Text style={styles.date}>{formattedDate}</Text>

        {/* The One Thing */}
        <InsightCard
          insight={selectedDump.one_thing}
          mode={selectedDump.insight_mode}
        />

        {/* Prompt shown */}
        {selectedDump.prompt_shown && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prompt</Text>
            <Text style={styles.promptText}>{selectedDump.prompt_shown}</Text>
          </View>
        )}

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <TagCloud tags={selectedDump.tags} />
        </View>

        {/* Transcript */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Full Transcript</Text>
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcript}>{selectedDump.transcript}</Text>
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.metaSection}>
          {selectedDump.duration_seconds && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Duration</Text>
              <Text style={styles.metaValue}>
                {Math.floor(selectedDump.duration_seconds / 60)}:
                {(selectedDump.duration_seconds % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Mode</Text>
            <Text style={styles.metaValue}>
              {selectedDump.insight_mode.charAt(0).toUpperCase() +
                selectedDump.insight_mode.slice(1)}
            </Text>
          </View>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>Delete Dump</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  date: {
    color: '#71717a',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
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
  promptText: {
    color: '#a1a1aa',
    fontSize: 16,
    fontStyle: 'italic',
  },
  transcriptContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  transcript: {
    color: '#fafafa',
    fontSize: 15,
    lineHeight: 24,
  },
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 32,
    paddingHorizontal: 16,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    color: '#71717a',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaValue: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    marginTop: 40,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#71717a',
    fontSize: 16,
  },
});
