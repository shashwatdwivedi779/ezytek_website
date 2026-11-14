const mongoose = require('mongoose');

const workProofSchema = new mongoose.Schema({
    youtubeUrl:  { type: String, required: true, trim: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    isActive:    { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('WorkProof', workProofSchema);

