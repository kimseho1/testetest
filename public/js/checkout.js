// ===================================
// 결제 페이지 (Checkout Page)
// ===================================

let cartItems = [];
let orderSummary = {
    subtotal: 0,
    shipping: 0,
    total: 0
};

// ===================================
// 페이지 초기화 (Page Initialization)
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    // 인증 체크 - 비로그인 시 로그인 페이지로 리다이렉트
    const isAuth = await Auth.requireAuth();
    if (!isAuth) {
        return;
    }

    // 장바구니 데이터 로드 및 주문 요약 표시
    await loadCartForCheckout();

    // 폼 입력 이벤트 리스너
    setupFormValidation();

    // 결제 버튼 이벤트 리스너
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', handlePlaceOrder);
    }
});

// ===================================
// 장바구니 데이터 로드 (Load Cart Data)
// ===================================

/**
 * 결제를 위한 장바구니 데이터 로드
 */
async function loadCartForCheckout() {
    const summaryLoading = document.getElementById('summary-loading');
    const orderItemsList = document.getElementById('order-items-list');

    try {
        // 로딩 상태 표시
        summaryLoading.classList.remove('hidden');
        orderItemsList.innerHTML = '';

        // API 호출
        const response = await API.get('/cart');
        
        if (response.success && response.data) {
            cartItems = response.data.items || [];
            
            // 장바구니가 비어있는 경우
            if (cartItems.length === 0) {
                UI.showWarning('장바구니가 비어있습니다.');
                setTimeout(() => {
                    window.location.href = '/pages/cart.html';
                }, 2000);
                return;
            }

            // 주문 요약 렌더링
            renderOrderSummary();
            calculateOrderSummary();
        } else {
            UI.showError('장바구니 정보를 불러올 수 없습니다.');
            setTimeout(() => {
                window.location.href = '/pages/cart.html';
            }, 2000);
        }
    } catch (error) {
        console.error('장바구니 로드 실패:', error);
        UI.showError('장바구니를 불러오는데 실패했습니다.');
        setTimeout(() => {
            window.location.href = '/pages/cart.html';
        }, 2000);
    } finally {
        summaryLoading.classList.add('hidden');
    }
}

// ===================================
// 주문 요약 렌더링 (Render Order Summary)
// ===================================

/**
 * 주문 요약 정보 렌더링
 */
function renderOrderSummary() {
    const orderItemsList = document.getElementById('order-items-list');
    
    orderItemsList.innerHTML = cartItems.map(item => createOrderItemHTML(item)).join('');
}

/**
 * 주문 아이템 HTML 생성
 * @param {object} item - 장바구니 아이템
 * @returns {string} - HTML 문자열
 */
function createOrderItemHTML(item) {
    const itemTotal = item.price * item.quantity;
    const imageUrl = item.image_url || '/images/placeholder.png';

    return `
        <div class="order-item">
            <div class="order-item-image">
                <img src="${imageUrl}" alt="${item.product_name}" onerror="this.src='/images/placeholder.png'">
            </div>
            <div class="order-item-details">
                <h4 class="order-item-name">${item.product_name}</h4>
                <p class="order-item-info">
                    ${Utils.formatPrice(item.price)} × ${item.quantity}개
                </p>
            </div>
            <div class="order-item-total">
                <p class="order-item-price">${Utils.formatPrice(itemTotal)}</p>
            </div>
        </div>
    `;
}

/**
 * 주문 요약 금액 계산
 */
function calculateOrderSummary() {
    // 상품 금액 계산
    const subtotal = cartItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);

    // 배송비 계산 (50,000원 이상 무료배송)
    const shipping = subtotal >= 50000 ? 0 : 3000;

    // 총 금액
    const total = subtotal + shipping;

    // 요약 정보 저장
    orderSummary = { subtotal, shipping, total };

    // UI 업데이트
    updateSummaryDisplay(subtotal, shipping, total);
}

/**
 * 주문 요약 UI 업데이트
 * @param {number} subtotal - 상품 금액
 * @param {number} shipping - 배송비
 * @param {number} total - 총 금액
 */
function updateSummaryDisplay(subtotal, shipping, total) {
    const subtotalEl = document.getElementById('summary-subtotal');
    const shippingEl = document.getElementById('summary-shipping');
    const totalEl = document.getElementById('summary-total');

    if (subtotalEl) subtotalEl.textContent = Utils.formatPrice(subtotal);
    if (shippingEl) {
        shippingEl.textContent = shipping === 0 ? '무료' : Utils.formatPrice(shipping);
    }
    if (totalEl) totalEl.textContent = Utils.formatPrice(total);
}

