const mysql = require('mysql2/promise');
require('dotenv').config();

// MySQL 커넥션 풀 생성
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1q2w3e4r',
    database: process.env.DB_NAME || 'ecommerce_test',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// 데이터베이스 연결 테스트 함수
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✓ MySQL 데이터베이스 연결 성공');
        connection.release();
        return true;
    } catch (error) {
        console.error('✗ MySQL 데이터베이스 연결 실패:', error.message);
        return false;
    }
};

// 쿼리 실행 헬퍼 함수
const query = async (sql, params = []) => {
    try {
        // pool.query()를 사용 (pool.execute()보다 호환성이 좋음)
        const [results] = await pool.query(sql, params || []);
        return results;
    } catch (error) {
        console.error('쿼리 실행 오류:', error.message);
        console.error('SQL:', sql);
        console.error('Params:', params);
        throw error;
    }
};

// 트랜잭션 헬퍼 함수
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// 커넥션 풀 종료 함수
const closeConnection = async () => {
    try {
        await pool.end();
        console.log('✓ MySQL 커넥션 풀 종료');
    } catch (error) {
        console.error('✗ MySQL 커넥션 풀 종료 실패:', error.message);
    }
};

module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    closeConnection
};
