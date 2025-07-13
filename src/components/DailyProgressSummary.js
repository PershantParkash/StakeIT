import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { goalsAPI } from '../services/api';

const DailyProgressSummary = ({ onPress }) => {
  const [todayProgress, setTodayProgress] = useState({
    checkedInGoals: 0,
    totalActiveGoals: 0,
    progressPercentage: 0,
    uncheckedGoals: []
  });
  const [loading, setLoading] = useState(true);
  const [ringAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchTodayProgress();
  }, []);

  useEffect(() => {
    // Animate the progress ring
    Animated.timing(ringAnimation, {
      toValue: todayProgress.progressPercentage / 100,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [todayProgress.progressPercentage]);

  const fetchTodayProgress = async () => {
    try {
      setLoading(true);
      const response = await goalsAPI.getGoals();
      if (response.data.success) {
        const goals = response.data.goals;
        const activeGoals = goals.filter(goal => goal.status === 'ACTIVE');
        
        const today = new Date();
        const todayKey = today.toISOString().split('T')[0];
        
        let checkedInGoals = 0;
        const uncheckedGoals = [];
        
        activeGoals.forEach(goal => {
          const hasCheckIn = goal.progressLogs?.some(log => {
            const logDate = new Date(log.date);
            // Compare dates properly by setting time to midnight
            const logDateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
            const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            return logDateOnly.getTime() === todayOnly.getTime();
          });
          
          if (hasCheckIn) {
            checkedInGoals++;
          } else {
            uncheckedGoals.push(goal);
          }
        });
        
        const totalActiveGoals = activeGoals.length;
        const progressPercentage = totalActiveGoals > 0 ? 
          Math.round((checkedInGoals / totalActiveGoals) * 100) : 0;
        
        setTodayProgress({
          checkedInGoals,
          totalActiveGoals,
          progressPercentage,
          uncheckedGoals
        });
      }
    } catch (error) {
      console.error('Error fetching today progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#00ff88';
    if (percentage >= 80) return '#00d4ff';
    if (percentage >= 60) return '#ffaa00';
    if (percentage >= 40) return '#ff6b35';
    return '#ff4444';
  };

  const getProgressMessage = (percentage) => {
    if (percentage >= 100) return 'Perfect! All goals completed today! 🎉';
    if (percentage >= 80) return 'Great job! Almost there! 💪';
    if (percentage >= 60) return 'Good progress! Keep going! 🔥';
    if (percentage >= 40) return 'You can do it! Stay focused! 💯';
    if (percentage > 0) return 'Every step counts! Keep pushing! 🚀';
    return 'Start your day with a check-in! 🌟';
  };

  const strokeWidth = 8;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = ringAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const color = getProgressColor(todayProgress.progressPercentage);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Progress</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.ringContainer}>
          <Animated.View
            style={[
              styles.progressRing,
              {
                strokeDasharray: circumference,
                strokeDashoffset,
                stroke: color,
              },
            ]}
          />
          <View style={styles.ringCenter}>
            <Text style={[styles.percentageText, { color }]}>
              {todayProgress.progressPercentage}%
            </Text>
            <Text style={styles.goalsText}>
              {todayProgress.checkedInGoals}/{todayProgress.totalActiveGoals}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          <Text style={styles.message}>
            {getProgressMessage(todayProgress.progressPercentage)}
          </Text>
          
          {todayProgress.totalActiveGoals > 0 && (
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{todayProgress.checkedInGoals}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{todayProgress.uncheckedGoals.length}</Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
            </View>
          )}

          {todayProgress.uncheckedGoals.length > 0 && (
            <View style={styles.remainingGoals}>
              <Text style={styles.remainingTitle}>Goals to check in:</Text>
              {todayProgress.uncheckedGoals.slice(0, 3).map((goal, index) => (
                <Text key={goal.id} style={styles.remainingGoal}>
                  • {goal.title}
                </Text>
              ))}
              {todayProgress.uncheckedGoals.length > 3 && (
                <Text style={styles.remainingGoal}>
                  +{todayProgress.uncheckedGoals.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {todayProgress.totalActiveGoals > 0 && (
        <TouchableOpacity style={styles.checkInButton} onPress={onPress}>
          <Text style={styles.checkInButtonText}>
            {todayProgress.progressPercentage === 100 ? 'View Progress' : 'Check In Now'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#888',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ringContainer: {
    position: 'relative',
    marginRight: 20,
  },
  progressRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#333',
    position: 'absolute',
  },
  ringCenter: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  goalsText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  details: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 10,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statItem: {
    marginRight: 20,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  remainingGoals: {
    marginTop: 10,
  },
  remainingTitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  remainingGoal: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
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

export default DailyProgressSummary; 