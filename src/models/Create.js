const { Schema, model } = require('mongoose');

const createSchema = new Schema({
  guildId: {
    type: String,
    required: true,
  },
    teamName: {
    type: String,
    required: true,
  },
  captainId: {
    type: String,
    required: true,
  },
  playerTwoId: {
    type: String,
    required: true,
  },
  playerThreeId: {
    type: String,
    required: true,
  },
});

module.exports = model('Create', createSchema);