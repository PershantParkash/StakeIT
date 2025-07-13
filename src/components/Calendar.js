import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { goalsAPI } from '../services/api';

const { width } = Dimensions.get('window');

const Calendar = ({ onDatePress }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyProgress, setDailyProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyProgress();
  }, [currentMonth]);

  const fetchMonthlyProgress = async () => {
    try {
      setLoading(true);
      const response = await goalsAPI.getGoals();
      if (response.data.success) {
        const goals = response.data.goals;
        const activeGoals = goals.filter(goal => goal.status === 'ACTIVE');
        
        // Calculate daily progress for the current month
        const progress = {};
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          const dateKey = date.toISOString().split('T')[0];
          
          // Count check-ins for this date
          let checkedInGoals = 0;
          activeGoals.forEach(goal => {
            const hasCheckIn = goal.progressLogs?.some(log => {
              const logDate = new Date(log.date);
              // Compare dates properly by setting time to midnight
              const logDateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
              const targetDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
              return logDateOnly.getTime() === targetDateOnly.getTime();
            });
            if (hasCheckIn) checkedInGoals++;
          });
          
          const totalActiveGoals = activeGoals.length;
          const progressPercentage = totalActiveGoals > 0 ? 
            Math.round((checkedInGoals / totalActiveGoals) * 100) : 0;
          
          progress[dateKey] = {
            checkedInGoals,
            totalActiveGoals,
            progressPercentage,
            date: date
          };
        }
        
        setDailyProgress(progress);
      }
    } catch (error) {
      console.error('Error fetching monthly progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty days for padding
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const changeMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const getProgressRing = (dateKey, day) => {
    const progress = dailyProgress[dateKey];
    if (!progress || progress.totalActiveGoals === 0) {
      // No active goals, show just the date
      return (
        <View style={styles.progressRing}>
          <View style={[styles.ring, { borderColor: '#444' }]}>
            <Text style={styles.ringText}>{day}</Text>
          </View>
        </View>
      );
    }
    
    const { progressPercentage } = progress;
    const themeColor = '#00d4ff'; // Theme color
    const grayColor = '#444'; // Gray for incomplete portion
    
    // Create a simple progress ring using border colors
    let borderColors = {
      borderTopColor: grayColor,
      borderRightColor: grayColor,
      borderBottomColor: grayColor,
      borderLeftColor: grayColor,
    };
    
    if (progressPercentage >= 100) {
      // All goals completed - full theme color
      borderColors = {
        borderTopColor: themeColor,
        borderRightColor: themeColor,
        borderBottomColor: themeColor,
        borderLeftColor: themeColor,
      };
    } else if (progressPercentage >= 75) {
      // 75-99% - 3/4 ring
      borderColors = {
        borderTopColor: themeColor,
        borderRightColor: themeColor,
        borderBottomColor: themeColor,
        borderLeftColor: grayColor,
      };
    } else if (progressPercentage >= 50) {
      // 50-74% - 1/2 ring
      borderColors = {
        borderTopColor: themeColor,
        borderRightColor: themeColor,
        borderBottomColor: grayColor,
        borderLeftColor: grayColor,
      };
    } else if (progressPercentage >= 25) {
      // 25-49% - 1/4 ring
      borderColors = {
        borderTopColor: themeColor,
        borderRightColor: grayColor,
        borderBottomColor: grayColor,
        borderLeftColor: grayColor,
      };
    }
    
    return (
      <View style={styles.progressRing}>
        <View style={[styles.ring, { 
          borderColor: grayColor,
          ...borderColors
        }]}>
          <Text style={styles.ringText}>{day}</Text>
        </View>
      </View>
    );
  };

  const handleDatePress = (day) => {
    if (!day) return;
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, day);
    const dateKey = date.toISOString().split('T')[0];
    
    if (onDatePress) {
      onDatePress(date, dailyProgress[dateKey]);
    }
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && 
                        currentMonth.getFullYear() === today.getFullYear();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton}>
          <Text style={styles.arrow}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{getMonthName(currentMonth)}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
          <Text style={styles.arrow}>▶</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekDays}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {days.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const year = currentMonth.getFullYear();
          const month = currentMonth.getMonth();
          const date = new Date(year, month, day);
          const dateKey = date.toISOString().split('T')[0];
          const isToday = isCurrentMonth && day === today.getDate();

          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayCell, isToday && styles.todayCell]}
              onPress={() => handleDatePress(day)}
            >
              {getProgressRing(dateKey, day)}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Progress Legend:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendRing, { 
              borderTopColor: '#00d4ff',
              borderRightColor: '#00d4ff',
              borderBottomColor: '#00d4ff',
              borderLeftColor: '#00d4ff',
            }]} />
            <Text style={styles.legendText}>All Goals</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendRing, { 
              borderTopColor: '#00d4ff',
              borderRightColor: '#00d4ff',
              borderBottomColor: '#444',
              borderLeftColor: '#444',
            }]} />
            <Text style={styles.legendText}>Most Goals</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendRing, { 
              borderTopColor: '#00d4ff',
              borderRightColor: '#444',
              borderBottomColor: '#444',
              borderLeftColor: '#444',
            }]} />
            <Text style={styles.legendText}>Some Goals</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendRing, { 
              borderTopColor: '#444',
              borderRightColor: '#444',
              borderBottomColor: '#444',
              borderLeftColor: '#444',
            }]} />
            <Text style={styles.legendText}>No Progress</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 10,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  arrowButton: {
    padding: 8,
  },
  arrow: {
    color: '#00d4ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    width: (width - 60) / 7,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (width - 60) / 7,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  todayCell: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderRadius: 8,
  },
  progressRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  ringText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  legend: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  legendTitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#444',
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#ccc',
  },
});

export default Calendar; 