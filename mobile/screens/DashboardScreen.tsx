import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Platform, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Emerald, Amber } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/utils/error';
import { Skeleton } from '@/components/Skeleton';
import { AnimatedButton } from '@/components/AnimatedButton';
import apiClientService from '@/services/apiClient.service';
import type { DashboardStats, Course, AttendanceHistoryItem } from '@/types/api.types';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentSessions, setRecentSessions] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuCourseId, setMenuCourseId] = useState<number | null>(null);

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getAttendancePercentage = () => {
    if (!stats || stats.total_sessions === 0) return 0;
    return Math.round((stats.attendance_marked_count / stats.total_sessions) * 100 * 10) / 10;
  };

  const noSessions = !stats || stats.total_sessions === 0;

  const getStatusLabel = (percentage: number) => {
    if (noSessions) return 'No Sessions';
    if (percentage >= 80) return 'Good';
    if (percentage >= 60) return 'Average';
    return 'At Risk';
  };

  const loadDashboardData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const [dashboardStats, enrolledCourses, history] = await Promise.all([
        apiClientService.studentDashboard().catch((e: any) => {
          console.error('Failed to load dashboard stats:', e);
          throw new Error(`Dashboard stats: ${e?.message || 'Unknown error'}`);
        }),
        apiClientService.studentGetCourses().catch((e: any) => {
          console.error('Failed to load courses:', e);
          throw new Error(`Courses: ${e?.message || 'Unknown error'}`);
        }),
        apiClientService.getAttendanceHistory().catch(() => [] as AttendanceHistoryItem[]),
      ]);

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
  }, [isAuthenticated]);

  const hasPendingVerification = recentSessions.some((s) => s.status === 'pending_verification');

  useEffect(() => {
    if (!hasPendingVerification || !isAuthenticated) return;
    const interval = setInterval(() => loadDashboardData(), 3000);
    return () => clearInterval(interval);
  }, [hasPendingVerification, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [isAuthenticated])
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
      case 'pending_verification':
        return { backgroundColor: '#dbeafe', color: '#1d4ed8' };
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
      case 'confirmed': return 'PRESENT';
      case 'pending_verification': return 'VERIFYING';
      case 'flagged': return 'FLAGGED';
      case 'absent': return 'ABSENT';
      default: return status.toUpperCase();
    }
  };

  const formatSessionTime = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const attendancePercentage = getAttendancePercentage();
  const statusLabel = getStatusLabel(attendancePercentage);
  const paddingTop = Math.max(insets.top, Platform.OS === 'ios' ? 8 : 12) + 8;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        {/* Custom Header: Greeting + Bell + Avatar */}
        <View style={styles.headerRow}>
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
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerIconButton, { backgroundColor: isDark ? colors.surface : '#f0f1f3' }]}
              activeOpacity={0.7}
              onPress={() => showToast('Notifications coming soon', 'info')}
              accessibilityLabel="Notifications"
            >
              <IconSymbol name="bell.fill" size={20} color={colors.tabIconDefault} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.greetingAvatar, { backgroundColor: colors.tint }]}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/profile')}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <Text style={styles.greetingAvatarText}>{getInitials(user?.full_name || user?.email)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={{ paddingTop: 10 }}>
            <Skeleton height={200} width="100%" borderRadius={20} style={{ marginBottom: 20 }} />
            <Skeleton height={72} width="100%" borderRadius={16} style={{ marginBottom: 28 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Skeleton height={20} width={120} />
              <Skeleton height={20} width={60} />
            </View>
            <Skeleton height={80} width="100%" borderRadius={12} style={{ marginBottom: 12 }} />
            <Skeleton height={80} width="100%" borderRadius={12} style={{ marginBottom: 12 }} />
          </View>
        ) : (
          <>
            {/* Stacked Card Container */}
            <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.stackedCardContainer}>
              <View style={[styles.backCard2, { backgroundColor: Emerald[700] }]} />
              <View style={[styles.backCard1, { backgroundColor: Emerald[800] }]} />
              <View style={[styles.attendanceCard, { backgroundColor: Emerald[900] }]}>
                <View style={styles.attendanceCardContent}>
                  <View style={styles.attendanceInfo}>
                    <Text style={styles.attendanceLabel}>Overall Attendance</Text>
                    <Text style={styles.attendancePercentage}>{attendancePercentage}%</Text>
                    <Text style={styles.attendanceSubtitle}>
                      {stats?.attendance_marked_count || 0}/{stats?.total_sessions || 0} Classes Attended
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{statusLabel}</Text>
                  </View>
                </View>
                <View style={styles.attendanceButtons}>
                  <AnimatedButton
                    style={styles.attendanceActionButton}
                    onPress={handleMarkAttendance}
                  >
                    <IconSymbol name="qrcode" size={16} color={Emerald[900]} />
                    <Text style={[styles.attendanceActionText, { color: Emerald[900] }]}>Check In</Text>
                  </AnimatedButton>
                  <AnimatedButton
                    style={styles.attendanceActionButtonSecondary}
                    onPress={handleViewHistory}
                  >
                    <IconSymbol name="clock.fill" size={16} color="rgba(255,255,255,0.9)" />
                    <Text style={[styles.attendanceActionText, { color: 'rgba(255,255,255,0.9)' }]}>History</Text>
                  </AnimatedButton>
                </View>
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
                    Your year and programme are not set. Tap to complete your setup.
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Stats row */}
            {stats && (
              <Animated.View
                entering={FadeInDown.duration(500).delay(100).springify()}
                style={[styles.statsRow, { backgroundColor: isDark ? '#1e2328' : '#f0f1f3' }]}
              >
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stats.enrolled_courses}</Text>
                  <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>Enrolled</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: isDark ? '#383b3d' : '#d8d9dc' }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stats.attendance_marked_count}</Text>
                  <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>Marked</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: isDark ? '#383b3d' : '#d8d9dc' }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stats.confirmed_count}</Text>
                  <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>Confirmed</Text>
                </View>
              </Animated.View>
            )}

            {/* Recent Sessions */}
            <View style={styles.sessionsSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Sessions</Text>
                <TouchableOpacity onPress={handleViewHistory} activeOpacity={0.7}>
                  <Text style={[styles.viewAllText, { color: colors.tabIconDefault }]}>View All</Text>
                </TouchableOpacity>
              </View>

              {recentSessions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <IconSymbol name="calendar" size={48} color={colors.tabIconDefault} />
                  <Text style={[styles.emptyText, { color: colors.text }]}>No recent sessions</Text>
                  <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                    Your attendance history will appear here
                  </Text>
                </View>
              ) : (
                <View style={styles.sessionsList}>
                  {recentSessions.map((session, index) => {
                    const statusStyle = getSessionStatusStyle(session.status);
                    return (
                      <Animated.View
                        entering={FadeInDown.duration(400).delay(200 + index * 50).springify()}
                        key={session.session_id}
                        style={[
                          styles.sessionCard,
                          {
                            backgroundColor: isDark ? '#1e2328' : '#ffffff',
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.sessionRowInner}>
                          <View style={[styles.statusDot, { backgroundColor: statusStyle.color }]} />
                          <View style={styles.sessionDetails}>
                            <Text style={[styles.sessionName, { color: colors.text }]} numberOfLines={1}>
                              {session.course_name}
                            </Text>
                            <Text style={[styles.sessionProfessor, { color: colors.tabIconDefault }]}>
                              {session.course_code} {session.ends_at ? `· ${formatSessionTime(session.ends_at)}` : ''}
                            </Text>
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
                </View>
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
                      {
                        backgroundColor: isDark ? '#1e2328' : '#ffffff',
                        borderColor: colors.border,
                        borderLeftColor: colors.tint,
                      },
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
                          {course.semester}{course.lecturer_names?.length > 0 ? ` • ${course.lecturer_names.join(', ')}` : ''}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setMenuCourseId(course.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.7}
                    >
                      <IconSymbol name="ellipsis.vertical" size={20} color={colors.tabIconDefault} />
                    </TouchableOpacity>
                  </Animated.View>
                ))
              )}

              {/* Course action menu */}
              <Modal
                visible={menuCourseId !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuCourseId(null)}
              >
                <Pressable style={styles.menuOverlay} onPress={() => setMenuCourseId(null)}>
                  <View style={[styles.menuSheet, { backgroundColor: isDark ? '#252829' : '#ffffff' }]}>
                    {(() => {
                      const course = courses.find((c) => c.id === menuCourseId);
                      if (!course) return null;
                      return (
                        <>
                          <Text style={[styles.menuSheetTitle, { color: colors.text }]} numberOfLines={1}>
                            {course.code} – {course.name}
                          </Text>
                          <TouchableOpacity
                            style={styles.menuSheetItem}
                            activeOpacity={0.7}
                            onPress={() => {
                              setMenuCourseId(null);
                              router.push('/(tabs)/courses');
                            }}
                          >
                            <IconSymbol name="book.fill" size={20} color={colors.tint} />
                            <Text style={[styles.menuSheetItemText, { color: colors.text }]}>View in Courses</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.menuSheetItem}
                            activeOpacity={0.7}
                            onPress={() => {
                              setMenuCourseId(null);
                              handleViewHistory();
                            }}
                          >
                            <IconSymbol name="clock.fill" size={20} color={colors.tint} />
                            <Text style={[styles.menuSheetItemText, { color: colors.text }]}>Attendance History</Text>
                          </TouchableOpacity>
                          <View style={[styles.menuSheetDivider, { backgroundColor: colors.border }]} />
                          <TouchableOpacity
                            style={styles.menuSheetItem}
                            activeOpacity={0.7}
                            onPress={() => {
                              setMenuCourseId(null);
                              confirmDropCourse({ id: course.id, code: course.code, name: course.name });
                            }}
                          >
                            <IconSymbol name="trash" size={20} color={colors.error} />
                            <Text style={[styles.menuSheetItemText, { color: colors.error }]}>Drop Course</Text>
                          </TouchableOpacity>
                        </>
                      );
                    })()}
                    <TouchableOpacity
                      style={[styles.menuSheetCancel, { backgroundColor: isDark ? '#1a1c1d' : '#f5f5f5' }]}
                      activeOpacity={0.7}
                      onPress={() => setMenuCourseId(null)}
                    >
                      <Text style={[styles.menuSheetCancelText, { color: colors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Modal>
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
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 4,
  },
  greetingText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 13,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingAvatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  // Stacked card effect
  stackedCardContainer: {
    marginBottom: 28,
    position: 'relative',
    paddingTop: 10,
  },
  backCard2: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: '100%',
    borderRadius: 20,
    opacity: 0.3,
  },
  backCard1: {
    position: 'absolute',
    top: 5,
    left: 7,
    right: 7,
    height: '100%',
    borderRadius: 20,
    opacity: 0.5,
  },
  attendanceCard: {
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    zIndex: 1,
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
    color: 'rgba(255,255,255,0.9)',
  },
  attendancePercentage: {
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -1,
    color: '#ffffff',
  },
  attendanceSubtitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.85)',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
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
    backgroundColor: '#ffffff',
  },
  attendanceActionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  attendanceActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 28,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  // Sections
  sessionsSection: {
    marginBottom: 28,
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
  sessionsList: {
    marginTop: 4,
  },
  sessionCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
    overflow: 'hidden',
  },
  sessionRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    flexShrink: 0,
  },
  sessionDetails: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
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
    marginBottom: 20,
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
  // Enrolled
  enrolledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
    overflow: 'hidden',
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  menuSheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  menuSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  menuSheetItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuSheetDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  menuSheetCancel: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  menuSheetCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
