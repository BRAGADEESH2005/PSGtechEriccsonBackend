const multer = require('multer');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Single file upload
  }
});

/**
 * Upload team logo to Cloudinary
 */
const uploadTeamLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only images are allowed.'
      });
    }

    const { teamName } = req.body;
    
    if (!teamName) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    console.log(`Uploading logo for team: ${teamName}`);

    // Create unique public_id
    const publicId = `${teamName.replace(/\s+/g, '_')}_${Date.now()}`;

    // Upload options
    const uploadOptions = {
      folder: 'hackathon-logos',
      public_id: publicId,
      tags: ['hackathon', 'team-logo', teamName],
      context: {
        teamName: teamName,
        uploadedAt: new Date().toISOString()
      },
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, uploadOptions);

    // Extract relevant information
    const imageData = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
      originalName: req.file.originalname,
      teamName: teamName
    };

    console.log(`Successfully uploaded logo for team: ${teamName}`);

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: imageData
    });

  } catch (error) {
    console.error('Error uploading logo:', error);
    
    // Handle specific multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 5MB.'
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload logo',
      error: error.message
    });
  }
};

/**
 * Delete image from Cloudinary
 */
const deleteTeamLogo = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    const result = await deleteFromCloudinary(publicId);

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Logo deleted successfully',
        data: result
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Logo not found or already deleted'
      });
    }

  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete logo',
      error: error.message
    });
  }
};

/**
 * Get upload configuration info
 */
const getUploadInfo = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        maxFileSize: '5MB',
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        folder: 'hackathon-logos',
        transformations: {
          maxWidth: 500,
          maxHeight: 500,
          quality: 'auto',
          format: 'auto'
        }
      }
    });
  } catch (error) {
    console.error('Error getting upload info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upload information',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  uploadTeamLogo,
  deleteTeamLogo,
  getUploadInfo
};