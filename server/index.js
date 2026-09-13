const express = require("express");
const mongoose = require("mongoose");
const dns = require("dns");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env"),
});

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
// JWT AUTHENTICATION MIDDLEWARE
// ===============================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    const token =
        authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Access token required",
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired token",
        });
    }
};

// ===============================
// REGISTER API
// ===============================

app.post("/api/auth/register", async(req, res) => {
    try {
        const {
            name,
            email,
            password,
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }

        const existingUser =
            await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
        });

        await user.save();

        res.status(201).json({
            message: "User registered successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error(
            "Registration error:",
            error
        );

        res.status(500).json({
            message: "Registration failed",
            error: error.message,
        });
    }
});

// ===============================
// LOGIN API
// ===============================

app.post("/api/auth/login", async(req, res) => {
    try {
        const {
            email,
            password,
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const user =
            await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign({
                userId: user._id,
                name: user.name,
                email: user.email,
            },
            process.env.JWT_SECRET, {
                expiresIn: "1d",
            }
        );

        res.json({
            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error(
            "Login error:",
            error
        );

        res.status(500).json({
            message: "Login failed",
            error: error.message,
        });
    }
});

// ===============================
// CREATE FARMER
// ===============================

app.post("/api/farmers", async(req, res) => {
    try {
        const {
            name,
            email,
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                message: "Name and email are required",
            });
        }

        const existingFarmer =
            await Farmer.findOne({ email });

        if (existingFarmer) {
            return res.status(400).json({
                message: "Farmer already exists",
            });
        }

        const farmer = new Farmer({
            name,
            email,
        });

        const savedFarmer =
            await farmer.save();

        res.status(201).json({
            message: "Farmer created successfully",

            value: savedFarmer,
        });
    } catch (error) {
        console.error(
            "Create farmer error:",
            error
        );

        res.status(500).json({
            message: "Failed to create farmer",

            error: error.message,
        });
    }
});

// ===============================
// GET ALL FARMERS
// ===============================

app.get("/api/farmers", async(req, res) => {
    try {
        const farmers =
            await Farmer.find();

        res.json({
            value: farmers,
            Count: farmers.length,
        });
    } catch (error) {
        console.error(
            "Get farmers error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch farmers",

            error: error.message,
        });
    }
});

// ===============================
// CREATE WATER RESOURCE
// JWT PROTECTED
// ===============================

app.post(
    "/api/water-resources",
    authenticateToken,
    async(req, res) => {
        try {
            const {
                name,
                type,
                location,
                description,
                farmer,
            } = req.body;

            if (!name ||
                !type ||
                !location ||
                !farmer
            ) {
                return res.status(400).json({
                    message: "Name, type, location and farmer are required",
                });
            }

            const waterResource =
                new WaterResource({
                    name,
                    type,
                    location,
                    description,
                    farmer,
                });

            const savedResource =
                await waterResource.save();

            res.status(201).json({
                message: "Water resource created successfully",

                value: savedResource,
            });
        } catch (error) {
            console.error(
                "Create water resource error:",
                error
            );

            res.status(500).json({
                message: "Failed to create water resource",

                error: error.message,
            });
        }
    }
);

// ===============================
// GET ALL WATER RESOURCES
// ===============================

app.get(
    "/api/water-resources",
    async(req, res) => {
        try {
            const resources =
                await WaterResource.find()
                .populate("farmer");

            res.json({
                value: resources,
                Count: resources.length,
            });
        } catch (error) {
            console.error(
                "Get water resources error:",
                error
            );

            res.status(500).json({
                message: "Failed to fetch water resources",

                error: error.message,
            });
        }
    }
);

// ===============================
// UPDATE WATER RESOURCE
// ===============================

app.put(
    "/api/water-resources/:id",
    async(req, res) => {
        try {
            const updatedResource =
                await WaterResource.findByIdAndUpdate(
                    req.params.id,
                    req.body, {
                        new: true,
                        runValidators: true,
                    }
                );

            if (!updatedResource) {
                return res.status(404).json({
                    message: "Water resource not found",
                });
            }

            res.json({
                message: "Water resource updated successfully",

                value: updatedResource,
            });
        } catch (error) {
            console.error(
                "Update water resource error:",
                error
            );

            res.status(500).json({
                message: "Failed to update water resource",

                error: error.message,
            });
        }
    }
);

// ===============================
// DELETE WATER RESOURCE
// ===============================

app.delete(
    "/api/water-resources/:id",
    async(req, res) => {
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

                value: deletedResource,
            });
        } catch (error) {
            console.error(
                "Delete water resource error:",
                error
            );

            res.status(500).json({
                message: "Failed to delete water resource",

                error: error.message,
            });
        }
    }
);

// ===============================
// MONGODB CONNECTION
// ===============================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log(
            "MongoDB connected successfully"
        );

        app.listen(5000, () => {
            console.log(
                "Server running on http://localhost:5000"
            );
        });
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:",
            error.message
        );
    });