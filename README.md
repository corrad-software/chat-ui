I'll help you update the README.md with environment setup instructions. Here's the updated content:

```markdown:README.md
# Chat UI

A modern chat interface built with Nuxt 3 and Dify.AI.

## Features
- Real-time chat with AI
- Image upload support
- Conversation management
- Dark/Light theme
- Mobile responsive
- Message streaming
- Code highlighting
- Markdown support

## Prerequisites
- Node.js 18.x or higher
- Dify.AI API credentials

## Setup

1. Install dependencies:
```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

2. Create `.env` file in the root directory:
```bash
# Dify API Configuration
DIFY_API_KEY=your_api_key_here
DIFY_API_URL=your_api_url_here # e.g., https://api.dify.ai/v1
DIFY_USER_ID=your_user_id # Optional, defaults to "1"

# Agent Configuration
AGENT_NAME=your_agent_name # e.g., "AI Assistant"
AGENT_DESCRIPTION=your_agent_description # e.g., "I'm here to help!"
```

3. Optional: Configure your AI avatar
- Place your AI avatar image in `/public/ai-avatar.png`
- Place your user avatar image in `/public/user-avatar.png`

## Development

Start the development server:
```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## License
MIT

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information about deploying to production.
```

This README now includes:
1. Complete environment setup instructions
2. Required environment variables
3. Dify.AI setup steps
4. Development and production commands
5. Additional configuration options
6. Prerequisites and features list