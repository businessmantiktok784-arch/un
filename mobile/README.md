# UniHub Mobile App

An Expo-based React Native mobile application for the UniHub academic resource platform.

## Features

- **Browse**: Search and filter documents by type, university, and course
- **Bookmarks**: Save documents for quick access (requires sign-in)
- **Upload**: Share study materials with the community (requires sign-in)
- **Download**: Access documents with credit-based system
- **Profile**: View user stats and manage account
- **Opportunities**: Browse internships, scholarships, and other opportunities

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator or Android Emulator (optional)

### Installation

```bash
cd mobile
npm install
```

### Configuration

Set up your Supabase credentials in `src/lib/supabase.ts`:

```typescript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### Running the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Project Structure

```
mobile/
├── src/
│   ├── components/     # Reusable components
│   │   ├── DocumentCard.tsx
│   │   └── UniversityCard.tsx
│   ├── screens/        # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── BrowseScreen.tsx
│   │   ├── DocumentDetailScreen.tsx
│   │   ├── UploadScreen.tsx
│   │   ├── BookmarksScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── LoginScreen.tsx
│   ├── lib/
│   │   └── supabase.ts  # Supabase client
│   └── types/
├── App.tsx             # Root component
├── app.json            # Expo configuration
└── package.json
```

## Tech Stack

- Expo SDK 52
- React Native 0.76
- React Navigation (Bottom Tabs + Stack)
- Supabase (same backend as web app)
- RNEUI (React Native Elements UI)
- Lucide React Native (icons)

## Building for Production

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Or use EAS
 eas build --platform all
```
