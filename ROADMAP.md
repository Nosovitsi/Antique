Of course. Here is a complete, phased development plan for the "Live Feed" Marketplace. This plan is designed to be straightforward enough for a developer to begin coding immediately, with a focus on creating a **minimalistic but effective** solution.

### **Introduction**

The goal is to build a **fast-paced, mobile-friendly marketplace** where sellers can host "live sales" by posting a feed of photo-based items that buyers can reserve and discuss in real-time.

The core philosophy is **simplicity**. We'll use a straightforward tech stack and avoid over-engineering to ensure the application is easy to build, understand, and deploy.

-----

### **Phase 1: Foundation & Core Data Models**

This phase establishes the project's skeleton, database, and all necessary data structures.

#### **1. Project Setup**

  - Generate a new Spring Boot project from `start.spring.io`.
  - **Dependencies**:
      - `Spring Web`
      - `Spring Data JPA`
      - `Spring Security`
      - `Thymeleaf`
      - `PostgreSQL Driver`
      - `spring-boot-docker-compose`
      - `Lombok`

#### **2. Database with Docker Compose**

  - Create a `docker-compose.yml` file in the project root:
    ```yml
    services:
      db:
        image: 'postgres:16'
        container_name: livefeed-db
        environment:
          - POSTGRES_USER=admin
          - POSTGRES_PASSWORD=password
          - POSTGRES_DB=livefeed_market
        ports:
          - "5432:5432"
        volumes:
          - db_data:/var/lib/postgresql/data
    volumes:
      db_data:
    ```
  - Configure `application.properties` to connect to this database and set up a simple file storage location for uploads.

#### **3. JPA Entity Definitions**

  - Define all necessary models in the `model` package.
  - **`User`**: `id`, `email`, `password`, `role` (Enum: `ROLE_SELLER`, `ROLE_BUYER`).
  - **`Product`**: `id`, `name`, `description`, `price`, `imageUrl`, **`status` (Enum: `AVAILABLE`, `RESERVED`, `SOLD`, `CANCELLED`)**, `seller` (`@ManyToOne User`), `reservedBy` (`@ManyToOne User`, nullable).
  - **`SaleSession`**: `id`, `seller` (`@ManyToOne User`), `startTime`, `endTime`, `status` (Enum: `ACTIVE`, `FINISHED`). The `Product` will be linked to this via the seller's active session upon creation.
  - **`Chat`**: `id`, `buyer` (`@ManyToOne User`), `seller` (`@ManyToOne User`).
  - **`ChatMessage`**: `id`, `chat` (`@ManyToOne Chat`), `sender` (`@ManyToOne User`), `content` (TEXT), `timestamp`, **`isRead` (boolean, default false)**.

-----

### **Phase 2: User Authentication & Basic Pages**

This phase implements user management and the basic site layout.

#### **1. Spring Security Configuration**

  - Create a `SecurityConfig` class to manage access.
  - Configure a `BCryptPasswordEncoder`.
  - Implement `UserDetailsService` to load users from the `UserRepository`.
  - Define URL access rules:
      - Public: `/`, `/login`, `/register`, `/feed`.
      - Seller-only: `/seller/**`.
      - Authenticated users: `/my-reservations`, `/chat/**`, `/notifications/**`.

#### **2. Registration and Login Flow**

  - Create a `UserController` with endpoints for `/register` and `/login`.
  - Build simple, responsive Thymeleaf templates for the registration and login forms.
  - Create a `UserService` to handle the logic of creating new users with hashed passwords.

#### **3. Basic Site Layout**

  - Create a main layout template (`/templates/layout.html`) using Thymeleaf fragments.
  - This layout should include a common **header** (with placeholders for a logo, navigation links, and the future notification icon 🔔) and a **footer**.
  - All other pages will extend this layout to ensure a consistent look and feel.

-----

### **Phase 3: The "Live Sale" Core Loop**

This phase focuses on the main functionality: selling, viewing the feed, and reserving items.

