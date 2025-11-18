# E-Commerce AWS Platform

AWS 기반 풀스택 이커머스 웹사이트 플랫폼입니다. 사용자는 회원가입 및 로그인을 통해 상품을 탐색하고, 장바구니에 담고, 결제를 진행할 수 있습니다. Node.js 백엔드와 MySQL 데이터베이스를 사용하며, AWS 서비스(EC2, RDS, S3)와 통합되어 확장 가능하고 안정적인 인프라를 제공합니다.

## 주요 기능

- 사용자 인증 (회원가입, 로그인, 로그아웃)
- 상품 목록 조회 및 검색
- 상품 상세 정보 확인
- 장바구니 관리 (추가, 수정, 삭제)
- 주문 및 결제 처리
- 사용자 프로필 및 주문 내역 관리
- AWS S3를 통한 이미지 저장 및 제공

## 프로젝트 구조

```
ecommerce-aws-platform/
├── server/              # 서버 진입점
│   └── server.js       # Express 앱 설정 및 시작
├── config/              # 설정 파일
│   ├── database.js     # MySQL 연결 설정
│   ├── aws.js          # AWS SDK 설정
│   ├── schema.js       # 데이터베이스 스키마
│   ├── initDatabase.js # DB 초기화 스크립트
│   └── seedData.js     # 샘플 데이터 삽입
├── middleware/          # Express 미들웨어
│   ├── auth.js         # JWT 인증 미들웨어
│   ├── errorHandler.js # 글로벌 에러 핸들러
│   └── upload.js       # 파일 업로드 미들웨어
├── routes/              # API 라우트
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── cartRoutes.js
│   ├── orderRoutes.js
│   └── userRoutes.js
├── controllers/         # 컨트롤러 로직
│   ├── authController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── orderController.js
│   ├── userController.js
│   └── uploadController.js
├── models/              # 데이터 모델
│   ├── User.js
│   ├── Product.js
│   ├── Cart.js
│   └── Order.js
├── services/            # 비즈니스 로직 서비스
│   ├── authService.js  # 인증 서비스 (JWT, bcrypt)
│   └── s3Service.js    # S3 업로드 서비스
├── utils/               # 유틸리티 함수
│   ├── logger.js       # 로깅 유틸리티
│   └── validator.js    # 입력 검증 함수
├── public/              # 정적 파일
│   ├── css/            # 스타일시트
│   │   ├── styles.css
│   │   ├── auth.css
│   │   ├── product.css
│   │   └── mypage.css
│   ├── js/             # 클라이언트 JavaScript
│   │   ├── main.js
│   │   ├── auth.js
│   │   ├── product.js
│   │   ├── product-detail.js
│   │   ├── cart.js
│   │   ├── checkout.js
│   │   └── mypage.js
│   └── pages/          # HTML 페이지
│       ├── index.html
│       ├── login.html
│       ├── register.html
│       ├── product-detail.html
│       ├── cart.html
│       ├── checkout.html
│       └── mypage.html
├── __tests__/           # 테스트 파일
│   ├── api/            # API 통합 테스트
│   ├── models/         # 모델 단위 테스트
│   └── database/       # 데이터베이스 테스트
├── .env                 # 환경 변수 (git에서 제외)
├── .env.example         # 환경 변수 템플릿
├── .env.test            # 테스트 환경 변수
└── package.json         # 프로젝트 의존성
```

## 기술 스택

### 백엔드
- Node.js 14+
- Express.js 4.x
- MySQL 8.0 (mysql2)
- JWT (jsonwebtoken)
- bcrypt
- multer (파일 업로드)
- cookie-parser
- cors

### AWS 서비스
- EC2 (서버 호스팅)
- RDS (MySQL 데이터베이스)
- S3 (이미지 저장소)

### 프론트엔드
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)

### 테스트
- Jest
- Supertest

## 설치 및 실행 방법

### 사전 요구사항

- Node.js 14 이상
- MySQL 8.0 이상
- AWS 계정 (S3 사용을 위해)
- npm 또는 yarn

### 1. 저장소 클론

