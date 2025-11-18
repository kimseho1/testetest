const { query, transaction } = require('../config/database');

/**
 * 주문 모델
 * 주문 생성, 조회, 상태 업데이트 및 주문 상세 아이템 관리 작업을 처리합니다
 */

/**
 * 새 주문 생성 (트랜잭션 사용)
 * @param {number} userId - 사용자 ID
 * @param {Object} orderData - 주문 데이터
 * @param {number} orderData.totalAmount - 총 주문 금액
 * @param {string} orderData.shippingAddress - 배송지 주소
 * @param {string} orderData.paymentMethod - 결제 수단
 * @param {Array} orderItems - 주문 아이템 배열 [{productId, quantity, price}, ...]
 * @returns {Promise<number>} 생성된 주문 ID
 */
const createOrder = async (userId, orderData, orderItems) => {
    return await transaction(async (connection) => {
        try {
            const { totalAmount, shippingAddress, paymentMethod } = orderData;
            
            // 1. 주문 생성
            const orderSql = `
                INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status)
                VALUES (?, ?, ?, ?, 'pending')
            `;
            const [orderResult] = await connection.execute(orderSql, [
                userId,
                totalAmount,
                shippingAddress,
                paymentMethod
            ]);
            
            const orderId = orderResult.insertId;
            
            // 2. 주문 아이템 추가
            if (orderItems && orderItems.length > 0) {
                const itemSql = `
                    INSERT INTO order_items (order_id, product_id, quantity, price)
                    VALUES (?, ?, ?, ?)
                `;
                
                for (const item of orderItems) {
                    await connection.execute(itemSql, [
                        orderId,
                        item.productId,
                        item.quantity,
                        item.price
                    ]);
                    
                    // 3. 재고 감소
                    const stockSql = `
                        UPDATE products 
                        SET stock_quantity = stock_quantity - ? 
                        WHERE product_id = ? AND stock_quantity >= ?
                    `;
                    const [stockResult] = await connection.execute(stockSql, [
                        item.quantity,
                        item.productId,
                        item.quantity
                    ]);
                    
                    // 재고 부족 시 에러
                    if (stockResult.affectedRows === 0) {
                        throw new Error(`상품 ID ${item.productId}의 재고가 부족합니다`);
                    }
                }
            }
            
            return orderId;
        } catch (error) {
            console.error('주문 생성 오류:', error);
            throw error;
        }
    });
};

/**
 * 주문 ID로 주문 조회
 * @param {number} orderId - 주문 ID
 * @param {number} userId - 사용자 ID (권한 확인용, 선택적)
 * @returns {Promise<Object|null>}
 */
const getOrderById = async (orderId, userId = null) => {
    try {
        let sql = `
            SELECT 
                o.order_id,
                o.user_id,
                o.total_amount,
                o.status,
                o.shipping_address,
                o.payment_method,
                o.created_at,
                o.updated_at,
                u.name as user_name,
                u.email as user_email
            FROM orders o
            INNER JOIN users u ON o.user_id = u.user_id
            WHERE o.order_id = ?
        `;
        
        const params = [orderId];
        
        // 사용자 ID가 제공된 경우 권한 확인
        if (userId !== null) {
            sql += ' AND o.user_id = ?';
            params.push(userId);
        }
        
        const results = await query(sql, params);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('주문 조회 오류:', error);
        throw error;
    }
};

/**
 * 사용자의 모든 주문 조회
 * @param {number} userId - 사용자 ID
 * @param {number} page - 페이지 번호 (기본값: 1)
 * @param {number} limit - 페이지당 항목 수 (기본값: 10)
 * @returns {Promise<{orders: Array, total: number, page: number, totalPages: number}>}
 */
