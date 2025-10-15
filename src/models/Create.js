const mongoose = require('mongoose');

const CreateSchema = new mongoose.Schema({
  guildId: String,
  teamName: String,
  captainId: String,
  playerTwoId: String,
  playerThreeId: String,

  // 🏆 Performance stats
  roundsWon: { type: Number, default: 0 },
  roundsLost: { type: Number, default: 0 },
  setsWon: { type: Number, default: 0 },
  setsLost: { type: Number, default: 0 },
  matchesWon: { type: Number, default: 0 },
  matchesLost: { type: Number, default: 0 },
});

module.exports = mongoose.model('Create', CreateSchema);
