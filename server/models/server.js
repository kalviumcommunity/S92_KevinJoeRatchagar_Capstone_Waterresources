const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const WaterResource = require("./WaterResource");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err));

app.get("/", (req, res) => {
    res.json({ message: "Water Resources API is running" });
});

app.post("/api/water-resources", async(req, res) => {
    try {
        const resource = await WaterResource.create(req.body);
        res.status(201).json(resource);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get("/api/water-resources", async(req, res) => {
    try {
        const resources = await WaterResource.find();
        res.json(resources);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});