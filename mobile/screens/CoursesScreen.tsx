import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Colors, Emerald, Amber } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/utils/error';
import apiClientService from '@/services/apiClient.service';
import type { Course, DashboardStats, RecommendedCourse } from '@/types/api.types';

export default function CoursesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { showToast } = useToast();

  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrollingIds, setEnrollingIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const hasLoadedOnce = useRef(false);

  const enrolledIdSet = useMemo(
    () => new Set(enrolledCourses.map((c) => c.id)),
    [enrolledCourses]
  );

  const loadData = async () => {
    try {
      const [courses, dashboardData] = await Promise.all([
        apiClientService.studentGetCourses(),
        apiClientService.studentDashboard(),
      ]);
      setEnrolledCourses(courses);
      setStats(dashboardData);

      if (dashboardData?.profile_complete && !hasLoadedOnce.current) {
        setLoadingRecommended(true);
        try {
          const recommended = await apiClientService.studentGetRecommendedCourses();
          setRecommendedCourses(recommended);
        } catch {
          // Non-critical
        } finally {
          setLoadingRecommended(false);
        }
        hasLoadedOnce.current = true;
      }
    } catch (error: any) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEnroll = async (courseId: number) => {
    if (enrollingIds.has(courseId)) return;
    try {
      setEnrollingIds((prev) => new Set(prev).add(courseId));
      await apiClientService.studentEnrollInCourse(courseId);
      showToast('Course added successfully', 'success');

      const courses = await apiClientService.studentGetCourses();
      setEnrolledCourses(courses);
      setRecommendedCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, is_enrolled: true } : c))
      );
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setEnrollingIds((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    hasLoadedOnce.current = false;
    await loadData();
  };

  const handleUnenroll = (courseId: number, courseName: string) => {
    Alert.alert(
      'Unenroll Course',
      `Are you sure you want to unenroll from ${courseName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unenroll',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClientService.studentUnenrollFromCourse(courseId);
              showToast('Unenrolled successfully', 'success');

              const courses = await apiClientService.studentGetCourses();
              setEnrolledCourses(courses);
              setRecommendedCourses((prev) =>
                prev.map((c) => (c.id === courseId ? { ...c, is_enrolled: false } : c))
              );
            } catch (error: any) {
              showToast(getErrorMessage(error), 'error');
            }
          },
        },
      ]
    );
  };

  const matchesSearch = (course: { code: string; name: string }, q: string) => {
    if (!q.trim()) return true;
    const lower = q.trim().toLowerCase();
    return course.code.toLowerCase().includes(lower) || course.name.toLowerCase().includes(lower);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        (async () => {
          try {
            setSearching(true);
            const results = await apiClientService.studentSearchCourses(searchQuery.trim());
            setSearchResults(results);
          } catch {
            setSearchResults([]);
          } finally {
            setSearching(false);
          }
        })();
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const filteredRecommended = useMemo(
    () => recommendedCourses.filter((c) => matchesSearch(c, searchQuery)),
    [recommendedCourses, searchQuery]
  );

  const isSearchingCatalog = searchQuery.trim().length > 0;

  const renderCourseCard = (course: RecommendedCourse | Course, isEnrolled: boolean) => {
    const canEnroll = stats?.enrollment_open && !isEnrolled;
    return (
      <View
        key={course.id}
        style={[
          styles.courseCard,
          { backgroundColor: colorScheme === 'dark' ? '#1e2328' : '#f0f1f3' },
        ]}
      >
        <View style={styles.courseHeader}>
          <View style={styles.courseCodeRow}>
            <Text style={[styles.courseCode, { color: colors.tint }]}>{course.code}</Text>
            {isEnrolled && (
              <View style={[styles.enrolledPill, { backgroundColor: colors.tint + '18' }]}>
                <Text style={[styles.enrolledPillText, { color: colors.tint }]}>Enrolled</Text>
              </View>
            )}
          </View>
          <View style={styles.courseActions}>
            {isEnrolled ? (
              <TouchableOpacity
                onPress={() => handleUnenroll(course.id, course.name)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
                style={styles.unenrollButton}
              >
                <IconSymbol name="trash" size={16} color={colors.error} />
              </TouchableOpacity>
            ) : canEnroll ? (
              <TouchableOpacity
                style={[styles.enrollButton, { backgroundColor: colors.tint + '12' }]}
                onPress={() => handleEnroll(course.id)}
                disabled={enrollingIds.has(course.id)}
                activeOpacity={0.8}
              >
                {enrollingIds.has(course.id) ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : (
                  <>
                    <IconSymbol name="plus" size={12} color={colors.tint} />
                    <Text style={[styles.enrollButtonText, { color: colors.tint }]}>Enrol</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <Text style={[styles.courseName, { color: colors.text }]} numberOfLines={1}>{course.name}</Text>

        {'description' in course && course.description ? (
          <Text style={[styles.courseDescription, { color: colors.tabIconDefault }]} numberOfLines={2}>
            {course.description}
          </Text>
        ) : null}

        <View style={styles.courseMetaRow}>
          {'semester' in course && (
            <>
              <IconSymbol name="calendar" size={13} color={colors.tabIconDefault} />
              <Text style={[styles.courseMeta, { color: colors.tabIconDefault }]}>
                {course.semester}
              </Text>
            </>
          )}
          {'lecturer_names' in course && course.lecturer_names?.length > 0 && (
            <>
              <Text style={[styles.metaDot, { color: colors.tabIconDefault }]}>·</Text>
              <IconSymbol name="person.fill" size={13} color={colors.tabIconDefault} />
              <Text style={[styles.courseMeta, { color: colors.tabIconDefault }]}>
                {course.lecturer_names.join(', ')}
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#fcfcf7' }]}>
      <ScreenHeader title="Courses" />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: '#fcfcf7' }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        <View style={styles.searchRow}>
          <View style={[styles.searchContainer, { backgroundColor: colorScheme === 'dark' ? '#252829' : '#f0f1f3' }]}>
            <IconSymbol name="magnifyingglass" size={18} color={colors.tabIconDefault} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by code or name..."
              placeholderTextColor={colors.tabIconDefault}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Search results from full catalog */}
        {isSearchingCatalog && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Search Results</Text>
            {searching ? (
              <ActivityIndicator size="small" color={colors.tint} style={{ marginVertical: 16 }} />
            ) : searchResults.length === 0 ? (
              <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                No courses found. Try a different search term.
              </Text>
            ) : (
              searchResults.map((course) =>
                renderCourseCard(course, course.is_enrolled || enrolledIdSet.has(course.id))
              )
            )}
          </View>
        )}

        {/* Semester courses (unified list — no separate enrolled section) */}
        {!isSearchingCatalog && (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>Loading courses...</Text>
              </View>
            ) : stats?.profile_complete ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {stats.current_semester || 'This Semester'}
                  {stats.academic_year ? ` (${stats.academic_year})` : ''}
                </Text>

                {!stats.enrollment_open && (
                  <View style={[styles.enrollmentBanner, { backgroundColor: Amber[50] }]}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={16} color={Amber[500]} />
                    <Text style={[styles.enrollmentBannerText, { color: Amber[800] }]}>
                      Enrolment is currently closed.
                    </Text>
                  </View>
                )}

                {loadingRecommended ? (
                  <ActivityIndicator size="small" color={colors.tint} style={{ marginVertical: 16 }} />
                ) : filteredRecommended.length === 0 ? (
                  <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                    No courses found for your programme and year this semester.
                  </Text>
                ) : (
                  filteredRecommended.map((course) =>
                    renderCourseCard(course, course.is_enrolled || enrolledIdSet.has(course.id))
                  )
                )}
              </View>
            ) : enrolledCourses.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="book.fill" size={64} color={colors.tabIconDefault} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No courses yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                  Complete your profile to see semester courses, or use search above
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  searchRow: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
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
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  courseCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  courseCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseCode: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  courseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
  courseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  courseMeta: {
    fontSize: 11,
    marginLeft: 3,
  },
  metaDot: {
    fontSize: 11,
    marginHorizontal: 2,
  },
  enrolledPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  enrolledPillText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  enrollmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  enrollmentBannerText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  enrollButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  unenrollButton: {
    padding: 6,
  },
});
