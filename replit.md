# Choreography Editor

## Overview

A professional choreography synchronization tool designed for coaches to create and edit vibration patterns synchronized with music and video. The application allows coaches to program vibration cues across four watch channels (G1-G4) on a timeline, supporting both real-time "Live Tap" recording and precise "Edit" mode adjustments.

## Recent Changes

### Video Support (Latest)
- Added MP4 video file support alongside MP3 audio
- YouTube-style progress bar with clickable seek functionality
- Markers displayed on progress bar for quick navigation
- Speed control buttons: 0.25x, 0.5x, 0.75x, 1x
- Video preview with click-to-play/pause functionality

### "G" Button for All Channels
- Added "SVE GRUPE" (All Groups) button that triggers all 4 channels simultaneously
- Button positioned above individual channel pads
- Spans full width for easy access

## User Preferences

Preferred communication style: Simple, everyday language.
Target device: Apple iPad (10th generation or newer) - Safari browser.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript compiled via tsx for development, esbuild for production
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **Static Serving**: Vite dev server in development, static file serving in production

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` - defines projects and markers tables
- **Migrations**: Drizzle Kit with `db:push` command for schema updates

### Data Models
- **Projects**: Store choreography metadata (title, audio file, duration)
- **Markers**: Store vibration events (time, duration, channel, intensity, pattern)

### Build System
- **Development**: Vite dev server with HMR, tsx for server compilation
- **Production**: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Path Aliases**: `@/*` maps to client source, `@shared/*` maps to shared code

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database queries
- pg (node-postgres) as the PostgreSQL driver

### UI Framework
- Radix UI primitives for accessible components
- Lucide React for icons
- class-variance-authority for component variants
- tailwind-merge and clsx for class name handling

### Development Tools
- Vite with React plugin and Tailwind CSS plugin
- Replit-specific plugins for development (cartographer, dev-banner, error overlay)
- Custom meta images plugin for OpenGraph support