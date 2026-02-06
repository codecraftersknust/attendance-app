import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import apiClientService from '@/services/apiClient.service';
import type { Course } from '@/types/api.types';

export default function CoursesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEnrolledCourses = async () => {
    try {
      const courses = await apiClientService.studentGetCourses();
      setEnrolledCourses(courses);
    } catch (error: any) {
      console.error('Failed to load enrolled courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load courses on mount
  useEffect(() => {
    loadEnrolledCourses();
  }, []);

  // Refresh courses when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEnrolledCourses();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadEnrolledCourses();
  };

  const formatEnrollmentDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `Enrolled ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Courses</Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Your enrolled courses
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>Loading courses...</Text>
        </View>
      ) : enrolledCourses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="book.fill" size={64} color={colors.tabIconDefault} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No courses yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
            Use the search button to find and enroll in courses
          </Text>
        </View>
      ) : (
        <View style={styles.coursesContainer}>
          {enrolledCourses.map((course) => (
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
              <View style={styles.courseHeader}>
                <Text style={[styles.courseCode, { color: colors.tint }]}>{course.code}</Text>
                {course.enrolled_at && (
                  <Text style={[styles.enrollmentDate, { color: colors.tabIconDefault }]}>
                    {formatEnrollmentDate(course.enrolled_at)}
                  </Text>
                )}
              </View>

              <Text style={[styles.courseName, { color: colors.text }]}>{course.name}</Text>

              {course.description && (
                <Text style={[styles.courseDescription, { color: colors.tabIconDefault }]} numberOfLines={3}>
                  {course.description}
                </Text>
              )}

              <View style={styles.courseMetaRow}>
                <IconSymbol name="calendar" size={14} color={colors.tabIconDefault} />
                <Text style={[styles.courseMeta, { color: colors.tabIconDefault }]}>
                  {course.semester}
                </Text>
                {course.lecturer_name && (
                  <>
                    <Text style={[styles.metaDivider, { color: colors.tabIconDefault }]}> • </Text>
                    <IconSymbol name="person.fill" size={14} color={colors.tabIconDefault} />
                    <Text style={[styles.courseMeta, { color: colors.tabIconDefault }]}>
                      {course.lecturer_name}
                    </Text>
                  </>
                )}
              </View>
            </View>
          ))}
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
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  coursesContainer: {
    marginTop: 8,
  },
  courseCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: '700',
  },
  enrollmentDate: {
    fontSize: 11,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  courseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  courseMeta: {
    fontSize: 13,
    marginLeft: 4,
  },
  metaDivider: {
    fontSize: 12,
    marginHorizontal: 4,
  },
});
