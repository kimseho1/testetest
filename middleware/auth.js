const authService = require('../services/authService');

/**
 * 인증 미들웨어
 * JWT 토큰 검증 및 보호된 라우트 접근 제어
 */

// JWT 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
    try {
        // 쿠키 또는 Authorization 헤더에서 토큰 추출
        const token = req.cookies?.token || 
                     (req.headers['authorization']?.startsWith('Bearer ') 
                         ? req.headers['authorization'].split(' ')[1] 
                         : null);

        // 토큰이 없는 경우
        if (!token) {
            return res.status(401).json({
                success: false,
                error: '인증이 필요합니다'
            });
        }

        // 토큰 검증
        const decoded = authService.verifyToken(token);
        
        // 검증된 사용자 정보를 req.user에 저장
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            name: decoded.name
        };

        next();
    } catch (error) {
        console.error('토큰 검증 오류:', error.message);
        
        // 토큰 만료 또는 유효하지 않은 토큰
        return res.status(403).json({
            success: false,
            error: error.message || '유효하지 않은 토큰입니다'
        });
    }
};

// 선택적 인증 미들웨어 (토큰이 있으면 검증하고, 없어도 통과)
const optionalAuth = (req, res, next) => {
    try {
        const token = req.cookies?.token || 
                     (req.headers['authorization']?.startsWith('Bearer ') 
                         ? req.headers['authorization'].split(' ')[1] 
                         : null);

        if (token) {
            try {
                const decoded = authService.verifyToken(token);
                req.user = {
                    userId: decoded.userId,
                    email: decoded.email,
                    name: decoded.name
                };
            } catch (error) {
                // 토큰이 유효하지 않아도 계속 진행
                req.user = null;
            }
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth
};
