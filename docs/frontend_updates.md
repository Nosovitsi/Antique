# Frontend Updates (July 2025)

This document outlines the recent changes and considerations for the React frontend.

## 1. Duplicate Request Resolution

- **Problem:** Components like `SessionsList.tsx` and `LiveSessionChat.tsx` were making duplicate network requests on initial mount in development mode.
- **Solution:** Temporarily disabled React `StrictMode` in `src/main.tsx`.
- **Note:** `StrictMode` intentionally renders components twice in development to help identify side effects. Disabling it resolves the duplicate requests in development. For production builds, `StrictMode` is typically re-enabled as it aids in catching potential issues.

## 2. Backend API Alignment

- **Update:** Frontend API calls (e.g., for live sessions and messages) are now correctly aligned with the backend's updated route definitions (e.g., no trailing slashes for `POST` endpoints).

## 3. Real-time Messaging (Future Work)

- **Current Status:** The frontend currently fetches messages via standard `GET` requests, meaning new messages only appear upon manual refresh or re-rendering of the component.
- **Next Steps:** To enable real-time message display, the frontend will need to establish and manage WebSocket connections to the backend, listening for and processing live message updates.
