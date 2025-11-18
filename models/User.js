const { query } = require('../config/database');

/**
 * 사용자 모델
 * 사용자 CRUD 작업을 처리합니다
 */

// 이메일로 사용자 조회
const findByEmail = async (email) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const results = await query(sql, [email]);
    return results[0] || null;
};

// ID로 사용자 조회
const findById = async (userId) => {
    const sql = 'SELECT user_id, email, name, phone, created_at, updated_at FROM users WHERE user_id = ?';
    const results = await query(sql, [userId]);
    return results[0] || null;
};

// 새 사용자 생성
const create = async (userData) => {
    const { email, password_hash, name, phone } = userData;
    const sql = 'INSERT INTO users (email, password_hash, name, phone) VALUES (?, ?, ?, ?)';
    const result = await query(sql, [email, password_hash, name, phone || null]);
    return result.insertId;
};

// 사용자 정보 업데이트
const update = async (userId, userData) => {
    const { name, phone } = userData;
    const sql = 'UPDATE users SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?';
    await query(sql, [name, phone || null, userId]);
    return findById(userId);
};

// 사용자 삭제
const deleteUser = async (userId) => {
    const sql = 'DELETE FROM users WHERE user_id = ?';
    const result = await query(sql, [userId]);
    return result.affectedRows > 0;
};

// 이메일 중복 체크
const emailExists = async (email) => {
    const user = await findByEmail(email);
    return user !== null;
};

module.exports = {
    findByEmail,
    findById,
    create,
    update,
    deleteUser,
    emailExists
};
