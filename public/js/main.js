// ===================================
// API 호출 헬퍼 함수 (API Helper Functions)
// ===================================

/**
 * API 기본 URL
 */
const API_BASE_URL = '/api';

/**
 * Fetch wrapper - API 호출을 위한 헬퍼 함수
 * @param {string} endpoint - API 엔드포인트
 * @param {object} options - fetch 옵션
 * @returns {Promise<object>} - API 응답 데이터
 */
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // 쿠키 포함
    };

    // 토큰이 있으면 헤더에 추가
    const token = getToken();
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

/**
 * GET 요청
 */
async function apiGet(endpoint) {
    return apiCall(endpoint, { method: 'GET' });
}

/**
 * POST 요청
 */
async function apiPost(endpoint, data) {
    return apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * PUT 요청
 */
async function apiPut(endpoint, data) {
    return apiCall(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

/**
 * DELETE 요청
 */
async function apiDelete(endpoint) {
    return apiCall(endpoint, { method: 'DELETE' });
}

// ===================================
// 토큰 관리 함수 (Token Management)
// ===================================

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

/**
 * 토큰 저장 (localStorage)
 * @param {string} token - JWT 토큰
 */
function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * 토큰 가져오기
 * @returns {string|null} - 저장된 토큰
 */
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * 토큰 삭제
 */
function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

/**
 * 사용자 데이터 저장
 * @param {object} userData - 사용자 정보
 */
function saveUserData(userData) {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
}

/**
 * 사용자 데이터 가져오기
 * @returns {object|null} - 저장된 사용자 정보
 */
function getUserData() {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
}

/**
 * 사용자 데이터 삭제
 */
function removeUserData() {
    localStorage.removeItem(USER_KEY);
}

/**
 * 쿠키에서 토큰 가져오기
 * @param {string} name - 쿠키 이름
 * @returns {string|null} - 쿠키 값
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
}

/**
 * 쿠키 삭제
 * @param {string} name - 쿠키 이름
 */
function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ===================================
// 사용자 인증 상태 체크 (Authentication Check)
// ===================================

/**
 * 사용자 로그인 상태 확인
 * @returns {boolean} - 로그인 여부
 */
function isAuthenticated() {
    const token = getToken() || getCookie('token');
    return !!token;
}

/**
 * 인증 상태 검증 (서버에 토큰 검증 요청)
 * @returns {Promise<boolean>} - 유효한 토큰 여부
 */
async function verifyAuth() {
    try {
        const response = await apiGet('/auth/verify');
        return response.success;
    } catch (error) {
        console.error('Auth verification failed:', error);
        return false;
    }
}

/**
 * 로그인 필요 페이지 보호
 * 로그인하지 않은 경우 로그인 페이지로 리다이렉트
 */
async function requireAuth() {
    if (!isAuthenticated()) {
        redirectToLogin();
        return false;
    }

    const isValid = await verifyAuth();
    if (!isValid) {
        logout();
        redirectToLogin();
        return false;
    }

    return true;
}

/**
 * 로그인 페이지로 리다이렉트
 */
function redirectToLogin() {
    const currentPath = window.location.pathname;
    window.location.href = `/pages/login.html?redirect=${encodeURIComponent(currentPath)}`;
}

/**
 * 로그아웃 처리
 */
async function logout() {
    try {
        await apiPost('/auth/logout', {});
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        removeToken();
        removeUserData();
        deleteCookie('token');
        window.location.href = '/pages/login.html';
    }
}

// ===================================
// 헤더 동적 업데이트 (Dynamic Header Update)
// ===================================

/**
 * 헤더 초기화 및 업데이트
 */
async function initializeHeader() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    if (isAuthenticated()) {
        const isValid = await verifyAuth();
        if (isValid) {
            renderAuthenticatedHeader(headerActions);
        } else {
            renderUnauthenticatedHeader(headerActions);
        }
    } else {
        renderUnauthenticatedHeader(headerActions);
    }
}

/**
 * 로그인 상태 헤더 렌더링
 * @param {HTMLElement} container - 헤더 액션 컨테이너
 */
function renderAuthenticatedHeader(container) {
    const userData = getUserData();
    const userName = userData?.name || '사용자';

    container.innerHTML = `
        <a href="/pages/cart.html" class="header-link">
            <span>🛒</span> 장바구니
        </a>
        <a href="/pages/mypage.html" class="header-link">
            <span>👤</span> 마이페이지
        </a>
        <div class="header-user">
            <span class="header-user-name">${userName}</span>님
        </div>
        <button class="btn btn-secondary" id="logout-btn">로그아웃</button>
    `;

    // 로그아웃 버튼 이벤트 리스너
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

/**
 * 비로그인 상태 헤더 렌더링
 * @param {HTMLElement} container - 헤더 액션 컨테이너
 */
function renderUnauthenticatedHeader(container) {
    container.innerHTML = `
        <a href="/pages/login.html" class="btn btn-outline">로그인</a>
        <a href="/pages/register.html" class="btn btn-primary">회원가입</a>
    `;
}

// ===================================
// 알림 메시지 표시 (Alert Messages)
// ===================================

/**
 * 알림 메시지 표시
 * @param {string} message - 메시지 내용
 * @param {string} type - 메시지 타입 (success, error, warning, info)
 * @param {number} duration - 표시 시간 (ms)
 */
function showAlert(message, type = 'info', duration = 3000) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '10000';
    alertDiv.style.minWidth = '300px';
    alertDiv.style.boxShadow = 'var(--shadow-lg)';

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(alertDiv);
        }, 300);
    }, duration);
}

