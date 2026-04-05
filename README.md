# Manamperi Rice Mill — POS & Management System

A complete **Point of Sale** and **Management System** for a rice mill built with **Django REST Framework** + **React** + **Tailwind CSS** + **MySQL**.

---

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Backend  | Python / Django 5.1 / DRF          |
| Frontend | React 18 / Vite / Tailwind CSS 3   |
| Database | MySQL                               |
| Auth     | JWT (SimpleJWT)                     |
| Reports  | ReportLab (PDF) / openpyxl (Excel) |

---

## Features

- **POS System** — Product search, cart, checkout, PDF invoice print
- **Paddy Purchase Management** — Record purchases from farmers, auto stock update
- **Rice Product Management** — CRUD with low-stock alerts
- **Bran / Husk Sales** — Track by-product sales
- **Inventory Management** — Stock levels, movement logs, alerts
- **Farmer & Customer Management** — CRUD with history
- **Reports & Analytics** — Daily/monthly sales charts, profit summary, Excel export
- **JWT Authentication** — Login with role-based access (Admin / Staff)
- **Django Admin Panel** — Full admin for all models

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8.0+

### 1. Database Setup

```sql
CREATE DATABASE manamperi_ricemill CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python manage.py makemigrations core
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Access

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api/
- **Admin Panel:** http://localhost:8000/admin/

---

## API Endpoints

| Endpoint                    | Method | Description            |
| --------------------------- | ------ | ---------------------- |
| `/api/auth/login/`          | POST   | JWT Login              |
| `/api/auth/refresh/`        | POST   | Refresh token          |
| `/api/products/`            | CRUD   | Rice products          |
| `/api/sales/`               | CRUD   | Sales                  |
| `/api/sales/checkout/`      | POST   | POS Checkout           |
| `/api/sales/{id}/invoice/`  | GET    | PDF Invoice            |
| `/api/paddy-purchases/`     | CRUD   | Paddy purchases        |
| `/api/farmers/`             | CRUD   | Farmers                |
| `/api/customers/`           | CRUD   | Customers              |
| `/api/bran-sales/`          | CRUD   | Bran/Husk sales        |
| `/api/inventory/`           | CRUD   | Inventory              |
| `/api/stock-movements/`     | GET    | Stock movement logs    |
| `/api/reports/dashboard/`   | GET    | Dashboard stats        |
| `/api/reports/daily/`       | GET    | Daily sales report     |
| `/api/reports/monthly/`     | GET    | Monthly sales report   |
| `/api/reports/profit/`      | GET    | Profit summary         |
| `/api/reports/export/sales/`| GET    | Excel export           |

---

## Project Structure

```
Manamperi-Rice-Mill/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── ricemill/          # Django project settings
│   └── core/              # Main app (models, views, serializers)
└── frontend/
    ├── package.json
    └── src/
        ├── api/           # Axios config
        ├── context/       # Auth context
        ├── components/    # Sidebar, Layout, Modal, StatsCard
        └── pages/         # 10 pages (Login, Dashboard, POS, etc.)
```

---

## MySQL Configuration

Update `backend/ricemill/settings.py` if your MySQL credentials differ:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'manamperi_ricemill',
        'USER': 'root',
        'PASSWORD': '1234',       # ← Update
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```
