# 데이터베이스 설정 가이드

## 파일 구조

- `database.js` - MySQL 커넥션 풀 및 쿼리 헬퍼 함수
- `schema.js` - 데이터베이스 스키마 생성/삭제 함수
- `seedData.js` - 샘플 데이터 삽입 함수
- `initDatabase.js` - 데이터베이스 초기화 실행 스크립트

## 사용 방법

### 1. 환경 변수 설정

`.env` 파일에 데이터베이스 연결 정보를 설정하세요:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ecommerce
DB_USER=root
DB_PASSWORD=your_password
```

### 2. 데이터베이스 초기화

#### 전체 초기화 (스키마 생성 + 샘플 데이터)
```bash
npm run db:init
```

#### 기존 데이터 삭제 후 재생성
```bash
npm run db:reset
```

#### 스키마만 생성
```bash
npm run db:schema
```

#### 샘플 데이터만 삽입
```bash
npm run db:seed
```

## 데이터베이스 스키마

### 테이블 목록

1. **users** - 사용자 정보
2. **products** - 상품 정보
3. **cart_items** - 장바구니 아이템
4. **orders** - 주문 정보
5. **order_items** - 주문 상세 아이템
6. **sessions** - 세션 정보

### 샘플 데이터

- **사용자**: 3명 (test1@example.com, test2@example.com, admin@example.com)
  - 비밀번호: password123 (admin은 admin123)
- **상품**: 10개 (전자제품, 컴퓨터 주변기기, 가방 등)

## 코드에서 사용하기

### 기본 쿼리 실행

```javascript
const { query } = require('./config/database');

// SELECT 쿼리
const users = await query('SELECT * FROM users WHERE email = ?', ['test@example.com']);

// INSERT 쿼리
await query('INSERT INTO products (name, price) VALUES (?, ?)', ['상품명', 10000]);
```

### 트랜잭션 사용

```javascript
const { transaction } = require('./config/database');

await transaction(async (connection) => {
    await connection.query('UPDATE products SET stock_quantity = stock_quantity - 1 WHERE product_id = ?', [1]);
    await connection.query('INSERT INTO orders (...) VALUES (...)', [...]);
});
```

### 연결 테스트

```javascript
const { testConnection } = require('./config/database');

const isConnected = await testConnection();
if (isConnected) {
    console.log('데이터베이스 연결 성공!');
}
```
