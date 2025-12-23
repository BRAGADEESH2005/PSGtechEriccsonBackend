const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  submissionDeadline: {
    type: Date,
    required: true
  },
  adminPassword: {
    type: String,
    required: true,
    default: 'admin@ericsson2024'
  }
});

module.exports = mongoose.model('Settings', SettingsSchema);