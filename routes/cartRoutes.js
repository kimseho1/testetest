const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

/**
 * 장바구니 라우트
 * 모든 장바구니 엔드포인트는 인증이 필요합니다
 */

// GET /api/cart - 장바구니 조회 (인증 필요)
router.get('/', authenticateToken, cartController.getCart);

// POST /api/cart - 장바구니에 상품 추가 (인증 필요)
router.post('/', authenticateToken, cartController.addToCart);

// PUT /api/cart/:itemId - 장바구니 아이템 수량 변경 (인증 필요)
router.put('/:itemId', authenticateToken, cartController.updateCartItem);

// DELETE /api/cart/:itemId - 장바구니 아이템 삭제 (인증 필요)
router.delete('/:itemId', authenticateToken, cartController.deleteCartItem);

// DELETE /api/cart - 장바구니 비우기 (인증 필요)
router.delete('/', authenticateToken, cartController.clearCart);

module.exports = router;
