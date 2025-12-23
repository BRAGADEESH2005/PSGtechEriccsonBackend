const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const Settings = require('../models/Settings');

// Submit proposal
router.post('/submit', async (req, res) => {
  try {
    // Check deadline
    const settings = await Settings.findOne();
    if (settings && new Date() > settings.submissionDeadline) {
      return res.status(400).json({ message: 'Submission deadline has passed' });
    }

    // Check if proposal already exists
    const existingProposal = await Proposal.findOne({ teamName: req.body.teamName });
    if (existingProposal) {
      return res.status(400).json({ message: 'Proposal already submitted for this team' });
    }

    // Validate team composition (must have ECE, CSE, RAE)
    const departments = req.body.students.map(s => s.department);
    if (!departments.includes('ECE') || !departments.includes('CSE') || !departments.includes('RAE')) {
      return res.status(400).json({ message: 'Team must include members from ECE, CSE, and RAE departments' });
    }

    const proposal = new Proposal(req.body);
    await proposal.save();

    res.status(201).json({ message: 'Proposal submitted successfully', proposal });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting proposal', error: error.message });
  }
});

// Check if team has submitted
router.get('/check/:teamName', async (req, res) => {
  try {
    const proposal = await Proposal.findOne({ teamName: req.params.teamName });
    res.json({ submitted: !!proposal, proposal });
  } catch (error) {
    res.status(500).json({ message: 'Error checking proposal status', error: error.message });
  }
});

module.exports = router;