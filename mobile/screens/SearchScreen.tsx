import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useToast } from '@/contexts/ToastContext';
import apiClientService from '@/services/apiClient.service';
import type { Course } from '@/types/api.types';

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [searching, setSearching] = useState(false);
  const [enrollingIds, setEnrollingIds] = useState<Set<number>>(new Set());

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    try {
      setSearching(true);
      const results = await apiClientService.studentSearchCourses(query);
      setSearchResults(results);
    } catch (error: any) {
      showToast(error.message || 'Failed to search courses', 'error');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleEnroll = async (courseId: number) => {
    if (enrollingIds.has(courseId)) return;

    try {
      setEnrollingIds((prev) => new Set(prev).add(courseId));
      await apiClientService.studentEnrollInCourse(courseId);
      showToast('Course added successfully', 'success');

      // Refresh search results to update enrollment status
      if (searchQuery.trim()) {
        await performSearch(searchQuery.trim());
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to enroll in course', 'error');
    } finally {
      setEnrollingIds((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Find and enroll in courses
        </Text>
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colorScheme === 'dark' ? '#252829' : '#f5f5f5' }]}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.tabIconDefault} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by course code or name..."
          placeholderTextColor={colors.tabIconDefault}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Search Results */}
      {searching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>Searching...</Text>
        </View>
      )}

      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Search Results</Text>
          {searchResults.map((course) => (
            <View
              key={course.id}
              style={[
                styles.courseCard,
                {
                  backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                  borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                },
              ]}
            >
              <View style={styles.courseInfo}>
                <Text style={[styles.courseCode, { color: colors.tint }]}>{course.code}</Text>
                <Text style={[styles.courseName, { color: colors.text }]}>{course.name}</Text>
                {course.description && (
                  <Text style={[styles.courseDescription, { color: colors.tabIconDefault }]} numberOfLines={2}>
                    {course.description}
                  </Text>
                )}
                <View style={styles.courseMetaRow}>
                  <Text style={[styles.courseMeta, { color: colors.tabIconDefault }]}>
                    {course.semester}
                  </Text>
                  {course.lecturer_name && (
                    <>
                      <Text style={[styles.metaDivider, { color: colors.tabIconDefault }]}> • </Text>
                      <Text style={[styles.courseMeta, { color: colors.tabIconDefault }]}>
                        {course.lecturer_name}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {course.is_enrolled ? (
                <View style={[styles.enrolledBadge, { backgroundColor: colors.tint + '20' }]}>
                  <Text style={[styles.enrolledText, { color: colors.tint }]}>Enrolled</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.enrollButton, { backgroundColor: colors.tint }]}
                  onPress={() => handleEnroll(course.id)}
                  disabled={enrollingIds.has(course.id)}
                >
                  {enrollingIds.has(course.id) ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <IconSymbol name="plus" size={16} color="#ffffff" />
                      <Text style={styles.enrollButtonText}>Add</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {searchQuery.trim() && !searching && searchResults.length === 0 && (
        <View style={styles.emptyContainer}>
          <IconSymbol name="magnifyingglass" size={48} color={colors.tabIconDefault} />
          <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>No courses found</Text>
          <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
            Try searching with a different course code or name
          </Text>
        </View>
      )}

      {!searchQuery.trim() && (
        <View style={styles.emptyContainer}>
          <IconSymbol name="magnifyingglass" size={48} color={colors.tabIconDefault} />
          <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>Start searching</Text>
          <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
            Enter a course code or name to search
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  resultsContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  courseCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  courseDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  courseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  courseMeta: {
    fontSize: 12,
  },
  metaDivider: {
    fontSize: 12,
  },
  enrolledBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  enrolledText: {
    fontSize: 12,
    fontWeight: '600',
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 70,
    justifyContent: 'center',
  },
  enrollButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
