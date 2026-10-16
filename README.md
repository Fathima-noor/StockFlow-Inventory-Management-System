# StockFlow – Inventory Management System

A full-stack inventory management application built using React, Django REST Framework, and MySQL. StockFlow helps manage products, categories, suppliers, stock movements, and inventory reports through a dashboard.

## Features

- **Dashboard:** View inventory summary, total products, stock levels, suppliers, and low-stock alerts.
- **Product Management:** Add, update, search, and manage product details.
- **Category Management:** Organize products by category.
- **Supplier Management:** Maintain supplier information.
- **Stock In / Stock Out:** Record inventory movements and automatically update stock quantities.
- **Stock Validation:** Prevent stock-out transactions when sufficient stock is unavailable.
- **Transaction History:** View and search stock movement records, including notes and timestamps.
- **Low-Stock Alerts:** Identify products that have reached or fallen below their reorder levels.
- **Reports:** View inventory data, filter transactions, visualize stock movements, and export CSV reports.
- **Authentication:** Access protected API endpoints using authentication.

## Technology Stack

**Frontend**
- React.js
- Vite
- Axios
- Recharts
- Lucide React
- CSS

**Backend**
- Python
- Django
- Django REST Framework
- Django REST Framework Simple JWT (if configured)

**Database**
- MySQL

**Tools**
- Visual Studio Code
- Git and GitHub
- Postman

## Project Structure

```text
InventoryManagementSystem/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── ...
├── .gitignore
└── README.md
```



## Testing

- Test product creation, updating, searching, and deletion.
- Verify stock-in and stock-out transactions.
- Confirm that insufficient stock is rejected.
- Check dashboard totals and low-stock alerts.
- Test transaction notes, filters, CSV exports, and report printing.


## Author

Developed as a full-stack inventory management project using React, Django REST Framework, and MySQL.
