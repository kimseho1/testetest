const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * 인증 서비스
 * 비밀번호 해싱 및 JWT 토큰 관리를 처리합니다
 */

// 비밀번호 해싱
const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        throw new Error('비밀번호 해싱 실패: ' + error.message);
    }
};

// 비밀번호 검증
const comparePassword = async (password, hashedPassword) => {
    try {
        const isMatch = await bcrypt.compare(password, hashedPassword);
        return isMatch;
    } catch (error) {
        throw new Error('비밀번호 검증 실패: ' + error.message);
    }
};

// JWT 토큰 생성
const generateToken = (payload) => {
    try {
        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });
        return token;
    } catch (error) {
        throw new Error('토큰 생성 실패: ' + error.message);
    }
};

// JWT 토큰 검증
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('토큰이 만료되었습니다');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('유효하지 않은 토큰입니다');
        } else {
            throw new Error('토큰 검증 실패: ' + error.message);
        }
    }
};

// 사용자 정보로 JWT 토큰 생성
const createUserToken = (user) => {
    const payload = {
        userId: user.user_id,
        email: user.email,
        name: user.name
    };
    return generateToken(payload);
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    createUserToken
};
