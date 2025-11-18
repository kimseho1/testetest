// ===================================
// 상품 관련 기능 (Product Functions)
// ===================================

let currentCategory = 'all';
let currentSearchQuery = '';
let allProducts = [];

/**
 * 페이지 초기화
 */
async function initializeProductPage() {
    // URL에서 검색 쿼리 가져오기
    currentSearchQuery = Utils.getQueryParam('search') || '';
    
    if (currentSearchQuery) {
        document.getElementById('search-input').value = currentSearchQuery;
    }

    // 카테고리 필터 이벤트 리스너
    setupCategoryFilter();

    // 상품 목록 로드
    await loadProducts();
}

/**
 * 카테고리 필터 설정
 */
function setupCategoryFilter() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 활성 상태 변경
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 카테고리 변경
            currentCategory = button.dataset.category;
            
            // 상품 필터링
            filterProducts();
        });
    });
}

/**
 * 상품 목록 로드
 */
async function loadProducts() {
    const loadingState = document.getElementById('loading-state');
    const productList = document.getElementById('product-list');
    const emptyState = document.getElementById('empty-state');

    try {
        // 로딩 상태 표시
        loadingState.classList.remove('hidden');
        productList.innerHTML = '';
        emptyState.classList.add('hidden');

        // API 호출
        let endpoint = '/products';
        if (currentSearchQuery) {
            endpoint = `/products/search?q=${encodeURIComponent(currentSearchQuery)}`;
        }

        const response = await API.get(endpoint);
        
        console.log('API 응답:', response); // 디버깅용
        
        if (response.success && response.data) {
            // API 응답 구조: {success: true, data: {products: [...], total, page, totalPages}}
            // 또는 검색 시: {success: true, data: {products: [...], total, page, totalPages}}
            if (Array.isArray(response.data)) {
                // 배열인 경우 (검색 결과가 배열로 올 수 있음)
                allProducts = response.data;
            } else if (response.data.products) {
                // 객체인 경우 products 속성 사용
                allProducts = response.data.products;
            } else {
                allProducts = [];
            }
            
            console.log('로드된 상품 수:', allProducts.length); // 디버깅용
            filterProducts();
        } else {
            throw new Error('상품 데이터를 불러올 수 없습니다');
        }
    } catch (error) {
        console.error('상품 로드 에러:', error);
        UI.showError(error.message || '상품을 불러오는데 실패했습니다');
        emptyState.classList.remove('hidden');
    } finally {
        loadingState.classList.add('hidden');
    }
}

/**
 * 상품 필터링
 */
function filterProducts() {
    let filteredProducts = allProducts;

    // 카테고리 필터링
    if (currentCategory !== 'all') {
        filteredProducts = filteredProducts.filter(
            product => product.category === currentCategory
        );
    }

    // 상품 렌더링
    renderProducts(filteredProducts);
}

/**
 * 상품 목록 렌더링
 * @param {Array} products - 상품 배열
 */
function renderProducts(products) {
    const productList = document.getElementById('product-list');
    const emptyState = document.getElementById('empty-state');

    if (!products || products.length === 0) {
        productList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    productList.innerHTML = products.map(product => createProductCard(product)).join('');

    // 상품 카드 클릭 이벤트 리스너
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('click', () => {
            const productId = card.dataset.productId;
            window.location.href = `/pages/product-detail.html?id=${productId}`;
        });
    });
}

/**
 * 상품 카드 HTML 생성
 * @param {Object} product - 상품 객체
 * @returns {string} - 상품 카드 HTML
 */
function createProductCard(product) {
    const {
        product_id,
        name,
        description,
        price,
        stock_quantity,
        category,
        image_url
    } = product;

    // 재고 상태 결정
    let stockClass = '';
    let stockText = `재고: ${stock_quantity}개`;
    let badge = '';

    if (stock_quantity === 0) {
        stockClass = 'out';
        stockText = '품절';
        badge = '<div class="product-badge out-of-stock">품절</div>';
    } else if (stock_quantity <= 5) {
        stockClass = 'low';
        stockText = `재고 부족 (${stock_quantity}개)`;
    }

    // 이미지 URL 처리
    const imageUrl = image_url || '/images/placeholder.svg';

    // 카테고리는 이미 한글로 저장되어 있음
    const categoryText = category || '기타';

    return `
        <div class="product-card" data-product-id="${product_id}">
            <div class="product-image-container">
                <img 
                    src="${imageUrl}" 
                    alt="${name}" 
                    class="product-image"
                    onerror="this.src='/images/placeholder.svg'"
                >
                ${badge}
            </div>
            <div class="product-info">
                <div class="product-category">${categoryText}</div>
                <h3 class="product-name">${escapeHtml(name)}</h3>
                <p class="product-description">${escapeHtml(description || '')}</p>
                <div class="product-footer">
                    <div class="product-price">${Utils.formatPrice(price)}</div>
                    <div class="product-stock ${stockClass}">${stockText}</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * HTML 이스케이프 (XSS 방지)
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} - 이스케이프된 텍스트
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 검색 기능
 * @param {string} query - 검색어
 */
async function searchProducts(query) {
    currentSearchQuery = query;
    await loadProducts();
}

// ===================================
// 페이지 로드 시 초기화
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initializeProductPage();
});

// ===================================
// 전역 객체로 내보내기
// ===================================

window.ProductPage = {
    loadProducts,
    searchProducts,
    filterProducts,
};
