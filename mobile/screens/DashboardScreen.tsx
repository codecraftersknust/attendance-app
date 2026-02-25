import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Emerald, Amber } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/utils/error';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Skeleton } from '@/components/Skeleton';
import { AnimatedButton } from '@/components/AnimatedButton';
import apiClientService from '@/services/apiClient.service';
import type { DashboardStats, Course, AttendanceHistoryItem } from '@/types/api.types';

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
  const [recentSessions, setRecentSessions] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get user initials
  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Calculate attendance percentage (marked out of total past sessions)
  const getAttendancePercentage = () => {
    if (!stats || stats.total_sessions === 0) return 0;
    return Math.round((stats.attendance_marked_count / stats.total_sessions) * 100 * 10) / 10;
  };

  // Get status label
  const getStatusLabel = (percentage: number) => {
    if (percentage >= 80) return 'Good';
    if (percentage >= 60) return 'Average';
    return 'At Risk';
  };

  // Get status color (emerald=good, amber=average, red=at risk)
  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return colors.tint;
    if (percentage >= 60) return colors.accent ?? colors.warning;
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
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDropCourse = async (course: { id: number; code: string; name: string }) => {
    try {
      await apiClientService.studentUnenrollFromCourse(course.id);
      showToast('Dropped course', 'success');
      await loadDashboardData();
    } catch (error: any) {
      showToast(getErrorMessage(error), 'error');
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
        return { backgroundColor: Amber[100], color: Amber[700] };
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
    <View style={styles.container}>
      <ScreenHeader title="Home" />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: '#ffffff' }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        {/* Greeting + Avatar */}
        <View style={styles.greeting}>
          <View style={styles.greetingText}>
            <Text style={[styles.welcomeText, { color: colors.tabIconDefault }]}>
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
            </Text>
            {user && (
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {user.full_name || user.email}
              </Text>
            )}
          </View>
          <View style={[styles.greetingAvatar, { backgroundColor: colors.tint }]}>
            <Text style={styles.greetingAvatarText}>
              {getInitials(user?.full_name || user?.email)}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={{ paddingTop: 10 }}>
            {/* Main card skeleton */}
            <Skeleton height={180} width="100%" borderRadius={20} style={{ marginBottom: 20 }} />

            {/* Recent sessions section header skeleton */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Skeleton height={20} width={120} />
              <Skeleton height={20} width={60} />
            </View>

            {/* Session cards skeletons */}
            <Skeleton height={80} width="100%" borderRadius={12} style={{ marginBottom: 12 }} />
            <Skeleton height={80} width="100%" borderRadius={12} style={{ marginBottom: 12 }} />
            <Skeleton height={80} width="100%" borderRadius={12} style={{ marginBottom: 20 }} />

            {/* Courses section header skeleton */}
            <Skeleton height={20} width={150} style={{ marginBottom: 16 }} />
            <Skeleton height={90} width="100%" borderRadius={12} style={{ marginBottom: 12 }} />
          </View>
        ) : (
          <>
            {/* Main Attendance Card - First (precedence) */}
            <Animated.View entering={FadeInDown.duration(500).springify()} style={[styles.attendanceCard, { backgroundColor: Emerald[900] }]}>
              <View style={styles.attendanceCardContent}>
                <View style={styles.attendanceInfo}>
                  <Text style={[styles.attendanceLabel, { color: 'rgba(255,255,255,0.9)' }]}>Overall Attendance</Text>
                  <Text style={[styles.attendancePercentage, { color: '#ffffff' }]}>{attendancePercentage}%</Text>
                  <Text style={[styles.attendanceSubtitle, { color: 'rgba(255,255,255,0.85)' }]}>
                    {stats?.attendance_marked_count || 0}/{stats?.total_sessions || 0} Classes Attended
                  </Text>
                </View>

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#ffffff' }]}>{statusLabel}</Text>
                </View>
              </View>

              {/* Quick Action Buttons */}
              <View style={styles.attendanceButtons}>
                <AnimatedButton
                  style={[styles.attendanceActionButton, { backgroundColor: '#ffffff' }]}
                  onPress={handleMarkAttendance}
                >
                  <IconSymbol name="qrcode" size={16} color={Emerald[900]} />
                  <Text style={[styles.attendanceActionText, { color: Emerald[900] }]}>Check In</Text>
                </AnimatedButton>
                <AnimatedButton
                  style={[styles.attendanceActionButtonReports, { backgroundColor: 'rgba(255,255,255,0.18)' }]}
                  onPress={handleViewHistory}
                >
                  <IconSymbol name="clock.fill" size={16} color="rgba(255,255,255,0.9)" />
                  <Text style={[styles.attendanceActionText, { color: 'rgba(255,255,255,0.9)' }]}>History</Text>
                </AnimatedButton>
              </View>
            </Animated.View>

            {/* Incomplete profile alert */}
            {stats && !stats.profile_complete && (
              <TouchableOpacity
                style={[styles.incompleteProfileBanner, { backgroundColor: Amber[50], borderColor: Amber[300] }]}
                onPress={() => router.push('/(tabs)/profile')}
                activeOpacity={0.8}
              >
                <IconSymbol name="exclamationmark.triangle.fill" size={20} color={Amber[500]} />
                <View style={styles.incompleteProfileContent}>
                  <Text style={[styles.incompleteProfileTitle, { color: Amber[800] }]}>Incomplete profile</Text>
                  <Text style={[styles.incompleteProfileText, { color: Amber[700] }]}>
                    Your level and programme are not set. Tap to complete your setup.
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Stats row - below attendance card */}
            {stats && (
              <Animated.View entering={FadeInDown.duration(500).delay(100).springify()} style={[styles.statsRow, { width: screenWidth - 40 }]}>
                <View style={[styles.statCard, { backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff', borderWidth: 1, borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5', borderTopWidth: 3, borderTopColor: Emerald[500] }, styles.statCardShadow]}>
                  <View style={styles.statCardIconWrap}>
                    <IconSymbol name="book" size={20} color={Emerald[600]} />
                  </View>
                  <Text style={[styles.statCardValue, { color: colors.text }]}>{stats.enrolled_courses}</Text>
                  <Text style={[styles.statCardLabel, { color: colorScheme === 'dark' ? Emerald[400] : Emerald[700] }]}>Enrolled</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff', borderWidth: 1, borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5', borderTopWidth: 3, borderTopColor: Emerald[500] }, styles.statCardShadow]}>
                  <View style={styles.statCardIconWrap}>
                    <IconSymbol name="person" size={20} color={Emerald[600]} />
                  </View>
                  <Text style={[styles.statCardValue, { color: colors.text }]}>{stats.attendance_marked_count}</Text>
                  <Text style={[styles.statCardLabel, { color: colorScheme === 'dark' ? Emerald[400] : Emerald[700] }]}>Marked</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff', borderWidth: 1, borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5', borderTopWidth: 3, borderTopColor: Emerald[500] }, styles.statCardShadow]}>
                  <View style={styles.statCardIconWrap}>
                    <IconSymbol name="checkmark.circle" size={20} color={Emerald[600]} />
                  </View>
                  <Text style={[styles.statCardValue, { color: colors.text }]}>{stats.confirmed_count}</Text>
                  <Text style={[styles.statCardLabel, { color: colorScheme === 'dark' ? Emerald[400] : Emerald[700] }]}>Confirmed</Text>
                </View>
              </Animated.View>
            )}

            {/* Recent Sessions Section */}
            <View style={styles.sessionsSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Recent Sessions
                </Text>
                <TouchableOpacity onPress={handleViewHistory} activeOpacity={0.7}>
                  <Text style={[styles.viewAllText, { color: colors.accent }]}>
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
                  {recentSessions.map((session, index) => {
                    const statusStyle = getSessionStatusStyle(session.status);
                    return (
                      <Animated.View
                        entering={FadeInDown.duration(400).delay(200 + index * 50).springify()}
                        key={session.session_id}
                        style={[
                          styles.sessionCard,
                          {
                            backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                            borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                            borderLeftWidth: 3,
                            borderLeftColor: statusStyle.color,
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
                      </Animated.View>
                    );
                  })}
                </>
              )}
            </View>

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
                courses.map((course, index) => (
                  <Animated.View
                    entering={FadeInDown.duration(400).delay(300 + index * 50).springify()}
                    key={course.id}
                    style={[
                      styles.enrolledCard,
                      { backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff', borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5', borderLeftWidth: 3, borderLeftColor: Emerald[500] },
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
                      activeOpacity={0.7}
                    >
                      <IconSymbol name="trash" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </Animated.View>
                ))
              )}
            </View>

          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 11,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  greetingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  greetingAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
  // Overall Attendance Card (main card with precedence)
  attendanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attendancePercentage: {
    fontSize: 38,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: -1,
  },
  attendanceSubtitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
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
    paddingVertical: 12,
    borderRadius: 12,
  },
  attendanceActionButtonReports: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  attendanceActionText: {
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
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
    letterSpacing: 0.5,
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
  },
  incompleteProfileText: {
    fontSize: 13,
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
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
    letterSpacing: 0.5,
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
