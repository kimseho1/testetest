// ===================================
// 마이페이지 JavaScript (My Page)
// ===================================

let currentUserProfile = null;
let currentOrders = [];

// ===================================
// 페이지 초기화 (Page Initialization)
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    // 인증 체크
    const isAuth = await Auth.requireAuth();
    if (!isAuth) {
        return;
    }

    // 데이터 로드
    await loadUserProfile();
    await loadOrders();

    // 이벤트 리스너 설정
    setupEventListeners();
});

// ===================================
// 사용자 프로필 로드 (Load User Profile)
// ===================================

async function loadUserProfile() {
    try {
        const response = await API.get('/users/profile');
        
        if (response.success && response.data) {
            // response.data.user 또는 response.data 직접 사용
            const userData = response.data.user || response.data;
            currentUserProfile = userData;
            displayUserProfile(userData);
            
            // 사용자 데이터 저장
            Auth.saveUserData(userData);
        }
    } catch (error) {
        console.error('Failed to load user profile:', error);
        UI.showError('사용자 정보를 불러오는데 실패했습니다.');
    }
}

/**
 * 사용자 프로필 표시
 */
function displayUserProfile(profile) {
    document.getElementById('profile-name').textContent = profile.name || '-';
    document.getElementById('profile-email').textContent = profile.email || '-';
    document.getElementById('profile-phone').textContent = profile.phone || '-';
    document.getElementById('profile-created').textContent = 
        profile.created_at || profile.createdAt ? Utils.formatDate(profile.created_at || profile.createdAt) : '-';
}

// ===================================
// 주문 내역 로드 (Load Orders)
// ===================================

async function loadOrders() {
    const loadingEl = document.getElementById('orders-loading');
    const emptyEl = document.getElementById('orders-empty');
    const listEl = document.getElementById('orders-list');

    try {
        loadingEl.classList.remove('hidden');
        emptyEl.classList.add('hidden');
        listEl.classList.add('hidden');

        const response = await API.get('/orders');
        
        if (response.success && response.data) {
            // response.data.orders 또는 response.data가 배열인 경우 처리
            const orders = response.data.orders || (Array.isArray(response.data) ? response.data : []);
            currentOrders = orders;
            
            loadingEl.classList.add('hidden');
            
            if (currentOrders.length === 0) {
                emptyEl.classList.remove('hidden');
            } else {
                listEl.classList.remove('hidden');
                displayOrders(currentOrders);
            }
        }
    } catch (error) {
        console.error('Failed to load orders:', error);
        loadingEl.classList.add('hidden');
        UI.showError('주문 내역을 불러오는데 실패했습니다.');
    }
}

/**
 * 주문 목록 표시
 */
function displayOrders(orders) {
    const listEl = document.getElementById('orders-list');
    listEl.innerHTML = '';

    orders.forEach(order => {
        const orderEl = createOrderElement(order);
        listEl.appendChild(orderEl);
    });
}

/**
 * 주문 아이템 엘리먼트 생성
 */
function createOrderElement(order) {
    const div = document.createElement('div');
    div.className = 'order-item';
    div.dataset.orderId = order.order_id;

    const statusText = getStatusText(order.status);
    const statusClass = order.status;

    div.innerHTML = `
        <div class="order-header">
            <div>
                <div class="order-number">주문번호: ${order.order_id}</div>
                <div class="order-date">${Utils.formatDate(order.created_at)}</div>
            </div>
            <span class="order-status ${statusClass}">${statusText}</span>
        </div>
        <div class="order-body">
            <div class="order-info-row">
                <span class="order-label">주문 상품</span>
                <span class="order-value">${order.item_count || 1}개 상품</span>
            </div>
            <div class="order-info-row">
                <span class="order-label">결제 금액</span>
                <span class="order-total">${Utils.formatPrice(order.total_amount)}</span>
            </div>
        </div>
    `;

    // 클릭 이벤트 - 주문 상세 보기
    div.addEventListener('click', () => {
        showOrderDetail(order.order_id);
    });

    return div;
}

/**
 * 주문 상태 텍스트 변환
 */
function getStatusText(status) {
    const statusMap = {
        'pending': '결제 대기',
        'processing': '처리중',
        'shipped': '배송중',
        'delivered': '배송완료',
        'cancelled': '취소됨'
    };
    return statusMap[status] || status;
}

// ===================================
// 주문 상세 보기 (Order Detail)
// ===================================

async function showOrderDetail(orderId) {
    try {
        UI.showLoading();
        
        const response = await API.get(`/orders/${orderId}`);
        
        if (response.success && response.data) {
            displayOrderDetail(response.data);
            openModal();
        }
    } catch (error) {
        console.error('Failed to load order detail:', error);
        UI.showError('주문 상세 정보를 불러오는데 실패했습니다.');
    } finally {
        UI.hideLoading();
    }
}

/**
 * 주문 상세 정보 표시
 */
