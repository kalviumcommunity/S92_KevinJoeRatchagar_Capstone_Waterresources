const express = require("express");
const mongoose = require("mongoose");
const dns = require("dns");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

// =====================================================
// LOAD ENVIRONMENT VARIABLES FIRST
// =====================================================

require("dotenv").config({
    path: path.join(__dirname, ".env"),
});

// IMPORTANT:
// Passport must be loaded AFTER dotenv
const passport = require("./config/passport");

// =====================================================
// MODELS
// =====================================================

const WaterResource = require("./models/WaterResource");
const Farmer = require("./models/Farmer");
const User = require("./models/User");

// =====================================================
// EXPRESS APP
// =====================================================

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());

// Initialize Passport
app.use(passport.initialize());

// =====================================================
// DNS
// =====================================================

dns.setServers(["8.8.8.8", "1.1.1.1"]);

// =====================================================
// HOME ROUTE
// =====================================================

app.get("/", (req, res) => {
    res.json({
        message: "AquaShare API is running",
    });
});

// =====================================================
// JWT AUTHENTICATION MIDDLEWARE
// =====================================================

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Authorization header missing",
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Token missing",
        });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (err, user) => {
            if (err) {
                return res.status(403).json({
                    message: "Invalid or expired token",
                });
            }

            req.user = user;
            next();
        }
    );
}

// =====================================================
// LOCAL REGISTER
// =====================================================

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

        const existingUser = await User.findOne({
            email,
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            authProvider: "local",
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                authProvider: user.authProvider,
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

// =====================================================
// LOCAL LOGIN
// =====================================================

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

        const user = await User.findOne({
            email,
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        // Google users may not have a password
        if (!user.password) {
            return res.status(400).json({
                message: "This account uses Google login. Please continue with Google.",
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
                id: user._id,
                email: user.email,
                name: user.name,
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
                profileImage: user.profileImage,
                authProvider: user.authProvider,
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

// =====================================================
// GOOGLE OAUTH
// =====================================================

// Start Google authentication
app.get(
    "/api/auth/google",
    passport.authenticate("google", {
        scope: [
            "profile",
            "email",
        ],
    })
);

// Google callback
app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: "/api/auth/google/failure",
    }),
    (req, res) => {
        try {
            const user = req.user;

            const token = jwt.sign({
                    id: user._id,
                    email: user.email,
                    name: user.name,
                },
                process.env.JWT_SECRET, {
                    expiresIn: "1d",
                }
            );

            res.json({
                message: "Google authentication successful",

                token,

                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    profileImage: user.profileImage,
                    authProvider: user.authProvider,
                },
            });
        } catch (error) {
            console.error(
                "Google callback error:",
                error
            );

            res.status(500).json({
                message: "Google authentication failed",
                error: error.message,
            });
        }
    }
);

// Google authentication failure
app.get(
    "/api/auth/google/failure",
    (req, res) => {
        res.status(401).json({
            message: "Google authentication failed",
        });
    }
);

// =====================================================
// FARMER API
// =====================================================

// CREATE FARMER
app.post(
    "/api/farmers",
    async(req, res) => {
        try {
            const farmer =
                await Farmer.create(
                    req.body
                );

            res.status(201).json(
                farmer
            );
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
    }
);

// GET FARMERS
app.get(
    "/api/farmers",
    async(req, res) => {
        try {
            const farmers =
                await Farmer.find();

            res.json(farmers);
        } catch (error) {
            console.error(
                "Get farmers error:",
                error
            );

            res.status(500).json({
                message: "Failed to get farmers",
                error: error.message,
            });
        }
    }
);

// =====================================================
// WATER RESOURCE API
// =====================================================

// CREATE WATER RESOURCE
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
                !location
            ) {
                return res.status(400).json({
                    message: "Name, type and location are required",
                });
            }

            const waterResource =
                await WaterResource.create({
                    name,
                    type,
                    location,
                    description,
                    farmer,
                });

            res.status(201).json({
                message: "Water resource created successfully",
                waterResource,
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

// GET WATER RESOURCES
app.get(
    "/api/water-resources",
    async(req, res) => {
        try {
            const resources =
                await WaterResource.find()
                .populate("farmer");

            res.json(resources);
        } catch (error) {
            console.error(
                "Get water resources error:",
                error
            );

            res.status(500).json({
                message: "Failed to get water resources",
                error: error.message,
            });
        }
    }
);

// UPDATE WATER RESOURCE
app.put(
    "/api/water-resources/:id",
    authenticateToken,
    async(req, res) => {
        try {
            const resource =
                await WaterResource.findByIdAndUpdate(
                    req.params.id,
                    req.body, {
                        new: true,
                        runValidators: true,
                    }
                );

            if (!resource) {
                return res.status(404).json({
                    message: "Water resource not found",
                });
            }

            res.json({
                message: "Water resource updated successfully",
                resource,
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

// DELETE WATER RESOURCE
app.delete(
    "/api/water-resources/:id",
    authenticateToken,
    async(req, res) => {
        try {
            const resource =
                await WaterResource.findByIdAndDelete(
                    req.params.id
                );

            if (!resource) {
                return res.status(404).json({
                    message: "Water resource not found",
                });
            }

            res.json({
                message: "Water resource deleted successfully",
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

// =====================================================
// MONGODB CONNECTION
// =====================================================

mongoose
    .connect(process.env.MONGODB_URI)
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
            "MongoDB connection error:",
            error
        );
    });