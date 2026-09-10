const mongoose = require("mongoose");

const waterResourceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },

    // Relationship: WaterResource belongs to a Farmer
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Farmer",
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("WaterResource", waterResourceSchema);