const bcrypt = require('bcrypt');
const { pool } = require('./database');

// 샘플 사용자 데이터
const sampleUsers = [
    {
        email: 'test1@example.com',
        password: 'password123',
        name: '김철수',
        phone: '010-1234-5678'
    },
    {
        email: 'test2@example.com',
        password: 'password123',
        name: '이영희',
        phone: '010-2345-6789'
    },
    {
        email: 'admin@example.com',
        password: 'admin123',
        name: '관리자',
        phone: '010-9999-9999'
    }
];

// 샘플 상품 데이터
const sampleProducts = [
    {
        name: '노트북 - MacBook Pro 14',
        description: 'Apple M3 Pro 칩, 18GB RAM, 512GB SSD. 고성능 프로페셔널 노트북',
        price: 2890000,
        stock_quantity: 15,
        category: '전자제품',
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop'
    },
    {
        name: '무선 이어폰 - AirPods Pro',
        description: '액티브 노이즈 캔슬링, 공간 오디오 지원',
        price: 359000,
        stock_quantity: 50,
        category: '전자제품',
        image_url: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400&h=400&fit=crop'
    },
    {
        name: '스마트워치 - Galaxy Watch 6',
        description: '건강 모니터링, GPS, 방수 기능',
        price: 429000,
        stock_quantity: 30,
        category: '전자제품',
        image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop'
    },
    {
        name: '게이밍 키보드',
        description: '기계식 스위치, RGB 백라이트, 매크로 지원',
        price: 189000,
        stock_quantity: 25,
        category: '컴퓨터 주변기기',
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop'
    },
    {
        name: '무선 마우스',
        description: '인체공학적 디자인, 고정밀 센서',
        price: 79000,
        stock_quantity: 40,
        category: '컴퓨터 주변기기',
        image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop'
    },
    {
        name: '모니터 - 27인치 4K',
        description: 'IPS 패널, HDR 지원, 60Hz',
        price: 549000,
        stock_quantity: 20,
        category: '컴퓨터 주변기기',
        image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop'
    },
    {
        name: '백팩 - 노트북 수납 가능',
        description: '방수 소재, 15.6인치 노트북 수납, USB 충전 포트',
        price: 89000,
        stock_quantity: 60,
        category: '가방',
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop'
    },
    {
        name: '블루투스 스피커',
        description: '360도 사운드, 방수 IPX7, 12시간 재생',
        price: 129000,
        stock_quantity: 35,
        category: '전자제품',
        image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop'
    },
    {
        name: 'USB-C 허브',
        description: 'HDMI, USB 3.0 x3, SD 카드 리더기',
        price: 45000,
        stock_quantity: 100,
        category: '컴퓨터 주변기기',
        image_url: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=400&fit=crop'
    },
    {
        name: '웹캠 - 1080p HD',
        description: '자동 초점, 노이즈 캔슬링 마이크',
        price: 95000,
        stock_quantity: 45,
        category: '컴퓨터 주변기기',
        image_url: 'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=400&h=400&fit=crop'
    }
];

// 사용자 데이터 삽입 함수
const insertUsers = async () => {
    const connection = await pool.getConnection();
    
    try {
        console.log('샘플 사용자 데이터 삽입 중...');
        
        for (const user of sampleUsers) {
            // 비밀번호 해싱
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
            const passwordHash = await bcrypt.hash(user.password, saltRounds);
            
            await connection.query(
                'INSERT INTO users (email, password_hash, name, phone) VALUES (?, ?, ?, ?)',
                [user.email, passwordHash, user.name, user.phone]
            );
            
            console.log(`  - 사용자 추가됨: ${user.email}`);
        }
        
        console.log('✓ 샘플 사용자 데이터 삽입 완료');
        return true;
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log('  ℹ 일부 사용자가 이미 존재합니다.');
            return true;
        }
        console.error('✗ 사용자 데이터 삽입 중 오류:', error.message);
        throw error;
    } finally {
        connection.release();
    }
};

// 상품 데이터 삽입 함수
const insertProducts = async () => {
    const connection = await pool.getConnection();
    
    try {
        console.log('샘플 상품 데이터 삽입 중...');
        
        for (const product of sampleProducts) {
            await connection.query(
                'INSERT INTO products (name, description, price, stock_quantity, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
                [product.name, product.description, product.price, product.stock_quantity, product.category, product.image_url]
            );
            
            console.log(`  - 상품 추가됨: ${product.name}`);
        }
        
        console.log('✓ 샘플 상품 데이터 삽입 완료');
        return true;
    } catch (error) {
        console.error('✗ 상품 데이터 삽입 중 오류:', error.message);
        throw error;
    } finally {
        connection.release();
    }
};

// 모든 샘플 데이터 삽입
const seedDatabase = async () => {
    try {
        console.log('\n=== 샘플 데이터 삽입 시작 ===\n');
        
        await insertUsers();
        await insertProducts();
        
        console.log('\n=== 샘플 데이터 삽입 완료 ===\n');
        return true;
    } catch (error) {
        console.error('샘플 데이터 삽입 실패:', error.message);
        throw error;
    }
};

module.exports = {
    seedDatabase,
    insertUsers,
    insertProducts
};
