import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { goalsAPI } from '../services/api';

const GoalDetailsScreen = ({ navigation, route }) => {
  const { goalId } = route.params;
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    fetchGoalDetails();
  }, [goalId]);

  const fetchGoalDetails = async () => {
    try {
      const response = await goalsAPI.getGoal(goalId);
      if (response.data.success) {
        setGoal(response.data.goal);
      }
    } catch (error) {
      console.error('Error fetching goal details:', error);
      Alert.alert('Error', 'Failed to load goal details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const response = await goalsAPI.checkIn(goalId);
      if (response.data.success) {
        Alert.alert('Success!', 'Check-in recorded successfully!');
        fetchGoalDetails(); // Refresh the data
      }
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to check in. Please try again.'
      );
    } finally {
      setCheckingIn(false);
    }
  };

  const getStatusColor = (status, progressPercentage) => {
    if (status === 'COMPLETED') return '#00ff88';
    if (status === 'FAILED') return '#ff4444';
    if (status === 'CANCELLED') return '#888888';
    
    if (progressPercentage >= 100) return '#00ff88';
    if (progressPercentage >= 70) return '#ffaa00';
    return '#ff4444';
  };

  const getStatusText = (status, progressPercentage) => {
    if (status === 'COMPLETED') return 'Completed';
    if (status === 'FAILED') return 'Failed';
    if (status === 'CANCELLED') return 'Cancelled';
    
    if (progressPercentage >= 100) return 'Completed';
    return 'Active';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const canCheckIn = goal?.status === 'ACTIVE' && goal?.progressPercentage < 100;
  const daysRemaining = goal ? Math.max(0, Math.ceil((new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00d4ff" />
          <Text style={styles.loadingText}>Loading goal details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Goal not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(goal.status, goal.progressPercentage) }]}>
            <Text style={styles.statusText}>{getStatusText(goal.status, goal.progressPercentage)}</Text>
          </View>
        </View>

        <View style={styles.goalInfo}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          {goal.description && (
            <Text style={styles.goalDescription}>{goal.description}</Text>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${parseFloat(goal.stakeAmount).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Stake Amount</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{goal.progressPercentage}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{goal.completedDays}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{daysRemaining}</Text>
            <Text style={styles.statLabel}>Days Left</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(goal.progressPercentage, 100)}%`,
                  backgroundColor: getStatusColor(goal.status, goal.progressPercentage)
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {goal.completedDays} of {goal.totalDays} days completed
          </Text>
        </View>

        <View style={styles.datesSection}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <Text style={styles.dateValue}>{formatDate(goal.startDate)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>End Date</Text>
            <Text style={styles.dateValue}>{formatDate(goal.endDate)}</Text>
          </View>
        </View>

        {canCheckIn && (
          <TouchableOpacity 
            style={[styles.checkInButton, checkingIn && styles.checkInButtonDisabled]}
            onPress={handleCheckIn}
            disabled={checkingIn}
          >
            {checkingIn ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.checkInButtonText}>Check In Today</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.checkinsSection}>
          <Text style={styles.sectionTitle}>Recent Check-ins</Text>
          {goal.progressLogs.length === 0 ? (
            <Text style={styles.noCheckinsText}>No check-ins yet. Start your journey today!</Text>
          ) : (
            <FlatList
              data={goal.progressLogs.slice(0, 10)} // Show last 10 check-ins
              renderItem={({ item }) => (
                <View style={styles.checkinItem}>
                  <Text style={styles.checkinDate}>{formatShortDate(item.date)}</Text>
                  <Text style={styles.checkinStatus}>✓ Checked in</Text>
                  {item.notes && (
                    <Text style={styles.checkinNotes}>{item.notes}</Text>
                  )}
                </View>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How rewards work:</Text>
          <Text style={styles.infoText}>
            • 100% success: Get your full ${parseFloat(goal.stakeAmount).toFixed(2)} back{'\n'}
            • 70-99% success: Get 50% (${(parseFloat(goal.stakeAmount) * 0.5).toFixed(2)}) back{'\n'}
            • Below 70%: Lose your full stake
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#00d4ff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 18,
    marginBottom: 20,
  },
  goalInfo: {
    marginBottom: 25,
  },
  goalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  goalDescription: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 15,
    margin: 2,
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  progressSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  datesSection: {
    marginBottom: 25,
  },
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dateLabel: {
    fontSize: 14,
    color: '#888',
  },
  dateValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  checkInButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 25,
  },
  checkInButtonDisabled: {
    backgroundColor: '#666',
  },
  checkInButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkinsSection: {
    marginBottom: 25,
  },
  noCheckinsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  checkinItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  checkinDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  checkinStatus: {
    fontSize: 12,
    color: '#00ff88',
    marginBottom: 5,
  },
  checkinNotes: {
    fontSize: 12,
    color: '#ccc',
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
});

export default GoalDetailsScreen; 