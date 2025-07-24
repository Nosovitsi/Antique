# Antique Feed

Antique Feed is a modern web application for live-streamed antique sales. Sellers can host live video sessions, showcase products, and interact with buyers in real-time. Buyers can discover new items, participate in live chats, and get a closer look at unique antiques from the comfort of their homes.

## Stack Overview

- **Framework**: [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), and shadcn/ui
- **Routing**: [React Router](https://reactrouter.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

For a more detailed explanation of the architecture, please see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.com/) account and project.

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/antique-feed.git
    cd antique-feed
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project and add your Supabase project URL and anon key:

    ```
    VITE_SUPABASE_URL=your-supabase-project-url
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

    You can find these in your Supabase project settings.

### Running the Development Server

To start the local development server, run the following command:

```bash
pnpm run dev
```

This will start the application on `http://localhost:5173`.

## Deployment

The application can be deployed to any static hosting provider like Vercel, Netlify, or AWS S3.

1.  **Build the application:**

    ```bash
    pnpm run build
    ```

    This command creates a `dist/` directory with the production-ready assets.

2.  **Deploy:**

    Deploy the contents of the `dist/` directory to your hosting provider of choice.