import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { goalsAPI } from '../services/api';

const AnalyticsScreen = ({ navigation }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      console.log('Fetching analytics...');
      const response = await goalsAPI.getAnalytics();
      console.log('Analytics response:', response.data);
      
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      } else {
        console.error('Analytics API returned success: false');
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      console.error('Error details:', error.response?.data);
      
      // Try to get basic analytics from goals data as fallback
      try {
        console.log('Trying fallback analytics...');
        const goalsResponse = await goalsAPI.getGoals();
        if (goalsResponse.data.success) {
          const goals = goalsResponse.data.goals;
          const fallbackAnalytics = {
            totalGoals: goals.length,
            activeGoals: goals.filter(g => g.status === 'ACTIVE').length,
            completedGoals: goals.filter(g => g.status === 'COMPLETED').length,
            failedGoals: goals.filter(g => g.status === 'FAILED').length,
            successRate: goals.length > 0 ? Math.round((goals.filter(g => g.status === 'COMPLETED').length / goals.length) * 100) : 0,
            totalStaked: goals.reduce((sum, g) => sum + parseFloat(g.stakeAmount || 0), 0),
            totalRefunded: 0,
            totalForfeited: 0,
            netAmount: 0,
          };
          setAnalytics(fallbackAnalytics);
          console.log('Using fallback analytics:', fallbackAnalytics);
        } else {
          setAnalytics(null);
        }
      } catch (fallbackError) {
        console.error('Fallback analytics also failed:', fallbackError);
        setAnalytics(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const StatCard = ({ title, value, subtitle, color = '#00d4ff' }) => (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00d4ff" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load analytics</Text>
          <Text style={styles.errorSubtext}>
            Please check your connection and try again
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAnalytics}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.retryButton, { marginTop: 10, backgroundColor: '#333' }]} 
            onPress={() => {
              console.log('Testing goals API...');
              goalsAPI.getGoals().then(res => console.log('Goals API works:', res.data)).catch(err => console.error('Goals API error:', err));
            }}
          >
            <Text style={styles.retryButtonText}>Test Goals API</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Ensure all analytics properties exist with fallbacks
  const safeAnalytics = {
    totalGoals: analytics.totalGoals || 0,
    activeGoals: analytics.activeGoals || 0,
    completedGoals: analytics.completedGoals || 0,
    failedGoals: analytics.failedGoals || 0,
    successRate: analytics.successRate || 0,
    totalStaked: analytics.totalStaked || 0,
    totalRefunded: analytics.totalRefunded || 0,
    totalForfeited: analytics.totalForfeited || 0,
    netAmount: analytics.netAmount || 0,
  };

  const netAmount = safeAnalytics.netAmount;
  const isPositive = netAmount >= 0;

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
          <Text style={styles.title}>Analytics</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Total Goals" 
              value={safeAnalytics.totalGoals}
              subtitle="All time"
            />
            <StatCard 
              title="Active Goals" 
              value={safeAnalytics.activeGoals}
              subtitle="In progress"
              color="#ffaa00"
            />
            <StatCard 
              title="Success Rate" 
              value={`${safeAnalytics.successRate}%`}
              subtitle="Completed goals"
              color="#00ff88"
            />
            <StatCard 
              title="Failed Goals" 
              value={safeAnalytics.failedGoals}
              subtitle="Below 70%"
              color="#ff4444"
            />
          </View>
        </View>

        {/* Financial Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.financialCard}>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total Staked:</Text>
              <Text style={styles.financialValue}>${safeAnalytics.totalStaked.toFixed(2)}</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total Refunded:</Text>
              <Text style={[styles.financialValue, { color: '#00ff88' }]}>
                ${safeAnalytics.totalRefunded.toFixed(2)}
              </Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total Forfeited:</Text>
              <Text style={[styles.financialValue, { color: '#ff4444' }]}>
                ${safeAnalytics.totalForfeited.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.financialRow, styles.netRow]}>
              <Text style={styles.financialLabel}>Net Amount:</Text>
              <Text style={[
                styles.financialValue, 
                { color: isPositive ? '#00ff88' : '#ff4444' }
              ]}>
                ${netAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightsContainer}>
            {safeAnalytics.totalGoals === 0 ? (
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>🎯 Start Your Journey</Text>
                <Text style={styles.insightText}>
                  Create your first goal to start building better habits with financial accountability.
                </Text>
                <TouchableOpacity 
                  style={styles.insightButton}
                  onPress={() => navigation.navigate('CreateGoal')}
                >
                  <Text style={styles.insightButtonText}>Create Goal</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {safeAnalytics.successRate >= 80 && (
                  <View style={styles.insightCard}>
                    <Text style={styles.insightTitle}>🏆 Excellent Performance!</Text>
                    <Text style={styles.insightText}>
                      You're crushing it! Your {safeAnalytics.successRate}% success rate shows great commitment.
                    </Text>
                  </View>
                )}
                
                {safeAnalytics.activeGoals > 0 && (
                  <View style={styles.insightCard}>
                    <Text style={styles.insightTitle}>🔥 Keep Going!</Text>
                    <Text style={styles.insightText}>
                      You have {safeAnalytics.activeGoals} active goals. Don't forget to check in daily!
                    </Text>
                  </View>
                )}

                {isPositive && (
                  <View style={styles.insightCard}>
                    <Text style={styles.insightTitle}>💰 Profit!</Text>
                    <Text style={styles.insightText}>
                      You've earned ${netAmount.toFixed(2)} from your successful goals!
                    </Text>
                  </View>
                )}

                {!isPositive && safeAnalytics.totalGoals > 0 && (
                  <View style={styles.insightCard}>
                    <Text style={styles.insightTitle}>💪 Learning Experience</Text>
                    <Text style={styles.insightText}>
                      Every setback is a learning opportunity. Focus on consistency for better results.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for Success</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipItem}>
              <Text style={styles.tipNumber}>1</Text>
              <Text style={styles.tipText}>Set realistic goals with achievable timelines</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipNumber}>2</Text>
              <Text style={styles.tipText}>Check in daily to maintain momentum</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipNumber}>3</Text>
              <Text style={styles.tipText}>Start with smaller stakes to build confidence</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipNumber}>4</Text>
              <Text style={styles.tipText}>Focus on consistency over perfection</Text>
            </View>
          </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    color: '#00d4ff',
    fontSize: 16,
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
    padding: 40,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 18,
    marginBottom: 10,
  },
  errorSubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
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
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 2,
  },
  financialCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  netRow: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 8,
    paddingTop: 16,
  },
  financialLabel: {
    fontSize: 16,
    color: '#ccc',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  insightsContainer: {
    gap: 15,
  },
  insightCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 15,
  },
  insightButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  insightButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  tipsContainer: {
    gap: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  tipNumber: {
    backgroundColor: '#00d4ff',
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#ccc',
    flex: 1,
    lineHeight: 20,
  },
});

export default AnalyticsScreen; 