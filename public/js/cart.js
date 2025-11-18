// ===================================
// 장바구니 페이지 (Cart Page)
// ===================================

let cartItems = [];
let cartSummary = {
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

    // 장바구니 데이터 로드
    await loadCart();

    // 결제 버튼 이벤트 리스너
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
});

// ===================================
// 장바구니 데이터 로드 (Load Cart Data)
// ===================================

/**
 * 장바구니 데이터 로드
 */
async function loadCart() {
    const loadingState = document.getElementById('loading-state');
    const emptyCart = document.getElementById('empty-cart');
    const cartItemsList = document.getElementById('cart-items-list');

    try {
        // 로딩 상태 표시
        loadingState.classList.remove('hidden');
        emptyCart.classList.add('hidden');
        cartItemsList.innerHTML = '';

        // API 호출
        const response = await API.get('/cart');
        
        if (response.success && response.data) {
            cartItems = response.data.items || [];
            
            // 장바구니가 비어있는 경우
            if (cartItems.length === 0) {
                showEmptyCart();
            } else {
                renderCartItems();
                calculateSummary();
            }
        } else {
            showEmptyCart();
        }
    } catch (error) {
        console.error('장바구니 로드 실패:', error);
        UI.showError('장바구니를 불러오는데 실패했습니다.');
        showEmptyCart();
    } finally {
        loadingState.classList.add('hidden');
    }
}

/**
 * 빈 장바구니 표시
 */
function showEmptyCart() {
    const emptyCart = document.getElementById('empty-cart');
    const cartItemsList = document.getElementById('cart-items-list');
    const checkoutBtn = document.getElementById('checkout-btn');

    emptyCart.classList.remove('hidden');
    cartItemsList.innerHTML = '';
    checkoutBtn.disabled = true;

    // 요약 정보 초기화
    updateSummaryDisplay(0, 0, 0);
}

// ===================================
// 장바구니 아이템 렌더링 (Render Cart Items)
// ===================================

/**
 * 장바구니 아이템 목록 렌더링
 */
function renderCartItems() {
    const cartItemsList = document.getElementById('cart-items-list');
    const emptyCart = document.getElementById('empty-cart');
    const checkoutBtn = document.getElementById('checkout-btn');

    emptyCart.classList.add('hidden');
    checkoutBtn.disabled = false;

    cartItemsList.innerHTML = cartItems.map(item => createCartItemHTML(item)).join('');

    // 이벤트 리스너 등록
    attachCartItemEventListeners();
}

/**
 * 장바구니 아이템 HTML 생성
 * @param {object} item - 장바구니 아이템
 * @returns {string} - HTML 문자열
 */
