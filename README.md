# Insyd Notification System POC

A proof-of-concept notification system for the Insyd social platform, designed for 100 DAUs with real-time notifications for follow/unfollow events.

## Architecture Overview

### Backend (Node.js + Express + Prisma + PostgreSQL)

- **REST API**: User management, follow/unfollow operations, notification CRUD
- **WebSocket Server**: Real-time notification delivery
- **Notification Queue**: In-memory queue system for processing notifications
- **Database**: PostgreSQL with Prisma ORM

### Frontend (Next.js + React + TailwindCSS)

- **User Interface**: Simple, functional UI for testing
- **Real-time Updates**: WebSocket client for live notifications
- **Optimistic Updates**: Immediate UI feedback for follow/unfollow actions

## Features

✅ **User Management**: Dummy users with avatars and follow counts  
✅ **Follow/Unfollow**: Interactive buttons with optimistic updates  
✅ **Notification Queue**: Events are queued and processed asynchronously  
✅ **Real-time Delivery**: WebSocket-based instant notification delivery  
✅ **Notification History**: View all notifications with read/unread status  
✅ **User Switching**: Simulate different users to test the system

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- Git

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd insyd

# Install backend dependencies
cd backend
pnpm install

# Install frontend dependencies
cd ../frontend
pnpm install
```

### 2. Database Setup

```bash
# Start PostgreSQL (if using Docker)
docker run --name postgres-insyd -e POSTGRES_PASSWORD=password -e POSTGRES_DB=insyd_notifications -p 5432:5432 -d postgres:15

# Or use your existing PostgreSQL instance
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/insyd_notifications?schema=public"

# Server
PORT=3001
```

### 4. Database Migration and Seeding

```bash
cd backend

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed with dummy data
pnpm db:seed
```

### 5. Start the Application

```bash
# Terminal 1: Start backend server
cd backend
pnpm dev

# Terminal 2: Start frontend
cd frontend
pnpm dev
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:3001

## Usage Guide

### Testing the Notification System

1. **Open the Application**: Navigate to http://localhost:3000

2. **Select a User**: Choose a user from the dropdown to simulate being logged in as that user

3. **Follow/Unfollow Users**: Click the Follow/Unfollow buttons on user cards

4. **View Notifications**: Click the "Notifications" button to see real-time notifications

5. **Test Real-time Updates**:
   - Open multiple browser tabs
   - Select different users in each tab
   - Follow/unfollow users and watch notifications appear instantly

### API Endpoints

```
GET    /api/users                           # Get all users
GET    /api/users/:userId                   # Get user with follow status
POST   /api/users/:userId/follow            # Follow a user
DELETE /api/users/:userId/follow            # Unfollow a user
GET    /api/users/:userId/notifications     # Get user notifications
GET    /api/users/:userId/notifications/unread-count  # Get unread count
PATCH  /api/notifications/:id/read          # Mark notification as read
GET    /api/queue/status                    # Get queue status (debug)
GET    /api/health                          # Health check
```

## System Design

### Notification Flow

1. **User Action**: User clicks Follow/Unfollow button
2. **Optimistic Update**: UI immediately reflects the change
3. **API Call**: Request sent to backend
4. **Database Update**: Follow relationship created/deleted
5. **Queue Event**: Notification added to processing queue
6. **Process Notification**: Queue processes event and saves to database
7. **Real-time Delivery**: WebSocket sends notification to connected user
8. **UI Update**: Notification appears in real-time

### Scalability Considerations

**Current (100 DAUs)**:

- In-memory notification queue
- Single server instance
- Direct WebSocket connections

**Future (1M DAUs)**:

- Redis-based queue system
- Horizontal scaling with load balancers
- Message broker (RabbitMQ/Apache Kafka)
- Database sharding/read replicas
- CDN for static assets
- Microservices architecture

## Project Structure

```
insyd/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── notificationService.ts    # Notification logic & queue
│   │   ├── index.ts                      # Express server & WebSocket
│   │   └── seed.ts                       # Database seeding
│   ├── prisma/
│   │   └── schema.prisma                 # Database schema
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── page.tsx                      # Main UI component
│   │   ├── layout.tsx                    # App layout
│   │   └── globals.css                   # Global styles
│   └── package.json
└── README.md
```

## Technologies Used

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **WebSocket (ws)** - Real-time communication
- **TypeScript** - Type safety

### Frontend

- **Next.js 15** - React framework
- **React 19** - UI library
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons
- **TypeScript** - Type safety

## Development Notes

- **No Authentication**: Simplified for POC - user switching simulates different sessions
- **In-Memory Queue**: Suitable for 100 DAUs, would need Redis/database queue for scale
- **Simple UI**: Focused on functionality over aesthetics as requested
- **Error Handling**: Basic error handling implemented
- **Real-time**: WebSocket connection per user for instant notifications

## Future Enhancements

- User authentication system
- Push notifications for mobile
- Email notifications
- Notification preferences
- Advanced queuing with retry logic
- Monitoring and analytics
- Rate limiting and abuse prevention
