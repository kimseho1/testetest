// 입력 검증 유틸리티 함수

// 이메일 형식 검증
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// 비밀번호 강도 검증 (최소 6자)
const isValidPassword = (password) => {
    return password && password.length >= 6;
};

// 전화번호 형식 검증 (한국 형식)
const isValidPhone = (phone) => {
    if (!phone) return true; // 선택적 필드
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    return phoneRegex.test(phone);
};

// 이름 검증 (2-50자)
const isValidName = (name) => {
    return name && name.length >= 2 && name.length <= 50;
};

// 가격 검증 (양수)
const isValidPrice = (price) => {
    return !isNaN(price) && parseFloat(price) > 0;
};

// 수량 검증 (양의 정수)
const isValidQuantity = (quantity) => {
    return Number.isInteger(quantity) && quantity > 0;
};

// 문자열 길이 검증
const isValidLength = (str, min, max) => {
    if (!str) return false;
    const length = str.length;
    return length >= min && length <= max;
};

// 필수 필드 검증
const validateRequiredFields = (data, requiredFields) => {
    const missingFields = [];
    
    for (const field of requiredFields) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            missingFields.push(field);
        }
    }
    
    return {
        isValid: missingFields.length === 0,
        missingFields
    };
};

// 회원가입 데이터 검증
const validateRegistrationData = (data) => {
    const errors = [];
    
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Invalid email format');
    }
    
    if (!data.password || !isValidPassword(data.password)) {
        errors.push('Password must be at least 6 characters');
    }
    
    if (!data.name || !isValidName(data.name)) {
        errors.push('Name must be between 2 and 50 characters');
    }
    
    if (data.phone && !isValidPhone(data.phone)) {
        errors.push('Invalid phone number format');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// 로그인 데이터 검증
const validateLoginData = (data) => {
    const errors = [];
    
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Invalid email format');
    }
    
    if (!data.password) {
        errors.push('Password is required');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// 상품 데이터 검증
const validateProductData = (data) => {
    const errors = [];
    
    if (!data.name || !isValidLength(data.name, 1, 255)) {
        errors.push('Product name must be between 1 and 255 characters');
    }
    
    if (!isValidPrice(data.price)) {
        errors.push('Price must be a positive number');
    }
    
    if (data.stock_quantity !== undefined && !Number.isInteger(data.stock_quantity)) {
        errors.push('Stock quantity must be an integer');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// 주문 데이터 검증
const validateOrderData = (data) => {
    const errors = [];
    
    if (!data.shipping_address || data.shipping_address.trim() === '') {
        errors.push('Shipping address is required');
    }
    
    if (!data.payment_method || data.payment_method.trim() === '') {
        errors.push('Payment method is required');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// SQL Injection 방지를 위한 입력 sanitization
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    // 위험한 문자 제거
    return input
        .replace(/[<>]/g, '') // HTML 태그 제거
        .trim();
};

module.exports = {
    isValidEmail,
    isValidPassword,
    isValidPhone,
    isValidName,
    isValidPrice,
    isValidQuantity,
    isValidLength,
    validateRequiredFields,
    validateRegistrationData,
    validateLoginData,
    validateProductData,
    validateOrderData,
    sanitizeInput
};
