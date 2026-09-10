const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const WaterResource = require("./models/WaterResource");
const Farmer = require("./models/Farmer");

const app = express();

app.use(express.json());

// POST API - Create a new water resource
app.post("/api/water-resources", async(req, res) => {
    try {
        const { name, type, location, description, farmer } = req.body;

        const waterResource = new WaterResource({
            name,
            type,
            location,
            description,
            farmer,
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

// GET API - Get all water resources with farmer details
app.get("/api/water-resources", async(req, res) => {
    try {
        const resources = await WaterResource.find().populate("farmer");

        res.status(200).json(resources);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch water resources",
            error: error.message,
        });
    }
});

// PUT API - Update a water resource
app.put("/api/water-resources/:id", async(req, res) => {
    try {
        const { name, type, location, description, farmer } = req.body;

        const updatedResource = await WaterResource.findByIdAndUpdate(
            req.params.id, {
                name,
                type,
                location,
                description,
                farmer,
            }, {
                new: true,
                runValidators: true,
            }
        ).populate("farmer");

        if (!updatedResource) {
            return res.status(404).json({
                message: "Water resource not found",
            });
        }

        res.status(200).json(updatedResource);
    } catch (error) {
        res.status(400).json({
            message: "Failed to update water resource",
            error: error.message,
        });
    }
});

// DELETE API - Delete a water resource
app.delete("/api/water-resources/:id", async(req, res) => {
    try {
        const deletedResource = await WaterResource.findByIdAndDelete(
            req.params.id
        );

        if (!deletedResource) {
            return res.status(404).json({
                message: "Water resource not found",
            });
        }

        res.status(200).json({
            message: "Water resource deleted successfully",
            deletedResource,
        });
    } catch (error) {
        res.status(400).json({
            message: "Failed to delete water resource",
            error: error.message,
        });
    }
});

// MongoDB connection
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