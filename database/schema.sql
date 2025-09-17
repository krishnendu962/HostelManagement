-- Hostel Room Allocation and Maintenance Tracker Database Schema
-- Execute these statements in order in pgAdmin

-- 1. Create Users table first (no dependencies)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Student', 'Warden', 'SuperAdmin')),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 2. Create Hostels table (depends on Users for warden_id)
CREATE TABLE hostels (
    hostel_id SERIAL PRIMARY KEY,
    hostel_name VARCHAR(255) NOT NULL,
    hostel_type VARCHAR(10) NOT NULL CHECK (hostel_type IN ('Boys', 'Girls')),
    warden_id INTEGER REFERENCES users(user_id),
    total_rooms INTEGER CHECK (total_rooms >= 0),
    location VARCHAR(255)
);

-- 3. Create Students table (depends on Users)
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id),
    name VARCHAR(255) NOT NULL,
    reg_no VARCHAR(50) NOT NULL UNIQUE,
    year_of_study INTEGER NOT NULL CHECK (year_of_study >= 1 AND year_of_study <= 5),
    department VARCHAR(100),
    keam_rank INTEGER,
    distance_category VARCHAR(20) CHECK (distance_category IN ('<25km', '25-50km', '>50km')),
    category VARCHAR(20) CHECK (category IN ('General', 'OBC', 'SC', 'ST', 'Other')),
    sgpa DECIMAL(3,2) CHECK (sgpa >= 0 AND sgpa <= 10),
    backlogs INTEGER DEFAULT 0 CHECK (backlogs >= 0)
);

-- 4. Create Rooms table (depends on Hostels)
CREATE TABLE rooms (
    room_id SERIAL PRIMARY KEY,
    hostel_id INTEGER REFERENCES hostels(hostel_id),
    room_no VARCHAR(10) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    status VARCHAR(20) DEFAULT 'Vacant' CHECK (status IN ('Vacant', 'Occupied', 'Under Maintenance'))
);

-- 5. Create Room Allotments table (depends on Students and Rooms)
CREATE TABLE room_allotments (
    allotment_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(student_id),
    room_id INTEGER REFERENCES rooms(room_id),
    allotment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Active', 'Vacated', 'Pending')),
    vacated_date DATE
);

-- 6. Create Maintenance Requests table (depends on Students and Rooms)
CREATE TABLE maintenance_requests (
    request_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(student_id),
    room_id INTEGER REFERENCES rooms(room_id),
    category VARCHAR(20) CHECK (category IN ('Electricity', 'Plumbing', 'Cleaning', 'Other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    assigned_to VARCHAR(255),
    priority VARCHAR(10) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Notifications table (depends on Users)
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(user_id),
    receiver_role VARCHAR(20) CHECK (receiver_role IN ('Student', 'Warden', 'All')),
    receiver_id INTEGER REFERENCES users(user_id),
    title VARCHAR(255),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_reg_no ON students(reg_no);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_rooms_hostel_id ON rooms(hostel_id);
CREATE INDEX idx_room_allotments_student_id ON room_allotments(student_id);
CREATE INDEX idx_room_allotments_room_id ON room_allotments(room_id);
CREATE INDEX idx_maintenance_requests_student_id ON maintenance_requests(student_id);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_notifications_receiver_id ON notifications(receiver_id);