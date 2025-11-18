// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { uploadImage, uploadMultipleImages } = require('../controllers/uploadController');
const { upload, handleMulterError } = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/upload
 * 단일 이미지 업로드
 * 인증 필요
 * Query params: folder (optional) - S3 버킷 내 폴더 경로
 * Body: multipart/form-data with 'image' field
 */
router.post(
    '/',
    authenticateToken,
    upload.single('image'),
    handleMulterError,
    uploadImage
);

/**
 * POST /api/upload/multiple
 * 여러 이미지 업로드
 * 인증 필요
 * Query params: folder (optional) - S3 버킷 내 폴더 경로
 * Body: multipart/form-data with 'images' field (multiple files)
 */
router.post(
    '/multiple',
    authenticateToken,
    upload.array('images', 10),
    handleMulterError,
    uploadMultipleImages
);

module.exports = router;
