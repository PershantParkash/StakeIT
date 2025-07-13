import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { goalsAPI } from '../services/api';
import DailyProgressSummary from '../components/DailyProgressSummary';
import Calendar from '../components/Calendar';
import QuickCheckInModal from '../components/QuickCheckInModal';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    activeGoals: 0,
    totalStaked: 0,
    successRate: 0,
    completed: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickCheckIn, setShowQuickCheckIn] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await goalsAPI.getGoals();
      if (response.data.success) {
        const goals = response.data.goals;
        
        const activeGoals = goals.filter(goal => goal.status === 'ACTIVE').length;
        const completedGoals = goals.filter(goal => goal.status === 'COMPLETED').length;
        const totalStaked = goals.reduce((sum, goal) => sum + parseFloat(goal.stakeAmount), 0);
        
        // Calculate success rate (completed vs total)
        const totalGoals = goals.length;
        const successRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

        setStats({
          activeGoals,
          totalStaked,
          successRate,
          completed: completedGoals,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats().finally(() => setRefreshing(false));
  };

  const handleLogout = () => {
    logout();
  };

  const handleDailyProgressPress = () => {
    setShowQuickCheckIn(true);
  };

  const handleCalendarDatePress = (date, progress) => {
    if (progress && progress.totalActiveGoals > 0) {
      Alert.alert(
        `${date.toLocaleDateString()}`,
        `Progress: ${progress.progressPercentage}%\n${progress.checkedInGoals}/${progress.totalActiveGoals} goals completed`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00d4ff"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back, {user?.name || 'User'}!</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Progress Summary */}
        <DailyProgressSummary onPress={handleDailyProgressPress} />

        {/* Monthly Calendar */}
        <Calendar onDatePress={handleCalendarDatePress} />

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.activeGoals}</Text>
              <Text style={styles.statLabel}>Active Goals</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>${stats.totalStaked.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Staked</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.successRate}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateGoal')}
          >
            <Text style={styles.actionButtonText}>Create New Goal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('Goals')}
          >
            <Text style={styles.secondaryButtonText}>View All Goals</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.tertiaryButton]}
            onPress={() => setShowQuickCheckIn(true)}
          >
            <Text style={styles.tertiaryButtonText}>Quick Check-In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>How StakeIt Works</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🎯 Set Your Goal</Text>
            <Text style={styles.infoText}>
              Define what you want to achieve and set a deadline
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💰 Stake Your Money</Text>
            <Text style={styles.infoText}>
              Commit a specific amount that motivates you to succeed
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>✅ Daily Check-ins</Text>
            <Text style={styles.infoText}>
              Track your progress with daily check-ins
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🏆 Get Rewarded</Text>
            <Text style={styles.infoText}>
              Complete your goal and get your money back, or lose it if you fail
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Quick Check-In Modal */}
      <QuickCheckInModal
        visible={showQuickCheckIn}
        onClose={() => setShowQuickCheckIn(false)}
        onSuccess={() => {
          setShowQuickCheckIn(false);
          fetchStats(); // Refresh stats after check-in
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#00d4ff',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  statsContainer: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  actionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  secondaryButtonText: {
    color: '#00d4ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tertiaryButton: {
    backgroundColor: '#ffaa00',
  },
  tertiaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
});

export default HomeScreen; 