const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

/**
 * 주문 컨트롤러
 * 주문 생성, 조회 로직을 처리합니다
 */

/**
 * 배송지 정보 검증 함수
 * @param {string} shippingAddress - 배송지 주소
 * @returns {Object} { valid: boolean, error: string }
 */
const validateShippingAddress = (shippingAddress) => {
    // 필수 입력 확인
    if (!shippingAddress || typeof shippingAddress !== 'string') {
        return { valid: false, error: '배송지 정보를 입력해주세요' };
    }
    
    const address = shippingAddress.trim();
    
    // 최소 길이 확인 (10자 이상)
    if (address.length < 10) {
        return { valid: false, error: '배송지 정보를 10자 이상 입력해주세요' };
    }
    
    // 최대 길이 확인 (500자 이하)
    if (address.length > 500) {
        return { valid: false, error: '배송지 정보는 500자를 초과할 수 없습니다' };
    }
    
    // 특수문자만으로 구성되지 않았는지 확인
    const hasValidContent = /[가-힣a-zA-Z0-9]/.test(address);
    if (!hasValidContent) {
        return { valid: false, error: '유효한 배송지 정보를 입력해주세요' };
    }
    
    return { valid: true };
};

/**
 * 결제 수단 검증 및 처리 함수
 * @param {string} paymentMethod - 결제 수단
 * @returns {Object} { valid: boolean, error: string, processedMethod: string }
 */
const validateAndProcessPaymentMethod = (paymentMethod) => {
    // 필수 입력 확인
    if (!paymentMethod || typeof paymentMethod !== 'string') {
        return { valid: false, error: '결제 수단을 선택해주세요' };
    }
    
    const method = paymentMethod.trim().toLowerCase();
    
    // 지원하는 결제 수단 목록
    const validMethods = {
        'credit_card': '신용카드',
        'debit_card': '체크카드',
        'bank_transfer': '계좌이체',
        'virtual_account': '가상계좌',
        'mobile_payment': '모바일결제',
        'kakao_pay': '카카오페이',
        'naver_pay': '네이버페이',
        'paypal': '페이팔'
    };
    
    // 결제 수단 유효성 확인
    if (!validMethods[method]) {
        return { 
            valid: false, 
            error: '지원하지 않는 결제 수단입니다. 사용 가능한 결제 수단: ' + 
                   Object.values(validMethods).join(', ')
        };
    }
    
    // 결제 수단 처리 (기본 구현 - 실제로는 PG사 연동 필요)
    const processedMethod = validMethods[method];
    
    return { 
        valid: true, 
        processedMethod,
        methodKey: method
    };
};

/**
 * 주문 생성
 * POST /api/orders
 * Body: { shippingAddress, paymentMethod }
 */
const createOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { shippingAddress, paymentMethod } = req.body;
        
        // 배송지 정보 검증
        const addressValidation = validateShippingAddress(shippingAddress);
        if (!addressValidation.valid) {
            return res.status(400).json({
                success: false,
                error: addressValidation.error
            });
        }
        
        // 결제 수단 검증 및 처리
        const paymentValidation = validateAndProcessPaymentMethod(paymentMethod);
        if (!paymentValidation.valid) {
            return res.status(400).json({
                success: false,
                error: paymentValidation.error
            });
        }
        
        // 장바구니 조회
        const cartItems = await Cart.getCartItems(userId);
        
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                error: '장바구니가 비어있습니다'
            });
        }
        
        // 재고 확인
        for (const item of cartItems) {
            const stockInfo = await Product.checkStock(item.product_id);
            
            if (!stockInfo.available) {
                return res.status(400).json({
                    success: false,
                    error: `${item.name} 상품이 품절되었습니다`
                });
            }
            
            if (stockInfo.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    error: `${item.name} 상품의 재고가 부족합니다. 현재 재고: ${stockInfo.stock}개`
                });
            }
        }
        
        // 총액 계산
        const totals = await Cart.getCartTotal(userId);
        const totalAmount = totals.totalAmount;
        
        // 최소 주문 금액 확인
        if (totalAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: '주문 금액이 유효하지 않습니다'
            });
        }
        
        // 주문 아이템 데이터 준비
        const orderItems = cartItems.map(item => ({
            productId: item.product_id,
            quantity: item.quantity,
            price: item.price
        }));
        
        // 주문 데이터 준비
        const orderData = {
            totalAmount,
            shippingAddress: shippingAddress.trim(),
            paymentMethod: paymentValidation.processedMethod
        };
        
        // 결제 처리 시뮬레이션 (기본 구현)
        // 실제 환경에서는 PG사 API 호출 필요
        const paymentResult = await processPayment({
            amount: totalAmount,
            method: paymentValidation.methodKey,
            userId: userId
        });
        
        if (!paymentResult.success) {
            return res.status(400).json({
                success: false,
                error: paymentResult.error || '결제 처리에 실패했습니다'
            });
        }
        
        // 주문 생성 (트랜잭션 처리 - 재고 감소 포함)
        const orderId = await Order.createOrder(userId, orderData, orderItems);
        
        // 장바구니 비우기
        await Cart.clearCart(userId);
        
        res.status(201).json({
            success: true,
            data: {
                orderId,
                totalAmount,
                paymentMethod: paymentValidation.processedMethod,
                message: '주문이 완료되었습니다'
            }
        });
    } catch (error) {
        console.error('주문 생성 실패:', error);
        
        // 재고 부족 에러 처리
        if (error.message && error.message.includes('재고가 부족합니다')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        
        // 트랜잭션 롤백 에러 처리
        if (error.message && error.message.includes('트랜잭션')) {
            return res.status(500).json({
                success: false,
                error: '주문 처리 중 오류가 발생했습니다. 다시 시도해주세요'
            });
        }
        
        res.status(500).json({
            success: false,
            error: '주문 처리에 실패했습니다'
        });
    }
};