function createCartItemHTML(item) {
    const itemTotal = item.price * item.quantity;
    const imageUrl = item.image_url || '/images/placeholder.png';
    const productName = item.name || item.product_name || '상품명 없음';

    return `
        <div class="cart-item" data-item-id="${item.cart_item_id}">
            <div class="cart-item-image">
                <img src="${imageUrl}" alt="${productName}" onerror="this.src='/images/placeholder.png'">
            </div>
            <div class="cart-item-details">
                <h3 class="cart-item-name">${productName}</h3>
                <p class="cart-item-price">${Utils.formatPrice(item.price)}</p>
                ${item.stock_quantity < 5 ? `<p class="cart-item-stock-warning">재고 ${item.stock_quantity}개 남음</p>` : ''}
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn quantity-decrease" data-item-id="${item.cart_item_id}" ${item.quantity <= 1 ? 'disabled' : ''}>
                    -
                </button>
                <input 
                    type="number" 
                    class="quantity-input" 
                    value="${item.quantity}" 
                    min="1" 
                    max="${item.stock_quantity}"
                    data-item-id="${item.cart_item_id}"
                    readonly
                >
                <button class="quantity-btn quantity-increase" data-item-id="${item.cart_item_id}" ${item.quantity >= item.stock_quantity ? 'disabled' : ''}>
                    +
                </button>
            </div>
            <div class="cart-item-total">
                <p class="item-total-price">${Utils.formatPrice(itemTotal)}</p>
            </div>
            <div class="cart-item-actions">
                <button class="btn-remove" data-item-id="${item.cart_item_id}" title="삭제">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

/**
 * 장바구니 아이템 이벤트 리스너 등록
 */
function attachCartItemEventListeners() {
    // 수량 감소 버튼
    document.querySelectorAll('.quantity-decrease').forEach(btn => {
        btn.addEventListener('click', handleQuantityDecrease);
    });

    // 수량 증가 버튼
    document.querySelectorAll('.quantity-increase').forEach(btn => {
        btn.addEventListener('click', handleQuantityIncrease);
    });

    // 삭제 버튼
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', handleRemoveItem);
    });
}

// ===================================
// 장바구니 아이템 조작 (Cart Item Actions)
// ===================================

/**
 * 수량 감소 처리
 * @param {Event} e - 클릭 이벤트
 */
async function handleQuantityDecrease(e) {
    const itemId = e.target.dataset.itemId;
    const item = cartItems.find(i => i.cart_item_id == itemId);
    
    if (!item || item.quantity <= 1) return;

    await updateItemQuantity(itemId, item.quantity - 1);
}

/**
 * 수량 증가 처리
 * @param {Event} e - 클릭 이벤트
 */
async function handleQuantityIncrease(e) {
    const itemId = e.target.dataset.itemId;
    const item = cartItems.find(i => i.cart_item_id == itemId);
    
    if (!item || item.quantity >= item.stock_quantity) {
        UI.showWarning('재고가 부족합니다.');
        return;
    }

    await updateItemQuantity(itemId, item.quantity + 1);
}

/**
 * 아이템 수량 업데이트
 * @param {number} itemId - 장바구니 아이템 ID
 * @param {number} newQuantity - 새로운 수량
 */
async function updateItemQuantity(itemId, newQuantity) {
    try {
        UI.showLoading();

        const response = await API.put(`/cart/${itemId}`, {
            quantity: newQuantity
        });

        if (response.success) {
            // 로컬 데이터 업데이트
            const item = cartItems.find(i => i.cart_item_id == itemId);
            if (item) {
                item.quantity = newQuantity;
            }

            // UI 업데이트
            renderCartItems();
            calculateSummary();
            UI.showSuccess('수량이 변경되었습니다.');
        }
    } catch (error) {
        console.error('수량 변경 실패:', error);
        UI.showError('수량 변경에 실패했습니다.');
    } finally {
        UI.hideLoading();
    }
}

/**
 * 아이템 삭제 처리
 * @param {Event} e - 클릭 이벤트
 */
async function handleRemoveItem(e) {
    const itemId = e.target.dataset.itemId;
    
    if (!confirm('이 상품을 장바구니에서 삭제하시겠습니까?')) {
        return;
    }

    try {
        UI.showLoading();

        const response = await API.delete(`/cart/${itemId}`);

        if (response.success) {
            // 로컬 데이터에서 제거
            cartItems = cartItems.filter(i => i.cart_item_id != itemId);

            // UI 업데이트
            if (cartItems.length === 0) {
                showEmptyCart();
            } else {
                renderCartItems();
                calculateSummary();
            }

            UI.showSuccess('상품이 삭제되었습니다.');
        }
    } catch (error) {
        console.error('상품 삭제 실패:', error);
        UI.showError('상품 삭제에 실패했습니다.');
    } finally {
        UI.hideLoading();
    }
}

// ===================================
// 주문 요약 계산 (Calculate Summary)
// ===================================

/**
 * 주문 요약 정보 계산
 */
function calculateSummary() {
    // 상품 금액 계산
    const subtotal = cartItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);

    // 배송비 계산 (50,000원 이상 무료배송)
    const shipping = subtotal >= 50000 ? 0 : 3000;

    // 총 금액
    const total = subtotal + shipping;

    // 요약 정보 저장
    cartSummary = { subtotal, shipping, total };

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
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const totalEl = document.getElementById('total');

    if (subtotalEl) subtotalEl.textContent = Utils.formatPrice(subtotal);
    if (shippingEl) {
        shippingEl.textContent = shipping === 0 ? '무료' : Utils.formatPrice(shipping);
    }
    if (totalEl) totalEl.textContent = Utils.formatPrice(total);
}

// ===================================
// 결제 처리 (Checkout)
// ===================================

/**
 * 결제 페이지로 이동
 */
function handleCheckout() {
    if (cartItems.length === 0) {
        UI.showWarning('장바구니가 비어있습니다.');
        return;
    }

    // 재고 확인
    const outOfStockItems = cartItems.filter(item => item.quantity > item.stock_quantity);
    if (outOfStockItems.length > 0) {
        UI.showError('일부 상품의 재고가 부족합니다. 수량을 조정해주세요.');
        return;
    }

    // 결제 페이지로 이동
    window.location.href = '/pages/checkout.html';
}

// ===================================
// CSS 스타일 추가 (Additional Styles)
// ===================================

// 장바구니 페이지 전용 스타일을 동적으로 추가
const style = document.createElement('style');
style.textContent = `
    .cart-container {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 24px;
        margin-top: 32px;
    }

    .cart-items-section {
        min-height: 400px;
    }

    .cart-item {
        display: grid;
        grid-template-columns: 100px 1fr 150px 120px 50px;
        gap: 20px;
        align-items: center;
        background-color: var(--bg-primary);
        padding: 20px;
        border-radius: var(--border-radius);
        margin-bottom: 16px;
        box-shadow: var(--shadow-sm);
        transition: var(--transition);
    }

    .cart-item:hover {
        box-shadow: var(--shadow-md);
    }

    .cart-item-image img {
        width: 100px;
        height: 100px;
        object-fit: cover;
        border-radius: var(--border-radius);
    }

    .cart-item-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .cart-item-name {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .cart-item-price {
        font-size: 16px;
        color: var(--text-secondary);
        margin: 0;
    }

    .cart-item-stock-warning {
        font-size: 14px;
        color: var(--danger-color);
        margin: 0;
    }

    .cart-item-quantity {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .quantity-btn {
        width: 32px;
        height: 32px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        background-color: var(--bg-primary);
        color: var(--text-primary);
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: var(--transition);
    }

    .quantity-btn:hover:not(:disabled) {
        background-color: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
    }

    .quantity-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .quantity-input {
        width: 60px;
        height: 32px;
        text-align: center;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 16px;
        font-weight: 500;
    }

    .cart-item-total {
        text-align: right;
    }

    .item-total-price {
        font-size: 18px;
        font-weight: 700;
        color: var(--primary-color);
        margin: 0;
    }

    .cart-item-actions {
        display: flex;
        justify-content: center;
    }

    .btn-remove {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
        transition: var(--transition);
    }

    .btn-remove:hover {
        background-color: var(--bg-secondary);
        transform: scale(1.1);
    }

    .cart-summary {
        position: sticky;
        top: 100px;
        height: fit-content;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        font-size: 16px;
    }

    .summary-divider {
        height: 1px;
        background-color: var(--border-color);
        margin: 12px 0;
    }

    .summary-total {
        font-size: 20px;
        font-weight: 700;
        color: var(--primary-color);
        padding-top: 16px;
    }

    .loading-state,
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
    }

    .empty-icon {
        font-size: 80px;
        margin-bottom: 20px;
    }

    .empty-state h3 {
        font-size: 24px;
        color: var(--text-primary);
        margin-bottom: 8px;
    }

    .empty-state p {
        font-size: 16px;
        color: var(--text-secondary);
    }

    @media (max-width: 1024px) {
        .cart-container {
            grid-template-columns: 1fr;
        }

        .cart-summary {
            position: static;
        }

        .cart-item {
            grid-template-columns: 80px 1fr;
            gap: 16px;
        }

        .cart-item-quantity,
        .cart-item-total {
            grid-column: 2;
        }

        .cart-item-actions {
            grid-column: 2;
            justify-content: flex-end;
        }
    }

    @media (max-width: 768px) {
        .cart-item {
            grid-template-columns: 1fr;
            text-align: center;
        }

        .cart-item-image {
            margin: 0 auto;
        }

        .cart-item-quantity {
            justify-content: center;
        }

        .cart-item-total {
            text-align: center;
        }

        .cart-item-actions {
            justify-content: center;
        }
    }
`;
document.head.appendChild(style);
