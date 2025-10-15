const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    brawlTag: { type: String, required: true, unique: true },
    linkedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Link', LinkSchema);
