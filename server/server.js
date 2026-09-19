const dns = require("dns");

// Fix MongoDB Atlas SRV DNS resolution in Node.js
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const WaterResource = require("./models/WaterResource");

const app = express();

app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
    res.json({ message: "Water Resources API is running" });
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        database: mongoose.connection.readyState === 1 ?
            "connected" : "disconnected",
    });
});

// Create water resource
app.post("/api/water-resources", async(req, res) => {
    try {
        const resource = await WaterResource.create(req.body);

        res.status(201).json(resource);
    } catch (err) {
        res.status(400).json({
            message: err.message,
        });
    }
});

// Get all water resources
app.get("/api/water-resources", async(req, res) => {
    try {
        const resources = await WaterResource.find();

        res.json(resources);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
});

// Delete water resource
app.delete("/api/water-resources/:id", async(req, res) => {
    try {
        const resource = await WaterResource.findByIdAndDelete(
            req.params.id
        );

        if (!resource) {
            return res.status(404).json({
                message: "Water resource not found",
            });
        }

        res.status(204).send();
    } catch (err) {
        res.status(400).json({
            message: "Invalid water resource id",
        });
    }
});

const PORT = process.env.PORT || 5000;

// Start server
async function startServer() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not configured");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    return app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// Start only when this file is executed directly
if (require.main === module) {
    startServer().catch((err) => {
        console.error("MongoDB connection error:", err.message);
        process.exitCode = 1;
    });
}

module.exports = {
    app,
    startServer,
};