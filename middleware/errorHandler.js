// AppError 클래스 정의
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// 글로벌 에러 핸들링 미들웨어
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';
    
    // 에러 로깅
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Error: ${err.message}`);
    console.error(`[${timestamp}] Status Code: ${err.statusCode}`);
    console.error(`[${timestamp}] Stack: ${err.stack}`);
    
    // 요청 정보 로깅
    console.error(`[${timestamp}] Request: ${req.method} ${req.originalUrl}`);
    if (req.user) {
        console.error(`[${timestamp}] User ID: ${req.user.userId}`);
    }
    
    // 개발 환경
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
            stack: err.stack,
            statusCode: err.statusCode
        });
    } 
    
    // 프로덕션 환경
    // 운영 에러만 클라이언트에 노출
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    }
    
    // 예상치 못한 에러는 일반 메시지로 응답
    return res.status(500).json({
        success: false,
        error: 'Something went wrong'
    });
};

// 404 에러 핸들러
const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
    next(error);
};

module.exports = {
    AppError,
    errorHandler,
    notFoundHandler
};
