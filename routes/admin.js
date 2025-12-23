const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const Announcement = require('../models/Announcement');
const Settings = require('../models/Settings');

// Admin authentication middleware
const verifyAdmin = (req, res, next) => {
  const { password } = req.body;
  console.log("Verifying admin with password:", password, process.env.ADMIN_PASSWORD);
  if (password !== process.env.ADMIN_PASSWORD && password !== 'admin@ericsson2024') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Get all proposals
router.post('/proposals', verifyAdmin, async (req, res) => {
  try {
    const proposals = await Proposal.find().sort({ submittedAt: -1 });
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching proposals', error: error.message });
  }
});

// Update proposal status
router.post('/proposals/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ message: 'Error updating proposal status', error: error.message });
  }
});

// Select 15 teams
router.post('/select-teams', verifyAdmin, async (req, res) => {
  try {
    const { teamIds } = req.body;
    
    // Reset all to submitted first
    await Proposal.updateMany({}, { status: 'submitted' });
    
    // Select specified teams
    await Proposal.updateMany(
      { _id: { $in: teamIds.slice(0, 15) } },
      { status: 'selected' }
    );
    
    res.json({ message: 'Teams selected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error selecting teams', error: error.message });
  }
});

// Create announcement
router.post('/announcements', verifyAdmin, async (req, res) => {
  try {
    const announcement = new Announcement(req.body);
    await announcement.save();
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Error creating announcement', error: error.message });
  }
});

// Update deadline
router.post('/deadline', verifyAdmin, async (req, res) => {
  try {
    const { deadline } = req.body;
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({ submissionDeadline: deadline });
    } else {
      settings.submissionDeadline = deadline;
    }
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error updating deadline', error: error.message });
  }
});

// Get settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
});

module.exports = router;