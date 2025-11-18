// ===================================
// 인증 페이지 JavaScript (Authentication Pages)
// ===================================

/**
 * 회원가입 처리
 * @param {Event} event - 폼 제출 이벤트
 */
async function handleRegister(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('.auth-submit-btn');
    const errorElements = form.querySelectorAll('.form-error');

    // 기존 에러 메시지 초기화
    errorElements.forEach(el => el.classList.remove('show'));

    // 폼 데이터 수집
    const formData = {
        email: form.email.value.trim(),
        password: form.password.value,
        confirmPassword: form.confirmPassword?.value,
        name: form.name.value.trim(),
        phone: form.phone?.value.trim() || null,
    };

    // 클라이언트 측 유효성 검사
    const validation = validateRegisterForm(formData);
    if (!validation.isValid) {
        displayFormErrors(form, validation.errors);
        return;
    }

    // 비밀번호 확인 제거 (서버에 전송하지 않음)
    delete formData.confirmPassword;

    try {
        // 로딩 상태
        submitBtn.disabled = true;
        submitBtn.textContent = '처리 중...';
        UI.showLoading();

        // API 호출
        const response = await API.post('/auth/register', formData);

        UI.hideLoading();

        if (response.success) {
            const message = response.data?.message || '회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.';
            UI.showSuccess(message);
            
            // 2초 후 로그인 페이지로 리다이렉트
            setTimeout(() => {
                window.location.href = '/pages/login.html';
            }, 2000);
        }
    } catch (error) {
        UI.hideLoading();
        submitBtn.disabled = false;
        submitBtn.textContent = '회원가입';

        console.error('Registration error:', error);
        UI.showError(error.message || '회원가입 중 오류가 발생했습니다.');
    }
}

/**
 * 로그인 처리
 * @param {Event} event - 폼 제출 이벤트
 */
async function handleLogin(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('.auth-submit-btn');
    const errorElements = form.querySelectorAll('.form-error');

    // 기존 에러 메시지 초기화
    errorElements.forEach(el => el.classList.remove('show'));

    // 폼 데이터 수집
    const formData = {
        email: form.email.value.trim(),
        password: form.password.value,
    };

    // 클라이언트 측 유효성 검사
    const validation = validateLoginForm(formData);
    if (!validation.isValid) {
        displayFormErrors(form, validation.errors);
        return;
    }

    try {
        // 로딩 상태
        submitBtn.disabled = true;
        submitBtn.textContent = '로그인 중...';
        UI.showLoading();

        // API 호출
        const response = await API.post('/auth/login', formData);

        UI.hideLoading();

        if (response.success) {
            // 토큰 저장
            if (response.data?.token) {
                Auth.saveToken(response.data.token);
            }

            // 사용자 정보 저장
            if (response.data?.user) {
                Auth.saveUserData(response.data.user);
            }

            UI.showSuccess('로그인 성공! 메인 페이지로 이동합니다.');

            // 리다이렉트 URL 확인
            const redirectUrl = Utils.getQueryParam('redirect') || '/pages/index.html';
            
            // 1초 후 리다이렉트
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
        }
    } catch (error) {
        UI.hideLoading();
        submitBtn.disabled = false;
        submitBtn.textContent = '로그인';

        console.error('Login error:', error);
        UI.showError(error.message || '로그인 중 오류가 발생했습니다.');
    }
}

/**
 * 회원가입 폼 유효성 검사
 * @param {object} data - 폼 데이터
 * @returns {object} - 검사 결과
 */