```bash
git clone <repository-url>
cd ecommerce-aws-platform
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 실제 값을 입력합니다:

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 다음 값들을 설정합니다:

```env
# 서버 설정
NODE_ENV=development
PORT=3000

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ecommerce
DB_USER=root
DB_PASSWORD=your_password

# JWT 설정
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# AWS 설정
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET_NAME=your-s3-bucket-name

# 기타
BCRYPT_ROUNDS=10
```

### 4. 데이터베이스 설정

MySQL 데이터베이스를 생성하고 스키마를 초기화합니다:

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE ecommerce;
exit;

# 스키마 초기화 및 샘플 데이터 삽입
node config/initDatabase.js
```

### 5. 서버 실행

개발 모드로 실행:

```bash
npm run dev
```

프로덕션 모드로 실행:

```bash
npm start
```

서버가 시작되면 브라우저에서 `http://localhost:3000`으로 접속할 수 있습니다.

### 6. 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 특정 테스트 파일 실행
npm test -- auth.test.js

# 테스트 커버리지 확인
npm run test:coverage
```

## 환경 변수 설정 가이드

### 필수 환경 변수

| 변수명 | 설명 | 예시 값 |
|--------|------|---------|
| `NODE_ENV` | 실행 환경 | `development`, `production` |
| `PORT` | 서버 포트 | `3000` |
| `DB_HOST` | MySQL 호스트 주소 | `localhost`, `your-rds-endpoint.amazonaws.com` |
| `DB_PORT` | MySQL 포트 | `3306` |
| `DB_NAME` | 데이터베이스 이름 | `ecommerce` |
| `DB_USER` | 데이터베이스 사용자 | `root`, `admin` |
| `DB_PASSWORD` | 데이터베이스 비밀번호 | `your_password` |
| `JWT_SECRET` | JWT 토큰 서명 키 | `your_random_secret_key` |
| `JWT_EXPIRES_IN` | JWT 토큰 만료 시간 | `24h`, `7d` |
| `AWS_REGION` | AWS 리전 | `ap-northeast-2`, `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS 액세스 키 ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS 시크릿 액세스 키 | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `S3_BUCKET_NAME` | S3 버킷 이름 | `ecommerce-product-images` |
| `BCRYPT_ROUNDS` | bcrypt 해싱 라운드 | `10` |

### 환경별 설정

#### 개발 환경 (.env)
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
```

#### 테스트 환경 (.env.test)
```env
NODE_ENV=test
PORT=3001
DB_NAME=ecommerce_test
```

#### 프로덕션 환경
```env
NODE_ENV=production
PORT=80
DB_HOST=your-rds-endpoint.amazonaws.com
```

## API 엔드포인트 문서

### 인증 API

#### 회원가입
```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "phone": "010-1234-5678"
}

Response (201):
{
  "success": true,
  "data": {
    "message": "User registered successfully"
  }
}
```

#### 로그인
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "name": "홍길동"
    }
  }
}
```

#### 로그아웃
```
POST /api/auth/logout
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

#### 토큰 검증
```
GET /api/auth/verify
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "name": "홍길동"
    }
  }
}
```

### 상품 API

#### 상품 목록 조회
```
GET /api/products?page=1&limit=12&category=electronics

Query Parameters:
- page: 페이지 번호 (기본값: 1)
- limit: 페이지당 항목 수 (기본값: 12)
- category: 카테고리 필터 (선택)

Response (200):
{
  "success": true,
  "data": {
    "products": [
      {
        "product_id": 1,
        "name": "노트북",
        "description": "고성능 노트북",
        "price": 1500000,
        "stock_quantity": 10,
        "category": "electronics",
        "image_url": "https://s3.amazonaws.com/..."
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50
    }
  }
}
```

#### 상품 상세 조회
```
GET /api/products/:id

Response (200):
{
  "success": true,
  "data": {
    "product_id": 1,
    "name": "노트북",
    "description": "고성능 노트북",
    "price": 1500000,
    "stock_quantity": 10,
    "category": "electronics",
    "image_url": "https://s3.amazonaws.com/..."
  }
}
```

#### 상품 검색
```
GET /api/products/search?q=노트북

Query Parameters:
- q: 검색 키워드

Response (200):
{
  "success": true,
  "data": [
    {
      "product_id": 1,
      "name": "노트북",
      "price": 1500000,
      "image_url": "https://s3.amazonaws.com/..."
    }
  ]
}
```

### 장바구니 API

#### 장바구니 조회
```
GET /api/cart
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "items": [
      {
        "cart_item_id": 1,
        "product_id": 1,
        "name": "노트북",
        "price": 1500000,
        "quantity": 2,
        "image_url": "https://s3.amazonaws.com/..."
      }
    ],
    "totalAmount": 3000000
  }
}
```

#### 장바구니에 상품 추가
```
POST /api/cart
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "product_id": 1,
  "quantity": 2
}

