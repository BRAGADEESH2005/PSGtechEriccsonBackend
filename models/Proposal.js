const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    unique: true
  },
  students: [{
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    department: {
      type: String,
      required: true,
      enum: ['ECE', 'CSE', 'RAE']
    }
  }],
  projectTitle: {
    type: String,
    required: true
  },
  projectLogo: {
    type: String,
    required: true
  },
  teamComposition: {
    type: String,
    required: true
  },
  problemStatement: {
    type: String,
    required: true
  },
  toolsAndMethodology: {
    type: String,
    required: true
  },
  implementationPlan: {
    type: String,
    required: true
  },
  projectFlowSlides: {
    type: String,
    required: true
  },
  expectedResults: {
    type: String,
    required: true
  },
  additionalDetails: {
    type: String
  },
  status: {
    type: String,
    enum: ['submitted', 'selected', 'rejected'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Proposal', ProposalSchema);