import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TagCloud, DumpListItem } from '@/components';
import { useDumpStore } from '@/stores/dumpStore';

export default function ArchiveScreen() {
  const router = useRouter();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    dumps,
    tags,
    isLoading,
    fetchDumps,
    fetchDumpsByTag,
    fetchTags,
    setSelectedDump,
  } = useDumpStore();

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    if (selectedTag) {
      fetchDumpsByTag(selectedTag);
    } else {
      fetchDumps();
    }
  }, [selectedTag, fetchDumpsByTag, fetchDumps]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDumps();
    await fetchTags();
    setRefreshing(false);
  };

  const handleTagPress = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
  };

  const handleDumpPress = (dump: typeof dumps[0]) => {
    setSelectedDump(dump);
    router.push(`/dump/${dump.id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tags filter */}
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          <TouchableOpacity
            style={[
              styles.allTag,
              !selectedTag && styles.allTagSelected,
            ]}
            onPress={() => setSelectedTag(null)}
          >
            <Text
              style={[
                styles.allTagText,
                !selectedTag && styles.allTagTextSelected,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TagCloud
            tags={tags}
            selectedTag={selectedTag || undefined}
            onTagPress={handleTagPress}
            scrollable
          />
        </View>
      )}

      {/* Dumps list */}
      <FlatList
        data={dumps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DumpListItem
            dump={item}
            onPress={() => handleDumpPress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isLoading ? (
              <Text style={styles.emptyText}>Loading...</Text>
            ) : (
              <>
                <Text style={styles.emptyText}>No dumps yet</Text>
                <Text style={styles.emptySubtext}>
                  Start by recording your first brain dump
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/')}
                >
                  <Text style={styles.emptyButtonText}>Record Now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  tagsContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  allTag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 16,
    marginRight: 8,
  },
  allTagSelected: {
    backgroundColor: '#6366f1',
  },
  allTagText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500',
  },
  allTagTextSelected: {
    color: '#fafafa',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#71717a',
    fontSize: 14,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
});
