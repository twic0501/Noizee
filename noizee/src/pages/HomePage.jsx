import React from 'react';
import { Link } from 'react-router-dom'; // Cho nút "XEM COLLECTIONS"
import { useTranslation } from 'react-i18next';

// Import các component con (chúng ta sẽ tạo file cho chúng sau nếu chưa có)
import HeroSection from '../components/home/HeroSection'; // Dựa trên code mẫu App()
import ThreeVideoBackground from '../components/home/ThreeVideoBackground'; // Placeholder cho hiệu ứng 3 video
import FeaturedProducts from '../components/home/FeaturedProducts'; // Dựa trên ProductListSection từ code mẫu App()

// Placeholder cho các video - bạn cần cung cấp đường dẫn đúng tới file video
// Nên đặt video trong src/assets/videos/ và import chúng
// import video1 from '../assets/videos/video1.mp4';
// import video2 from '../assets/videos/video2.mp4';
// import video3 from '../assets/videos/video3.mp4';

const HomePage = () => {
    const { t } = useTranslation();

    // const videosForBackground = [video1, video2, video3]; // Truyền vào ThreeVideoBackground

    // Font chữ đặc biệt cho logo/heading từ user/ cũ sẽ được áp dụng qua CSS global hoặc inline style
    // const specialFontStyle = { fontFamily: "'YourNoizeeFont', sans-serif" };

    return (
        <div>
            {/* Phần 1: Hiệu ứng 3 video làm nền cho HeroSection */}
            {/* ThreeVideoBackground sẽ nằm dưới HeroSection content và có thể là full screen */}
            {/* <ThreeVideoBackground videos={videosForBackground} /> */}
            {/* HeroSection sẽ được đặt trên ThreeVideoBackground */}
            <HeroSection
                title={t('hero.title', 'NOIZEE AW25')}
                subtitle={t('hero.subtitle', 'KHÁM PHÁ BỘ SƯU TẬP MỚI')}
                buttonText={t('hero.button', 'XEM COLLECTIONS')}
                buttonLink="/collections"
                // titleStyle={specialFontStyle} // Áp dụng font đặc biệt nếu cần
            />

            {/* Phần 2: Sản phẩm nổi bật / Hàng mới về */}
            <FeaturedProducts
                title={t('nav.newArrivals', 'Hàng Mới Về')}
                // Thêm các props khác nếu cần, ví dụ: filter để lấy sản phẩm mới
            />

            {/* Các sections khác của HomePage nếu có */}
            {/* Ví dụ:
            <section className="container py-5">
                <div className="text-center">
                    <h2 className="h3 text-uppercase fw-bold text-dark">Về Thương Hiệu</h2>
                    <p className="text-muted">Một chút giới thiệu về Noizee...</p>
                    <Link to="/the-noizee" className="btn btn-outline-dark">Tìm hiểu thêm</Link>
                </div>
            </section>
            */}
        </div>
    );
};

export default HomePage;