function validateRegisterForm(data) {
    const errors = {};

    // 이메일 검증
    if (!data.email) {
        errors.email = '이메일을 입력해주세요.';
    } else if (!isValidEmail(data.email)) {
        errors.email = '올바른 이메일 형식이 아닙니다.';
    }

    // 비밀번호 검증
    if (!data.password) {
        errors.password = '비밀번호를 입력해주세요.';
    } else if (data.password.length < 6) {
        errors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
    }

    // 비밀번호 확인 검증
    if (data.confirmPassword !== undefined) {
        if (!data.confirmPassword) {
            errors.confirmPassword = '비밀번호 확인을 입력해주세요.';
        } else if (data.password !== data.confirmPassword) {
            errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        }
    }

    // 이름 검증
    if (!data.name) {
        errors.name = '이름을 입력해주세요.';
    } else if (data.name.length < 2) {
        errors.name = '이름은 최소 2자 이상이어야 합니다.';
    }

    // 전화번호 검증 (선택사항)
    if (data.phone && !isValidPhone(data.phone)) {
        errors.phone = '올바른 전화번호 형식이 아닙니다.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * 로그인 폼 유효성 검사
 * @param {object} data - 폼 데이터
 * @returns {object} - 검사 결과
 */
function validateLoginForm(data) {
    const errors = {};

    // 이메일 검증
    if (!data.email) {
        errors.email = '이메일을 입력해주세요.';
    } else if (!isValidEmail(data.email)) {
        errors.email = '올바른 이메일 형식이 아닙니다.';
    }

    // 비밀번호 검증
    if (!data.password) {
        errors.password = '비밀번호를 입력해주세요.';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

/**
 * 이메일 형식 검증
 * @param {string} email - 이메일
 * @returns {boolean} - 유효 여부
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 전화번호 형식 검증
 * @param {string} phone - 전화번호
 * @returns {boolean} - 유효 여부
 */
function isValidPhone(phone) {
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    return phoneRegex.test(phone);
}

/**
 * 폼 에러 메시지 표시
 * @param {HTMLFormElement} form - 폼 엘리먼트
 * @param {object} errors - 에러 객체
 */
function displayFormErrors(form, errors) {
    Object.keys(errors).forEach(fieldName => {
        const errorElement = form.querySelector(`#${fieldName}-error`);
        if (errorElement) {
            errorElement.textContent = errors[fieldName];
            errorElement.classList.add('show');
        }
    });

    // 첫 번째 에러 필드에 포커스
    const firstErrorField = Object.keys(errors)[0];
    const firstField = form.querySelector(`[name="${firstErrorField}"]`);
    if (firstField) {
        firstField.focus();
    }
}

/**
 * 비밀번호 강도 체크
 * @param {string} password - 비밀번호
 * @returns {string} - 강도 (weak, medium, strong)
 */
function checkPasswordStrength(password) {
    if (!password) return 'weak';

    let strength = 0;

    // 길이 체크
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // 대문자 포함
    if (/[A-Z]/.test(password)) strength++;

    // 소문자 포함
    if (/[a-z]/.test(password)) strength++;

    // 숫자 포함
    if (/[0-9]/.test(password)) strength++;

    // 특수문자 포함
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
}

/**
 * 비밀번호 강도 표시 업데이트
 * @param {HTMLInputElement} passwordInput - 비밀번호 입력 필드
 */
function updatePasswordStrength(passwordInput) {
    const password = passwordInput.value;
    const strengthContainer = document.querySelector('.password-strength');
    const strengthBar = document.querySelector('.password-strength-bar');
    const strengthText = document.querySelector('.password-strength-text');

    if (!strengthContainer || !strengthBar) return;

    if (password.length === 0) {
        strengthContainer.classList.remove('show');
        return;
    }

    strengthContainer.classList.add('show');

    const strength = checkPasswordStrength(password);
    strengthBar.className = `password-strength-bar ${strength}`;

    if (strengthText) {
        const strengthLabels = {
            weak: '약함',
            medium: '보통',
            strong: '강함',
        };
        strengthText.textContent = `비밀번호 강도: ${strengthLabels[strength]}`;
    }
}

// ===================================
// 페이지 초기화 (Page Initialization)
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // 회원가입 폼
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);

        // 비밀번호 강도 체크
        const passwordInput = registerForm.querySelector('[name="password"]');
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                updatePasswordStrength(passwordInput);
            });
        }

        // 실시간 유효성 검사 (선택적)
        const inputs = registerForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                const errorElement = registerForm.querySelector(`#${input.name}-error`);
                if (errorElement) {
                    errorElement.classList.remove('show');
                }
            });
        });
    }

    // 로그인 폼
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);

        // 실시간 유효성 검사 (선택적)
        const inputs = loginForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                const errorElement = loginForm.querySelector(`#${input.name}-error`);
                if (errorElement) {
                    errorElement.classList.remove('show');
                }
            });
        });
    }

    // 이미 로그인된 경우 메인 페이지로 리다이렉트
    if (Auth.isAuthenticated()) {
        Auth.verifyAuth().then(isValid => {
            if (isValid) {
                window.location.href = '/pages/index.html';
            }
        });
    }
});
