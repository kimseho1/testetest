const { query } = require('../config/database');

/**
 * 장바구니 모델
 * 장바구니 아이템 추가, 조회, 수정, 삭제 작업을 처리합니다
 */

/**
 * 사용자의 장바구니 아이템 조회
 * @param {number} userId - 사용자 ID
 * @returns {Promise<Array>} 장바구니 아이템 목록 (상품 정보 포함)
 */
const getCartItems = async (userId) => {
    try {
        const sql = `
            SELECT 
                ci.cart_item_id,
                ci.user_id,
                ci.product_id,
                ci.quantity,
                ci.created_at,
                ci.updated_at,
                p.name,
                p.price,
                p.image_url,
                p.stock_quantity,
                (p.price * ci.quantity) as subtotal
            FROM cart_items ci
            INNER JOIN products p ON ci.product_id = p.product_id
            WHERE ci.user_id = ?
            ORDER BY ci.created_at DESC
        `;
        
        const items = await query(sql, [userId]);
        return items;
    } catch (error) {
        console.error('장바구니 조회 오류:', error);
        throw error;
    }
};

/**
 * 장바구니에 상품 추가 또는 수량 증가
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @param {number} quantity - 수량 (기본값: 1)
 * @returns {Promise<number>} 장바구니 아이템 ID
 */
const addCartItem = async (userId, productId, quantity = 1) => {
    try {
        // 이미 장바구니에 있는지 확인
        const checkSql = 'SELECT cart_item_id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?';
        const existing = await query(checkSql, [userId, productId]);
        
        if (existing.length > 0) {
            // 이미 존재하면 수량 증가
            const newQuantity = existing[0].quantity + quantity;
            const updateSql = 'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_item_id = ?';
            await query(updateSql, [newQuantity, existing[0].cart_item_id]);
            return existing[0].cart_item_id;
        } else {
            // 새로 추가
            const insertSql = 'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)';
            const result = await query(insertSql, [userId, productId, quantity]);
            return result.insertId;
        }
    } catch (error) {
        console.error('장바구니 추가 오류:', error);
        throw error;
    }
};

/**
 * 장바구니 아이템 수량 변경
 * @param {number} cartItemId - 장바구니 아이템 ID
 * @param {number} userId - 사용자 ID (권한 확인용)
 * @param {number} quantity - 새로운 수량
 * @returns {Promise<boolean>} 성공 여부
 */
const updateCartItemQuantity = async (cartItemId, userId, quantity) => {
    try {
        const sql = `
            UPDATE cart_items 
            SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE cart_item_id = ? AND user_id = ?
        `;
        
        const result = await query(sql, [quantity, cartItemId, userId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('장바구니 수량 변경 오류:', error);
        throw error;
    }
};

/**
 * 장바구니 아이템 삭제
 * @param {number} cartItemId - 장바구니 아이템 ID
 * @param {number} userId - 사용자 ID (권한 확인용)
 * @returns {Promise<boolean>} 성공 여부
 */
const deleteCartItem = async (cartItemId, userId) => {
    try {
        const sql = 'DELETE FROM cart_items WHERE cart_item_id = ? AND user_id = ?';
        const result = await query(sql, [cartItemId, userId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('장바구니 아이템 삭제 오류:', error);
        throw error;
    }
};

/**
 * 사용자의 장바구니 비우기
 * @param {number} userId - 사용자 ID
 * @returns {Promise<boolean>} 성공 여부
 */
const clearCart = async (userId) => {
    try {
        const sql = 'DELETE FROM cart_items WHERE user_id = ?';
        const result = await query(sql, [userId]);
        return result.affectedRows >= 0; // 0개여도 성공으로 간주
    } catch (error) {
        console.error('장바구니 비우기 오류:', error);
        throw error;
    }
};

/**
 * 장바구니 총액 계산
 * @param {number} userId - 사용자 ID
 * @returns {Promise<{totalAmount: number, itemCount: number}>}
 */
const getCartTotal = async (userId) => {
    try {
        const sql = `
            SELECT 
                COALESCE(SUM(p.price * ci.quantity), 0) as total_amount,
                COALESCE(COUNT(ci.cart_item_id), 0) as item_count
            FROM cart_items ci
            INNER JOIN products p ON ci.product_id = p.product_id
            WHERE ci.user_id = ?
        `;
        
        const [result] = await query(sql, [userId]);
        return {
            totalAmount: parseFloat(result.total_amount) || 0,
            itemCount: parseInt(result.item_count) || 0
        };
    } catch (error) {
        console.error('장바구니 총액 계산 오류:', error);
        throw error;
    }
};

/**
 * 특정 장바구니 아이템 조회
 * @param {number} cartItemId - 장바구니 아이템 ID
 * @param {number} userId - 사용자 ID (권한 확인용)
 * @returns {Promise<Object|null>}
 */
const getCartItemById = async (cartItemId, userId) => {
    try {
        const sql = `
            SELECT 
                ci.cart_item_id,
                ci.user_id,
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.stock_quantity
            FROM cart_items ci
            INNER JOIN products p ON ci.product_id = p.product_id
            WHERE ci.cart_item_id = ? AND ci.user_id = ?
        `;
        
        const results = await query(sql, [cartItemId, userId]);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('장바구니 아이템 조회 오류:', error);
        throw error;
    }
};

module.exports = {
    getCartItems,
    addCartItem,
    updateCartItemQuantity,
    deleteCartItem,
    clearCart,
    getCartTotal,
    getCartItemById
};
