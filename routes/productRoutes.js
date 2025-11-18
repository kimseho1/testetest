const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 카테고리 목록 조회 (이 라우트는 /search보다 먼저 정의되어야 함)
router.get('/categories', productController.getCategories);

// 상품 검색 (이 라우트는 /:id보다 먼저 정의되어야 함)
router.get('/search', productController.searchProducts);

// 상품 목록 조회 (페이지네이션 및 카테고리 필터)
router.get('/', productController.getProducts);

// 상품 상세 조회
router.get('/:id', productController.getProductById);

// 재고 확인
router.get('/:id/stock', productController.checkProductStock);

module.exports = router;
