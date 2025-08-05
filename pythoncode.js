const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 3000;

app.use(express.json());

let vehicles = [];
let alerts = [];

app.post('/vehicles', (req, res) => {
    const { vehicleNumber, model, year } = req.body;
    const newVehicle = { id: uuidv4(), vehicleNumber, model, year, telemetry: [] };
    vehicles.push(newVehicle);
    res.status(201).json(newVehicle);
});

app.get('/vehicles', (req, res) => {
    res.json(vehicles);
});

app.get('/vehicles/:id', (req, res) => {
    const vehicle = vehicles.find(v => v.id === req.params.id);
    vehicle ? res.json(vehicle) : res.status(404).json({ error: 'Vehicle not found' });
});

app.post('/vehicles/:id/telemetry', (req, res) => {
    const { speed, fuelLevel, engineTemp } = req.body;
    const vehicle = vehicles.find(v => v.id === req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const data = { timestamp: Date.now(), speed, fuelLevel, engineTemp };
    vehicle.telemetry.push(data);

    if (speed > 120 || fuelLevel < 15 || engineTemp > 110) {
        alerts.push({ vehicleId: vehicle.id, timestamp: Date.now(), speed, fuelLevel, engineTemp });
    }

    res.status(200).json({ message: 'Telemetry recorded' });
});

app.get('/alerts', (req, res) => {
    res.json(alerts);
});

app.get('/fleet', (req, res) => {
    const summary = vehicles.map(v => ({
        id: v.id,
        vehicleNumber: v.vehicleNumber,
        telemetryCount: v.telemetry.length
    }));
    res.json(summary);
});

app.delete('/vehicles/:id', (req, res) => {
    const index = vehicles.findIndex(v => v.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Vehicle not found' });
    vehicles.splice(index, 1);
    res.status(204).send();
});

app.listen(port, () => {
    console.log(`Fleet Management API running at http://localhost:${port}`);
});