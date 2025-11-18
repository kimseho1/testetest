/**
 * Express 서버 메인 파일
 * 이커머스 플랫폼 백엔드 서버
 */

// 환경 변수 로드 (가장 먼저 실행)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// 데이터베이스 연결
const db = require('../config/database');

// 라우트 임포트
const authRoutes = require('../routes/authRoutes');
const productRoutes = require('../routes/productRoutes');
const cartRoutes = require('../routes/cartRoutes');
const orderRoutes = require('../routes/orderRoutes');
const userRoutes = require('../routes/userRoutes');
const uploadRoutes = require('../routes/uploadRoutes');

// 미들웨어 임포트
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

// Express 앱 초기화
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 미들웨어 설정
// ============================================

// CORS 설정
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser 미들웨어
app.use(cookieParser());

// 요청 로깅 미들웨어
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
});

// ============================================
// 정적 파일 서빙
// ============================================

// public 폴더의 정적 파일 제공
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// API 라우트 등록
// ============================================

// 헬스 체크 엔드포인트
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 인증 라우트
app.use('/api/auth', authRoutes);

// 상품 라우트
app.use('/api/products', productRoutes);

// 장바구니 라우트
app.use('/api/cart', cartRoutes);

// 주문 라우트
app.use('/api/orders', orderRoutes);

// 사용자 라우트
app.use('/api/users', userRoutes);

// 업로드 라우트
app.use('/api/upload', uploadRoutes);

// ============================================
// 프론트엔드 라우팅 처리 (SPA)
// ============================================

// HTML 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/register.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/cart.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/checkout.html'));
});

app.get('/mypage', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/mypage.html'));
});

app.get('/product/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/pages/product-detail.html'));
});

// ============================================
// 에러 핸들링
// ============================================

// 404 에러 핸들러 (모든 라우트 이후에 위치)
app.use(notFoundHandler);

// 글로벌 에러 핸들러 (가장 마지막에 위치)
app.use(errorHandler);

// ============================================
// 서버 시작
// ============================================

// 데이터베이스 연결 테스트 및 서버 시작
const startServer = async () => {
    try {
        // 데이터베이스 연결 테스트
        console.log('데이터베이스 연결 테스트 중...');
        await db.testConnection();
        console.log('✓ 데이터베이스 연결 성공');

        // 서버 시작
        app.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log(`🚀 서버가 시작되었습니다`);
            console.log(`📍 환경: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 포트: ${PORT}`);
            console.log(`🔗 URL: http://localhost:${PORT}`);
            console.log(`📊 API: http://localhost:${PORT}/api`);
            console.log('='.repeat(50));
        });
    } catch (error) {
        console.error('❌ 서버 시작 실패:', error.message);
        console.error('상세 오류:', error);
        process.exit(1);
    }
};

// Graceful shutdown 처리
process.on('SIGTERM', () => {
    console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
    db.closeConnection();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT 신호를 받았습니다. 서버를 종료합니다...');
    db.closeConnection();
    process.exit(0);
});

// 처리되지 않은 Promise rejection 처리
process.on('unhandledRejection', (reason, promise) => {
    console.error('처리되지 않은 Promise Rejection:', reason);
    console.error('Promise:', promise);
});

// 서버 시작 실행
startServer();

// 모듈 내보내기 (테스트용)
module.exports = app;
