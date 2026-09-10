const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const WaterResource = require("./models/WaterResource");

const app = express();

app.use(express.json());

// POST API - Create a new water resource
app.post("/api/water-resources", async(req, res) => {
    try {
        const { name, type, location, description } = req.body;

        const waterResource = new WaterResource({
            name,
            type,
            location,
            description,
        });

        const savedResource = await waterResource.save();

        res.status(201).json(savedResource);
    } catch (error) {
        res.status(400).json({
            message: "Failed to create water resource",
            error: error.message,
        });
    }
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(5000, () => {
            console.log("Server running on port 5000");
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });