import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Colors, Emerald } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AttendanceService from '@/services/attendance.service';
import apiClientService from '@/services/apiClient.service';
import type { ActiveSession, AttendanceHistoryItem } from '@/types/api.types';

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

type TabType = 'checkin' | 'history';

export default function AttendanceScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<TabType>(
    params.tab === 'history' ? 'history' : 'checkin'
  );

  // Check In state
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsRefreshing, setSessionsRefreshing] = useState(false);

  // History state
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyRefreshing, setHistoryRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'flagged' | 'absent'>('all');

  // Update tab if navigated with param
  useEffect(() => {
    if (params.tab === 'history') {
      setActiveTab('history');
    }
  }, [params.tab]);

  // --- Check In logic ---
  const loadActiveSessions = async () => {
    try {
      const activeSessions = await AttendanceService.getActiveSessions();
      setSessions(activeSessions);
    } catch (error: any) {
      console.error('Failed to load active sessions:', error);
      if (!sessionsRefreshing && sessions.length === 0) {
        Alert.alert('Error', error.message || 'Failed to load active sessions');
      }
    } finally {
      setSessionsLoading(false);
      setSessionsRefreshing(false);
    }
  };

  // --- History logic ---
  const loadHistory = async () => {
    try {
      const data = await apiClientService.getAttendanceHistory();
      setHistory(data);
    } catch (error: any) {
      console.error('Failed to load attendance history:', error);
      if (!historyRefreshing && history.length === 0) {
        Alert.alert('Error', error.message || 'Failed to load attendance history');
      }
    } finally {
      setHistoryLoading(false);
      setHistoryRefreshing(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadActiveSessions();
    loadHistory();
  }, []);

  // Auto-refresh active sessions
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'checkin') {
        loadActiveSessions();
      }
    }, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadActiveSessions();
      loadHistory();
    }, [])
  );

  const onRefreshCheckin = () => {
    setSessionsRefreshing(true);
    loadActiveSessions();
  };

  const onRefreshHistory = () => {
    setHistoryRefreshing(true);
    loadHistory();
  };

  const handleOpenSession = (session: ActiveSession) => {
    router.push({
      pathname: '/attendance-flow',
      params: { session: JSON.stringify(session) },
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatFullDate = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter history
  const filteredHistory = statusFilter === 'all'
    ? history
    : history.filter((item) => item.status === statusFilter);

  // Stats from history
  const totalSessions = history.length;
  const presentCount = history.filter((h) => h.status === 'confirmed').length;
  const flaggedCount = history.filter((h) => h.status === 'flagged').length;
  const absentCount = history.filter((h) => h.status === 'absent').length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: Emerald[100], color: Emerald[700], label: 'Present' };
      case 'flagged':
        return { bg: '#fef3c7', color: '#d97706', label: 'Flagged' };
      case 'absent':
        return { bg: '#fee2e2', color: '#dc2626', label: 'Absent' };
      default:
        return { bg: '#f3f4f6', color: '#6b7280', label: status };
    }
  };

  // --- Render ---
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Attendance</Text>

        {/* Segmented Control */}
        <View
          style={[
            styles.segmentedControl,
            {
              backgroundColor: colorScheme === 'dark' ? '#1e2328' : '#f1f5f9',
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segment,
              activeTab === 'checkin' && {
                backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
            onPress={() => setActiveTab('checkin')}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="qrcode"
              size={16}
              color={activeTab === 'checkin' ? colors.tint : colors.tabIconDefault}
            />
            <Text
              style={[
                styles.segmentText,
                {
                  color: activeTab === 'checkin' ? colors.tint : colors.tabIconDefault,
                  fontWeight: activeTab === 'checkin' ? '700' : '500',
                },
              ]}
            >
              Check In
            </Text>
            {sessions.length > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.tint }]}>
                <Text style={styles.badgeText}>{sessions.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segment,
              activeTab === 'history' && {
                backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="clock.fill"
              size={16}
              color={activeTab === 'history' ? colors.tint : colors.tabIconDefault}
            />
            <Text
              style={[
                styles.segmentText,
                {
                  color: activeTab === 'history' ? colors.tint : colors.tabIconDefault,
                  fontWeight: activeTab === 'history' ? '700' : '500',
                },
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Check In Tab */}
      {activeTab === 'checkin' && (
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={sessionsRefreshing}
              onRefresh={onRefreshCheckin}
              tintColor={colors.tint}
            />
          }
        >
          <Text style={[styles.sectionSubtitle, { color: colors.tabIconDefault }]}>
            Active sessions for your courses
          </Text>

          {sessionsLoading ? (
            <View style={styles.centeredContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.centeredText, { color: colors.tabIconDefault }]}>
                Loading sessions...
              </Text>
            </View>
          ) : sessions.length === 0 ? (
            <View style={styles.centeredContainer}>
              <IconSymbol name="checkmark.circle.fill" size={64} color={colors.tabIconDefault} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No active sessions</Text>
              <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                Your lecturers haven't started any attendance sessions yet. Pull down to refresh.
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    styles.sessionCard,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                      borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                    },
                  ]}
                  onPress={() => handleOpenSession(session)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionInfo}>
                    <View style={styles.sessionHeader}>
                      <Text style={[styles.courseCode, { color: colors.tint }]}>
                        {session.course_code}
                      </Text>
                      <View style={[styles.activeBadge, { backgroundColor: '#10b981' + '20' }]}>
                        <View style={[styles.activeDot, { backgroundColor: '#10b981' }]} />
                        <Text style={[styles.activeText, { color: '#10b981' }]}>Active</Text>
                      </View>
                    </View>

                    <Text style={[styles.courseName, { color: colors.text }]} numberOfLines={1}>
                      {session.course_name}
                    </Text>

                    <View style={styles.sessionMeta}>
                      <View style={styles.metaItem}>
                        <IconSymbol name="number" size={14} color={colors.tabIconDefault} />
                        <Text style={[styles.metaText, { color: colors.tabIconDefault }]}>
                          Session #{session.id}
                        </Text>
                      </View>

                      {session.starts_at && (
                        <View style={styles.metaItem}>
                          <IconSymbol name="clock.fill" size={14} color={colors.tabIconDefault} />
                          <Text style={[styles.metaText, { color: colors.tabIconDefault }]}>
                            {formatTime(session.starts_at)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.arrowContainer}>
                    <IconSymbol name="chevron.right" size={20} color={colors.tint} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={historyRefreshing}
              onRefresh={onRefreshHistory}
              tintColor={colors.tint}
            />
          }
        >
          {historyLoading ? (
            <View style={styles.centeredContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.centeredText, { color: colors.tabIconDefault }]}>
                Loading history...
              </Text>
            </View>
          ) : (
            <>
              {/* Summary Stats */}
              <View style={styles.statsRow}>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                      borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                    },
                  ]}
                >
                  <Text style={[styles.statValue, { color: colors.tint }]}>{attendanceRate}%</Text>
                  <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>Rate</Text>
                </View>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                      borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                    },
                  ]}
                >
                  <Text style={[styles.statValue, { color: Emerald[700] }]}>{presentCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>Present</Text>
                </View>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                      borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                    },
                  ]}
                >
                  <Text style={[styles.statValue, { color: '#d97706' }]}>{flaggedCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>Flagged</Text>
                </View>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                      borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                    },
                  ]}
                >
                  <Text style={[styles.statValue, { color: '#dc2626' }]}>{absentCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.tabIconDefault }]}>Absent</Text>
                </View>
              </View>

              {/* Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
                contentContainerStyle={styles.filterContent}
              >
                {(
                  [
                    { key: 'all', label: `All (${totalSessions})` },
                    { key: 'confirmed', label: `Present (${presentCount})` },
                    { key: 'flagged', label: `Flagged (${flaggedCount})` },
                    { key: 'absent', label: `Absent (${absentCount})` },
                  ] as const
                ).map((filter) => {
                  const isActive = statusFilter === filter.key;
                  return (
                    <TouchableOpacity
                      key={filter.key}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isActive
                            ? colors.tint
                            : colorScheme === 'dark'
                              ? '#252829'
                              : '#f1f5f9',
                          borderColor: isActive
                            ? colors.tint
                            : colorScheme === 'dark'
                              ? '#383b3d'
                              : '#e2e8f0',
                        },
                      ]}
                      onPress={() => setStatusFilter(filter.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: isActive
                              ? '#ffffff'
                              : colorScheme === 'dark'
                                ? '#94a3b8'
                                : '#64748b',
                          },
                        ]}
                      >
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* History List */}
              {filteredHistory.length === 0 ? (
                <View style={styles.centeredContainer}>
                  <IconSymbol name="calendar" size={56} color={colors.tabIconDefault} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {statusFilter === 'all' ? 'No attendance history' : `No ${statusFilter} sessions`}
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
                    {statusFilter === 'all'
                      ? 'Your attendance records will appear here after sessions end.'
                      : 'Try a different filter to see more results.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {filteredHistory.map((item, index) => {
                    const statusStyle = getStatusStyle(item.status);
                    return (
                      <View
                        key={`${item.session_id}-${index}`}
                        style={[
                          styles.historyCard,
                          {
                            backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                            borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                          },
                        ]}
                      >
                        <View style={styles.historyTop}>
                          <View style={styles.historyInfo}>
                            <Text style={[styles.historyCourse, { color: colors.text }]} numberOfLines={1}>
                              {item.course_name}
                            </Text>
                            <Text style={[styles.historyCourseCode, { color: colors.tint }]}>
                              {item.course_code}
                            </Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                            <Text style={[styles.statusText, { color: statusStyle.color }]}>
                              {statusStyle.label}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.historyBottom}>
                          <View style={styles.metaItem}>
                            <IconSymbol name="calendar" size={13} color={colors.tabIconDefault} />
                            <Text style={[styles.historyMeta, { color: colors.tabIconDefault }]}>
                              {formatDate(item.starts_at)}
                            </Text>
                          </View>
                          {item.starts_at && item.ends_at && (
                            <View style={styles.metaItem}>
                              <IconSymbol name="clock.fill" size={13} color={colors.tabIconDefault} />
                              <Text style={[styles.historyMeta, { color: colors.tabIconDefault }]}>
                                {formatTime(item.starts_at)} – {formatTime(item.ends_at)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentText: {
    fontSize: 14,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  centeredText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  listContainer: {
    marginTop: 4,
  },
  // --- Check In styles ---
  sessionCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: '700',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  activeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
  },
  arrowContainer: {
    marginLeft: 12,
  },
  // --- History styles ---
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  filterRow: {
    marginBottom: 16,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  historyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  historyInfo: {
    flex: 1,
    marginRight: 12,
  },
  historyCourse: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  historyCourseCode: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyBottom: {
    flexDirection: 'row',
    gap: 16,
  },
  historyMeta: {
    fontSize: 12,
    marginLeft: 4,
  },
});
