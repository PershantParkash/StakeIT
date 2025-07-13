const { prisma } = require('./database');

// Calculate success rate for a goal
const calculateSuccessRate = (completedDays, totalDays) => {
  if (totalDays === 0) return 0;
  return Math.round((completedDays / totalDays) * 100);
};

// Determine goal status based on success rate
const determineGoalStatus = (successRate) => {
  if (successRate >= 100) return 'COMPLETED';
  if (successRate >= 70) return 'COMPLETED'; // 70-99% is still considered completed
  return 'FAILED';
};

// Calculate refund amount based on success rate
const calculateRefundAmount = (stakeAmount, successRate) => {
  if (successRate >= 100) {
    return parseFloat(stakeAmount); // Full refund
  } else if (successRate >= 70) {
    return parseFloat(stakeAmount) * 0.5; // 50% refund
  } else {
    return 0; // No refund
  }
};

// Process goal completion
const processGoalCompletion = async (goalId) => {
  try {
    // Get goal with progress logs
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        progressLogs: true,
        transactions: {
          where: { type: 'DEPOSIT' }
        }
      }
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    if (goal.status !== 'ACTIVE') {
      return; // Goal already processed
    }

    const endDate = new Date(goal.endDate);
    const now = new Date();

    // Only process if goal has ended
    if (now < endDate) {
      return;
    }

    // Calculate success metrics
    const totalDays = Math.ceil((endDate - new Date(goal.startDate)) / (1000 * 60 * 60 * 24));
    const completedDays = goal.progressLogs.length;
    const successRate = calculateSuccessRate(completedDays, totalDays);
    const newStatus = determineGoalStatus(successRate);
    const refundAmount = calculateRefundAmount(goal.stakeAmount, successRate);

    // Update goal status
    await prisma.goal.update({
      where: { id: goalId },
      data: { status: newStatus }
    });

    // Create refund transaction if applicable
    if (refundAmount > 0) {
      await prisma.transaction.create({
        data: {
          userId: goal.userId,
          goalId: goal.id,
          amount: refundAmount,
          type: 'REFUND',
          status: 'COMPLETED'
        }
      });
    }

    // Create forfeit transaction if failed
    if (refundAmount === 0) {
      await prisma.transaction.create({
        data: {
          userId: goal.userId,
          goalId: goal.id,
          amount: parseFloat(goal.stakeAmount),
          type: 'FORFEIT',
          status: 'COMPLETED'
        }
      });
    }

    return {
      goalId,
      successRate,
      status: newStatus,
      refundAmount,
      totalDays,
      completedDays
    };
  } catch (error) {
    console.error('Error processing goal completion:', error);
    throw error;
  }
};

// Process all expired goals
const processExpiredGoals = async () => {
  try {
    const now = new Date();
    
    // Find all active goals that have ended
    const expiredGoals = await prisma.goal.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: now
        }
      }
    });

    const results = [];
    
    for (const goal of expiredGoals) {
      try {
        const result = await processGoalCompletion(goal.id);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Error processing goal ${goal.id}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Error processing expired goals:', error);
    throw error;
  }
};

// Get goal analytics
const getGoalAnalytics = async (userId) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId },
      include: {
        progressLogs: true,
        transactions: true
      }
    });

    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.status === 'ACTIVE').length;
    const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
    const failedGoals = goals.filter(g => g.status === 'FAILED').length;

    const totalStaked = goals.reduce((sum, goal) => sum + parseFloat(goal.stakeAmount), 0);
    const totalRefunded = goals.reduce((sum, goal) => {
      const refunds = goal.transactions.filter(t => t.type === 'REFUND');
      return sum + refunds.reduce((s, t) => s + parseFloat(t.amount), 0);
    }, 0);
    const totalForfeited = goals.reduce((sum, goal) => {
      const forfeits = goal.transactions.filter(t => t.type === 'FORFEIT');
      return sum + forfeits.reduce((s, t) => s + parseFloat(t.amount), 0);
    }, 0);

    const successRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      failedGoals,
      successRate,
      totalStaked,
      totalRefunded,
      totalForfeited,
      netAmount: totalRefunded - totalStaked
    };
  } catch (error) {
    console.error('Error getting goal analytics:', error);
    throw error;
  }
};

module.exports = {
  processGoalCompletion,
  processExpiredGoals,
  getGoalAnalytics,
  calculateSuccessRate,
  determineGoalStatus,
  calculateRefundAmount
}; 