function displayOrderDetail(order) {
    const contentEl = document.getElementById('order-detail-content');
    
    const statusText = getStatusText(order.status);
    const statusClass = order.status;

    contentEl.innerHTML = `
        <!-- 주문 기본 정보 -->
        <div class="order-detail-section">
            <h4>주문 정보</h4>
            <div class="order-detail-info">
                <div class="order-detail-row">
                    <span class="order-detail-label">주문번호</span>
                    <span class="order-detail-value">${order.order_id}</span>
                </div>
                <div class="order-detail-row">
                    <span class="order-detail-label">주문일시</span>
                    <span class="order-detail-value">${Utils.formatDate(order.created_at)}</span>
                </div>
                <div class="order-detail-row">
                    <span class="order-detail-label">주문상태</span>
                    <span class="order-status ${statusClass}">${statusText}</span>
                </div>
                <div class="order-detail-row">
                    <span class="order-detail-label">결제수단</span>
                    <span class="order-detail-value">${order.payment_method || '-'}</span>
                </div>
            </div>
        </div>

        <!-- 주문 상품 목록 -->
        <div class="order-detail-section">
            <h4>주문 상품</h4>
            <div class="order-items-list">
                ${order.items ? order.items.map(item => {
                    const productName = item.name || item.product_name || '상품명 없음';
                    return `
                    <div class="order-item-card">
                        <img src="${item.image_url || '/images/placeholder.png'}" 
                             alt="${productName}" 
                             class="order-item-image"
                             onerror="this.src='/images/placeholder.png'">
                        <div class="order-item-info">
                            <div>
                                <div class="order-item-name">${productName}</div>
                                <div class="order-item-details">
                                    수량: ${item.quantity}개 | 
                                    단가: ${Utils.formatPrice(item.price)}
                                </div>
                            </div>
                            <div class="order-item-price">
                                ${Utils.formatPrice(item.price * item.quantity)}
                            </div>
                        </div>
                    </div>
                `}).join('') : '<p class="text-secondary">상품 정보가 없습니다.</p>'}
            </div>
        </div>

        <!-- 배송지 정보 -->
        <div class="order-detail-section">
            <h4>배송지 정보</h4>
            <div class="shipping-address">${order.shipping_address || '배송지 정보가 없습니다.'}</div>
        </div>

        <!-- 결제 정보 -->
        <div class="order-detail-section">
            <h4>결제 정보</h4>
            <div class="order-summary">
                <div class="order-summary-row">
                    <span class="order-summary-label">상품 금액</span>
                    <span class="order-summary-value">${Utils.formatPrice(order.total_amount)}</span>
                </div>
                <div class="order-summary-row">
                    <span class="order-summary-label">배송비</span>
                    <span class="order-summary-value">무료</span>
                </div>
                <div class="order-summary-row total">
                    <span class="order-summary-label">총 결제 금액</span>
                    <span class="order-summary-value">${Utils.formatPrice(order.total_amount)}</span>
                </div>
            </div>
        </div>
    `;
}

// ===================================
// 프로필 수정 (Edit Profile)
// ===================================

function showEditForm() {
    const viewEl = document.getElementById('profile-view');
    const formEl = document.getElementById('profile-edit-form');
    const editBtn = document.getElementById('edit-profile-btn');

    // 현재 값으로 폼 채우기
    if (currentUserProfile) {
        document.getElementById('edit-name').value = currentUserProfile.name || '';
        document.getElementById('edit-email').value = currentUserProfile.email || '';
        document.getElementById('edit-phone').value = currentUserProfile.phone || '';
    }

    viewEl.classList.add('hidden');
    formEl.classList.remove('hidden');
    editBtn.classList.add('hidden');
}

function hideEditForm() {
    const viewEl = document.getElementById('profile-view');
    const formEl = document.getElementById('profile-edit-form');
    const editBtn = document.getElementById('edit-profile-btn');

    viewEl.classList.remove('hidden');
    formEl.classList.add('hidden');
    editBtn.classList.remove('hidden');
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const name = document.getElementById('edit-name').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();

    if (!name) {
        UI.showError('이름을 입력해주세요.');
        return;
    }

    try {
        UI.showLoading();

        const response = await API.put('/users/profile', {
            name,
            phone
        });

        if (response.success) {
            UI.showSuccess('프로필이 수정되었습니다.');
            await loadUserProfile();
            hideEditForm();
            
            // 헤더 업데이트
            UI.initializeHeader();
        }
    } catch (error) {
        console.error('Failed to update profile:', error);
        UI.showError(error.message || '프로필 수정에 실패했습니다.');
    } finally {
        UI.hideLoading();
    }
}

// ===================================
// 모달 관리 (Modal Management)
// ===================================

function openModal() {
    const modal = document.getElementById('order-detail-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('order-detail-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// ===================================
// 이벤트 리스너 설정 (Event Listeners)
// ===================================

function setupEventListeners() {
    // 프로필 수정 버튼
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
        editBtn.addEventListener('click', showEditForm);
    }

    // 프로필 수정 취소 버튼
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideEditForm);
    }

    // 프로필 수정 폼 제출
    const editForm = document.getElementById('profile-edit-form');
    if (editForm) {
        editForm.addEventListener('submit', handleProfileUpdate);
    }

    // 모달 닫기 버튼
    const closeModalBtn = document.getElementById('close-modal-btn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // 모달 오버레이 클릭
    const modal = document.getElementById('order-detail-modal');
    if (modal) {
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeModal);
        }
    }

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}
