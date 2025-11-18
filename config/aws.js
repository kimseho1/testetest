// config/aws.js
const AWS = require('aws-sdk');
require('dotenv').config();

// AWS SDK 설정
AWS.config.update({
    region: process.env.AWS_REGION || 'ap-northeast-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// S3 클라이언트 생성
const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    signatureVersion: 'v4'
});

// AWS 설정 검증 함수
const validateAWSConfig = () => {
    const requiredEnvVars = [
        'AWS_REGION',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'S3_BUCKET_NAME'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.warn(`[AWS Config] Missing environment variables: ${missingVars.join(', ')}`);
        return false;
    }

    return true;
};

// S3 버킷 존재 확인 함수
const checkS3BucketExists = async () => {
    try {
        await s3.headBucket({ Bucket: process.env.S3_BUCKET_NAME }).promise();
        console.log(`[AWS S3] Successfully connected to bucket: ${process.env.S3_BUCKET_NAME}`);
        return true;
    } catch (error) {
        console.error(`[AWS S3] Error connecting to bucket: ${error.message}`);
        return false;
    }
};

module.exports = {
    s3,
    AWS,
    validateAWSConfig,
    checkS3BucketExists
};