// ===================================
// 폼 검증 (Form Validation)
// ===================================

/**
 * 폼 입력 검증 설정
 */
function setupFormValidation() {
    const form = document.getElementById('shipping-form');
    const placeOrderBtn = document.getElementById('place-order-btn');
    
    // 필수 입력 필드
    const requiredFields = [
        'recipient-name',
        'recipient-phone',
        'postal-code',
        'address'
    ];

    // 입력 필드 변경 시 검증
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', () => {
                validateForm(requiredFields, placeOrderBtn);
            });
        }
    });

    // 초기 검증
    validateForm(requiredFields, placeOrderBtn);
}

/**
 * 폼 유효성 검증
 * @param {Array} requiredFields - 필수 입력 필드 ID 배열
 * @param {HTMLElement} submitBtn - 제출 버튼
 */
function validateForm(requiredFields, submitBtn) {
    let isValid = true;

    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
            isValid = false;
            break;
        }
    }

    // 연락처 형식 검증
    const phoneField = document.getElementById('recipient-phone');
    if (phoneField && phoneField.value) {
        const phonePattern = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
        if (!phonePattern.test(phoneField.value.replace(/\s/g, ''))) {
            isValid = false;
        }
    }

    // 버튼 활성화/비활성화
    if (submitBtn) {
        submitBtn.disabled = !isValid;
    }

    return isValid;
}

/**
 * 배송지 정보 수집
 * @returns {string} - 배송지 정보 문자열
 */
function collectShippingAddress() {
    const recipientName = document.getElementById('recipient-name').value.trim();
    const recipientPhone = document.getElementById('recipient-phone').value.trim();
    const postalCode = document.getElementById('postal-code').value.trim();
    const address = document.getElementById('address').value.trim();
    const addressDetail = document.getElementById('address-detail').value.trim();
    const deliveryMessage = document.getElementById('delivery-message').value.trim();

    // 배송지 정보를 하나의 문자열로 결합
    let shippingAddress = `[받는사람] ${recipientName}\n`;
    shippingAddress += `[연락처] ${recipientPhone}\n`;
    shippingAddress += `[우편번호] ${postalCode}\n`;
    shippingAddress += `[주소] ${address}`;
    
    if (addressDetail) {
        shippingAddress += ` ${addressDetail}`;
    }
    
    if (deliveryMessage) {
        shippingAddress += `\n[배송메시지] ${deliveryMessage}`;
    }

    return shippingAddress;
}

/**
 * 선택된 결제 수단 가져오기
 * @returns {string} - 결제 수단
 */
function getSelectedPaymentMethod() {
    const selectedRadio = document.querySelector('input[name="payment-method"]:checked');
    return selectedRadio ? selectedRadio.value : 'credit_card';
}

// ===================================
// 주문 처리 (Place Order)
// ===================================

/**
 * 주문 생성 처리
 */
async function handlePlaceOrder() {
    try {
        // 폼 검증
        const requiredFields = [
            'recipient-name',
            'recipient-phone',
            'postal-code',
            'address'
        ];
        
        if (!validateForm(requiredFields, null)) {
            UI.showError('모든 필수 항목을 입력해주세요.');
            return;
        }

        // 장바구니 확인
        if (cartItems.length === 0) {
            UI.showError('장바구니가 비어있습니다.');
            return;
        }

        // 재고 확인
        const outOfStockItems = cartItems.filter(item => item.quantity > item.stock_quantity);
        if (outOfStockItems.length > 0) {
            UI.showError('일부 상품의 재고가 부족합니다.');
            return;
        }

        // 배송지 정보 수집
        const shippingAddress = collectShippingAddress();
        
        // 결제 수단 가져오기
        const paymentMethod = getSelectedPaymentMethod();

        // 주문 확인
        const confirmMessage = `총 ${Utils.formatPrice(orderSummary.total)}을(를) 결제하시겠습니까?`;
        if (!confirm(confirmMessage)) {
            return;
        }

        // 로딩 표시
        UI.showLoading();

        // 주문 생성 API 호출
        const response = await API.post('/orders', {
            shippingAddress,
            paymentMethod
        });

        if (response.success) {
            // 성공 메시지 표시
            UI.showSuccess('주문이 완료되었습니다!');
            
            // 주문 완료 후 마이페이지로 이동
            setTimeout(() => {
                window.location.href = '/pages/mypage.html';
            }, 1500);
        } else {
            // 에러 메시지 표시
            UI.showError(response.error || '주문 처리에 실패했습니다.');
        }
    } catch (error) {
        console.error('주문 생성 실패:', error);
        
        // 에러 메시지 표시
        const errorMessage = error.message || '주문 처리 중 오류가 발생했습니다.';
        UI.showError(errorMessage);
    } finally {
        UI.hideLoading();
    }
}

