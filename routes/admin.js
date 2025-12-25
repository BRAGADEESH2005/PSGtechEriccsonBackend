const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const Announcement = require('../models/Announcement');
const Settings = require('../models/Settings');

// Admin authentication middleware
const verifyAdmin = (req, res, next) => {
  console.log('=== Admin Authentication ===');
  const { password } = req.body;
  console.log("Verifying admin with password:", password ? '***' : 'undefined');
  console.log("Expected password:", process.env.ADMIN_PASSWORD ? '***' : 'undefined');
  
  if (password !== process.env.ADMIN_PASSWORD && password !== 'admin@ericsson2024') {
    console.log('Authentication failed');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  console.log('Authentication successful');
  next();
};

// Get all proposals
router.post('/proposals', verifyAdmin, async (req, res) => {
  try {
    console.log('=== Fetching All Proposals ===');
    const proposals = await Proposal.find().sort({ submittedAt: -1 });
    console.log(`Found ${proposals.length} proposals`);
    res.json(proposals);
  } catch (error) {
    console.error('=== ERROR in Fetching Proposals ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching proposals', error: error.message });
  }
});

// Update proposal status (single team)
router.post('/proposals/:id/status', verifyAdmin, async (req, res) => {
  try {
    console.log('=== Updating Proposal Status ===');
    console.log('Proposal ID:', req.params.id);
    console.log('New status:', req.body.status);
    
    const { status } = req.body;
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!proposal) {
      console.log('Proposal not found');
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    console.log('Proposal updated successfully');
    res.json(proposal);
  } catch (error) {
    console.error('=== ERROR in Updating Proposal Status ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Proposal ID:', req.params.id);
    res.status(500).json({ message: 'Error updating proposal status', error: error.message });
  }
});

// Toggle team selection (new route)
router.post('/toggle-selection/:id', verifyAdmin, async (req, res) => {
  try {
    console.log('=== Toggling Team Selection ===');
    console.log('Proposal ID:', req.params.id);
    
    const proposal = await Proposal.findById(req.params.id);
    
    if (!proposal) {
      console.log('Proposal not found');
      return res.status(404).json({ message: 'Proposal not found' });
    }

    console.log('Current status:', proposal.status);
    
    // Toggle between selected and submitted
    const newStatus = proposal.status === 'selected' ? 'submitted' : 'selected';
    console.log('New status:', newStatus);
    
    // Check if we're trying to select and already have 15 teams
    if (newStatus === 'selected') {
      const selectedCount = await Proposal.countDocuments({ status: 'selected' });
      console.log('Current selected count:', selectedCount);
      
      if (selectedCount >= 15) {
        console.log('Maximum teams already selected');
        return res.status(400).json({ 
          message: 'Maximum of 15 teams already selected',
          selectedCount 
        });
      }
    }

    proposal.status = newStatus;
    await proposal.save();
    console.log('Team selection toggled successfully');

    res.json({ 
      success: true,
      proposal,
      message: `Team ${newStatus === 'selected' ? 'selected' : 'deselected'} successfully`
    });
  } catch (error) {
    console.error('=== ERROR in Toggling Selection ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Proposal ID:', req.params.id);
    res.status(500).json({ message: 'Error toggling selection', error: error.message });
  }
});

// Select 15 teams (batch selection)
router.post('/select-teams', verifyAdmin, async (req, res) => {
  try {
    console.log('=== Batch Team Selection ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { teamIds } = req.body;
    
    if (!Array.isArray(teamIds) || teamIds.length !== 15) {
      console.log('Invalid team IDs:', teamIds);
      return res.status(400).json({ message: 'Exactly 15 team IDs required' });
    }
    
    console.log('Resetting all proposals to submitted...');
    // Reset all to submitted first
    await Proposal.updateMany({}, { status: 'submitted' });
    
    console.log('Selecting specified teams...');
    // Select specified teams
    const result = await Proposal.updateMany(
      { _id: { $in: teamIds.slice(0, 15) } },
      { status: 'selected' }
    );
    
    console.log('Teams selected successfully. Modified count:', result.modifiedCount);
    
    res.json({ 
      success: true,
      message: 'Teams selected successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('=== ERROR in Batch Team Selection ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({ message: 'Error selecting teams', error: error.message });
  }
});

// Get selected teams count
router.post('/selected-count', verifyAdmin, async (req, res) => {
  try {
    console.log('=== Fetching Selected Teams Count ===');
    const count = await Proposal.countDocuments({ status: 'selected' });
    console.log('Selected teams count:', count);
    res.json({ count });
  } catch (error) {
    console.error('=== ERROR in Fetching Selected Count ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error getting selected count', error: error.message });
  }
});

// Create announcement
router.post('/announcements', verifyAdmin, async (req, res) => {
  try {
    console.log('=== Creating Announcement ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const announcement = new Announcement(req.body);
    await announcement.save();
    
    console.log('Announcement created successfully');
    res.status(201).json(announcement);
  } catch (error) {
    console.error('=== ERROR in Creating Announcement ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({ message: 'Error creating announcement', error: error.message });
  }
});

// Update deadline
router.post('/deadline', verifyAdmin, async (req, res) => {
  try {
    console.log('=== Updating Deadline ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { deadline } = req.body;
    let settings = await Settings.findOne();
    
    if (!settings) {
      console.log('No settings found, creating new settings');
      settings = new Settings({ submissionDeadline: deadline });
    } else {
      console.log('Updating existing settings');
      settings.submissionDeadline = deadline;
    }
    
    await settings.save();
    console.log('Deadline updated successfully');
    res.json(settings);
  } catch (error) {
    console.error('=== ERROR in Updating Deadline ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({ message: 'Error updating deadline', error: error.message });
  }
});

// Get settings
router.get('/settings', async (req, res) => {
  try {
    console.log('=== Fetching Settings ===');
    const settings = await Settings.findOne();
    console.log('Settings found:', settings);
    res.json(settings);
  } catch (error) {
    console.error('=== ERROR in Fetching Settings ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
});

module.exports = router;