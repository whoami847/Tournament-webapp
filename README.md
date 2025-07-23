# Tournament Web App

A comprehensive tournament management web application built with Next.js, Firebase, and modern UI components.

## Features

- 🏆 Tournament Management
- 👤 User Authentication & Profiles
- 💰 Wallet System
- 🎮 Game Management
- 📊 Real-time Leaderboards
- 🔐 Admin Panel
- 📱 Responsive Design
- 🎨 Modern UI with Animations

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Firebase (Auth, Firestore, Storage)
- **UI Components**: Radix UI, Lucide React
- **Forms**: React Hook Form, Zod validation

## Prerequisites

Before deploying this application, ensure you have:

- Node.js 18+ installed
- A Firebase project set up
- Git installed

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Follow the setup wizard
4. Enable Authentication, Firestore, and Storage

### 2. Configure Firebase Services

#### Authentication
1. Go to Authentication > Sign-in method
2. Enable Email/Password authentication
3. Optionally enable Google sign-in

#### Firestore Database
1. Go to Firestore Database
2. Create database in production mode
3. Set up security rules (see `firestore.rules`)

#### Storage
1. Go to Storage
2. Get started with default rules
3. Update rules for image uploads

### 3. Get Firebase Configuration

1. Go to Project Settings > General
2. Scroll down to "Your apps"
3. Click on the web app icon or "Add app"
4. Copy the configuration object

## Environment Variables

Create a `.env.local` file in the root directory with the following Firebase variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional: Analytics
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Setting Firebase Variables in Code

If you prefer to set variables directly in the code, update `src/lib/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your_api_key_here",
  authDomain: "your_project_id.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project_id.firebasestorage.app",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id"
};
```

## Installation & Deployment

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd tournament-webapp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase configuration
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:9002](http://localhost:9002)** in your browser

### Production Deployment

#### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Set environment variables in Vercel dashboard:**
   - Go to your project settings
   - Add all Firebase environment variables

#### Option 2: Firebase Hosting

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase:**
   ```bash
   firebase init hosting
   ```

4. **Build the application:**
   ```bash
   npm run build
   ```

5. **Deploy:**
   ```bash
   firebase deploy
   ```

#### Option 3: Netlify

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Drag and drop the `out` folder to Netlify
   - Or connect your Git repository

#### Option 4: Docker

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run:**
   ```bash
   docker build -t tournament-app .
   docker run -p 3000:3000 tournament-app
   ```

## Configuration

### Admin Setup

1. **Create first admin user:**
   - Register a user through the app
   - Go to Firebase Console > Firestore
   - Find the user document in `users` collection
   - Change `role` field from "Player" to "Admin"

### Firestore Security Rules

Update your Firestore rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null;
    }
    
    // Tournaments are public read, admin write
    match /tournaments/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }
    
    // Games are public read, admin write
    match /games/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin';
    }
  }
}
```

### Storage Rules

Update your Storage rules in Firebase Console:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }
  }
}
```

## Features Overview

### User Features
- User registration and authentication
- Profile management with avatar uploads
- Tournament browsing and registration
- Real-time tournament brackets
- Wallet management
- Game history and statistics

### Admin Features
- User management
- Tournament creation and management
- Game management
- Banner management
- Withdrawal request handling
- Real-time analytics dashboard

## Troubleshooting

### Common Issues

1. **Firebase Configuration Errors:**
   - Ensure all environment variables are set correctly
   - Check Firebase project settings
   - Verify API keys are active

2. **Build Errors:**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Check TypeScript errors: `npm run typecheck`

3. **Authentication Issues:**
   - Ensure Firebase Auth is enabled
   - Check domain whitelist in Firebase Console
   - Verify redirect URLs

4. **Storage Upload Issues:**
   - Check Storage rules
   - Verify bucket configuration
   - Ensure CORS is configured properly

### Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review Firebase Console for configuration issues
