const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Load environment variables from server/.env locally
require("dotenv").config({
    path: path.join(__dirname, ".env"),
});

// Import model
const WaterResource = require("./models/WaterResource");

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it does not exist
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded files
app.use("/uploads", express.static(uploadDir));

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );

        const uniqueName = `${Date.now()}-${safeName}`;

        cb(null, uniqueName);
    },
});

// Define upload middleware
const upload = multer({
    storage: storage,

    limits: {
        fileSize: 5 * 1024 * 1024, // Maximum 5 MB
    },
});

// Root endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        message: "AquaShare API is running",
    });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is healthy",
    });
});

// Upload endpoint
app.post("/api/upload", (req, res, next) => {
    upload.single("file")(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    message: "File upload error",
                    error: err.message,
                });
            }

            return res.status(400).json({
                message: "Unable to upload file",
                error: err.message,
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Please select a file to upload",
            });
        }

        return res.status(200).json({
            message: "File uploaded successfully",
            filename: req.file.filename,
            url: `/uploads/${req.file.filename}`,
        });
    });
});

// Create a water resource
app.post("/api/water-resources", async(req, res) => {
    try {
        const waterResource = new WaterResource(req.body);
        const savedResource = await waterResource.save();

        return res.status(201).json({
            message: "Water resource created successfully",
            data: savedResource,
        });
    } catch (error) {
        console.error("Create water resource error:", error);

        return res.status(400).json({
            message: "Failed to create water resource",
            error: error.message,
        });
    }
});

// Get all water resources
app.get("/api/water-resources", async(req, res) => {
    try {
        const resources = await WaterResource.find();

        return res.status(200).json({
            count: resources.length,
            data: resources,
        });
    } catch (error) {
        console.error("Fetch water resources error:", error);

        return res.status(500).json({
            message: "Failed to fetch water resources",
            error: error.message,
        });
    }
});

// Delete a water resource by ID
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

        return res.status(200).json({
            message: "Water resource deleted successfully",
            data: deletedResource,
        });
    } catch (error) {
        console.error("Delete water resource error:", error);

        return res.status(400).json({
            message: "Failed to delete water resource",
            error: error.message,
        });
    }
});

// Start server after connecting to MongoDB
async function startServer() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error(
                "MONGODB_URI is missing. Configure it in server/.env locally or in Render Environment Variables."
            );
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected");

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

// Start server when this file is executed directly
if (require.main === module) {
    startServer();
}

// Export app and startup function
module.exports = {
    app,
    startServer,
};