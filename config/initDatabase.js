#!/usr/bin/env node

/**
 * 데이터베이스 초기화 스크립트
 * 
 * 사용법:
 *   node config/initDatabase.js          - 스키마 생성 및 샘플 데이터 삽입
 *   node config/initDatabase.js --reset  - 기존 테이블 삭제 후 재생성
 *   node config/initDatabase.js --schema - 스키마만 생성
 *   node config/initDatabase.js --seed   - 샘플 데이터만 삽입
 */

require('dotenv').config();
const { testConnection } = require('./database');
const { initializeSchema, dropAllTables } = require('./schema');
const { seedDatabase } = require('./seedData');

const args = process.argv.slice(2);
const shouldReset = args.includes('--reset');
const schemaOnly = args.includes('--schema');
const seedOnly = args.includes('--seed');

async function initDatabase() {
    try {
        console.log('\n========================================');
        console.log('  데이터베이스 초기화 스크립트');
        console.log('========================================\n');
        
        // 1. 데이터베이스 연결 테스트
        console.log('1. 데이터베이스 연결 확인 중...');
        const isConnected = await testConnection();
        
        if (!isConnected) {
            console.error('\n데이터베이스에 연결할 수 없습니다.');
            console.error('환경 변수(.env)를 확인하세요.\n');
            process.exit(1);
        }
        
        console.log('');
        
        // 2. 기존 테이블 삭제 (--reset 옵션)
        if (shouldReset) {
            console.log('2. 기존 테이블 삭제 중...');
            await dropAllTables();
            console.log('');
        }
        
        // 3. 스키마 생성
        if (!seedOnly) {
            console.log(`${shouldReset ? '3' : '2'}. 데이터베이스 스키마 생성 중...`);
            await initializeSchema();
            console.log('');
        }
        
        // 4. 샘플 데이터 삽입
        if (!schemaOnly) {
            console.log(`${shouldReset ? '4' : '3'}. 샘플 데이터 삽입 중...`);
            await seedDatabase();
        }
        
        console.log('========================================');
        console.log('  데이터베이스 초기화 완료!');
        console.log('========================================\n');
        
        process.exit(0);
    } catch (error) {
        console.error('\n========================================');
        console.error('  데이터베이스 초기화 실패');
        console.error('========================================');
        console.error('\n오류:', error.message);
        console.error('\n상세 정보:', error);
        console.error('');
        process.exit(1);
    }
}

// 스크립트 실행
initDatabase();
