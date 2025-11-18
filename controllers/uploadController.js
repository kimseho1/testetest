// controllers/uploadController.js
const { uploadToS3, uploadMultipleToS3 } = require('../services/s3Service');

/**
 * 단일 이미지 업로드
 * POST /api/upload
 */
const uploadImage = async (req, res) => {
    try {
        // 파일이 업로드되었는지 확인
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        // 폴더 지정 (쿼리 파라미터 또는 기본값)
        const folder = req.query.folder || 'uploads';

        // S3에 업로드
        const imageUrl = await uploadToS3(req.file, folder);

        res.status(200).json({
            success: true,
            data: {
                url: imageUrl,
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('[Upload Controller] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to upload image'
        });
    }
};

/**
 * 여러 이미지 업로드
 * POST /api/upload/multiple
 */
const uploadMultipleImages = async (req, res) => {
    try {
        // 파일들이 업로드되었는지 확인
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files uploaded'
            });
        }

        // 폴더 지정 (쿼리 파라미터 또는 기본값)
        const folder = req.query.folder || 'uploads';

        // S3에 업로드
        const imageUrls = await uploadMultipleToS3(req.files, folder);

        res.status(200).json({
            success: true,
            data: {
                urls: imageUrls,
                count: imageUrls.length,
                files: req.files.map((file, index) => ({
                    url: imageUrls[index],
                    filename: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                }))
            }
        });
    } catch (error) {
        console.error('[Upload Controller] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to upload images'
        });
    }
};

module.exports = {
    uploadImage,
    uploadMultipleImages
};
