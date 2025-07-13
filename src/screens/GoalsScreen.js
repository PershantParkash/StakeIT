import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { goalsAPI } from '../services/api';

const GoalsScreen = ({ navigation }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await goalsAPI.getGoals();
      if (response.data.success) {
        setGoals(response.data.goals);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      Alert.alert('Error', 'Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGoals();
  };

  const handleCheckIn = async (goalId) => {
    try {
      const response = await goalsAPI.checkIn(goalId);
      if (response.data.success) {
        Alert.alert('Success!', 'Check-in recorded successfully!');
        fetchGoals(); // Refresh the list
      }
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to check in. Please try again.'
      );
    }
  };

  const getStatusColor = (status, progressPercentage) => {
    if (status === 'COMPLETED') return '#00ff88';
    if (status === 'FAILED') return '#ff4444';
    if (status === 'CANCELLED') return '#888888';
    
    // For active goals, color based on progress
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderGoalItem = ({ item }) => {
    const statusColor = getStatusColor(item.status, item.progressPercentage);
    const statusText = getStatusText(item.status, item.progressPercentage);
    const isActive = item.status === 'ACTIVE';
    const canCheckIn = isActive && item.progressPercentage < 100;

    return (
      <TouchableOpacity 
        style={styles.goalCard}
        onPress={() => navigation.navigate('GoalDetails', { goalId: item.id })}
      >
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.goalDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.goalStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Stake</Text>
            <Text style={styles.statValue}>${parseFloat(item.stakeAmount).toFixed(2)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Progress</Text>
            <Text style={styles.statValue}>{item.progressPercentage}%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>End Date</Text>
            <Text style={styles.statValue}>{formatDate(item.endDate)}</Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(item.progressPercentage, 100)}%`,
                backgroundColor: statusColor
              }
            ]} 
          />
        </View>

        {canCheckIn && (
          <TouchableOpacity 
            style={styles.checkInButton}
            onPress={() => handleCheckIn(item.id)}
          >
            <Text style={styles.checkInButtonText}>Check In Today</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00d4ff" />
          <Text style={styles.loadingText}>Loading your goals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Goals</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateGoal')}
        >
          <Text style={styles.createButtonText}>+ New Goal</Text>
        </TouchableOpacity>
      </View>

      {goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first goal to start building better habits with financial accountability.
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => navigation.navigate('CreateGoal')}
          >
            <Text style={styles.emptyButtonText}>Create Your First Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={goals}
          renderItem={renderGoalItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00d4ff"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createButtonText: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
  },
  goalCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  goalDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 15,
    lineHeight: 20,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  checkInButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  checkInButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GoalsScreen; 