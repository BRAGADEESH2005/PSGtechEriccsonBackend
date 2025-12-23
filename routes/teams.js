const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');

// Get selected teams
router.get('/selected', async (req, res) => {
  try {
    const selectedTeams = await Proposal.find({ status: 'selected' })
      .select('teamName projectTitle projectLogo students')
      .limit(15);
    res.json(selectedTeams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching selected teams', error: error.message });
  }
});

module.exports = router;