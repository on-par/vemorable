import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DumpListItem } from '@/components';
import { useDumpStore } from '@/stores/dumpStore';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const {
    searchResults,
    isLoading,
    searchDumps,
    setSelectedDump,
  } = useDumpStore();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    Keyboard.dismiss();
    setHasSearched(true);
    await searchDumps(query.trim());
  }, [query, searchDumps]);

  const handleDumpPress = (dump: typeof searchResults[0]) => {
    setSelectedDump(dump);
    router.push(`/dump/${dump.id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your thoughts..."
          placeholderTextColor="#71717a"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity
          style={[
            styles.searchButton,
            !query.trim() && styles.searchButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={!query.trim()}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {hasSearched ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DumpListItem
              dump={item}
              onPress={() => handleDumpPress(item)}
              showSimilarity={item.similarity}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {isLoading ? (
                <Text style={styles.emptyText}>Searching...</Text>
              ) : (
                <>
                  <Text style={styles.emptyText}>No results found</Text>
                  <Text style={styles.emptySubtext}>
                    Try different keywords or phrases
                  </Text>
                </>
              )}
            </View>
          }
          ListHeaderComponent={
            searchResults.length > 0 ? (
              <Text style={styles.resultsCount}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </Text>
            ) : null
          }
        />
      ) : (
        <View style={styles.promptContainer}>
          <Text style={styles.promptTitle}>Semantic Search</Text>
          <Text style={styles.promptText}>
            Search across all your brain dumps using natural language. Find
            connections and patterns in your thoughts.
          </Text>
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Try searching for:</Text>
            {['career decisions', 'unresolved feelings', 'next steps'].map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestion}
                onPress={() => {
                  setQuery(suggestion);
                }}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fafafa',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  searchButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  resultsCount: {
    color: '#71717a',
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
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
  },
  promptContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  promptTitle: {
    color: '#fafafa',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  promptText: {
    color: '#a1a1aa',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  suggestions: {
    gap: 12,
  },
  suggestionsTitle: {
    color: '#71717a',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  suggestion: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  suggestionText: {
    color: '#fafafa',
    fontSize: 15,
  },
});
