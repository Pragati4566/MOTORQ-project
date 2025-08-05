# MOTORQ-project
# Connected Car Fleet Management System

This project is a basic implementation of a Connected Car Fleet Management System, where vehicle data is tracked and analyzed in real-time. It was developed as part of a hackathon challenge provided by Motorq.

## Problem Statement

The system is designed to manage a fleet of connected vehicles (Tesla, BMW, Ford, etc.), process real-time telemetry data (GPS, speed, fuel, etc.), and provide useful analytics and alerts based on that data.

## Features

### 1. Vehicle Fleet Management
- Add, delete, view, and search vehicles
- Each vehicle contains VIN, model, manufacturer, fleet ID, owner info, and registration status

### 2. Telemetry Data Ingestion
- Vehicles send telemetry data every 30 seconds
- Includes GPS location, speed, fuel level, odometer, engine status, and diagnostic codes

### 3. Alert System
- Generates alerts for:
  - Over-speeding
  - Low fuel/battery levels
- Alerts are stored and can be queried

### 4. Fleet Analytics
- Counts of active vs inactive vehicles (based on last 24-hour data)
- Average fuel/battery level across fleet
- Total distance traveled by the fleet in the last 24 hours
- Alert summary categorized by type and severity

## Tech Stack

- Backend: Python, FastAPI
- Data Storage: In-Memory using Python data structures
- API Testing: Postman or Swagger UI

> Note: The current version uses in-memory storage for simplicity. It can later be extended with a proper database like MongoDB or PostgreSQL.

## Project Structure

