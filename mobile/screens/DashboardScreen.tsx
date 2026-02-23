import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Emerald } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useToast } from '@/contexts/ToastContext';
import apiClientService from '@/services/apiClient.service';
import type { DashboardStats, Course, AttendanceHistoryItem, RecommendedCourse } from '@/types/api.types';

export default function DashboardScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [recentSessions, setRecentSessions] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrollingIds, setEnrollingIds] = useState<Set<number>>(new Set());

  // Get user initials
  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Calculate attendance percentage (confirmed out of total past sessions)
  const getAttendancePercentage = () => {
    if (!stats || stats.total_sessions === 0) return 0;
    return Math.round((stats.confirmed_count / stats.total_sessions) * 100 * 10) / 10;
  };

  // Get status label
  const getStatusLabel = (percentage: number) => {
    if (percentage >= 80) return 'Good';
    if (percentage >= 60) return 'Average';
    return 'At Risk';
  };

  // Get status color
  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return colors.tint;
    if (percentage >= 60) return colors.warning;
    return colors.error;
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      let dashboardStats: DashboardStats | null = null;
      try {
        dashboardStats = await apiClientService.studentDashboard();
      } catch (statsError: any) {
        console.error('Failed to load dashboard stats:', statsError);
        throw new Error(`Dashboard stats: ${statsError?.message || 'Unknown error'}`);
      }

      let enrolledCourses: Course[] = [];
      try {
        enrolledCourses = await apiClientService.studentGetCourses();
      } catch (coursesError: any) {
        console.error('Failed to load courses:', coursesError);
        throw new Error(`Courses: ${coursesError?.message || 'Unknown error'}`);
      }

      let history: AttendanceHistoryItem[] = [];
      try {
        history = await apiClientService.getAttendanceHistory();
      } catch (historyError: any) {
        console.error('Failed to load attendance history:', historyError);
        // Non-critical: don't throw, just show empty recent sessions
      }

      setStats(dashboardStats);
      setCourses(enrolledCourses);
      setRecentSessions(history.slice(0, 5));

      // Load recommended courses when profile is complete
      if (dashboardStats?.profile_complete) {
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
      console.error('Failed to load dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
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
      await loadDashboardData();
    } catch (error: any) {
      showToast(error?.message || 'Failed to enroll in course', 'error');
    } finally {
      setEnrollingIds((prev) => {
        const next = new Set(prev);
        next.delete(courseId);
        return next;
      });
    }
  };

  const handleDropCourse = async (course: { id: number; code: string; name: string }) => {
    try {
      await apiClientService.studentUnenrollFromCourse(course.id);
      showToast('Dropped course', 'success');
      await loadDashboardData();
    } catch (error: any) {
      showToast(error?.message || 'Failed to drop course', 'error');
    }
  };

  const confirmDropCourse = (course: { id: number; code: string; name: string }) => {
    Alert.alert(
      'Drop course?',
      `You will be removed from ${course.code} – ${course.name}. You can search and re-enroll later if needed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Drop course', style: 'destructive', onPress: () => handleDropCourse(course) },
      ]
    );
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleMarkAttendance = () => {
    router.push('/(tabs)/attendance');
  };

  const handleViewHistory = () => {
    router.push({ pathname: '/(tabs)/attendance', params: { tab: 'history' } });
  };

  const getSessionStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { backgroundColor: Emerald[100], color: Emerald[700] };
      case 'flagged':
        return { backgroundColor: '#fef3c7', color: '#d97706' };
      case 'absent':
        return { backgroundColor: '#fee2e2', color: '#dc2626' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#6b7280' };
    }
  };

  const getStatusDisplayLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'PRESENT';
      case 'flagged':
        return 'FLAGGED';
      case 'absent':
        return 'ABSENT';
      default:
        return status.toUpperCase();
    }
  };

  const formatSessionTime = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const attendancePercentage = getAttendancePercentage();
  const statusLabel = getStatusLabel(attendancePercentage);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.userSection}>
            <View style={[styles.initialsCircle, { backgroundColor: colors.tint }]}>
              <Text style={styles.initialsText}>
                {getInitials(user?.full_name || user?.email)}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.welcomeText, { color: colors.tabIconDefault }]}>
                Welcome back,
              </Text>
              {user && (
                <Text style={[styles.userName, { color: colors.text }]}>
                  {user.full_name || user.email}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: colors.tint + '15' }]}
          >
            <IconSymbol name="bell.fill" size={22} color={colors.tint} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
            Loading dashboard...
          </Text>
        </View>
      ) : (
        <>
          {/* Incomplete profile alert */}
          {stats && !stats.profile_complete && (
            <TouchableOpacity
              style={[styles.incompleteProfileBanner, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.8}
            >
              <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#d97706" />
              <View style={styles.incompleteProfileContent}>
                <Text style={styles.incompleteProfileTitle}>Incomplete profile</Text>
                <Text style={styles.incompleteProfileText}>
                  Your level and programme are not set. Tap to complete your setup.
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Stats row */}
          {stats && (
            <View style={[styles.statsRow, { width: screenWidth - 40 }]}>
              <View style={[styles.statCard, { backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff', borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e7eb' }, styles.statCardShadow]}>
                <View style={styles.statCardIconWrap}>
                  <IconSymbol name="book.fill" size={20} color={Emerald[600]} />
                </View>
                <Text style={[styles.statCardValue, { color: colors.text }]}>{stats.enrolled_courses}</Text>
                <Text style={[styles.statCardLabel, { color: colors.tabIconDefault }]}>Enrolled</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff', borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e7eb' }, styles.statCardShadow]}>
                <View style={styles.statCardIconWrap}>
                  <IconSymbol name="person.fill" size={20} color={Emerald[600]} />
                </View>
                <Text style={[styles.statCardValue, { color: colors.text }]}>{stats.attendance_marked_count}</Text>
                <Text style={[styles.statCardLabel, { color: colors.tabIconDefault }]}>Marked</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff', borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e7eb' }, styles.statCardShadow]}>
                <View style={styles.statCardIconWrap}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color={Emerald[600]} />
                </View>
                <Text style={[styles.statCardValue, { color: colors.text }]}>{stats.confirmed_count}</Text>
                <Text style={[styles.statCardLabel, { color: colors.tabIconDefault }]}>Confirmed</Text>
              </View>
            </View>
          )}

          {/* Overall Attendance Card */}
          <View style={[styles.attendanceCard, { backgroundColor: colors.tint }]}>
            <View style={styles.attendanceCardContent}>
              <View style={styles.attendanceInfo}>
                <Text style={styles.attendanceLabel}>Overall Attendance</Text>
                <Text style={styles.attendancePercentage}>{attendancePercentage}%</Text>
                <Text style={styles.attendanceSubtitle}>
                  {stats?.confirmed_count || 0}/{stats?.total_sessions || 0} Classes Attended
                </Text>
              </View>

              {/* Status Badge */}
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{statusLabel}</Text>
              </View>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.attendanceButtons}>
              <TouchableOpacity
                style={styles.attendanceActionButton}
                onPress={handleMarkAttendance}
              >
                <IconSymbol name="qrcode" size={16} color={colors.tint} />
                <Text style={[styles.attendanceActionText, { color: colors.tint }]}>Check In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.attendanceActionButtonReports}
                onPress={handleViewHistory}
              >
                <IconSymbol name="chart.bar.fill" size={16} color='#ffffff' />
                <Text style={styles.attendanceActionText}>Reports</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Sessions Section */}
          <View style={styles.sessionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recent Sessions
              </Text>
              <TouchableOpacity onPress={handleViewHistory}>
                <Text style={[styles.viewAllText, { color: colors.tint }]}>
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {recentSessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="calendar" size={48} color={colors.tabIconDefault} />
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  No recent sessions
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                  Your attendance history will appear here
                </Text>
              </View>
            ) : (
              <>
                {recentSessions.map((session) => {
                  const statusStyle = getSessionStatusStyle(session.status);
                  return (
                    <View
                      key={session.session_id}
                      style={[
                        styles.sessionCard,
                        {
                          backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                          borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                        },
                      ]}
                    >
                      <View style={styles.sessionContent}>
                        <View style={styles.sessionDetails}>
                          <Text style={[styles.sessionName, { color: colors.text }]} numberOfLines={1}>
                            {session.course_name}
                          </Text>
                          <View style={styles.sessionMeta}>
                            <Text style={[styles.sessionProfessor, { color: colors.tabIconDefault }]}>
                              {session.course_code} {session.ends_at ? `· ${formatSessionTime(session.ends_at)}` : ''}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.sessionStatusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                          <Text style={[styles.sessionStatusText, { color: statusStyle.color }]}>
                            {getStatusDisplayLabel(session.status)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </View>

          {/* Recommended Courses (when profile complete) */}
          {stats?.profile_complete && (
            <View style={styles.sessionsSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Courses for {stats.current_semester || 'this semester'}
                  {stats.academic_year ? ` (${stats.academic_year})` : ''}
                </Text>
              </View>
              {!stats.enrollment_open && (
                <View style={[styles.enrollmentBanner, { backgroundColor: '#dbeafe', borderColor: '#3b82f6' }]}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#2563eb" />
                  <Text style={styles.enrollmentBannerText}>
                    Enrolment is currently closed. Courses will be available at the start of the next semester.
                  </Text>
                </View>
              )}
              {loadingRecommended ? (
                <ActivityIndicator size="small" color={colors.tint} style={{ marginVertical: 16 }} />
              ) : recommendedCourses.length === 0 ? (
                <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                  No courses found for your programme and level this semester.
                </Text>
              ) : (
                recommendedCourses.map((course) => (
                  <View
                    key={course.id}
                    style={[
                      styles.recommendedCard,
                      { backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff', borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5' },
                    ]}
                  >
                    <View style={styles.recommendedInfo}>
                      <Text style={[styles.recommendedCode, { color: colors.tint }]}>{course.code}</Text>
                      <Text style={[styles.recommendedName, { color: colors.text }]} numberOfLines={1}>{course.name}</Text>
                      {course.description && (
                        <Text style={[styles.recommendedDesc, { color: colors.tabIconDefault }]} numberOfLines={1}>{course.description}</Text>
                      )}
                      <View style={styles.recommendedMetaRow}>
                        <IconSymbol name="calendar" size={12} color={colors.tabIconDefault} />
                        <Text style={[styles.recommendedMeta, { color: colors.tabIconDefault }]}>
                          {course.semester}{course.lecturer_name ? ` • ${course.lecturer_name}` : ''}
                        </Text>
                      </View>
                    </View>
                    {course.is_enrolled ? (
                      <View style={[styles.enrolledBadge, { backgroundColor: Emerald[100] }]}>
                        <Text style={[styles.enrolledBadgeText, { color: Emerald[700] }]}>Enrolled</Text>
                      </View>
                    ) : stats.enrollment_open ? (
                      <TouchableOpacity
                        style={[styles.enrollBtn, { borderColor: colors.tint }]}
                        onPress={() => handleEnroll(course.id)}
                        disabled={enrollingIds.has(course.id)}
                      >
                        {enrollingIds.has(course.id) ? (
                          <ActivityIndicator size="small" color={colors.tint} />
                        ) : (
                          <>
                            <IconSymbol name="plus" size={14} color={colors.tint} />
                            <Text style={[styles.enrollBtnText, { color: colors.tint }]}>Enrol</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          )}

          {/* Enrolled Courses */}
          <View style={styles.sessionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>My Enrolled Courses</Text>
            </View>
            {courses.length === 0 ? (
              <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                No enrolled courses yet. Courses you enrol in will appear here.
              </Text>
            ) : (
              courses.map((course) => (
                <View
                  key={course.id}
                  style={[
                    styles.enrolledCard,
                    { backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff', borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5' },
                  ]}
                >
                  <View style={styles.enrolledInfo}>
                    <Text style={[styles.enrolledCode, { color: colors.tint }]}>{course.code}</Text>
                    <Text style={[styles.enrolledName, { color: colors.text }]} numberOfLines={1}>{course.name}</Text>
                    {course.description && (
                      <Text style={[styles.enrolledDesc, { color: colors.tabIconDefault }]} numberOfLines={1}>{course.description}</Text>
                    )}
                    <View style={styles.enrolledMetaRow}>
                      <IconSymbol name="calendar" size={12} color={colors.tabIconDefault} />
                      <Text style={[styles.enrolledMeta, { color: colors.tabIconDefault }]}>
                        {course.semester}{course.lecturer_name ? ` • ${course.lecturer_name}` : ''}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => confirmDropCourse({ id: course.id, code: course.code, name: course.name })}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <IconSymbol name="trash" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

        </>
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
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  initialsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 12,
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
  // Overall Attendance Card
  attendanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  attendanceCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  attendancePercentage: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  attendanceSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  attendanceActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 12,
  },
  attendanceActionButtonReports: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  attendanceActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff'
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 28,
  },
  quickActionItem: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Sessions Section
  sessionsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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
    marginBottom: 20,
    lineHeight: 20,
  },
  sessionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sessionTimeBar: {
    width: 4,
  },
  sessionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sessionTime: {
    marginRight: 16,
    alignItems: 'center',
  },
  sessionTimeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionTimeSeparator: {
    fontSize: 10,
  },
  sessionDetails: {
    flex: 1,
    marginRight: 12,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionLocation: {
    fontSize: 12,
  },
  sessionDot: {
    fontSize: 10,
    marginHorizontal: 6,
  },
  sessionProfessor: {
    fontSize: 12,
  },
  sessionStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sessionStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  // Incomplete profile
  incompleteProfileBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  incompleteProfileContent: {
    flex: 1,
    marginLeft: 12,
  },
  incompleteProfileTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  incompleteProfileText: {
    fontSize: 13,
    color: '#92400e',
    marginTop: 4,
  },
  // Stats row - vertical layout: icon, number, label (mobile-optimized)
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statCardShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statCardIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statCardLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Recommended
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
    color: '#1e40af',
    marginLeft: 8,
    flex: 1,
  },
  recommendedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  recommendedInfo: {
    flex: 1,
  },
  recommendedCode: {
    fontSize: 13,
    fontWeight: '700',
  },
  recommendedName: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  recommendedDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  recommendedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  recommendedMeta: {
    fontSize: 11,
    marginLeft: 4,
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
  },
  enrollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 12,
  },
  enrollBtnText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Enrolled
  enrolledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  enrolledInfo: {
    flex: 1,
  },
  enrolledCode: {
    fontSize: 13,
    fontWeight: '700',
  },
  enrolledName: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  enrolledDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  enrolledMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  enrolledMeta: {
    fontSize: 11,
    marginLeft: 4,
  },
});
