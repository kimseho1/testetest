// middleware/upload.js
const multer = require('multer');

// 메모리 스토리지 설정 (파일을 버퍼로 저장)
const storage = multer.memoryStorage();

// 파일 필터 - 이미지 파일만 허용
const fileFilter = (req, file, cb) => {
    // 허용되는 MIME 타입
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only image files are allowed.'), false);
    }
};

// Multer 설정
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB 제한
        files: 10 // 최대 10개 파일
    }
});

// 에러 핸들러 미들웨어
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer 에러 처리
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size exceeds 5MB limit'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files. Maximum 10 files allowed'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Unexpected field name'
            });
        }
        return res.status(400).json({
            success: false,
            error: err.message
        });
    } else if (err) {
        // 기타 에러 (파일 타입 에러 등)
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
    next();
};

module.exports = {
    upload,
    handleMulterError
};