/**
 * 성공 메시지 표시
 */
function showSuccess(message, duration) {
    showAlert(message, 'success', duration);
}

/**
 * 에러 메시지 표시
 */
function showError(message, duration) {
    showAlert(message, 'error', duration);
}

/**
 * 경고 메시지 표시
 */
function showWarning(message, duration) {
    showAlert(message, 'warning', duration);
}

/**
 * 정보 메시지 표시
 */
function showInfo(message, duration) {
    showAlert(message, 'info', duration);
}

// ===================================
// 로딩 스피너 (Loading Spinner)
// ===================================

let loadingOverlay = null;

/**
 * 로딩 스피너 표시
 */
function showLoading() {
    if (loadingOverlay) return;

    loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loadingOverlay);
}

/**
 * 로딩 스피너 숨기기
 */
function hideLoading() {
    if (loadingOverlay) {
        document.body.removeChild(loadingOverlay);
        loadingOverlay = null;
    }
}

// ===================================
// 유틸리티 함수 (Utility Functions)
// ===================================

/**
 * 가격 포맷팅 (원화)
 * @param {number} price - 가격
 * @returns {string} - 포맷된 가격
 */
function formatPrice(price) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
    }).format(price);
}

/**
 * 날짜 포맷팅
 * @param {string|Date} date - 날짜
 * @returns {string} - 포맷된 날짜
 */
function formatDate(date) {
    const d = new Date(date);
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

/**
 * URL 쿼리 파라미터 가져오기
 * @param {string} param - 파라미터 이름
 * @returns {string|null} - 파라미터 값
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * 폼 데이터를 객체로 변환
 * @param {HTMLFormElement} form - 폼 엘리먼트
 * @returns {object} - 폼 데이터 객체
 */
function formToObject(form) {
    const formData = new FormData(form);
    const obj = {};
    for (const [key, value] of formData.entries()) {
        obj[key] = value;
    }
    return obj;
}

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {number} delay - 지연 시간 (ms)
 * @returns {Function} - 디바운스된 함수
 */
function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// ===================================
// 페이지 로드 시 초기화 (Page Initialization)
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // 헤더 초기화
    initializeHeader();

    // 검색 기능 초기화
    const searchForm = document.querySelector('.header-search');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchInput = searchForm.querySelector('.search-input');
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/pages/index.html?search=${encodeURIComponent(query)}`;
            }
        });
    }
});

// ===================================
// 전역 객체로 내보내기 (Export to Global)
// ===================================

window.API = {
    call: apiCall,
    get: apiGet,
    post: apiPost,
    put: apiPut,
    delete: apiDelete,
};

window.Auth = {
    isAuthenticated,
    verifyAuth,
    requireAuth,
    logout,
    saveToken,
    getToken,
    removeToken,
    saveUserData,
    getUserData,
    removeUserData,
};

window.UI = {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    hideLoading,
    initializeHeader,
};

window.Utils = {
    formatPrice,
    formatDate,
    getQueryParam,
    formToObject,
    debounce,
};
