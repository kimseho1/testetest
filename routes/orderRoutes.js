const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

/**
 * 주문 라우트
 * 모든 주문 엔드포인트는 인증이 필요합니다
 */

// POST /api/orders - 주문 생성 (인증 필요)
router.post('/', authenticateToken, orderController.createOrder);

// GET /api/orders - 주문 내역 조회 (인증 필요)
router.get('/', authenticateToken, orderController.getOrders);

// GET /api/orders/:id - 주문 상세 조회 (인증 필요)
router.get('/:id', authenticateToken, orderController.getOrderById);

module.exports = router;
