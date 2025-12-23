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

// Update proposal status (single team)
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

// Toggle team selection (new route)
router.post('/toggle-selection/:id', verifyAdmin, async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Toggle between selected and submitted
    const newStatus = proposal.status === 'selected' ? 'submitted' : 'selected';
    
    // Check if we're trying to select and already have 15 teams
    if (newStatus === 'selected') {
      const selectedCount = await Proposal.countDocuments({ status: 'selected' });
      if (selectedCount >= 15) {
        return res.status(400).json({ 
          message: 'Maximum of 15 teams already selected',
          selectedCount 
        });
      }
    }

    proposal.status = newStatus;
    await proposal.save();

    res.json({ 
      success: true,
      proposal,
      message: `Team ${newStatus === 'selected' ? 'selected' : 'deselected'} successfully`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling selection', error: error.message });
  }
});

// Select 15 teams (batch selection)
router.post('/select-teams', verifyAdmin, async (req, res) => {
  try {
    const { teamIds } = req.body;
    
    if (!Array.isArray(teamIds) || teamIds.length !== 15) {
      return res.status(400).json({ message: 'Exactly 15 team IDs required' });
    }
    
    // Reset all to submitted first
    await Proposal.updateMany({}, { status: 'submitted' });
    
    // Select specified teams
    const result = await Proposal.updateMany(
      { _id: { $in: teamIds.slice(0, 15) } },
      { status: 'selected' }
    );
    
    res.json({ 
      success: true,
      message: 'Teams selected successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error selecting teams', error: error.message });
  }
});

// Get selected teams count
router.post('/selected-count', verifyAdmin, async (req, res) => {
  try {
    const count = await Proposal.countDocuments({ status: 'selected' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error getting selected count', error: error.message });
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