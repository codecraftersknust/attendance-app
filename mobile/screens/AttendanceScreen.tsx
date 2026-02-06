import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AttendanceService from '@/services/attendance.service';
import type { ActiveSession } from '@/types/api.types';

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export default function AttendanceScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadActiveSessions = async () => {
    try {
      const activeSessions = await AttendanceService.getActiveSessions();
      setSessions(activeSessions);
    } catch (error: any) {
      console.error('Failed to load active sessions:', error);
      // Only show alert if user initiated refresh, not on auto-refresh
      if (!refreshing && sessions.length === 0) {
        Alert.alert('Error', error.message || 'Failed to load active sessions');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadActiveSessions();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadActiveSessions();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadActiveSessions();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadActiveSessions();
  };

  const handleOpenSession = (session: ActiveSession) => {
    // Navigate to attendance flow screen with session data
    router.push({
      pathname: '/attendance-flow',
      params: {
        session: JSON.stringify(session),
      },
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return time;
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
        <Text style={[styles.title, { color: colors.text }]}>Mark Attendance</Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Active sessions for your courses
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>Loading sessions...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="checkmark.circle.fill" size={64} color={colors.tabIconDefault} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No active sessions</Text>
          <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
            Your lecturers haven't started any attendance sessions yet.
            Pull down to refresh.
          </Text>
        </View>
      ) : (
        <View style={styles.sessionsContainer}>
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
                        {formatDateTime(session.starts_at)}
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
  sessionsContainer: {
    marginTop: 8,
  },
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
});
