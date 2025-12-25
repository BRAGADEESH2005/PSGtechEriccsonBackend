const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const Settings = require('../models/Settings');

// Submit proposal
router.post('/submit', async (req, res) => {
  try {
    console.log('=== Proposal Submission Started ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Check deadline
    console.log('Checking submission deadline...');
    const settings = await Settings.findOne();
    console.log('Settings:', settings);
    
    if (settings && new Date() > settings.submissionDeadline) {
      console.log('Deadline passed');
      return res.status(400).json({ message: 'Submission deadline has passed' });
    }

    // Check if proposal already exists
    console.log('Checking for existing proposal for team:', req.body.teamName);
    const existingProposal = await Proposal.findOne({ teamName: req.body.teamName });
    console.log('Existing proposal:', existingProposal);
    
    if (existingProposal) {
      console.log('Proposal already exists');
      return res.status(400).json({ message: 'Proposal already submitted for this team' });
    }

    // Validate team composition (must have ECE, CSE, RAE)
    console.log('Validating team composition...');
    console.log('Students:', req.body.students);
    
    if (!req.body.students || !Array.isArray(req.body.students)) {
      console.error('Invalid students data:', req.body.students);
      return res.status(400).json({ message: 'Invalid team members data' });
    }
    
    const departments = req.body.students.map(s => s.department);
    console.log('Departments:', departments);
    
    if (!departments.includes('ECE') || !departments.includes('CSE') || !departments.includes('RAE')) {
      console.log('Missing required department');
      return res.status(400).json({ message: 'Team must include members from ECE, CSE, and RAE departments' });
    }

    console.log('Creating proposal...');
    const proposal = new Proposal(req.body);
    console.log('Proposal object created:', proposal);
    
    await proposal.save();
    console.log('Proposal saved successfully');

    res.status(201).json({ message: 'Proposal submitted successfully', proposal });
  } catch (error) {
    console.error('=== ERROR in Proposal Submission ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({ message: 'Error submitting proposal', error: error.message });
  }
});

// Check if team has submitted
router.get('/check/:teamName', async (req, res) => {
  try {
    console.log('Checking proposal for team:', req.params.teamName);
    const proposal = await Proposal.findOne({ teamName: req.params.teamName });
    console.log('Found proposal:', proposal);
    res.json({ submitted: !!proposal, proposal });
  } catch (error) {
    console.error('Error checking proposal:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Error checking proposal status', error: error.message });
  }
});

module.exports = router;