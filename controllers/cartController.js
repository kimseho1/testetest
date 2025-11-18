const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * 장바구니 컨트롤러
 * 장바구니 조회, 추가, 수정, 삭제 로직을 처리합니다
 */

/**
 * 장바구니 조회
 * GET /api/cart
 */
const getCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        // 장바구니 아이템 조회
        const items = await Cart.getCartItems(userId);
        
        // 총액 계산
        const totals = await Cart.getCartTotal(userId);
        
        res.status(200).json({
            success: true,
            data: {
                items,
                totalAmount: totals.totalAmount,
                itemCount: totals.itemCount
            }
        });
    } catch (error) {
        console.error('장바구니 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '장바구니를 불러오는데 실패했습니다'
        });
    }
};

/**
 * 장바구니에 상품 추가
 * POST /api/cart
 * Body: { productId, quantity }
 */
const addToCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        // product_id와 productId 둘 다 지원
        const productId = req.body.product_id || req.body.productId;
        const quantity = req.body.quantity;
        
        // 입력 검증
        if (!productId || !quantity) {
            return res.status(400).json({
                success: false,
                error: '상품 ID와 수량을 입력해주세요'
            });
        }
        
        // 수량 검증
        const parsedQuantity = parseInt(quantity);
        if (parsedQuantity < 1) {
            return res.status(400).json({
                success: false,
                error: '수량은 1 이상이어야 합니다'
            });
        }
        
        // 상품 존재 여부 확인
        const product = await Product.getProductById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: '상품을 찾을 수 없습니다'
            });
        }
        
        // 재고 확인
        const stockInfo = await Product.checkStock(productId);
        if (!stockInfo.available) {
            return res.status(400).json({
                success: false,
                error: '품절된 상품입니다'
            });
        }
        
        if (stockInfo.stock < parsedQuantity) {
            return res.status(400).json({
                success: false,
                error: `재고가 부족합니다. 현재 재고: ${stockInfo.stock}개`
            });
        }
        
        // 장바구니에 추가
        const cartItemId = await Cart.addCartItem(userId, productId, parsedQuantity);
        
        res.status(201).json({
            success: true,
            data: {
                cartItemId,
                message: '장바구니에 추가되었습니다'
            }
        });
    } catch (error) {
        console.error('장바구니 추가 실패:', error);
        res.status(500).json({
            success: false,
            error: '장바구니에 추가하는데 실패했습니다'
        });
    }
};

/**
 * 장바구니 아이템 수량 변경
 * PUT /api/cart/:itemId
 * Body: { quantity }
 */
const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cartItemId = parseInt(req.params.itemId);
        const { quantity } = req.body;
        
        // 입력 검증
        if (!cartItemId || cartItemId < 1) {
            return res.status(400).json({
                success: false,
                error: '유효하지 않은 장바구니 아이템 ID입니다'
            });
        }
        
        if (!quantity) {
            return res.status(400).json({
                success: false,
                error: '수량을 입력해주세요'
            });
        }
        
        // 수량 검증
        const parsedQuantity = parseInt(quantity);
        if (parsedQuantity < 1) {
            return res.status(400).json({
                success: false,
                error: '수량은 1 이상이어야 합니다'
            });
        }
        
        // 장바구니 아이템 존재 여부 및 권한 확인
        const cartItem = await Cart.getCartItemById(cartItemId, userId);
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                error: '장바구니 아이템을 찾을 수 없습니다'
            });
        }
        
        // 재고 확인
        const stockInfo = await Product.checkStock(cartItem.product_id);
        if (stockInfo.stock < parsedQuantity) {
            return res.status(400).json({
                success: false,
                error: `재고가 부족합니다. 현재 재고: ${stockInfo.stock}개`
            });
        }
        
        // 수량 업데이트
        const success = await Cart.updateCartItemQuantity(cartItemId, userId, parsedQuantity);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                error: '장바구니 아이템을 찾을 수 없습니다'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                message: '수량이 변경되었습니다'
            }
        });
    } catch (error) {
        console.error('장바구니 수량 변경 실패:', error);
        res.status(500).json({
            success: false,
            error: '수량 변경에 실패했습니다'
        });
    }
};

/**
 * 장바구니 아이템 삭제
 * DELETE /api/cart/:itemId
 */
const deleteCartItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cartItemId = parseInt(req.params.itemId);
        
        // 입력 검증
        if (!cartItemId || cartItemId < 1) {
            return res.status(400).json({
                success: false,
                error: '유효하지 않은 장바구니 아이템 ID입니다'
            });
        }
        
        // 삭제
        const success = await Cart.deleteCartItem(cartItemId, userId);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                error: '장바구니 아이템을 찾을 수 없습니다'
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                message: '장바구니에서 삭제되었습니다'
            }
        });
    } catch (error) {
        console.error('장바구니 아이템 삭제 실패:', error);
        res.status(500).json({
            success: false,
            error: '삭제에 실패했습니다'
        });
    }
};

/**
 * 장바구니 비우기
 * DELETE /api/cart
 */
const clearCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        await Cart.clearCart(userId);
        
        res.status(200).json({
            success: true,
            data: {
                message: '장바구니가 비워졌습니다'
            }
        });
    } catch (error) {
        console.error('장바구니 비우기 실패:', error);
        res.status(500).json({
            success: false,
            error: '장바구니를 비우는데 실패했습니다'
        });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    deleteCartItem,
    clearCart
};
