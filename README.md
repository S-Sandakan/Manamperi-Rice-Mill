# Manamperi Rice Mill Management System (MRMS) – ERP v1.0

A full-scale enterprise Rice Mill ERP system managing purchasing, production, inventory, POS sales, reporting, and analytics.

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18 + Vite, Tailwind CSS, Redux Toolkit |
| Backend    | Spring Boot 3.x, Java 17, Spring Security    |
| Database   | MySQL 8.0                                     |
| Auth       | JWT (BCrypt + 8hr session)                    |
| PDF Export | iText 7                                       |
| Excel      | Apache POI                                    |
| API Docs   | Swagger / OpenAPI 3.0                         |

## Quick Start

### Prerequisites
- Java 17+ (JDK)
- Maven 3.8+
- Node.js 18+ & npm
- MySQL 8.0

### 1. Database Setup
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p mrms_erp < database/seed-data.sql
```

### 2. Backend
```bash
cd backend
# Update database credentials in src/main/resources/application.properties
mvn spring-boot:run
# API available at http://localhost:8080/api
# Swagger UI at http://localhost:8080/api/swagger-ui.html
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

### Default Login Credentials
| Username   | Password     | Role               |
|------------|-------------|---------------------|
| admin      | password123 | Admin               |
| cashier1   | password123 | Cashier             |
| prodmgr1   | password123 | Production Manager  |

## Project Structure

```
├── backend/                    # Spring Boot 3.x application
│   └── src/main/java/com/manamperi/mrms/
│       ├── config/             # Security, Swagger configs
│       ├── controller/         # REST controllers
│       ├── service/            # Business logic
│       ├── repository/         # JPA repositories
│       ├── entity/             # JPA entities (12 tables)
│       ├── dto/                # Request/Response DTOs
│       ├── security/           # JWT auth components
│       └── exception/          # Exception handlers
├── frontend/                   # React + Vite application
│   └── src/
│       ├── components/         # Layout, ProtectedRoute
│       ├── pages/              # 7 pages (Dashboard, POS, etc.)
│       ├── services/           # API service layer
│       └── store/              # Redux Toolkit store
└── database/                   # SQL scripts
    ├── schema.sql              # Full DDL
    └── seed-data.sql           # Sample data
```

## Key Business Logic

- **Yield Calculation**: `Yield % = (Sahal Output / Vee Input) × 100` — ≥64% = Efficient
- **Batch ID Format**: `BATCH-YYYYMMDD-XXX`
- **Invoice Format**: `INV-YYYYMMDD-XXX`
- **Price History**: Immutable (append-only, enforced by DB triggers)
- **Stock Rules**: Purchase→+Vee, Production→-Vee/+Sahal+Kudu, Sale→-Stock, Void→+Stock