#### **1. Seller: "Go Live" Functionality**

  - **Controller**: `SellerController`.
  - **Seller Dashboard (`/seller/dashboard`)**: A simple page with a large **"Go Live"** button.
  - **Service Logic**: Clicking "Go Live" creates a new `SaleSession` with `ACTIVE` status and redirects the seller to the live management page (`/seller/session/live`).
  - **Live Management Page**:
      - A streamlined form to add products (name, price, photo upload). The UI must be mobile-friendly.
      - A list of items added during the current session is displayed below the form.
      - A prominent **"End Session"** button updates the `SaleSession` status to `FINISHED`.

#### **2. Buyer: View Feed & Reserve**

  - **Controller**: `FeedController`.
  - **Main Feed (`/` or `/feed`)**: Displays all `Product`s with `AVAILABLE` status from all `ACTIVE` `SaleSession`s.
  - **Thymeleaf Template**: Renders products in a responsive, card-based layout.
  - **Reservation Logic**:
      - Each product card has a **"Reserve"** button.
      - This button sends a `POST` request to an endpoint like `/products/{id}/reserve`.
      - **Service (`ProductService`)**:
        1.  Sets the product's status to `RESERVED`.
        2.  Assigns the current buyer to the product's `reservedBy` field.
        3.  Finds or creates the `Chat` between the buyer and seller.
        4.  Creates a system-generated `ChatMessage` to start the conversation (e.g., "I've reserved [Product Name]").
        5.  Redirects the user back to the feed.

-----

### **Phase 4: Post-Reservation Interaction & Chat**

This phase builds the communication bridge between buyers and sellers.

#### **1. User Dashboards**

  - **Seller's Sales Summary (`/seller/sales`)**: A page listing all `RESERVED` and `SOLD` items. Each item shows the buyer's info and a **"Go to Chat"** link.
  - **Buyer's Reservations (`/my-reservations`)**: A page listing all items the user has `RESERVED`. Each item shows seller info and a **"Go to Chat"** link.

#### **2. Minimalistic Chat Implementation**

  - **Controller**: `ChatController`.
  - **Chat Page (`/chat/{otherUserId}`)**: A page that displays message history with a specific user.
  - **No WebSockets\!** We will use a simple **polling mechanism** to keep it easy.
      - **Backend**: Create two REST endpoints:
        1.  `GET /api/chat/{chatId}/messages`: Fetches all messages for a chat. Marks them as read on the server.
        2.  `POST /api/chat/{chatId}/messages`: Allows a user to send a new message.
      - **Frontend**: On the chat page, use simple JavaScript with `setInterval()` to call the `GET` endpoint every few seconds to check for new messages and append them to the view.

#### **3. Transaction Finalization in Chat**

  - **UI**: In the seller's view of the chat page, for the relevant reserved item, add two buttons: **"Mark as Sold"** and **"Re-list Item"**.
  - **Controller Endpoints**:
      - `POST /products/{id}/sell`: The "Mark as Sold" button calls this. The service updates the product status to `SOLD`.
      - `POST /products/{id}/relist`: The "Re-list Item" button calls this. The service updates the product status back to `AVAILABLE` and clears the `reservedBy` field.

-----

### **Phase 5: Notifications & Final Polish**

This final phase adds a key engagement feature and ensures quality.

#### **1. Simple Notification System**

  - **Backend**: Create a REST endpoint `GET /api/notifications/unread-count`. This endpoint returns a simple JSON with the count of `ChatMessage`s where `isRead` is `false` for the current user.
  - **Frontend**: In the main `layout.html`, add a small piece of JavaScript that uses `setInterval()` to poll this endpoint every 30 seconds. If the count is greater than zero, it displays the count next to the notification bell icon 🔔 in the header.

#### **2. Final UI/UX Review**

  - Test the entire user flow on both desktop and a mobile browser viewport.
  - Ensure all buttons are easily tappable and pages are readable on a small screen.
  - Clean up the visual design for a modern, uncluttered look. Check for consistency.

-----

### **Technology Stack Summary**

  - **Backend**: Java 21, Spring Boot 3
  - **Frontend**: Server-Side Rendering with Thymeleaf, minimal vanilla JavaScript for chat and notifications.
  - **Database**: PostgreSQL (managed by Docker Compose).
  - **Architecture**: Service Layered Architecture.
  - **Deployment**: `spring-boot-docker-compose` for easy local setup and simple JAR-based deployment.
