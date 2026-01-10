-- Database initialization script
CREATE DATABASE IF NOT EXISTS news_digest;
\c news_digest;

-- Create tables if they don't exist
-- This will be handled by the backend's ORM (SQLAlchemy) on startup