// ===================================
// CSS 스타일 추가 (Additional Styles)
// ===================================

// 결제 페이지 전용 스타일을 동적으로 추가
const style = document.createElement('style');
style.textContent = `
    .checkout-container {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 24px;
        margin-top: 32px;
    }

    .checkout-form-section {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .checkout-summary-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .checkout-summary-section .card {
        position: sticky;
        top: 100px;
    }

    /* 주문 아이템 목록 */
    .order-items-list {
        max-height: 300px;
        overflow-y: auto;
        margin-bottom: 16px;
        padding-right: 8px;
    }

    .order-items-list::-webkit-scrollbar {
        width: 6px;
    }

    .order-items-list::-webkit-scrollbar-track {
        background: var(--bg-secondary);
        border-radius: 3px;
    }

    .order-items-list::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 3px;
    }

    .order-items-list::-webkit-scrollbar-thumb:hover {
        background: var(--secondary-color);
    }

    .order-item {
        display: grid;
        grid-template-columns: 60px 1fr auto;
        gap: 12px;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid var(--border-color);
    }

    .order-item:last-child {
        border-bottom: none;
    }

    .order-item-image img {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: var(--border-radius);
    }

    .order-item-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .order-item-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
        line-height: 1.4;
    }

    .order-item-info {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0;
    }

    .order-item-total {
        text-align: right;
    }

    .order-item-price {
        font-size: 15px;
        font-weight: 700;
        color: var(--primary-color);
        margin: 0;
    }

    /* 가격 요약 */
    .price-summary {
        padding-top: 16px;
        border-top: 2px solid var(--border-color);
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        font-size: 15px;
    }

    .summary-divider {
        height: 1px;
        background-color: var(--border-color);
        margin: 12px 0;
    }

    .summary-total {
        font-size: 18px;
        font-weight: 700;
        color: var(--primary-color);
        padding-top: 12px;
    }

    /* 결제 수단 선택 */
    .payment-methods {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }

    .payment-method-option {
        position: relative;
        cursor: pointer;
    }

    .payment-method-option input[type="radio"] {
        position: absolute;
        opacity: 0;
        cursor: pointer;
    }

    .payment-method-label {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px;
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        background-color: var(--bg-primary);
        transition: var(--transition);
    }

    .payment-method-option input[type="radio"]:checked + .payment-method-label {
        border-color: var(--primary-color);
        background-color: rgba(37, 99, 235, 0.05);
    }

    .payment-method-label:hover {
        border-color: var(--primary-color);
    }

    .payment-icon {
        font-size: 24px;
    }

    .payment-method-label span:last-child {
        font-weight: 500;
        color: var(--text-primary);
    }

    /* 주문 안내 */
    .checkout-notice {
        background-color: var(--bg-secondary);
        padding: 20px;
        border-radius: var(--border-radius);
        border: 1px solid var(--border-color);
    }

    .checkout-notice h4 {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 12px;
    }

    .checkout-notice ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .checkout-notice li {
        font-size: 14px;
        color: var(--text-secondary);
        padding: 6px 0;
        padding-left: 16px;
        position: relative;
    }

    .checkout-notice li:before {
        content: "•";
        position: absolute;
        left: 0;
        color: var(--primary-color);
        font-weight: bold;
    }

    /* 반응형 디자인 */
    @media (max-width: 1024px) {
        .checkout-container {
            grid-template-columns: 1fr;
        }

        .checkout-summary-section .card {
            position: static;
        }

        .payment-methods {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 768px) {
        .order-item {
            grid-template-columns: 50px 1fr;
            gap: 10px;
        }

        .order-item-total {
            grid-column: 2;
            text-align: left;
            margin-top: 4px;
        }

        .payment-method-label {
            padding: 12px;
        }

        .payment-icon {
            font-size: 20px;
        }
    }
`;
document.head.appendChild(style);