Response (201):
{
  "success": true,
  "data": {
    "message": "Product added to cart"
  }
}
```

#### 장바구니 아이템 수량 변경
```
PUT /api/cart/:itemId
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "quantity": 3
}

Response (200):
{
  "success": true,
  "data": {
    "message": "Cart item updated"
  }
}
```

#### 장바구니 아이템 삭제
```
DELETE /api/cart/:itemId
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "message": "Item removed from cart"
  }
}
```

### 주문 API

#### 주문 생성
```
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "shipping_address": "서울시 강남구 테헤란로 123",
  "payment_method": "credit_card"
}

Response (201):
{
  "success": true,
  "data": {
    "order_id": 1,
    "total_amount": 3000000,
    "status": "pending"
  }
}
```

#### 주문 내역 조회
```
GET /api/orders
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [
    {
      "order_id": 1,
      "total_amount": 3000000,
      "status": "pending",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 주문 상세 조회
```
GET /api/orders/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "order_id": 1,
    "total_amount": 3000000,
    "status": "pending",
    "shipping_address": "서울시 강남구 테헤란로 123",
    "payment_method": "credit_card",
    "created_at": "2024-01-01T00:00:00.000Z",
    "items": [
      {
        "product_id": 1,
        "name": "노트북",
        "quantity": 2,
        "price": 1500000
      }
    ]
  }
}
```

### 사용자 API

#### 프로필 조회
```
GET /api/users/profile
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "phone": "010-1234-5678"
  }
}
```

#### 프로필 수정
```
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "김철수",
  "phone": "010-9876-5432"
}

Response (200):
{
  "success": true,
  "data": {
    "message": "Profile updated successfully"
  }
}
```

### 이미지 업로드 API

#### 이미지 업로드
```
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Request Body:
- image: (file)

Response (200):
{
  "success": true,
  "data": {
    "imageUrl": "https://s3.amazonaws.com/your-bucket/images/..."
  }
}
```

## 에러 응답 형식

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "success": false,
  "error": "Error message"
}
```

일반적인 HTTP 상태 코드:
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스를 찾을 수 없음
- `500 Internal Server Error`: 서버 오류

## 데이터베이스 스키마

주요 테이블:
- `users`: 사용자 정보
- `products`: 상품 정보
- `cart_items`: 장바구니 아이템
- `orders`: 주문 정보
- `order_items`: 주문 상세 아이템
- `sessions`: 세션 정보 (선택적)

자세한 스키마는 `config/schema.js` 파일을 참조하세요.

## 보안 고려사항

- 비밀번호는 bcrypt로 해싱되어 저장됩니다
- JWT 토큰은 HttpOnly 쿠키에 저장됩니다
- SQL Injection 방지를 위해 Prepared Statements를 사용합니다
- CORS 설정으로 허용된 도메인만 접근 가능합니다
- 환경 변수로 민감한 정보를 관리합니다

## 배포

AWS 배포 가이드는 `docs/AWS_DEPLOYMENT_GUIDE.md` 파일을 참조하세요.

## 트러블슈팅

### 데이터베이스 연결 오류
- MySQL 서버가 실행 중인지 확인
- `.env` 파일의 데이터베이스 설정 확인
- 방화벽 설정 확인

### AWS S3 업로드 오류
- AWS 자격 증명 확인
- S3 버킷 권한 설정 확인
- IAM 정책 확인

### JWT 토큰 오류
- `JWT_SECRET` 환경 변수 설정 확인
- 토큰 만료 시간 확인

## 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

ISC

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
