// 로깅 유틸리티

// 로그 레벨
const LogLevel = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

// 타임스탬프 생성
const getTimestamp = () => {
    return new Date().toISOString();
};

// 로그 포맷팅
const formatLog = (level, message, meta = {}) => {
    const timestamp = getTimestamp();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level}] ${message} ${metaStr}`.trim();
};

// 에러 로그
const error = (message, meta = {}) => {
    const log = formatLog(LogLevel.ERROR, message, meta);
    console.error(log);
    
    // 프로덕션 환경에서는 파일이나 외부 서비스에 로그 저장 가능
    if (process.env.NODE_ENV === 'production') {
        // TODO: 파일 시스템이나 로그 서비스에 저장
    }
};

// 경고 로그
const warn = (message, meta = {}) => {
    const log = formatLog(LogLevel.WARN, message, meta);
    console.warn(log);
};

// 정보 로그
const info = (message, meta = {}) => {
    const log = formatLog(LogLevel.INFO, message, meta);
    console.log(log);
};

// 디버그 로그 (개발 환경에서만)
const debug = (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
        const log = formatLog(LogLevel.DEBUG, message, meta);
        console.log(log);
    }
};

// HTTP 요청 로그
const logRequest = (req) => {
    const meta = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent')
    };
    
    if (req.user) {
        meta.userId = req.user.userId;
    }
    
    info('HTTP Request', meta);
};

// HTTP 응답 로그
const logResponse = (req, res, responseTime) => {
    const meta = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`
    };
    
    if (req.user) {
        meta.userId = req.user.userId;
    }
    
    info('HTTP Response', meta);
};

// 데이터베이스 쿼리 로그
const logQuery = (query, params = []) => {
    if (process.env.NODE_ENV === 'development') {
        debug('Database Query', { query, params });
    }
};

// 데이터베이스 에러 로그
const logDbError = (err, query = '') => {
    error('Database Error', {
        message: err.message,
        query,
        code: err.code,
        errno: err.errno
    });
};

// 인증 관련 로그
const logAuth = (action, userId, success, reason = '') => {
    const meta = {
        action,
        userId,
        success,
        reason
    };
    
    if (success) {
        info('Authentication', meta);
    } else {
        warn('Authentication Failed', meta);
    }
};

// 비즈니스 로직 로그
const logBusiness = (action, details = {}) => {
    info('Business Logic', { action, ...details });
};

// AWS 서비스 로그
const logAWS = (service, action, success, details = {}) => {
    const meta = {
        service,
        action,
        success,
        ...details
    };
    
    if (success) {
        info('AWS Service', meta);
    } else {
        error('AWS Service Error', meta);
    }
};

module.exports = {
    LogLevel,
    error,
    warn,
    info,
    debug,
    logRequest,
    logResponse,
    logQuery,
    logDbError,
    logAuth,
    logBusiness,
    logAWS
};
