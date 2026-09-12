const express = require("express");
const mongoose = require("mongoose");
const dns = require("dns");

require("dotenv").config();

const bcrypt = require("bcryptjs");

const WaterResource = require("./models/WaterResource");
const Farmer = require("./models/Farmer");
const User = require("./models/User");

const app = express();

app.use(express.json());

// ===============================
// DNS
// ===============================

dns.setServers(["8.8.8.8", "1.1.1.1"]);

// ===============================
// AUTHENTICATION
// ===============================

// Register API
app.post("/api/auth/register", async(req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
        });

        const savedUser = await user.save();

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
            },
        });
    } catch (error) {
        console.error("REGISTER ERROR:", error.message);

        res.status(500).json({
            message: "Registration failed",
            error: error.message,
        });
    }
});

// Login API
app.post("/api/auth/login", async(req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error.message);

        res.status(500).json({
            message: "Login failed",
            error: error.message,
        });
    }
});

// ===============================
// WATER RESOURCE - POST
// ===============================

app.post("/api/water-resources", async(req, res) => {
    try {
        const {
            name,
            type,
            location,
            description,
            farmer,
        } = req.body;

        console.log("========== POST DEBUG ==========");
        console.log(
            "Database:",
            mongoose.connection.db.databaseName
        );
        console.log(
            "Host:",
            mongoose.connection.host
        );
        console.log(
            "Collection:",
            WaterResource.collection.name
        );
        console.log(
            "Farmer ID received:",
            farmer
        );

        const waterResource = new WaterResource({
            name,
            type,
            location,
            description,
            farmer,
        });

        const savedResource = await waterResource.save();

        console.log(
            "Saved ID:",
            savedResource._id
        );

        const countAfterSave =
            await WaterResource.countDocuments();

        console.log(
            "WaterResource count after save:",
            countAfterSave
        );

        console.log("================================");

        res.status(201).json(savedResource);
    } catch (error) {
        console.error(
            "POST ERROR:",
            error.message
        );

        res.status(400).json({
            message: "Failed to create water resource",
            error: error.message,
        });
    }
});

// ===============================
// WATER RESOURCE - GET ALL
// ===============================

app.get("/api/water-resources", async(req, res) => {
    try {
        const resources = await WaterResource.find()
            .populate("farmer");

        res.json({
            value: resources,
            Count: resources.length,
        });
    } catch (error) {
        console.error(
            "GET ERROR:",
            error.message
        );

        res.status(500).json({
            message: "Failed to fetch water resources",
            error: error.message,
        });
    }
});

// ===============================
// WATER RESOURCE - PUT
// ===============================

app.put("/api/water-resources/:id", async(req, res) => {
    try {
        const {
            name,
            type,
            location,
            description,
            farmer,
        } = req.body;

        const updatedResource =
            await WaterResource.findByIdAndUpdate(
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

        res.json(updatedResource);
    } catch (error) {
        console.error(
            "PUT ERROR:",
            error.message
        );

        res.status(400).json({
            message: "Failed to update water resource",
            error: error.message,
        });
    }
});

// ===============================
// WATER RESOURCE - DELETE
// ===============================

app.delete("/api/water-resources/:id", async(req, res) => {
    try {
        const deletedResource =
            await WaterResource.findByIdAndDelete(
                req.params.id
            );

        if (!deletedResource) {
            return res.status(404).json({
                message: "Water resource not found",
            });
        }

        res.json({
            message: "Water resource deleted successfully",
            deletedResource,
        });
    } catch (error) {
        console.error(
            "DELETE ERROR:",
            error.message
        );

        res.status(400).json({
            message: "Failed to delete water resource",
            error: error.message,
        });
    }
});

// ===============================
// MONGODB CONNECTION
// ===============================

mongoose
    .connect(process.env.MONGO_URI)
    .then(async() => {
        console.log("MongoDB connected successfully");

        console.log(
            "Connected database:",
            mongoose.connection.db.databaseName
        );

        console.log(
            "Connected host:",
            mongoose.connection.host
        );

        console.log(
            "WaterResource collection:",
            WaterResource.collection.name
        );

        const count =
            await WaterResource.countDocuments();

        console.log(
            "WaterResource document count:",
            count
        );

        app.listen(5000, () => {
            console.log(
                "Server running on port 5000"
            );
        });
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:",
            error.message
        );
    });