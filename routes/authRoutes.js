const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

/**
 * 인증 라우트
 * 회원가입, 로그인, 로그아웃, 토큰 검증 엔드포인트
 */

// POST /api/auth/register - 회원가입
router.post('/register', authController.register);

// POST /api/auth/login - 로그인
router.post('/login', authController.login);

// POST /api/auth/logout - 로그아웃
router.post('/logout', authController.logout);

// GET /api/auth/verify - 토큰 검증 (인증 필요)
router.get('/verify', authenticateToken, authController.verify);

module.exports = router;
