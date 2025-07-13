const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken: auth } = require('../middleware/auth');
const { getGoalAnalytics } = require('../utils/goalCompletion');

const router = express.Router();
const prisma = new PrismaClient();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Goals routes are working!' });
});

// Create a new goal
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, tags, endDate, stakeAmount } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!title || !endDate || !stakeAmount) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title, end date, and stake amount are required'
      });
    }

    // Validate stake amount
    if (stakeAmount <= 0) {
      return res.status(400).json({
        error: 'Invalid stake amount',
        message: 'Stake amount must be greater than 0'
      });
    }

    // Validate end date
    const endDateTime = new Date(endDate);
    if (endDateTime <= new Date()) {
      return res.status(400).json({
        error: 'Invalid end date',
        message: 'End date must be in the future'
      });
    }

    // Process tags
    const processedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    // Create the goal
    const goal = await prisma.goal.create({
      data: {
        userId,
        title,
        description,
        category,
        tags: processedTags,
        endDate: endDateTime,
        stakeAmount: parseFloat(stakeAmount),
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create initial transaction for stake
    await prisma.transaction.create({
      data: {
        userId,
        goalId: goal.id,
        amount: parseFloat(stakeAmount),
        type: 'DEPOSIT',
        status: 'COMPLETED'
      }
    });

    res.status(201).json({
      success: true,
      goal
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({
      error: 'Failed to create goal',
      message: error.message
    });
  }
});

// Get all goals for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, status } = req.query;
    
    const whereClause = { userId };
    
    if (category) {
      whereClause.category = category;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    const goals = await prisma.goal.findMany({
      where: whereClause,
      include: {
        progressLogs: {
          orderBy: { date: 'desc' },
          take: 1
        },
        _count: {
          select: {
            progressLogs: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => {
      const totalDays = Math.ceil((new Date(goal.endDate) - new Date(goal.startDate)) / (1000 * 60 * 60 * 24));
      const completedDays = goal._count.progressLogs;
      const progressPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
      
      return {
        ...goal,
        progressPercentage,
        totalDays,
        completedDays
      };
    });

    res.json({
      success: true,
      goals: goalsWithProgress
    });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({
      error: 'Failed to fetch goals',
      message: error.message
    });
  }
});

// Get a specific goal by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const goal = await prisma.goal.findFirst({
      where: { 
        id,
        userId 
      },
      include: {
        progressLogs: {
          orderBy: { date: 'desc' }
        },
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found',
        message: 'The requested goal does not exist or you do not have access to it'
      });
    }

    // Calculate progress
    const totalDays = Math.ceil((new Date(goal.endDate) - new Date(goal.startDate)) / (1000 * 60 * 60 * 24));
    const completedDays = goal.progressLogs.length;
    const progressPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    res.json({
      success: true,
      goal: {
        ...goal,
        progressPercentage,
        totalDays,
        completedDays
      }
    });
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({
      error: 'Failed to fetch goal',
      message: error.message
    });
  }
});

// Update a goal
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, endDate, status } = req.body;

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { 
        id,
        userId 
      }
    });

    if (!existingGoal) {
      return res.status(404).json({
        error: 'Goal not found',
        message: 'The requested goal does not exist or you do not have access to it'
      });
    }

    // Validate end date if provided
    if (endDate) {
      const endDateTime = new Date(endDate);
      if (endDateTime <= new Date()) {
        return res.status(400).json({
          error: 'Invalid end date',
          message: 'End date must be in the future'
        });
      }
    }

    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        title,
        description,
        endDate: endDate ? new Date(endDate) : undefined,
        status
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      goal: updatedGoal
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({
      error: 'Failed to update goal',
      message: error.message
    });
  }
});

// Delete a goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { 
        id,
        userId 
      }
    });

    if (!existingGoal) {
      return res.status(404).json({
        error: 'Goal not found',
        message: 'The requested goal does not exist or you do not have access to it'
      });
    }

    // Delete the goal (cascade will handle related records)
    await prisma.goal.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({
      error: 'Failed to delete goal',
      message: error.message
    });
  }
});

// Check in for a goal (mark progress for today)
router.post('/:id/checkin', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { notes } = req.body;

    // Check if goal exists and belongs to user
    const goal = await prisma.goal.findFirst({
      where: { 
        id,
        userId 
      }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found',
        message: 'The requested goal does not exist or you do not have access to it'
      });
    }

    // Check if goal is still active
    if (goal.status !== 'ACTIVE') {
      return res.status(400).json({
        error: 'Goal not active',
        message: 'Cannot check in for a goal that is not active'
      });
    }

    // Check if goal has ended
    if (new Date() > new Date(goal.endDate)) {
      return res.status(400).json({
        error: 'Goal ended',
        message: 'Cannot check in for a goal that has already ended'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingCheckin = await prisma.progressLog.findUnique({
      where: {
        goalId_date: {
          goalId: id,
          date: today
        }
      }
    });

    if (existingCheckin) {
      return res.status(400).json({
        error: 'Already checked in',
        message: 'You have already checked in for this goal today'
      });
    }

    // Create check-in
    const checkin = await prisma.progressLog.create({
      data: {
        goalId: id,
        date: today,
        checkedIn: true,
        notes
      }
    });

    res.json({
      success: true,
      checkin
    });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({
      error: 'Failed to check in',
      message: error.message
    });
  }
});

// Get progress for a goal
router.get('/:id/progress', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if goal exists and belongs to user
    const goal = await prisma.goal.findFirst({
      where: { 
        id,
        userId 
      },
      include: {
        progressLogs: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found',
        message: 'The requested goal does not exist or you do not have access to it'
      });
    }

    // Calculate progress statistics
    const totalDays = Math.ceil((new Date(goal.endDate) - new Date(goal.startDate)) / (1000 * 60 * 60 * 24));
    const completedDays = goal.progressLogs.length;
    const progressPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    const daysRemaining = Math.max(0, Math.ceil((new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24)));

    res.json({
      success: true,
      progress: {
        totalDays,
        completedDays,
        progressPercentage,
        daysRemaining,
        checkins: goal.progressLogs
      }
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      error: 'Failed to fetch progress',
      message: error.message
    });
  }
});

// Get user analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    console.log('Analytics endpoint called for user:', req.user.id);
    const userId = req.user.id;
    const analytics = await getGoalAnalytics(userId);
    
    console.log('Analytics result:', analytics);

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
});

// Get categories for the user
router.get('/categories', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const categories = await prisma.goal.findMany({
      where: { userId },
      select: { category: true }
    });

    const uniqueCategories = [...new Set(categories.map(g => g.category).filter(Boolean))];
    
    res.json({
      success: true,
      categories: uniqueCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

module.exports = router; 