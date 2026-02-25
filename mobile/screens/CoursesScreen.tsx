import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Colors, Emerald, Amber } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFocusEffect } from '@react-navigation/native';
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

  const loadEnrolledCourses = async () => {
    try {
      const [courses, dashboardData] = await Promise.all([
        apiClientService.studentGetCourses(),
        apiClientService.studentDashboard(),
      ]);
      setEnrolledCourses(courses);
      setStats(dashboardData);

      if (dashboardData?.profile_complete) {
        setLoadingRecommended(true);
        try {
          const recommended = await apiClientService.studentGetRecommendedCourses();
          setRecommendedCourses(recommended);
        } catch {
          // Non-critical
        } finally {
          setLoadingRecommended(false);
        }
      }
    } catch (error: any) {
      console.error('Failed to load enrolled courses:', error);
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
      await loadEnrolledCourses();
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

  const handleDeleteCourse = (courseId: number, courseName: string) => {
    Alert.alert(
      'Unenroll Course',
      `Are you sure you want to unenroll from ${courseName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unenroll',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClientService.studentUnenrollFromCourse(courseId);
              showToast('Unenrolled successfully', 'success');
              loadEnrolledCourses();
            } catch (error: any) {
              showToast(getErrorMessage(error), 'error');
            }
          },
        },
      ]
    );
  };

  const formatEnrollmentDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `Enrolled ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const matchesSearch = (course: { code: string; name: string }, q: string) => {
    if (!q.trim()) return true;
    const lower = q.trim().toLowerCase();
    return (
      course.code.toLowerCase().includes(lower) ||
      course.name.toLowerCase().includes(lower)
    );
  };

  // Debounced search for full catalog (when user types)
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
  const filteredEnrolled = useMemo(
    () => enrolledCourses.filter((c) => matchesSearch(c, searchQuery)),
    [enrolledCourses, searchQuery]
  );
  const isSearchingCatalog = searchQuery.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: '#ffffff' }]}>
      <ScreenHeader title="Courses" />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: '#ffffff' }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        <View style={styles.searchRow}>
          <View style={[styles.searchContainer, { backgroundColor: colorScheme === 'dark' ? '#252829' : '#f5f5f5' }]}>
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

        {/* Search results (when user is searching the full catalog) */}
        {isSearchingCatalog && (
          <View style={styles.recommendedSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Search Results</Text>
            {searching ? (
              <ActivityIndicator size="small" color={colors.tint} style={{ marginVertical: 16 }} />
            ) : searchResults.length === 0 ? (
              <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                No courses found. Try a different search term.
              </Text>
            ) : (
              searchResults.map((course) => (
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
                    {course.is_enrolled ? (
                      <View style={[styles.enrolledBadge, { backgroundColor: colors.tint + '20' }]}>
                        <Text style={[styles.enrolledBadgeText, { color: colors.tint }]}>Enrolled</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.enrollButton, { borderColor: colors.accent, borderWidth: 1 }]}
                        onPress={() => handleEnroll(course.id)}
                        disabled={enrollingIds.has(course.id)}
                        activeOpacity={0.8}
                      >
                        {enrollingIds.has(course.id) ? (
                          <ActivityIndicator size="small" color={colors.accent} />
                        ) : (
                          <>
                            <IconSymbol name="plus" size={14} color={colors.accent} />
                            <Text style={[styles.enrollButtonText, { color: colors.accent }]}>Enrol</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={[styles.courseName, { color: colors.text }]} numberOfLines={1}>{course.name}</Text>

                  {course.description && (
                    <Text style={[styles.courseDescription, { color: colors.tabIconDefault }]} numberOfLines={2}>
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
              ))
            )}
          </View>
        )}

        {/* Recommended courses (when profile complete and not searching) */}
        {stats?.profile_complete && !isSearchingCatalog && (
          <View style={styles.recommendedSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Courses for {stats.current_semester || 'this semester'}
              {stats.academic_year ? ` (${stats.academic_year})` : ''}
            </Text>
            {!stats.enrollment_open && (
              <View style={[styles.enrollmentBanner, { backgroundColor: Amber[50], borderColor: Amber[300] }]}>
                <IconSymbol name="exclamationmark.triangle.fill" size={16} color={Amber[500]} />
                <Text style={[styles.enrollmentBannerText, { color: Amber[800] }]}>
                  Enrolment is currently closed. Courses will be available at the start of the next semester.
                </Text>
              </View>
            )}
            {loadingRecommended ? (
              <ActivityIndicator size="small" color={colors.tint} style={{ marginVertical: 16 }} />
            ) : filteredRecommended.length === 0 ? (
              <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                {recommendedCourses.length === 0
                  ? 'No courses found for your programme and level this semester.'
                  : 'No courses match your search.'}
              </Text>
            ) : (
              filteredRecommended.map((course) => (
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
                    {course.is_enrolled ? (
                      <View style={[styles.enrolledBadge, { backgroundColor: colors.tint + '20' }]}>
                        <Text style={[styles.enrolledBadgeText, { color: colors.tint }]}>Enrolled</Text>
                      </View>
                    ) : stats.enrollment_open ? (
                      <TouchableOpacity
                        style={[styles.enrollButton, { borderColor: colors.accent, borderWidth: 1 }]}
                        onPress={() => handleEnroll(course.id)}
                        disabled={enrollingIds.has(course.id)}
                        activeOpacity={0.8}
                      >
                        {enrollingIds.has(course.id) ? (
                          <ActivityIndicator size="small" color={colors.accent} />
                        ) : (
                          <>
                            <IconSymbol name="plus" size={14} color={colors.accent} />
                            <Text style={[styles.enrollButtonText, { color: colors.accent }]}>Enrol</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <Text style={[styles.courseName, { color: colors.text }]} numberOfLines={1}>{course.name}</Text>

                  {course.description && (
                    <Text style={[styles.courseDescription, { color: colors.tabIconDefault }]} numberOfLines={2}>
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
              ))
            )}
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>Loading courses...</Text>
          </View>
        ) : enrolledCourses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="book.fill" size={64} color={colors.tabIconDefault} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No enrolled courses yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
              Use the search above or recommended courses to enroll
            </Text>
          </View>
        ) : (
          <View style={styles.enrolledSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Enrolled</Text>
            <View style={styles.coursesContainer}>
              {filteredEnrolled.length === 0 ? (
                <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                  No enrolled courses match your search.
                </Text>
              ) : (
                filteredEnrolled.map((course) => (
                  <View
                    key={course.id}
                    style={[
                      styles.courseCard,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                        borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                        borderLeftWidth: 3,
                        borderLeftColor: Emerald[500],
                      },
                    ]}
                  >
                    <View style={styles.courseHeader}>
                      <View>
                        <Text style={[styles.courseCode, { color: colors.tint }]}>{course.code}</Text>
                        {course.enrolled_at && (
                          <Text style={[styles.enrollmentDate, { color: colors.tabIconDefault }]}>
                            {formatEnrollmentDate(course.enrolled_at)}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteCourse(course.id, course.name)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="trash" size={18} color={colors.error} />
                      </TouchableOpacity>
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
                ))
              )}
            </View>
          </View>
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
    paddingTop: 34,
    paddingBottom: 100,
  },
  searchRow: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
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
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  coursesContainer: {
    marginTop: 8,
  },
  courseCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  courseCode: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  enrollmentDate: {
    fontSize: 10,
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
  },
  courseMeta: {
    fontSize: 11,
    marginLeft: 4,
  },
  metaDivider: {
    fontSize: 11,
    marginHorizontal: 4,
  },
  recommendedSection: {
    marginBottom: 24,
  },
  enrolledSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  enrollmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  enrollmentBannerText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  enrolledBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  enrolledBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 12,
  },
  enrollButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
