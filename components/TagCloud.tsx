import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface TagCloudProps {
  tags: string[];
  selectedTag?: string;
  onTagPress?: (tag: string) => void;
  scrollable?: boolean;
}

export function TagCloud({
  tags,
  selectedTag,
  onTagPress,
  scrollable = false,
}: TagCloudProps) {
  const content = (
    <View style={styles.container}>
      {tags.map((tag, index) => (
        <Animated.View
          key={tag}
          entering={FadeInUp.duration(300).delay(index * 50)}
        >
          <TouchableOpacity
            style={[
              styles.tag,
              selectedTag === tag && styles.tagSelected,
            ]}
            onPress={() => onTagPress?.(tag)}
            activeOpacity={onTagPress ? 0.7 : 1}
            disabled={!onTagPress}
          >
            <Text
              style={[
                styles.tagText,
                selectedTag === tag && styles.tagTextSelected,
              ]}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  tag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tagSelected: {
    backgroundColor: '#6366f1',
  },
  tagText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#fafafa',
  },
});
