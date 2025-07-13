import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { goalsAPI } from '../services/api';

const QuickCheckInModal = ({ visible, onClose, onSuccess }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState({});

  useEffect(() => {
    if (visible) {
      fetchActiveGoals();
    }
  }, [visible]);

  const fetchActiveGoals = async () => {
    try {
      const response = await goalsAPI.getGoals();
      if (response.data.success) {
        const activeGoals = response.data.goals.filter(goal => goal.status === 'ACTIVE');
        
        // Check which goals have been checked in today
        const today = new Date();
        const goalsWithCheckInStatus = activeGoals.map(goal => {
          const hasCheckIn = goal.progressLogs?.some(log => {
            const logDate = new Date(log.date);
            // Compare dates properly by setting time to midnight
            const logDateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            return logDateOnly.getTime() === todayOnly.getTime();
          });
          
          return {
            ...goal,
            checkedInToday: hasCheckIn
          };
        });
        
        setGoals(goalsWithCheckInStatus);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const handleCheckIn = async (goalId) => {
    if (checkingIn[goalId]) return;
    
    setCheckingIn(prev => ({ ...prev, [goalId]: true }));
    
    try {
      const response = await goalsAPI.checkIn(goalId);
      if (response.data.success) {
        // Update the goal's check-in status
        setGoals(prev => prev.map(goal => 
          goal.id === goalId 
            ? { ...goal, checkedInToday: true }
            : goal
        ));
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to check in. Please try again.'
      );
    } finally {
      setCheckingIn(prev => ({ ...prev, [goalId]: false }));
    }
  };

  const getProgressColor = (checkedIn) => {
    return checkedIn ? '#00ff88' : '#ff4444';
  };

  const getProgressIcon = (checkedIn) => {
    return checkedIn ? '✅' : '⭕';
  };

  const completedGoals = goals.filter(goal => goal.checkedInToday).length;
  const totalGoals = goals.length;
  const progressPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quick Check-In</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressSummary}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <View style={styles.progressRing}>
              <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
              <Text style={styles.progressText}>
                {completedGoals}/{totalGoals} goals completed
              </Text>
            </View>
          </View>

          <ScrollView style={styles.goalsList} showsVerticalScrollIndicator={false}>
            {goals.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No Active Goals</Text>
                <Text style={styles.emptyText}>
                  Create some goals to start tracking your progress!
                </Text>
              </View>
            ) : (
              goals.map((goal) => (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalTitle} numberOfLines={2}>
                      {goal.title}
                    </Text>
                    {goal.description && (
                      <Text style={styles.goalDescription} numberOfLines={1}>
                        {goal.description}
                      </Text>
                    )}
                    <Text style={styles.goalStake}>
                      Stake: ${parseFloat(goal.stakeAmount).toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.goalActions}>
                    <View style={[
                      styles.statusIndicator, 
                      { backgroundColor: getProgressColor(goal.checkedInToday) }
                    ]}>
                      <Text style={styles.statusIcon}>
                        {getProgressIcon(goal.checkedInToday)}
                      </Text>
                    </View>
                    
                    {!goal.checkedInToday && (
                      <TouchableOpacity
                        style={[
                          styles.checkInButton,
                          checkingIn[goal.id] && styles.checkInButtonDisabled
                        ]}
                        onPress={() => handleCheckIn(goal.id)}
                        disabled={checkingIn[goal.id]}
                      >
                        {checkingIn[goal.id] ? (
                          <ActivityIndicator size="small" color="#000" />
                        ) : (
                          <Text style={styles.checkInButtonText}>Check In</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#888',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressSummary: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  progressTitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
  },
  progressRing: {
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  goalsList: {
    maxHeight: 400,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  goalItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  goalInfo: {
    flex: 1,
    marginRight: 15,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  goalDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  goalStake: {
    fontSize: 12,
    color: '#00d4ff',
    fontWeight: '500',
  },
  goalActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIcon: {
    fontSize: 16,
  },
  checkInButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  checkInButtonDisabled: {
    backgroundColor: '#666',
  },
  checkInButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  doneButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuickCheckInModal; 