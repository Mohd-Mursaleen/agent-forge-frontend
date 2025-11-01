# AgentForge Frontend

A modern Next.js frontend for the Dynamic Task Generation Backend API. Built with Clerk authentication, Tailwind CSS, and Framer Motion for animations.

## Features

- 🔐 **Clerk Authentication** - Secure user authentication and management
- 🤖 **Agent Management** - Create, view, edit, and delete AI agents
- 📊 **Vector Tables** - Manage data tables with semantic search capabilities
- 🎯 **Task Management** - Create AI-generated tools from natural language
- 💬 **Real-time Chat** - Chat interface with AI agents
- 🎨 **Modern UI/UX** - Light theme with transparency effects and smooth animations
- 📱 **Responsive Design** - Works on all device sizes

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Clerk account and API keys
- Backend API running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── agents/            # Agent management pages
│   ├── chat/              # Chat interface
│   ├── dashboard/         # Dashboard page
│   ├── tables/            # Vector tables pages
│   └── sign-in/           # Authentication pages
├── components/            # React components
│   ├── ui/                # UI components (Button, Card, Input, etc.)
│   ├── sidebar.tsx        # Sidebar navigation
│   ├── chat-window.tsx    # Chat component
│   └── layout-wrapper.tsx # Layout wrapper
├── lib/                   # Utility functions
│   ├── api.ts            # API client
│   └── utils.ts          # Helper functions
└── middleware.ts          # Clerk middleware
```

## Key Pages

- **Dashboard** (`/dashboard`) - Overview of all agents
- **Agents** (`/agents`) - List and manage agents
- **Create Agent** (`/agents/new`) - Multi-step form to create agents
- **Agent Detail** (`/agents/[id]`) - View agent details with chat
- **Chat** (`/chat`) - Chat with any agent
- **Tables** (`/tables`) - Manage vector tables

## Technologies Used

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Clerk** - Authentication
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **Lucide React** - Icons

## Features in Detail

### Multi-step Forms
The agent creation form uses a multi-step wizard with progress indicators and smooth transitions.

### Chat Interface
The chat window appears in half the screen (or full screen on mobile) with real-time messaging and tool call visualization.

### Modern Design
- Glass morphism effects
- Smooth animations and transitions
- Light theme with transparency
- Responsive layout

## API Integration

The frontend uses the API client (`lib/api.ts`) to communicate with the backend. All requests include Clerk authentication tokens automatically.

## Contributing

1. Follow the existing code style
2. Add TypeScript types for all props and data
3. Use Tailwind CSS for styling
4. Add animations using Framer Motion
5. Test all functionality before committing

## License

MIT
