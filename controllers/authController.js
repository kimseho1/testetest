const User = require('../models/User');
const authService = require('../services/authService');

/**
 * 인증 컨트롤러
 * 회원가입, 로그인, 로그아웃 로직을 처리합니다
 */

// 회원가입
const register = async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        // 입력 검증
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                error: '이메일, 비밀번호, 이름은 필수 항목입니다'
            });
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: '유효한 이메일 주소를 입력해주세요'
            });
        }

        // 비밀번호 길이 검증
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: '비밀번호는 최소 6자 이상이어야 합니다'
            });
        }

        // 이메일 중복 체크
        const emailAlreadyExists = await User.emailExists(email);
        if (emailAlreadyExists) {
            return res.status(409).json({
                success: false,
                error: '이미 사용 중인 이메일입니다'
            });
        }

        // 비밀번호 해싱
        const password_hash = await authService.hashPassword(password);

        // 사용자 생성
        const userId = await User.create({
            email,
            password_hash,
            name,
            phone
        });

        res.status(201).json({
            success: true,
            data: {
                userId,
                message: '회원가입이 완료되었습니다'
            }
        });
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({
            success: false,
            error: '회원가입 처리 중 오류가 발생했습니다'
        });
    }
};

// 로그인
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 입력 검증
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: '이메일과 비밀번호를 입력해주세요'
            });
        }

        // 사용자 조회
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '이메일 또는 비밀번호가 일치하지 않습니다'
            });
        }

        // 비밀번호 검증
        const isPasswordValid = await authService.comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: '이메일 또는 비밀번호가 일치하지 않습니다'
            });
        }

        // JWT 토큰 생성
        const token = authService.createUserToken(user);

        // HttpOnly 쿠키에 토큰 저장
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24시간
        });

        res.status(200).json({
            success: true,
            data: {
                token,
                user: {
                    userId: user.user_id,
                    email: user.email,
                    name: user.name
                }
            }
        });
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({
            success: false,
            error: '로그인 처리 중 오류가 발생했습니다'
        });
    }
};

// 로그아웃
const logout = async (req, res) => {
    try {
        // 쿠키에서 토큰 제거
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({
            success: true,
            data: {
                message: '로그아웃되었습니다'
            }
        });
    } catch (error) {
        console.error('로그아웃 오류:', error);
        res.status(500).json({
            success: false,
            error: '로그아웃 처리 중 오류가 발생했습니다'
        });
    }
};

// 토큰 검증
const verify = async (req, res) => {
    try {
        // 인증 미들웨어를 통과했다면 req.user에 사용자 정보가 있음
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '사용자를 찾을 수 없습니다'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: {
                    userId: user.user_id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone
                }
            }
        });
    } catch (error) {
        console.error('토큰 검증 오류:', error);
        res.status(500).json({
            success: false,
            error: '토큰 검증 중 오류가 발생했습니다'
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    verify
};