/**
 * 결제 처리 함수 (기본 구현)
 * 실제 환경에서는 PG사 API와 연동 필요
 * @param {Object} paymentInfo - 결제 정보
 * @returns {Promise<Object>} { success: boolean, error?: string, transactionId?: string }
 */
const processPayment = async (paymentInfo) => {
    try {
        const { amount, method, userId } = paymentInfo;
        
        // 결제 금액 검증
        if (amount <= 0) {
            return { success: false, error: '결제 금액이 유효하지 않습니다' };
        }
        
        // 결제 수단별 처리 로직 (기본 구현)
        // 실제로는 각 PG사의 API를 호출해야 함
        switch (method) {
            case 'credit_card':
            case 'debit_card':
                // 카드 결제 처리 시뮬레이션
                // 실제: PG사 카드 결제 API 호출
                break;
                
            case 'bank_transfer':
            case 'virtual_account':
                // 계좌이체/가상계좌 처리 시뮬레이션
                // 실제: 은행 API 또는 PG사 API 호출
                break;
                
            case 'mobile_payment':
            case 'kakao_pay':
            case 'naver_pay':
            case 'paypal':
                // 간편결제 처리 시뮬레이션
                // 실제: 각 결제사 API 호출
                break;
                
            default:
                return { success: false, error: '지원하지 않는 결제 수단입니다' };
        }
        
        // 결제 성공 시뮬레이션
        // 실제로는 PG사로부터 받은 응답을 처리
        const transactionId = `TXN_${Date.now()}_${userId}`;
        
        console.log(`결제 처리 완료: ${method}, 금액: ${amount}원, 거래ID: ${transactionId}`);
        
        return {
            success: true,
            transactionId
        };
    } catch (error) {
        console.error('결제 처리 오류:', error);
        return {
            success: false,
            error: '결제 처리 중 오류가 발생했습니다'
        };
    }
};

/**
 * 주문 내역 조회
 * GET /api/orders
 * Query: page, limit
 */
const getOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        // 페이지 검증
        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                error: '유효하지 않은 페이지 정보입니다'
            });
        }
        
        // 주문 내역 조회
        const result = await Order.getOrdersByUserId(userId, page, limit);
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('주문 내역 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '주문 내역을 불러오는데 실패했습니다'
        });
    }
};

/**
 * 주문 상세 조회
 * GET /api/orders/:id
 */
const getOrderById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orderId = parseInt(req.params.id);
        
        // 입력 검증
        if (!orderId || orderId < 1) {
            return res.status(400).json({
                success: false,
                error: '유효하지 않은 주문 ID입니다'
            });
        }
        
        // 주문 상세 조회 (권한 확인 포함)
        const order = await Order.getOrderDetails(orderId, userId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                error: '주문을 찾을 수 없습니다'
            });
        }
        
        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('주문 상세 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: '주문 정보를 불러오는데 실패했습니다'
        });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById
};
