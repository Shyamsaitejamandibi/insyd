# Insyd Notification System

A proof-of-concept notification system for the Insyd social platform, designed for the Architecture Industry. This system handles real-time notifications for user interactions like follows, content engagement, and organic discoveries.

## Problem Statement

Insyd is a next-gen social web platform for the Architecture Industry, targeting 1 million daily active users (DAUs) from India. The platform needs to keep users engaged by notifying them about:

- Activity from people they follow
- Interactions from their followers
- Organic content discoveries

This POC is designed for a bootstrapped startup with 100 DAUs in mind, with a focus on scalability and real-time notifications.

## Architecture Overview

### Frontend (Next.js + React)

- **Modern UI**: Built with Next.js and React
- **Real-time Updates**: Redis-based real-time notification delivery
- **Type Safety**: Full TypeScript implementation
- **UI Components**: Custom UI components with Radix UI primitives

## Features

✅ **Real-time Notifications**: Redis-powered instant updates with in-memory fallback  
✅ **Scalable Architecture**: Designed to scale from 100 DAUs can scale to 1M+ DAUs with Redis Cluster
✅ **Type Safety**: Full TypeScript implementation  
✅ **Modern Stack**: Next.js, React, Redis  
✅ **Toast Notifications**: Using Sonner for beautiful notifications  
✅ **Date Handling**: date-fns for consistent date formatting

## Prerequisites

- Node.js 18+
- pnpm
- Redis server
- Git

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd insyd/frontend
pnpm install

# Push the database schema
pnpm dlx prisma db push

# Seed the database
pnpm dlx prisma db seed

```

### 2. Environment Configuration

Create a `.env` file in the `frontend` directory:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# Other environment variables as needed
```

### 3. Start the Application

```bash
# Start frontend development server
pnpm dev
```

The application will be available at:

- **Frontend**: http://localhost:3000

## Project Structure

```
frontend/
├── app/
│   ├── api/              # API routes
│   ├── components/       # Page-specific components
│   ├── hooks/           # Custom React hooks
│   ├── page.tsx         # Main page component
│   ├── layout.tsx       # Root layout
│   └── globals.css      # Global styles
├── components/
│   └── ui/              # Reusable UI components
├── lib/                 # Utility functions and configurations
├── prisma/             # Database schema and migrations
├── public/             # Static assets
└── package.json        # Project dependencies
```

## Technologies Used

### Frontend

- **Next.js** - React framework with App Router
- **TypeScript** - Type safety
- **Redis** - Real-time data handling and message broker
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Shadcn UI** - Accessible UI primitives
- **date-fns** - Date manipulation

## System Design

The notification system is designed with the following key components:

1. **Redis Queue System**

   - Primary message broker for notifications
   - In-memory fallback mechanism for high availability
   - Pub/Sub capabilities for real-time delivery

2. **Scalability Considerations**

   - Initial design for 100 DAUs
   - Architecture supports scaling to 1M+ DAUs
   - Redis Cluster support for horizontal scaling

3. **Performance Optimizations**
   - Real-time notification delivery
   - Efficient queue management
   - Fallback mechanisms for high availability

For detailed system design documentation, please refer to [REDIS.md](./frontend/REDIS.md)

## Development Notes

- **POC Focus**: Implementation focuses on core notification functionality
- **Type Safety**: Full TypeScript implementation for better development experience
- **Real-time**: Redis-based real-time updates with fallback mechanism
- **Performance**: Optimized for real-time notification delivery

## Future Enhancements

- Enhanced notification preferences
- Advanced analytics dashboard
- Push notification support
- Email notification integration
- Performance monitoring
- Automated testing suite
- CI/CD pipeline setup
- Documentation improvements
