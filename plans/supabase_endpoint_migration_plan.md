# Supabase Endpoint Migration Plan

This plan outlines the migration of existing Supabase API calls from the frontend to the new Python backend.

## Endpoints to Migrate:

### Authentication
*   **`AuthContext.tsx`**
    *   `supabase.auth.onAuthStateChange`: To be replaced by backend authentication flow. (Frontend will manage session state based on backend responses)
    *   `supabase.auth.signInWithPassword`: Migrated to backend login endpoint.
    *   `supabase.auth.signUp`: Migrated to backend registration endpoint.
    *   `supabase.auth.signOut`: Migrated to backend logout endpoint.
    *   `supabase.from('profiles')`: Migrated to backend profile endpoints (GET and PUT by user_id).
    *   `supabase.functions.invoke('fix-auth-domains')`: Migrated to backend endpoint.

### Live Sessions
*   **`components/seller/CreateSessionModal.tsx`**
    *   `supabase.from('live_sessions').insert()`: Migrated to backend: POST /live_sessions
*   **`components/seller/SellerDashboard.tsx`**
    *   `supabase.from('live_sessions').select()`: Migrated to backend: GET /live_sessions
    *   `supabase.rpc('end_live_session')`: Migrated to backend: POST /live_sessions/end/<session_id>
*   **`components/session/LiveSessionChat.tsx`**
    *   `supabase.from('live_sessions').select()`: Migrated to backend: GET /live_sessions?id=<session_id>
    *   `supabase.realtime`: Real-time updates for chat and products. (Requires WebSocket implementation in backend and frontend)
*   **`components/session/SessionsList.tsx`**
    *   `supabase.from('live_sessions').select()`: Migrated to backend: GET /live_sessions

### Products
*   **`components/feed/GlobalFeed.tsx`**
    *   `supabase.from('products').select()`: Migrated to backend: GET /products
    *   `supabase.from('profiles').select()`: Handled by separate profile endpoint
    *   `supabase.rpc('reserve_product')`: Migrated to backend: POST /products/reserve/<product_id>
    *   `supabase.rpc('update_product_status')`: Migrated to backend: PUT /products/status/<product_id>
*   **`components/session/ProductPostModal.tsx`**
    *   `supabase.from('products').insert()`: Migrated to backend: POST /products
*   **`components/session/LiveSessionChat.tsx`**
    *   `supabase.from('products').select()`: Migrated to backend: GET /products?id=<product_id>
    *   `supabase.rpc('reserve_product')`: Migrated to backend: POST /products/reserve/<product_id>
    *   `supabase.rpc('update_product_status')`: Migrated to backend: PUT /products/status/<product_id>

### Messages
*   **`components/session/LiveSessionChat.tsx`**
    *   `supabase.from('session_messages').select()`: Migrated to backend: GET /messages/<session_id>
    *   `supabase.from('session_messages').insert()`: Migrated to backend: POST /messages
*   **`components/session/SessionsList.tsx`**
    *   `supabase.from('session_messages').select()`: Migrated to backend: GET /messages/<session_id>

### Image Upload
*   **`hooks/useImageUpload.ts`**
    *   `supabase.functions.invoke('product-image-upload')`: Migrated to backend: POST /image_upload

## Migration Status:

*   **Authentication:** Completed.
*   **Live Sessions:** Completed.
*   **Messages:** Completed.
*   **Products:** Completed.
*   **Reservations:** Completed.
*   **Image Upload:** Completed.