const getOrdersByUserId = async (userId, page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit;
        
        const sql = `
            SELECT 
                order_id,
                user_id,
                total_amount,
                status,
                shipping_address,
                payment_method,
                created_at,
                updated_at
            FROM orders
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const countSql = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
        
        // 주문 조회
        const orders = await query(sql, [userId, limit, offset]);
        
        // 전체 개수 조회
        const [countResult] = await query(countSql, [userId]);
        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);
        
        return {
            orders,
            total,
            page: parseInt(page),
            totalPages
        };
    } catch (error) {
        console.error('사용자 주문 목록 조회 오류:', error);
        throw error;
    }
};

/**
 * 주문 상태 업데이트
 * @param {number} orderId - 주문 ID
 * @param {string} status - 새로운 상태 ('pending', 'processing', 'shipped', 'delivered', 'cancelled')
 * @returns {Promise<boolean>} 성공 여부
 */
const updateOrderStatus = async (orderId, status) => {
    try {
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            throw new Error(`유효하지 않은 주문 상태: ${status}`);
        }
        
        const sql = `
            UPDATE orders 
            SET status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE order_id = ?
        `;
        
        const result = await query(sql, [status, orderId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('주문 상태 업데이트 오류:', error);
        throw error;
    }
};

/**
 * 주문의 모든 아이템 조회
 * @param {number} orderId - 주문 ID
 * @returns {Promise<Array>} 주문 아이템 목록 (상품 정보 포함)
 */
const getOrderItems = async (orderId) => {
    try {
        const sql = `
            SELECT 
                oi.order_item_id,
                oi.order_id,
                oi.product_id,
                oi.quantity,
                oi.price,
                p.name as product_name,
                p.image_url,
                (oi.quantity * oi.price) as subtotal
            FROM order_items oi
            INNER JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
            ORDER BY oi.order_item_id
        `;
        
        const items = await query(sql, [orderId]);
        return items;
    } catch (error) {
        console.error('주문 아이템 조회 오류:', error);
        throw error;
    }
};

/**
 * 주문 상세 정보 조회 (주문 정보 + 주문 아이템)
 * @param {number} orderId - 주문 ID
 * @param {number} userId - 사용자 ID (권한 확인용, 선택적)
 * @returns {Promise<Object|null>} 주문 정보와 아이템 목록
 */
const getOrderDetails = async (orderId, userId = null) => {
    try {
        // 주문 정보 조회
        const order = await getOrderById(orderId, userId);
        
        if (!order) {
            return null;
        }
        
        // 주문 아이템 조회
        const items = await getOrderItems(orderId);
        
        return {
            ...order,
            items
        };
    } catch (error) {
        console.error('주문 상세 정보 조회 오류:', error);
        throw error;
    }
};

/**
 * 주문 삭제 (취소된 주문만 삭제 가능)
 * @param {number} orderId - 주문 ID
 * @param {number} userId - 사용자 ID (권한 확인용)
 * @returns {Promise<boolean>} 성공 여부
 */
const deleteOrder = async (orderId, userId) => {
    try {
        // 주문 상태 확인
        const order = await getOrderById(orderId, userId);
        
        if (!order) {
            throw new Error('주문을 찾을 수 없습니다');
        }
        
        if (order.status !== 'cancelled') {
            throw new Error('취소된 주문만 삭제할 수 있습니다');
        }
        
        const sql = 'DELETE FROM orders WHERE order_id = ? AND user_id = ?';
        const result = await query(sql, [orderId, userId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.error('주문 삭제 오류:', error);
        throw error;
    }
};

/**
 * 모든 주문 조회 (관리자용)
 * @param {number} page - 페이지 번호 (기본값: 1)
 * @param {number} limit - 페이지당 항목 수 (기본값: 20)
 * @param {string} status - 상태 필터 (선택적)
 * @returns {Promise<{orders: Array, total: number, page: number, totalPages: number}>}
 */
const getAllOrders = async (page = 1, limit = 20, status = null) => {
    try {
        const offset = (page - 1) * limit;
        
        let sql = `
            SELECT 
                o.order_id,
                o.user_id,
                o.total_amount,
                o.status,
                o.shipping_address,
                o.payment_method,
                o.created_at,
                o.updated_at,
                u.name as user_name,
                u.email as user_email
            FROM orders o
            INNER JOIN users u ON o.user_id = u.user_id
            WHERE 1=1
        `;
        
        let countSql = `
            SELECT COUNT(*) as total 
            FROM orders 
            WHERE 1=1
        `;
        
        const params = [];
        const countParams = [];
        
        // 상태 필터 적용
        if (status) {
            sql += ' AND o.status = ?';
            countSql += ' AND status = ?';
            params.push(status);
            countParams.push(status);
        }
        
        sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        // 주문 조회
        const orders = await query(sql, params);
        
        // 전체 개수 조회
        const [countResult] = await query(countSql, countParams);
        const total = countResult.total;
        const totalPages = Math.ceil(total / limit);
        
        return {
            orders,
            total,
            page: parseInt(page),
            totalPages
        };
    } catch (error) {
        console.error('전체 주문 조회 오류:', error);
        throw error;
    }
};

module.exports = {
    createOrder,
    getOrderById,
    getOrdersByUserId,
    updateOrderStatus,
    getOrderItems,
    getOrderDetails,
    deleteOrder,
    getAllOrders
};
