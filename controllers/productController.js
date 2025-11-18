const Product = require('../models/Product');

/**
 * 상품 목록 조회 (페이지네이션 및 카테고리 필터 지원)
 * GET /api/products?page=1&limit=12&category=electronics
 */
const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const category = req.query.category || null;
        
        // 페이지 및 limit 유효성 검사
        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                error: '잘못된 페이지 또는 limit 값입니다'
            });
        }
        
        const result = await Product.getAllProducts(page, limit, category);
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('상품 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '상품 목록을 불러오는데 실패했습니다'
        });
    }
};

/**
 * 상품 상세 조회
 * GET /api/products/:id
 */
const getProductById = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        if (!productId || productId < 1) {
            return res.status(400).json({
                success: false,
                error: '유효하지 않은 상품 ID입니다'
            });
        }
        
        const product = await Product.getProductById(productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: '상품을 찾을 수 없습니다'
            });
        }
        
        // 재고 확인 정보 추가
        const stockInfo = await Product.checkStock(productId);
        product.in_stock = stockInfo.available;
        
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('상품 상세 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '상품 정보를 불러오는데 실패했습니다'
        });
    }
};

/**
 * 상품 검색
 * GET /api/products/search?q=keyword&page=1&limit=12
 */
const searchProducts = async (req, res) => {
    try {
        const keyword = req.query.q;
        
        if (!keyword || keyword.trim() === '') {
            return res.status(400).json({
                success: false,
                error: '검색 키워드를 입력해주세요'
            });
        }
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        
        // 페이지 및 limit 유효성 검사
        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                error: '잘못된 페이지 또는 limit 값입니다'
            });
        }
        
        const result = await Product.searchProducts(keyword.trim(), page, limit);
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('상품 검색 실패:', error);
        res.status(500).json({
            success: false,
            error: '상품 검색에 실패했습니다'
        });
    }
};

/**
 * 재고 확인
 * GET /api/products/:id/stock
 */
const checkProductStock = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        if (!productId || productId < 1) {
            return res.status(400).json({
                success: false,
                error: '유효하지 않은 상품 ID입니다'
            });
        }
        
        const stockInfo = await Product.checkStock(productId);
        
        res.status(200).json({
            success: true,
            data: stockInfo
        });
    } catch (error) {
        console.error('재고 확인 실패:', error);
        res.status(500).json({
            success: false,
            error: '재고 확인에 실패했습니다'
        });
    }
};

/**
 * 카테고리 목록 조회
 * GET /api/products/categories
 */
const getCategories = async (req, res) => {
    try {
        const categories = await Product.getCategories();
        
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('카테고리 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '카테고리 목록을 불러오는데 실패했습니다'
        });
    }
};

module.exports = {
    getProducts,
    getProductById,
    searchProducts,
    checkProductStock,
    getCategories
};
