import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import apiClientService from '@/services/apiClient.service';
import StatCard from '@/components/dashboard/StatCard';
import ConfirmationGauge from '@/components/dashboard/ConfirmationGauge';
import QuickActionButton from '@/components/dashboard/QuickActionButton';
import type { DashboardStats, Course } from '@/types/api.types';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { logout, user } = useAuth();
  const router = useRouter();

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get user initials
  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Get current day and date
  const getCurrentDate = () => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();

    return `${dayName}, ${monthName} ${date}, ${year}`;
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      // Load stats first
      let dashboardStats: DashboardStats | null = null;
      try {
        dashboardStats = await apiClientService.studentDashboard();
      } catch (statsError: any) {
        console.error('Failed to load dashboard stats:', statsError);
        throw new Error(`Dashboard stats: ${statsError?.message || 'Unknown error'}`);
      }

      // Then load courses
      let enrolledCourses: Course[] = [];
      try {
        enrolledCourses = await apiClientService.studentGetCourses();
      } catch (coursesError: any) {
        console.error('Failed to load courses:', coursesError);
        throw new Error(`Courses: ${coursesError?.message || 'Unknown error'}`);
      }

      setStats(dashboardStats);
      setCourses(enrolledCourses);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      const errorMessage = error?.message || 'Failed to load dashboard data. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  // Pull to refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Logout handler
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Navigate to attendance flow
  const handleMarkAttendance = () => {
    router.push('/attendance-flow');
  };

  // Navigate to courses screen
  const handleViewAllCourses = () => {
    router.push('/(tabs)/courses');
  };

  // Navigate to search screen
  const handleSearchCourses = () => {
    router.push('/(tabs)/search');
  };

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
            {/* Initials Icon */}
            <View style={[styles.initialsCircle, { backgroundColor: colors.tint }]}>
              <Text style={styles.initialsText}>
                {getInitials(user?.full_name || user?.email)}
              </Text>
            </View>

            {/* Welcome and Username */}
            <View style={styles.userInfo}>
              <Text style={[styles.welcomeText, { color: colors.tabIconDefault }]}>
                Welcome back
              </Text>
              {user && (
                <Text style={[styles.userName, { color: colors.text }]}>
                  {user.full_name || user.email}
                </Text>
              )}
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.logoutButton, { backgroundColor: colors.tint + '15' }]}
          >
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color={colors.tint} />
          </TouchableOpacity>
        </View>

        {/* Date Display */}
        <Text style={[styles.dateText, { color: colors.tabIconDefault }]}>
          {getCurrentDate()}
        </Text>

        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Your attendance dashboard
        </Text>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
            Loading dashboard...
          </Text>
        </View>
      ) : (
        <>
          {/* Statistics Section */}
          {stats && (
            <View style={styles.statsSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statsScrollContent}
              >
                <StatCard
                  title="Enrolled"
                  value={stats.enrolled_courses}
                  subtitle="courses"
                  icon="book.fill"
                  iconColor="#10b981"
                  colorScheme={colorScheme}
                />
                <StatCard
                  title="Attendance"
                  value={stats.attendance_marked_count}
                  subtitle="marked"
                  icon="checkmark.circle"
                  iconColor="#3b82f6"
                  colorScheme={colorScheme}
                />
                <StatCard
                  title="Confirmed"
                  value={stats.confirmed_count}
                  subtitle="approved"
                  icon="checkmark.circle.fill"
                  iconColor="#10b981"
                  colorScheme={colorScheme}
                />
              </ScrollView>
            </View>
          )}

          {/* Confirmation Gauge Section */}
          {stats && stats.attendance_marked_count > 0 && (
            <View style={styles.gaugeSection}>
              <ConfirmationGauge
                confirmedCount={stats.confirmed_count}
                totalCount={stats.attendance_marked_count}
                colorScheme={colorScheme}
              />
            </View>
          )}

          {/* Quick Action Section */}
          <View style={styles.quickActionSection}>
            <QuickActionButton
              label="Mark Attendance"
              onPress={handleMarkAttendance}
              icon="qrcode"
            />
          </View>

          {/* My Courses Section */}
          <View style={styles.coursesSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                My Courses
              </Text>
              {courses.length > 3 && (
                <TouchableOpacity onPress={handleViewAllCourses}>
                  <Text style={[styles.seeAllText, { color: colors.tint }]}>
                    See All
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {courses.length === 0 ? (
              <View style={styles.emptyCoursesContainer}>
                <IconSymbol name="book.fill" size={48} color={colors.tabIconDefault} />
                <Text style={[styles.emptyCoursesText, { color: colors.text }]}>
                  No courses yet
                </Text>
                <Text style={[styles.emptyCoursesSubtext, { color: colors.tabIconDefault }]}>
                  Use the search tab to find and enroll in courses
                </Text>
                <TouchableOpacity
                  style={[styles.searchButton, { backgroundColor: colors.tint }]}
                  onPress={handleSearchCourses}
                >
                  <IconSymbol name="magnifyingglass" size={16} color="#ffffff" />
                  <Text style={styles.searchButtonText}>Search Courses</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {courses.slice(0, 3).map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={[
                      styles.courseCard,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#252829' : '#ffffff',
                        borderColor: colorScheme === 'dark' ? '#383b3d' : '#e5e5e5',
                      },
                    ]}
                    onPress={handleViewAllCourses}
                    activeOpacity={0.7}
                  >
                    <View style={styles.courseContent}>
                      <View style={styles.courseInfo}>
                        <Text style={[styles.courseCode, { color: colors.tint }]}>
                          {course.code}
                        </Text>
                        <Text style={[styles.courseName, { color: colors.text }]} numberOfLines={1}>
                          {course.name}
                        </Text>
                        <View style={styles.courseMeta}>
                          <IconSymbol name="calendar" size={12} color={colors.tabIconDefault} />
                          <Text style={[styles.courseMetaText, { color: colors.tabIconDefault }]}>
                            {course.semester}
                          </Text>
                          {course.lecturer_name && (
                            <>
                              <Text style={[styles.metaDivider, { color: colors.tabIconDefault }]}>
                                •
                              </Text>
                              <IconSymbol name="person.fill" size={12} color={colors.tabIconDefault} />
                              <Text style={[styles.courseMetaText, { color: colors.tabIconDefault }]} numberOfLines={1}>
                                {course.lecturer_name}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                      <IconSymbol name="chevron.right" size={20} color={colors.tabIconDefault} />
                    </View>
                  </TouchableOpacity>
                ))}

                {courses.length > 3 && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={handleViewAllCourses}
                  >
                    <Text style={[styles.viewAllButtonText, { color: colors.tint }]}>
                      See All Courses
                    </Text>
                    <IconSymbol name="chevron.right" size={16} color={colors.tint} />
                  </TouchableOpacity>
                )}
              </>
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
    paddingTop: 60,
    paddingBottom: 100, // Space for bottom nav bar
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  initialsCircle: {
    width: 50,
    height: 50,
    borderRadius: 10,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 14,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  statsSection: {
    marginBottom: 20,
  },
  statsScrollContent: {
    paddingRight: 8,
  },
  gaugeSection: {
    marginBottom: 20,
  },
  quickActionSection: {
    marginBottom: 24,
  },
  coursesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCoursesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyCoursesText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCoursesSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  courseCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  courseContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
    marginRight: 12,
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  courseMetaText: {
    fontSize: 12,
  },
  metaDivider: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
