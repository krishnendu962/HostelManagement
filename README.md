# Hostel Room Allocation and Maintenance Tracker

A comprehensive micro project for DBMS lab that manages hostel room allocation and maintenance requests for educational institutions.

## Features

- **User Management**: Students, Wardens, and Super Admins with role-based access
- **Room Allocation**: Intelligent room assignment based on student criteria
- **Maintenance Tracking**: Complete maintenance request lifecycle management
- **Notifications**: Real-time notifications for users
- **Reporting**: Various reports and analytics

## Technology Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Frontend**: HTML, CSS, JavaScript
- **Database Tool**: pgAdmin4

## Project Structure

```
MICROporject/
├── backend/
│   ├── models/          # Database models and operations
│   ├── routes/          # API endpoints
│   ├── app.py          # Main Flask application
│   └── config.py       # Configuration settings
├── frontend/
│   ├── templates/      # HTML templates
│   └── static/         # CSS, JS, images
├── database/
│   ├── schema.sql      # Database schema
│   ├── sample_data.sql # Test data
│   └── procedures.sql  # Stored procedures and triggers
└── docs/
    └── documentation files
```

## Setup Instructions

1. Ensure PostgreSQL is installed and running
2. Create a database named 'myprojectdb' (or use existing one)
3. Execute the schema.sql file in pgAdmin4
4. Navigate to backend folder: `cd backend`
5. Install Node.js dependencies: `npm install`
6. Copy .env.example to .env and configure your database credentials
7. Run the application: `npm run dev` (for development) or `npm start`

## Database Schema

The system uses 8 main tables:
- users (authentication and user info)
- hostels (hostel information)
- students (student details and criteria)
- rooms (room information)
- room_allotments (allocation tracking)
- maintenance_requests (maintenance management)
- notifications (system notifications)

## Author

Karthik - DBMS Lab Project