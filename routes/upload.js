const express = require('express');
const router = express.Router();
const {
  upload,
  uploadTeamLogo,
  deleteTeamLogo,
  getUploadInfo
} = require('../controllers/uploadController');

// Upload team logo
router.post('/logo', upload.single('logo'), uploadTeamLogo);

// Delete team logo
router.delete('/logo', deleteTeamLogo);

// Get upload info
router.get('/info', getUploadInfo);

module.exports = router;