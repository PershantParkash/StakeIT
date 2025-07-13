const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection, disconnect } = require('./utils/database');
const { processExpiredGoals } = require('./utils/goalCompletion');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const goalsRoutes = require('./routes/goals');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalsRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'StakeIt API is running!',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      health: '/health'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});
console.log("DATABASE_URL:", process.env.DATABASE_URL);
// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`🚀 StakeIt server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`🎯 Goals endpoints: http://localhost:${PORT}/api/goals`);
    });

    // Schedule goal completion processing (run every hour)
    setInterval(async () => {
      try {
        const results = await processExpiredGoals();
        if (results.length > 0) {
          console.log(`✅ Processed ${results.length} expired goals`);
        }
      } catch (error) {
        console.error('❌ Error processing expired goals:', error);
      }
    }, 60 * 60 * 1000); // Every hour

    // Process expired goals on startup
    processExpiredGoals()
      .then(results => {
        if (results.length > 0) {
          console.log(`✅ Processed ${results.length} expired goals on startup`);
        }
      })
      .catch(error => {
        console.error('❌ Error processing expired goals on startup:', error);
      });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await disconnect();
  process.exit(0);
});

startServer(); 