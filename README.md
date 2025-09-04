# Hockey Statistics Tracking Application

A comprehensive, production-ready hockey statistics tracking and analytics platform built with Next.js, TypeScript, and modern web technologies. Features advanced analytics, real-time updates, comprehensive testing, and enterprise-grade deployment capabilities.

🏒 ## Features

### Core Functionality
- **📊 Player Dashboard**: Interactive player statistics with advanced filtering and search
- **🏆 Team Statistics**: Comprehensive team analytics with multi-view dashboards
- **🎮 Game Summary Pages**: Detailed game recaps with box scores, player performances, and highlights
- **⚡ Real-time Updates**: Live game tracking with WebSocket support
- **📈 Advanced Analytics**: Performance trends, correlations, and comparative analytics
- **📤 Export & Sharing**: CSV/PDF exports and social media sharing capabilities

### Technical Features
- **🧪 Comprehensive Testing**: Unit tests, integration tests, and E2E tests with Playwright
- **🚀 Production Deployment**: Docker containerization with Nginx reverse proxy
- **📊 Performance Monitoring**: Prometheus metrics, health checks, and alerting
- **⚡ Database Optimization**: PostgreSQL with optimized indexes and views
- **💾 Backup & Recovery**: Automated database backups with S3 integration
- **🔒 Security**: Rate limiting, CORS protection, and comprehensive security headers

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth + Custom User Management
- **Database**: PostgreSQL with comprehensive hockey stats schema

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   └── layout.tsx         # Root layout
├── components/
│   ├── auth/              # Auth-related components
│   └── ui/                # Reusable UI components
├── contexts/
│   └── AuthContext.tsx    # Authentication context
├── hooks/
│   └── usePermissions.ts  # Permission checking hooks
├── lib/
│   ├── auth/              # Authentication services
│   └── supabase/          # Database clients
├── types/
│   └── database.ts        # TypeScript definitions
├── middleware.ts          # Route protection middleware
└── database/              # Database schema and setup
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Supabase account)
- Supabase project

### Environment Setup

1. Copy environment variables:
```bash
cp .env.local.example .env.local
```

2. Configure your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000
```

### Database Setup

1. Run the database setup script:
```sql
-- In your Supabase SQL editor or psql
\i database/setup.sql
```

This creates:
- All required tables with relationships
- Indexes for performance
- Sample data for testing
- Utility functions and views

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Authentication Flow

### Registration
- Users self-register with role selection
- Passwords are hashed with bcrypt
- User profiles stored in custom `users` table
- Supabase Auth handles session management

### Login
- Dual validation: custom table + Supabase Auth
- Password verification with bcrypt
- Session management via Supabase
- Automatic role-based redirects

### Route Protection
- Middleware checks authentication on all routes
- Role-based access control for protected areas
- Automatic redirects for unauthorized access
- Session refresh handling

### Permissions System
- Granular permission checking
- Role-based feature access
- React hooks for component-level permissions
- Server-side validation in middleware

## User Roles & Permissions

### Admin
- Full system access
- User management
- Team creation and management
- All coach and viewer permissions

### Coach  
- Live stat entry during games
- Player roster management
- Game scheduling and management
- View all stats and reports
- All viewer permissions

### Viewer (Parent)
- View player statistics
- View game schedules and results
- View team leaderboards
- Access public dashboards

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Next.js built-in protection
- **Role Validation**: Server-side permission checking
- **Session Security**: Secure cookie handling

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server  
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Database Schema

See `database/README.md` for complete schema documentation including:
- Table relationships
- Indexes and constraints
- Sample data
- Utility functions
- Performance optimizations

## Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Run: `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.