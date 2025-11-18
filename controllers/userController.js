const User = require('../models/User');

/**
 * 사용자 컨트롤러
 * 사용자 프로필 조회 및 수정 로직을 처리합니다
 */

// 프로필 조회
const getProfile = async (req, res) => {
    try {
        // 인증 미들웨어를 통과했다면 req.user에 사용자 정보가 있음
        const userId = req.user.userId;

        // 사용자 정보 조회
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: '사용자를 찾을 수 없습니다'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: {
                    userId: user.user_id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    createdAt: user.created_at,
                    updatedAt: user.updated_at
                }
            }
        });
    } catch (error) {
        console.error('프로필 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '프로필 조회 중 오류가 발생했습니다'
        });
    }
};

// 프로필 수정
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, phone } = req.body;

        // 입력 검증
        if (!name) {
            return res.status(400).json({
                success: false,
                error: '이름은 필수 항목입니다'
            });
        }

        // 이름 길이 검증
        if (name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: '유효한 이름을 입력해주세요'
            });
        }

        // 전화번호 형식 검증 (선택적)
        if (phone && phone.trim().length > 0) {
            const phoneRegex = /^[0-9-+() ]+$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({
                    success: false,
                    error: '유효한 전화번호를 입력해주세요'
                });
            }
        }

        // 사용자 정보 업데이트
        const updatedUser = await User.update(userId, {
            name: name.trim(),
            phone: phone ? phone.trim() : null
        });

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: '사용자를 찾을 수 없습니다'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: {
                    userId: updatedUser.user_id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    phone: updatedUser.phone,
                    updatedAt: updatedUser.updated_at
                },
                message: '프로필이 성공적으로 수정되었습니다'
            }
        });
    } catch (error) {
        console.error('프로필 수정 오류:', error);
        res.status(500).json({
            success: false,
            error: '프로필 수정 중 오류가 발생했습니다'
        });
    }
};

module.exports = {
    getProfile,
    updateProfile
};
