// services/s3Service.js
const { s3 } = require('../config/aws');
const path = require('path');
const crypto = require('crypto');

/**
 * S3에 이미지 업로드
 * @param {Object} file - Multer file object
 * @param {String} folder - S3 버킷 내 폴더 경로 (예: 'products', 'users')
 * @returns {Promise<String>} - 업로드된 이미지의 S3 URL
 */
const uploadToS3 = async (file, folder = 'uploads') => {
    try {
        // 고유한 파일명 생성 (타임스탬프 + 랜덤 해시)
        const timestamp = Date.now();
        const randomHash = crypto.randomBytes(8).toString('hex');
        const fileExtension = path.extname(file.originalname);
        const fileName = `${timestamp}-${randomHash}${fileExtension}`;
        const key = `${folder}/${fileName}`;

        // S3 업로드 파라미터
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read', // 공개 읽기 권한
            CacheControl: 'max-age=31536000' // 1년 캐시
        };

        // S3에 업로드
        const result = await s3.upload(params).promise();
        
        console.log(`[S3 Service] File uploaded successfully: ${result.Location}`);
        return result.Location;
    } catch (error) {
        console.error('[S3 Service] Upload error:', error);
        throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
};

/**
 * S3에서 이미지 삭제
 * @param {String} imageUrl - 삭제할 이미지의 S3 URL
 * @returns {Promise<Boolean>} - 삭제 성공 여부
 */
const deleteFromS3 = async (imageUrl) => {
    try {
        // URL에서 Key 추출
        const url = new URL(imageUrl);
        const key = url.pathname.substring(1); // 첫 번째 '/' 제거

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key
        };

        await s3.deleteObject(params).promise();
        console.log(`[S3 Service] File deleted successfully: ${key}`);
        return true;
    } catch (error) {
        console.error('[S3 Service] Delete error:', error);
        throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
};

/**
 * S3 이미지 URL 생성 (Signed URL)
 * @param {String} key - S3 객체 키
 * @param {Number} expiresIn - URL 만료 시간 (초 단위, 기본: 1시간)
 * @returns {Promise<String>} - Signed URL
 */
const getSignedUrl = async (key, expiresIn = 3600) => {
    try {
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Expires: expiresIn
        };

        const url = await s3.getSignedUrlPromise('getObject', params);
        return url;
    } catch (error) {
        console.error('[S3 Service] Signed URL error:', error);
        throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
};

/**
 * 여러 파일을 S3에 업로드
 * @param {Array} files - Multer file objects 배열
 * @param {String} folder - S3 버킷 내 폴더 경로
 * @returns {Promise<Array>} - 업로드된 이미지 URL 배열
 */
const uploadMultipleToS3 = async (files, folder = 'uploads') => {
    try {
        const uploadPromises = files.map(file => uploadToS3(file, folder));
        const urls = await Promise.all(uploadPromises);
        return urls;
    } catch (error) {
        console.error('[S3 Service] Multiple upload error:', error);
        throw new Error(`Failed to upload multiple files to S3: ${error.message}`);
    }
};

/**
 * S3 객체 존재 확인
 * @param {String} key - S3 객체 키
 * @returns {Promise<Boolean>} - 존재 여부
 */
const checkFileExists = async (key) => {
    try {
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key
        };

        await s3.headObject(params).promise();
        return true;
    } catch (error) {
        if (error.code === 'NotFound') {
            return false;
        }
        throw error;
    }
};

module.exports = {
    uploadToS3,
    deleteFromS3,
    getSignedUrl,
    uploadMultipleToS3,
    checkFileExists
};
