import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDumpStore } from '@/stores/dumpStore';

export default function RootLayout() {
  const fetchDumps = useDumpStore((state) => state.fetchDumps);
  const fetchTags = useDumpStore((state) => state.fetchTags);

  useEffect(() => {
    // Initial data fetch
    fetchDumps();
    fetchTags();
  }, [fetchDumps, fetchTags]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#fafafa',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#000000',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Vemorable',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="result"
          options={{
            title: 'Result',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="archive"
          options={{
            title: 'Archive',
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            title: 'Search',
          }}
        />
        <Stack.Screen
          name="dump/[id]"
          options={{
            title: 'Dump Details',
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
