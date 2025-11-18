// ===================================
// 상품 상세 페이지 기능 (Product Detail Page)
// ===================================

let currentProduct = null;

/**
 * 페이지 초기화
 */
async function initializeProductDetailPage() {
    // URL에서 상품 ID 가져오기
    const productId = Utils.getQueryParam('id');
    
    if (!productId) {
        showErrorState('상품 ID가 제공되지 않았습니다.');
        return;
    }

    // 상품 정보 로드
    await loadProductDetail(productId);
}

/**
 * 상품 상세 정보 로드
 * @param {string} productId - 상품 ID
 */
async function loadProductDetail(productId) {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const productDetail = document.getElementById('product-detail');

    try {
        // 로딩 상태 표시
        loadingState.classList.remove('hidden');
        errorState.classList.add('hidden');
        productDetail.classList.add('hidden');

        // API 호출
        const response = await API.get(`/products/${productId}`);
        
        if (response.success && response.data) {
            currentProduct = response.data;
            renderProductDetail(currentProduct);
            productDetail.classList.remove('hidden');
        } else {
            throw new Error('상품 정보를 불러올 수 없습니다');
        }
    } catch (error) {
        console.error('상품 로드 에러:', error);
        showErrorState(error.message || '상품을 불러오는데 실패했습니다');
    } finally {
        loadingState.classList.add('hidden');
    }
}

/**
 * 상품 상세 정보 렌더링
 * @param {Object} product - 상품 객체
 */
function renderProductDetail(product) {
    const {
        product_id,
        name,
        description,
        price,
        stock_quantity,
        category,
        image_url
    } = product;

    // 카테고리는 이미 한글로 저장되어 있음
    const categoryText = category || '기타';

    // 이미지 설정
    const productImage = document.getElementById('product-image');
    productImage.src = image_url || '/images/placeholder.svg';
    productImage.alt = name;

    // 카테고리 설정
    document.getElementById('product-category').textContent = categoryText;

    // 상품명 설정
    document.getElementById('product-name').textContent = name;

    // 가격 설정
    document.getElementById('product-price').textContent = Utils.formatPrice(price);

    // 설명 설정
    const descriptionElement = document.getElementById('product-description');
    descriptionElement.textContent = description || '상품 설명이 없습니다.';

    // 재고 정보 설정
    renderStockInfo(stock_quantity);

    // 장바구니 버튼 설정
    setupAddToCartButton(stock_quantity);
}

/**
 * 재고 정보 렌더링
 * @param {number} stockQuantity - 재고 수량
 */
function renderStockInfo(stockQuantity) {
    const stockElement = document.getElementById('product-stock');
    
    if (stockQuantity === 0) {
        stockElement.className = 'product-detail-stock out-of-stock';
        stockElement.innerHTML = '⚠️ <strong>품절</strong> - 현재 재고가 없습니다';
    } else if (stockQuantity <= 5) {
        stockElement.className = 'product-detail-stock low-stock';
        stockElement.innerHTML = `⚠️ <strong>재고 부족</strong> - 남은 수량: ${stockQuantity}개`;
    } else {
        stockElement.className = 'product-detail-stock in-stock';
        stockElement.innerHTML = `✓ <strong>재고 있음</strong> - ${stockQuantity}개 구매 가능`;
    }
}

/**
 * 장바구니 추가 버튼 설정
 * @param {number} stockQuantity - 재고 수량
 */
function setupAddToCartButton(stockQuantity) {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const quantityInput = document.getElementById('quantity-input');
    const decreaseBtn = document.getElementById('decrease-btn');
    const increaseBtn = document.getElementById('increase-btn');
    
    // 재고가 없으면 버튼 비활성화
    if (stockQuantity === 0) {
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = '품절';
        quantityInput.disabled = true;
        decreaseBtn.disabled = true;
        increaseBtn.disabled = true;
    } else {
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = '🛒 장바구니 담기';
        quantityInput.disabled = false;
        
        // 수량 입력 최대값 설정
        quantityInput.max = stockQuantity;
        
        // 수량 감소 버튼
        decreaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value) || 1;
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });
        
        // 수량 증가 버튼
        increaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value) || 1;
            if (currentValue < stockQuantity) {
                quantityInput.value = currentValue + 1;
            }
        });
        
        // 수량 입력 검증
        quantityInput.addEventListener('input', () => {
            let value = parseInt(quantityInput.value) || 1;
            if (value < 1) value = 1;
            if (value > stockQuantity) value = stockQuantity;
            quantityInput.value = value;
        });
        
        // 클릭 이벤트 리스너 추가
        addToCartBtn.addEventListener('click', handleAddToCart);
    }
}

/**
 * 장바구니 추가 처리
 */
async function handleAddToCart() {
    // 로그인 확인
    if (!Auth.isAuthenticated()) {
        UI.showWarning('로그인이 필요한 서비스입니다.');
        setTimeout(() => {
            window.location.href = `/pages/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }, 1500);
        return;
    }

    if (!currentProduct) {
        UI.showError('상품 정보를 찾을 수 없습니다.');
        return;
    }

    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const quantityInput = document.getElementById('quantity-input');
    const quantity = parseInt(quantityInput.value) || 1;
    const originalText = addToCartBtn.textContent;

    try {
        // 버튼 비활성화
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = '추가 중...';

        // 디버깅: 전송할 데이터 확인
        console.log('장바구니 추가 요청:', {
            product_id: currentProduct.product_id,
            quantity: quantity
        });

        // API 호출
        const response = await API.post('/cart', {
            product_id: currentProduct.product_id,
            quantity: quantity
        });

        if (response.success) {
            UI.showSuccess(`장바구니에 상품 ${quantity}개가 추가되었습니다!`);
            
            // 버튼 텍스트 변경
            addToCartBtn.textContent = '✓ 추가 완료';
            
            // 수량 초기화
            quantityInput.value = 1;
            
            // 2초 후 원래 텍스트로 복원
            setTimeout(() => {
                addToCartBtn.textContent = originalText;
                addToCartBtn.disabled = false;
            }, 2000);
        } else {
            throw new Error(response.error || '장바구니 추가에 실패했습니다');
        }
    } catch (error) {
        console.error('장바구니 추가 에러:', error);
        
        // 에러 메시지 표시
        let errorMessage = '장바구니 추가에 실패했습니다.';
        
        if (error.message.includes('already exists')) {
            errorMessage = '이미 장바구니에 담긴 상품입니다.';
        } else if (error.message.includes('stock')) {
            errorMessage = '재고가 부족합니다.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        UI.showError(errorMessage);
        
        // 버튼 복원
        addToCartBtn.textContent = originalText;
        addToCartBtn.disabled = false;
    }
}

/**
 * 에러 상태 표시
 * @param {string} message - 에러 메시지
 */
function showErrorState(message) {
    const errorState = document.getElementById('error-state');
    const productDetail = document.getElementById('product-detail');
    
    errorState.classList.remove('hidden');
    productDetail.classList.add('hidden');
    
    // 에러 메시지 업데이트
    const errorText = errorState.querySelector('p');
    if (errorText && message) {
        errorText.textContent = message;
    }
}

// ===================================
// 페이지 로드 시 초기화
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initializeProductDetailPage();
});

// ===================================
// 전역 객체로 내보내기
// ===================================

window.ProductDetailPage = {
    loadProductDetail,
    handleAddToCart,
};
