const { query } = require('../config/database');

/**
 * 모든 상품 조회 (페이지네이션 지원)
 * @param {number} page - 페이지 번호 (기본값: 1)
 * @param {number} limit - 페이지당 항목 수 (기본값: 12)
 * @param {string} category - 카테고리 필터 (선택적)
 * @returns {Promise<{products: Array, total: number, page: number, totalPages: number}>}
 */
const getAllProducts = async (page = 1, limit = 12, category = null) => {
    try {
        // 숫자로 변환
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        
        let sql = 'SELECT * FROM products WHERE 1=1';
        let countSql = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
        const params = [];
        const countParams = [];
        
        // 카테고리 필터 적용
        if (category) {
            sql += ' AND category = ?';
            countSql += ' AND category = ?';
            params.push(category);
            countParams.push(category);
        }
        
        // 정렬 및 페이지네이션
        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limitNum, offset);
        
        // 상품 조회
        const products = await query(sql, params);
        
        // 전체 개수 조회
        const [countResult] = await query(countSql, countParams);
        const total = countResult.total;
        const totalPages = Math.ceil(total / limitNum);
        
        return {
            products,
            total,
            page: pageNum,
            totalPages
        };
    } catch (error) {
        console.error('상품 목록 조회 오류:', error);
        throw error;
    }
};

/**
 * 상품 ID로 상세 정보 조회
 * @param {number} productId - 상품 ID
 * @returns {Promise<Object|null>}
 */
const getProductById = async (productId) => {
    try {
        const sql = 'SELECT * FROM products WHERE product_id = ?';
        const results = await query(sql, [productId]);
        
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('상품 상세 조회 오류:', error);
        throw error;
    }
};

/**
 * 상품 검색 (이름 또는 설명으로 검색)
 * @param {string} keyword - 검색 키워드
 * @param {number} page - 페이지 번호 (기본값: 1)
 * @param {number} limit - 페이지당 항목 수 (기본값: 12)
 * @returns {Promise<{products: Array, total: number, page: number, totalPages: number}>}
 */
const searchProducts = async (keyword, page = 1, limit = 12) => {
    try {
        // 숫자로 변환
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        const searchPattern = `%${keyword}%`;
        
        const sql = `
            SELECT * FROM products 
            WHERE name LIKE ? OR description LIKE ?
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;
        
        const countSql = `
            SELECT COUNT(*) as total FROM products 
            WHERE name LIKE ? OR description LIKE ?
        `;
        
        // 상품 검색
        const products = await query(sql, [searchPattern, searchPattern, limitNum, offset]);
        
        // 전체 개수 조회
        const [countResult] = await query(countSql, [searchPattern, searchPattern]);
        const total = countResult.total;
        const totalPages = Math.ceil(total / limitNum);
        
        return {
            products,
            total,
            page: pageNum,
            totalPages
        };
    } catch (error) {
        console.error('상품 검색 오류:', error);
        throw error;
    }
};

/**
 * 상품 재고 확인
 * @param {number} productId - 상품 ID
 * @returns {Promise<{available: boolean, stock: number}>}
 */
const checkStock = async (productId) => {
    try {
        const sql = 'SELECT stock_quantity FROM products WHERE product_id = ?';
        const results = await query(sql, [productId]);
        
        if (results.length === 0) {
            return { available: false, stock: 0 };
        }
        
        const stock = results[0].stock_quantity;
        return {
            available: stock > 0,
            stock
        };
    } catch (error) {
        console.error('재고 확인 오류:', error);
        throw error;
    }
};

/**
 * 재고 수량 감소
 * @param {number} productId - 상품 ID
 * @param {number} quantity - 감소할 수량
 * @returns {Promise<boolean>}
 */
const decreaseStock = async (productId, quantity) => {
    try {
        const sql = `
            UPDATE products 
            SET stock_quantity = stock_quantity - ? 
            WHERE product_id = ? AND stock_quantity >= ?
        `;
        
        const result = await query(sql, [quantity, productId, quantity]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('재고 감소 오류:', error);
        throw error;
    }
};

/**
 * 카테고리 목록 조회
 * @returns {Promise<Array<string>>}
 */
const getCategories = async () => {
    try {
        const sql = 'SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category';
        const results = await query(sql);
        return results.map(row => row.category);
    } catch (error) {
        console.error('카테고리 조회 오류:', error);
        throw error;
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    searchProducts,
    checkStock,
    decreaseStock,
    getCategories
};
