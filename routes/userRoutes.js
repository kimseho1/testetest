const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

/**
 * 사용자 라우트
 * 사용자 프로필 조회 및 수정 엔드포인트
 */

// GET /api/users/profile - 프로필 조회 (인증 필요)
router.get('/profile', authenticateToken, userController.getProfile);

// PUT /api/users/profile - 프로필 수정 (인증 필요)
router.put('/profile', authenticateToken, userController.updateProfile);

module.exports = router;
