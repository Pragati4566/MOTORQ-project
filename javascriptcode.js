// Fleet Management System - Phase 1 Core Implementation
// Save this file as: app.js
// 
// Setup Instructions:
// 1. npm init -y
// 2. npm install express uuid
// 3. node app.js
// 4. Server runs on http://localhost:3000

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// In-memory data storage
const vehicles = new Map();
const telemetryData = new Map(); // VIN -> Array of telemetry records
const alerts = new Map();

// Vehicle class definition
class Vehicle {
    constructor(vin, manufacturer, model, fleetId, owner, registrationStatus = 'Active') {
        this.vin = vin;
        this.manufacturer = manufacturer;
        this.model = model;
        this.fleetId = fleetId;
        this.owner = owner;
        this.registrationStatus = registrationStatus;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    update(updates) {
        Object.keys(updates).forEach(key => {
            if (key !== 'vin' && this.hasOwnProperty(key)) {
                this[key] = updates[key];
            }
        });
        this.updatedAt = new Date();
    }
}

// Telemetry data class
class TelemetryRecord {
    constructor(vin, speed, fuelLevel, batteryLevel, location, engineStatus) {
        this.id = uuidv4();
        this.vin = vin;
        this.speed = speed;
        this.fuelLevel = fuelLevel;
        this.batteryLevel = batteryLevel;
        this.location = location;
        this.engineStatus = engineStatus;
        this.timestamp = new Date();
    }
}

// Alert class
class Alert {
    constructor(vin, type, message, severity = 'Medium') {
        this.id = uuidv4();
        this.vin = vin;
        this.type = type;
        this.message = message;
        this.severity = severity;
        this.timestamp = new Date();
        this.status = 'Active';
    }
}

// Alert generation logic
function generateAlerts(telemetry) {
    const alertsGenerated = [];
    
    // Speed violation check (assuming speed limit of 80 km/h)
    if (telemetry.speed > 80) {
        const alert = new Alert(
            telemetry.vin,
            'SPEED_VIOLATION',
            `Vehicle ${telemetry.vin} exceeded speed limit: ${telemetry.speed} km/h`,
            'High'
        );
        alerts.set(alert.id, alert);
        alertsGenerated.push(alert);
    }
    
    // Low fuel check (below 15%)
    if (telemetry.fuelLevel !== null && telemetry.fuelLevel < 15) {
        const alert = new Alert(
            telemetry.vin,
            'LOW_FUEL',
            `Vehicle ${telemetry.vin} has low fuel: ${telemetry.fuelLevel}%`,
            'Medium'
        );
        alerts.set(alert.id, alert);
        alertsGenerated.push(alert);
    }
    
    // Low battery check (below 15%)
    if (telemetry.batteryLevel !== null && telemetry.batteryLevel < 15) {
        const alert = new Alert(
            telemetry.vin,
            'LOW_BATTERY',
            `Vehicle ${telemetry.vin} has low battery: ${telemetry.batteryLevel}%`,
            'Medium'
        );
        alerts.set(alert.id, alert);
        alertsGenerated.push(alert);
    }
    
    return alertsGenerated;
}

// Validation helpers
function validateVIN(vin) {
    return vin && typeof vin === 'string' && vin.length === 17;
}

function validateVehicleData(data) {
    const errors = [];
    
    if (!validateVIN(data.vin)) {
        errors.push('VIN must be a 17-character string');
    }
    
    if (!data.manufacturer || typeof data.manufacturer !== 'string') {
        errors.push('Manufacturer is required and must be a string');
    }
    
    if (!data.model || typeof data.model !== 'string') {
        errors.push('Model is required and must be a string');
    }
    
    if (!data.fleetId || typeof data.fleetId !== 'string') {
        errors.push('Fleet ID is required and must be a string');
    }
    
    if (!data.owner || typeof data.owner !== 'string') {
        errors.push('Owner is required and must be a string');
    }
    
    if (data.registrationStatus && !['Active', 'Maintenance', 'Decommissioned'].includes(data.registrationStatus)) {
        errors.push('Registration status must be Active, Maintenance, or Decommissioned');
    }
    
    return errors;
}

// API Routes

// Vehicle Management Routes

// Create vehicle
app.post('/api/vehicles', (req, res) => {
    try {
        const validationErrors = validateVehicleData(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                errors: validationErrors
            });
        }
        
        if (vehicles.has(req.body.vin)) {
            return res.status(409).json({
                success: false,
                message: 'Vehicle with this VIN already exists'
            });
        }
        
        const vehicle = new Vehicle(
            req.body.vin,
            req.body.manufacturer,
            req.body.model,
            req.body.fleetId,
            req.body.owner,
            req.body.registrationStatus
        );
        
        vehicles.set(vehicle.vin, vehicle);
        telemetryData.set(vehicle.vin, []);
        
        res.status(201).json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// List all vehicles with optional filtering
app.get('/api/vehicles', (req, res) => {
    try {
        let vehicleList = Array.from(vehicles.values());
        
        // Apply filters
        const { manufacturer, fleetId, registrationStatus } = req.query;
        
        if (manufacturer) {
            vehicleList = vehicleList.filter(v => 
                v.manufacturer.toLowerCase() === manufacturer.toLowerCase()
            );
        }
        
        if (fleetId) {
            vehicleList = vehicleList.filter(v => v.fleetId === fleetId);
        }
        
        if (registrationStatus) {
            vehicleList = vehicleList.filter(v => v.registrationStatus === registrationStatus);
        }
        
        // Summary statistics
        const summary = {
            total: vehicleList.length,
            byManufacturer: {},
            byFleet: {},
            byStatus: {}
        };
        
        vehicleList.forEach(v => {
            summary.byManufacturer[v.manufacturer] = (summary.byManufacturer[v.manufacturer] || 0) + 1;
            summary.byFleet[v.fleetId] = (summary.byFleet[v.fleetId] || 0) + 1;
            summary.byStatus[v.registrationStatus] = (summary.byStatus[v.registrationStatus] || 0) + 1;
        });
        
        res.json({
            success: true,
            data: vehicleList,
            summary: summary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get specific vehicle
app.get('/api/vehicles/:vin', (req, res) => {
    try {
        const vehicle = vehicles.get(req.params.vin);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }
        
        res.json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Update vehicle
app.put('/api/vehicles/:vin', (req, res) => {
    try {
        const vehicle = vehicles.get(req.params.vin);
        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }
        
        // Validate update data (excluding VIN)
        const updateData = { ...req.body };
        delete updateData.vin;
        
        vehicle.update(updateData);
        
        res.json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Delete vehicle
app.delete('/api/vehicles/:vin', (req, res) => {
    try {
        if (!vehicles.has(req.params.vin)) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }
        
        vehicles.delete(req.params.vin);
        telemetryData.delete(req.params.vin);
        
        res.json({
            success: true,
            message: 'Vehicle deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Telemetry Data Routes

// Receive telemetry data for a vehicle
app.post('/api/telemetry/:vin', (req, res) => {
    try {
        const vin = req.params.vin;
        
        if (!vehicles.has(vin)) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }
        
        const { speed, fuelLevel, batteryLevel, location, engineStatus } = req.body;
        
        const telemetry = new TelemetryRecord(
            vin, speed, fuelLevel, batteryLevel, location, engineStatus
        );
        
        if (!telemetryData.has(vin)) {
            telemetryData.set(vin, []);
        }
        
        telemetryData.get(vin).push(telemetry);
        
        // Generate alerts based on telemetry
        const generatedAlerts = generateAlerts(telemetry);
        
        res.status(201).json({
            success: true,
            data: telemetry,
            alertsGenerated: generatedAlerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Receive telemetry data for multiple vehicles
app.post('/api/telemetry/batch', (req, res) => {
    try {
        const telemetryRecords = req.body.records;
        if (!Array.isArray(telemetryRecords)) {
            return res.status(400).json({
                success: false,
                message: 'Records must be an array'
            });
        }
        
        const results = [];
        const allAlerts = [];
        
        telemetryRecords.forEach(record => {
            if (vehicles.has(record.vin)) {
                const telemetry = new TelemetryRecord(
                    record.vin, record.speed, record.fuelLevel, 
                    record.batteryLevel, record.location, record.engineStatus
                );
                
                if (!telemetryData.has(record.vin)) {
                    telemetryData.set(record.vin, []);
                }
                
                telemetryData.get(record.vin).push(telemetry);
                
                const generatedAlerts = generateAlerts(telemetry);
                allAlerts.push(...generatedAlerts);
                
                results.push({
                    vin: record.vin,
                    success: true,
                    telemetry: telemetry
                });
            } else {
                results.push({
                    vin: record.vin,
                    success: false,
                    message: 'Vehicle not found'
                });
            }
        });
        
        res.status(201).json({
            success: true,
            data: results,
            totalAlertsGenerated: allAlerts.length,
            alerts: allAlerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get telemetry history for a vehicle
app.get('/api/telemetry/:vin', (req, res) => {
    try {
        if (!vehicles.has(req.params.vin)) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }
        
        const vehicleTelemetry = telemetryData.get(req.params.vin) || [];
        const { limit, offset } = req.query;
        
        let result = vehicleTelemetry.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (offset) {
            result = result.slice(parseInt(offset));
        }
        
        if (limit) {
            result = result.slice(0, parseInt(limit));
        }
        
        res.json({
            success: true,
            data: result,
            total: vehicleTelemetry.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get latest telemetry for a vehicle
app.get('/api/telemetry/:vin/latest', (req, res) => {
    try {
        if (!vehicles.has(req.params.vin)) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }
        
        const vehicleTelemetry = telemetryData.get(req.params.vin) || [];
        const latest = vehicleTelemetry.length > 0 ? 
            vehicleTelemetry[vehicleTelemetry.length - 1] : null;
        
        if (!latest) {
            return res.status(404).json({
                success: false,
                message: 'No telemetry data found for this vehicle'
            });
        }
        
        res.json({
            success: true,
            data: latest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Alert Routes

// Get all alerts with optional filtering
app.get('/api/alerts', (req, res) => {
    try {
        let alertList = Array.from(alerts.values());
        
        const { vin, type, severity, status } = req.query;
        
        if (vin) {
            alertList = alertList.filter(a => a.vin === vin);
        }
        
        if (type) {
            alertList = alertList.filter(a => a.type === type);
        }
        
        if (severity) {
            alertList = alertList.filter(a => a.severity === severity);
        }
        
        if (status) {
            alertList = alertList.filter(a => a.status === status);
        }
        
        // Sort by timestamp (newest first)
        alertList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json({
            success: true,
            data: alertList,
            total: alertList.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get specific alert by ID
app.get('/api/alerts/:alertId', (req, res) => {
    try {
        const alert = alerts.get(req.params.alertId);
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }
        
        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Update alert status
app.put('/api/alerts/:alertId', (req, res) => {
    try {
        const alert = alerts.get(req.params.alertId);
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }
        
        if (req.body.status) {
            alert.status = req.body.status;
        }
        
        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Fleet Management System is running',
        timestamp: new Date(),
        stats: {
            totalVehicles: vehicles.size,
            totalAlerts: alerts.size,
            totalTelemetryRecords: Array.from(telemetryData.values()).reduce((sum, records) => sum + records.length, 0)
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Fleet Management System running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;

/*
===============================================================================
SETUP INSTRUCTIONS:
===============================================================================

1. Create a new directory for your project:
   mkdir fleet-management-system
   cd fleet-management-system

2. Initialize npm and install dependencies:
   npm init -y
   npm install express uuid

3. Save this code as app.js

4. Run the application:
   node app.js

5. Test with Postman or curl:
   GET http://localhost:3000/api/health

===============================================================================
API ENDPOINTS SUMMARY:
===============================================================================

VEHICLE MANAGEMENT:
- POST   /api/vehicles           - Create vehicle
- GET    /api/vehicles           - List vehicles (with filtering)
- GET    /api/vehicles/:vin      - Get specific vehicle
- PUT    /api/vehicles/:vin      - Update vehicle
- DELETE /api/vehicles/:vin      - Delete vehicle

TELEMETRY DATA:
- POST   /api/telemetry/:vin     - Submit telemetry for single vehicle
- POST   /api/telemetry/batch    - Submit batch telemetry
- GET    /api/telemetry/:vin     - Get telemetry history
- GET    /api/telemetry/:vin/latest - Get latest telemetry

ALERTS:
- GET    /api/alerts             - Get all alerts (with filtering)
- GET    /api/alerts/:alertId    - Get specific alert
- PUT    /api/alerts/:alertId    - Update alert status

SYSTEM:
- GET    /api/health             - Health check and stats

===============================================================================
SAMPLE TEST DATA:
===============================================================================

Sample Vehicle JSON:
{
  "vin": "1HGCM82633A123456",
  "manufacturer": "Tesla",
  "model": "Model S",
  "fleetId": "Corporate",
  "owner": "John Doe",
  "registrationStatus": "Active"
}

Sample Telemetry JSON:
{
  "speed": 65,
  "fuelLevel": 75,
  "batteryLevel": 85,
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "New York, NY"
  },
  "engineStatus": "Running"
}

===============================================================================
ALERT TRIGGERS:
===============================================================================

The system automatically generates alerts for:
- Speed violations: speed > 80 km/h (High severity)
- Low fuel: fuelLevel < 15% (Medium severity)
- Low battery: batteryLevel < 15% (Medium severity)
