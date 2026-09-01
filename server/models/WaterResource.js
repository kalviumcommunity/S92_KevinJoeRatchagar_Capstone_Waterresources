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
}, {
    timestamps: true,
});

module.exports = mongoose.model("WaterResource", waterResourceSchema);