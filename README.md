# StakeIt - Goal Setting & Accountability App

StakeIt is a mobile application designed to help users overcome procrastination by introducing real financial stakes. Users create goals, set deadlines, and commit money. Success means getting their money back, while failure means losing it.

## 🎯 Concept

- **100% success**: Full refund
- **70-99% success**: 50% refund  
- **Below 70%**: Lose the full amount

This app leverages loss aversion psychology and external accountability to keep users motivated.

## 🏗️ Project Structure

```
Stake-It/
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth & validation
│   │   ├── routes/         # API endpoints
│   │   ├── utils/          # Helper functions
│   │   └── index.js        # Server entry point
│   ├── prisma/             # Database schema
│   └── package.json
├── mobile/                 # React Native app
│   └── StakeItApp/
│       ├── src/
│       │   ├── screens/    # App screens
│       │   ├── components/ # Reusable components
│       │   ├── navigation/ # Navigation setup
│       │   ├── services/   # API calls
│       │   ├── contexts/   # State management
│       │   └── utils/      # Helper functions
│       └── App.tsx
└── db/                     # Database migrations
```

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **Prisma** ORM
- **JWT** authentication
- **bcrypt** password hashing

### Frontend
- **React Native CLI**
- **React Navigation** for routing
- **AsyncStorage** for local storage
- **Axios** for API calls
- **Context API** for state management

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL
- React Native development environment
- Android Studio / Xcode (for mobile development)

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the server directory:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL="postgresql://username:password@localhost:5432/stakeit_db"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   JWT_EXPIRES_IN="7d"
   ```

4. **Set up database:**
   ```bash
   # Create PostgreSQL database
   createdb stakeit_db
   
   # Run Prisma migrations
   npx prisma migrate dev
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

### Mobile App Setup

1. **Navigate to mobile app directory:**
   ```bash
   cd mobile/StakeItApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the app:**
   ```bash
   # For Android
   npx react-native run-android
   
   # For iOS
   npx react-native run-ios
   ```

## 📱 Features Implemented

### Backend
- ✅ User authentication (register/login)
- ✅ JWT token management
- ✅ Database schema with Prisma
- ✅ Basic API structure
- ✅ Error handling middleware

### Frontend
- ✅ Modern dark UI design
- ✅ Authentication flow
- ✅ Navigation structure
- ✅ API service layer
- ✅ Context-based state management
- ✅ Loading, Login, Register, Home, Profile screens

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Goals (To be implemented)
- `POST /api/goals` - Create goal
- `GET /api/goals` - Get user goals
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/checkin` - Daily check-in

## 🎨 Design System

- **Primary Color**: `#00d4ff` (Electric Blue)
- **Background**: `#0a0a0a` (Dark)
- **Surface**: `#1a1a1a` (Card backgrounds)
- **Text**: `#ffffff` (White)
- **Secondary Text**: `#888888` (Gray)
- **Borders**: `#333333` (Dark Gray)

## 📋 Next Steps

### Backend
1. Implement goal CRUD operations
2. Add progress tracking endpoints
3. Implement payment integration (Stripe)
4. Add scheduled job for goal evaluation
5. Add push notification service

### Frontend
1. Complete goal creation flow
2. Implement goal list and detail views
3. Add progress tracking UI
4. Implement payment flow
5. Add push notifications
6. Add goal evaluation results

### Database
1. Add more comprehensive data models
2. Implement proper indexing
3. Add data validation constraints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@stakeit.app or create an issue in this repository. 