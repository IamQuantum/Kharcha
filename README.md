# Quantum Expense: Personal Expense Tracker

A premium, full-stack personal finance dashboard designed to manage your ledger transactions, monitor monthly limits, and visualize budget velocities using custom interactive trajectory charts.

---

## 🛠️ Tech Stack

### Frontend Client
* **Framework:** React SPA bootstrapped with **Vite**
* **Styling Engine:** **Tailwind CSS v4** (with native Vite compiler plugin compilation)
* **Icons:** **Lucide React**
* **3D Backgrounds:** **Three.js** (WebGL canvas rendering for animated components)
* **Custom Charts:** Smooth native SVG-based cumulative area graphs matching CSS theme variables

### Backend Services
* **Core API Engine:** **Spring Boot 3.3.0** (Java 21)
* **Database Management:** **PostgreSQL**
* **Schema Ingestion:** **Flyway Migrations** (versioned database creation scripts)
* **Security Layer:** **Spring Security** + stateless **JWT Authentication**

---

## 🗂️ Project Directory Layout

```text
app/
├── backend/                   # Spring Boot API
│   ├── pom.xml                # Project dependencies (Security, Validation, Flyway, PostgreSQL, JWT)
│   └── src/main/java/com/tracker/
│       ├── BackendApplication.java  # Root main entry point
│       ├── config/            # JWT Token creation, request authorization filter, and SecurityFilterChain settings
│       ├── common/exception/  # Unified JSON error response exception advice interceptors
│       └── features/          # Package-by-feature layout
│           ├── auth/          # AppUser, UserSettings tables, authentication endpoints, and session settings
│           ├── transaction/   # Expense CRUD entities, specifications, services, and search endpoints
│           └── budget/        # Budget limits entities, controllers, and month progress calculators
│
└── frontend/                  # React SPA (Vite Client)
    ├── package.json           # Frontend packages (React 19, Axios, Lucide Icons, Tailwind v4, Three.js)
    ├── vite.config.js         # Tailwind v4 plugin compilation and alias configurations
    ├── jsconfig.json          # Path alias resolution mappings
    └── src/
        ├── index.css          # Theme custom properties declaring light/dark color variables
        ├── App.jsx            # Routing endpoints and session contexts
        ├── lib/api.js         # Customized Axios client with automatic Bearer token headers injection
        ├── components/layout/ # Main wrapper layout container with responsive toggling and session guards
        └── features/          # Feature verticals folder
            ├── auth/          # Login and register pages featuring full-screen LightPillar backgrounds
            ├── dashboard/     # Metric cards grid and interactive SVG area trajectory chart
            ├── expenses/      # Paginated ledger list, sorting selectors, and manual entry forms
            └── budgets/       # Limit setting forms and predictive burn velocity alerts
```

---

## 🚀 Local Installation & Run Guide

Follow these sequential steps to boot the project locally:

### 1. Database Setup
Ensure you have a local PostgreSQL server running on port `5432`. Create an empty database named `expense_tracker`:
```sql
CREATE DATABASE expense_tracker;
```

### 2. Configure Database Credentials
Open [application.yml](backend/src/main/resources/application.yml) and verify your PostgreSQL user credentials:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/expense_tracker
    username: postgres
    password: your_actual_password_here
```

### 3. Spin up the Spring Boot Backend
Navigate to the backend directory and launch the server using the Maven wrapper:
```powershell
cd backend
./mvnw spring-boot:run
```
On boot, **Flyway** will automatically run migrations and set up the schema. The server runs at `http://localhost:8080`.

### 4. Spin up the Vite React Frontend
In a separate terminal window, install dependencies and launch the dev environment:
```powershell
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## ✨ Core Features Explained

### 🔑 User Authentication & Settings
Stateless JWT tokens are issued on successful registration or login. Upon user creation, a default `user_settings` record is initialized. Users can update their baseline monthly income at any time in the settings view.

### 📊 Dynamic Ledger & Specifications
The ledger retrieves paginated transactions using Spring Data JPA **Specifications**. It permits simultaneous filtering by category, merchant name (case-insensitive substring match), and start/end date ranges directly at the database query execution layer.

### 📈 SVG Trajectory Charting
Rather than using heavy charting frameworks, the dashboard renders a custom, responsive **SVG area chart** that dynamically reads your cumulative expenditure day-by-day and graphs it alongside your monthly income limit.

### 🚨 Predictive Burn-rate alerts
Category limit progress indicators evaluate your spending speed. The system computes an *ideal burn rate* scaled to the current day of the month:
$$\text{Ideal Burn Rate} = \frac{\text{Budget Limit}}{\text{Total Days in Month}} \times \text{Current Day}$$
If your category spent amount exceeds this ideal trajectory, a warning badge alerts you early.
