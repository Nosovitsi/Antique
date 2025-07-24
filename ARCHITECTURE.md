# Antique Feed Architecture Overview

This document provides a comprehensive overview of the Antique Feed application architecture, including the frontend, backend, database, and authentication systems.

## Frontend (FE)

The frontend is a modern Single Page Application (SPA) built using the following technologies:

- **Framework**: [React](https://react.dev/) with [Vite](https://vitejs.dev/) for a fast development experience and optimized builds.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety and improved developer experience.
- **Routing**: [React Router](https://reactrouter.com/) is used for client-side routing, enabling navigation between different views without full page reloads.
- **Styling**:
  - [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework for rapid UI development.
  - [Radix UI](https://www.radix-ui.com/): Provides unstyled, accessible UI primitives.
  - **shadcn/ui**: The project utilizes a component library built on top of Radix UI and Tailwind CSS, suggested by the presence of `lucide-react`, `class-variance-authority`, and other related dependencies.
- **State Management**: Global state, particularly for authentication, is managed via React's Context API, as seen in `src/contexts/AuthContext.tsx`.
- **Forms**: [React Hook Form](https://react-hook-form.com/) is used for managing form state and validation, paired with [Zod](https://zod.dev/) for schema validation.

### Code Structure

The frontend code is organized in the `src/` directory with a feature-based structure:

- **`components/`**: Contains reusable React components, further organized by feature (e.g., `auth`, `feed`, `layout`, `seller`, `session`).
- **`contexts/`**: Holds React context providers for managing global state.
- **`hooks/`**: Contains custom React hooks for reusable logic (e.g., `use-mobile`, `useImageUpload`).
- **`lib/`**: Utility functions and library initializations, including the Supabase client.

## Backend (BE)

The application leverages [Supabase](https://supabase.com/) as its backend-as-a-service (BaaS) platform. This simplifies development by providing a suite of backend services through a single API.

- **API**: The frontend communicates with Supabase via the `@supabase/supabase-js` client library. This library provides a simple interface for interacting with the database, authentication, and storage services.
- **Serverless Functions**: While not explicitly present in the current file structure, Supabase allows for the deployment of serverless Edge Functions for custom backend logic if needed.

## Database (DB)

The database is a [PostgreSQL](https://www.postgresql.org/) instance managed by Supabase.

- **Schema**: The database schema is defined and managed through the Supabase dashboard or via SQL migrations.
- **Access**: The frontend directly queries the database using the Supabase client library, which enforces security through PostgreSQL's Row Level Security (RLS) policies. This ensures that users can only access and modify data they are permitted to.

## Authentication

Authentication is handled by [Supabase Auth](https://supabase.com/docs/guides/auth).

- **Providers**: Supabase Auth supports various authentication methods, including email/password, OAuth (e.g., Google, GitHub), and magic links. The `src/components/auth/` directory contains the UI components for login and sign-up flows.
- **Session Management**: Supabase manages user sessions and provides JWTs (JSON Web Tokens) to the client. The `AuthContext.tsx` context likely wraps the application to provide user and session information to the component tree.

## Deployment

The application is a standard Vite project and can be deployed to any static hosting provider.

1.  **Build**: The `pnpm run build` command compiles the TypeScript code, bundles the assets, and outputs a production-ready `dist/` directory.
2.  **Hosting**: The contents of the `dist/` directory can be deployed to services like Vercel, Netlify, or AWS S3/CloudFront.

This architecture allows for a rapid development workflow, with a clear separation of concerns between the frontend and the backend services provided by Supabase.
