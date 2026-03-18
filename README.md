# PetPal

A pet care marketplace platform where pet owners can discover stores, browse products, book services, and get AI-powered assistance — all in one place.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, React Router 7 |
| Backend | Java 17, Spring Boot 3.4, Spring Security, Spring Data JPA |
| Database | PostgreSQL |
| Authentication | JWT (JJWT) |
| AI Assistant | Spring AI + Ollama (Llama 3.1) |
| Maps | Mapbox GL |

## Features

- **Store Listings** — Browse pet stores with categories, images, and reviews
- **Products & Services** — View product catalogs and available services across all stores
- **Booking System** — Book pet services with real-time availability checking
- **Shopping Cart** — Add products to cart and checkout
- **Reviews & Ratings** — Leave reviews for stores with star ratings
- **Owner Dashboard** — Business owners can manage stores, products, services, bookings, and view analytics
- **Notifications** — Real-time notification system for bookings and updates
- **PawPal AI Assistant** — AI-powered chatbot that knows all stores on the platform and can help users find what they need
- **Remember Me** — Optional persistent login across browser sessions

## Prerequisites

Make sure you have the following installed:

- **Node.js** (v18 or higher) — [nodejs.org](https://nodejs.org)
- **Java 17** (JDK) — [adoptium.net](https://adoptium.net)
- **Maven** — [maven.apache.org](https://maven.apache.org) (or use the included `mvnw` wrapper)
- **PostgreSQL** — [postgresql.org](https://www.postgresql.org)
- **Ollama** (for AI chatbot) — [ollama.com](https://ollama.com)

## Setup & Installation

### 1. Database

Create a PostgreSQL database:

```sql
CREATE DATABASE pets_db;
```

The default connection settings in the backend expect:
- **Host:** localhost:5432
- **Database:** pets_db
- **Username:** postgres
- **Password:** admin

To change these, edit `TimskiMilenici/src/main/resources/application.properties`.

### 2. Backend

```bash
cd TimskiMilenici

# Install dependencies and build
mvn clean install -DskipTests

# Run the backend server (starts on port 8080)
mvn spring-boot:run
```

The backend will automatically create/update the database schema on startup via JPA `ddl-auto=update`.

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (starts on port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. AI Chatbot (PawPal)

The PawPal chatbot requires Ollama running locally with the Llama 3.1 model:

```bash
# Pull the model (one-time download, ~4.7 GB)
ollama pull llama3.1:8b
```

Ollama runs as a background service on port 11434 after installation. The app works without Ollama — PawPal will show a friendly error message — but the AI features won't function.

If you have limited GPU memory or run into CUDA errors, use a smaller model:

```bash
ollama pull llama3.2:3b
```

Then update `TimskiMilenici/src/main/resources/application.properties`:

```properties
spring.ai.ollama.chat.model=llama3.2:3b
```

### 5. Mapbox (Optional)

For map features, create a `.env` file in the `frontend/` directory:

```
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

Get a free token at [mapbox.com](https://www.mapbox.com).

## Project Structure

```
TimskiMilenici/
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── app/                # App entry, routing, providers
│   │   ├── features/           # Feature modules
│   │   │   ├── auth/           # Authentication (login, register, JWT)
│   │   │   ├── booking/        # Service booking
│   │   │   ├── business/       # Stores, products, services, reviews
│   │   │   ├── cart/           # Shopping cart
│   │   │   ├── notifications/  # Notification system
│   │   │   ├── pawpal/         # AI chatbot
│   │   │   ├── user/           # User profile
│   │   │   ├── analytics/      # Owner analytics
│   │   │   └── welcome/        # Landing page
│   │   ├── shared/             # Shared components (TopBar, Footer, etc.)
│   │   └── styles/             # Global styles and design tokens
│   └── package.json
│
├── TimskiMilenici/             # Spring Boot backend
│   ├── src/main/java/.../
│   │   ├── controllers/        # REST API controllers
│   │   ├── services/           # Business logic
│   │   ├── entities/           # JPA entities
│   │   ├── repositories/       # Spring Data repositories
│   │   ├── security/           # JWT filter, security config
│   │   └── config/             # CORS, security configuration
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
│
└── README.md
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | User login |
| `POST /api/auth/signup` | User registration |
| `GET /api/businesses` | List all stores |
| `GET /api/businesses/{id}` | Store details |
| `GET /api/products` | List all products |
| `GET /api/services` | List all services |
| `POST /api/bookings` | Create a booking |
| `GET /api/cart` | Get user's cart |
| `POST /api/cart/items` | Add item to cart |
| `POST /api/cart/checkout` | Checkout |
| `GET /api/reviews/business/{id}` | Store reviews |
| `POST /api/chat` | PawPal AI chat |
| `GET /api/notifications` | User notifications |

## Running in Production

```bash
# Build frontend
cd frontend
npm run build

# Build backend JAR
cd ../TimskiMilenici
mvn clean package -DskipTests

# Run
java -jar target/TimskiMilenici-0.0.1-SNAPSHOT.jar
```
