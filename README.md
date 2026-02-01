# JAKD - Video-Powered Fitness Tracker

A computer vision-powered fitness tracking application that uses MediaPipe Tasks Vision for automatic rep counting with real-time form feedback.

## Features

- **Real-time pose detection** with skeleton visualization
- **Automatic rep counting** for push-ups, bicep curls, and squats
- **Form analysis and scoring** with instant feedback
- **Video recording** with pose overlay for review
- **Workout history** with interactive D3.js charts
- **Goal tracking** with progress visualization
- **Cloud sync** via Supabase for cross-device access
- **Dark theme UI** with modern, minimalist design

## Supported Exercises

| Exercise | Detection Method | Notes |
|----------|-----------------|-------|
| Push-ups | Elbow angle tracking | Full range of motion detection |
| Bicep Curls (Both Arms) | Simultaneous arm tracking | Both arms must move together |
| Alternating Bicep Curls | Individual arm tracking | Tracks each arm separately |
| Squats | Hip drop + knee angle | Front and side view support |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | TailwindCSS |
| State Management | Zustand |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| Computer Vision | MediaPipe Tasks Vision |
| Charts | D3.js |
| Icons | Lucide React |

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env.local` file with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

After creating your Supabase project, run the migrations in order:

1. `supabase/migrations/001_initial_schema.sql` - Core tables and exercise seeds
2. `supabase/migrations/002_frontend_redesign_schema.sql` - User preferences and routines
3. `supabase/migrations/003_exercises_rls_safe.sql` - Row-level security policies

If exercises are missing, run `supabase/fix_missing_exercises.sql`.

## Project Structure

```
src/
├── components/       # React components
│   ├── workout/      # Workout UI (VideoFeed, RepCounter, etc.)
│   ├── exercise/     # Exercise selection components
│   ├── profile/      # User profile components
│   └── shared/       # Reusable UI components
├── services/         # Core services
│   ├── pose/         # MediaPipe integration and detectors
│   ├── video/        # Video recording service
│   ├── audio/        # Audio cue service
│   └── metrics/      # Form analysis calculations
├── store/            # Zustand state management
├── repositories/     # Data access layer
├── hooks/            # Custom React hooks
├── pages/            # Page components
├── types/            # TypeScript type definitions
└── utils/            # Helper functions and constants
```

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guidelines, including:

- MediaPipe API usage (important: use Tasks Vision API only)
- Database setup and troubleshooting
- Testing checklist
- Common pitfalls and solutions

## Deployment

The app is designed for deployment on Vercel with Supabase as the backend:

1. Push to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

For custom domains, configure DNS settings in your domain provider.

## License

Private project - All rights reserved
