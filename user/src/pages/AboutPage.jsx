// src/pages/AboutPage.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
// Chọn một bộ icon và sử dụng nhất quán, ví dụ: react-bootstrap-icons
import { People, Award, Bullseye, CupHot, Gem, Lightbulb, HeartFill } from 'react-bootstrap-icons';
// import { FiUsers, FiAward, FiTarget, FiCoffee } from 'lucide-react'; // Nếu bạn muốn dùng Lucide

import OptimizedImage from '../components/common/OptimizedImage';
import { APP_NAME } from '../utils/constants';

const AboutPage = () => {
  const { t } = useTranslation();

  const teamMembers = [
    { nameKey: 'about.team.member1.name', defaultName: 'Người Sáng Lập 1', roleKey: 'about.roles.founder', image: 'https://placehold.co/400x400/EAEAEA/333333?text=Founder&font=oswald' },
    { nameKey: 'about.team.member2.name', defaultName: 'CEO Hiện Tại', roleKey: 'about.roles.ceo', image: 'https://placehold.co/400x400/D0D0D0/333333?text=CEO&font=oswald' },
    { nameKey: 'about.team.member3.name', defaultName: 'Trưởng Nhóm Thiết Kế', roleKey: 'about.roles.leadDesigner', image: 'https://placehold.co/400x400/B0B0B0/333333?text=Designer&font=oswald' },
  ];

  return (
    <div className="bg-white text-dark"> {/* Nền trắng, chữ đen mặc định */}
      {/* Hero Section */}
      <div className="position-relative bg-primary text-white text-center">
        {/* Ảnh nền có thể được thêm vào đây với opacity */}
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{zIndex: 0}}>
           <OptimizedImage
             src="/images/banners/about-us-banner.webp" // Thay thế bằng ảnh banner thực tế của bạn
             alt={t('about.heroAlt', 'Đội ngũ Noizee làm việc')}
             containerClassName="w-100 h-100"
             objectFitClass="object-fit-cover"
             imageClassName="opacity-25" // Giảm độ mờ nếu ảnh quá sáng
             placeholderSrcOverride="https://placehold.co/1920x500/343a40/FFFFFF?text=Về+Chúng+Tôi&font=oswald"
           />
        </div>
        <div className="container position-relative py-5" style={{zIndex: 1}}>
          <h1 className="display-4 fw-bold">
            {t('about.title', `Về ${APP_NAME}`)}
          </h1>
          <p className="lead col-lg-9 mx-auto mt-3 mb-0">
            {t('about.subtitle', 'Chúng tôi là ai và điều gì thúc đẩy chúng tôi tạo ra những sản phẩm tuyệt vời cho bạn.')}
          </p>
        </div>
      </div>

      {/* Our Story Section */}
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-9 text-center">
              <h2 className="h3 fw-bold text-dark mb-3 d-inline-flex align-items-center">
                <CupHot size={28} className="me-2 text-primary" /> {t('about.ourStoryTitle', 'Câu Chuyện Của Chúng Tôi')}
              </h2>
              <p className="text-muted mb-3 px-md-3">
                {t('about.ourStoryP1', `Được thành lập vào năm ${new Date().getFullYear() - 3}, ${APP_NAME} bắt đầu với một ý tưởng đơn giản: mang đến những sản phẩm chất lượng cao, thiết kế độc đáo và trải nghiệm mua sắm tuyệt vời cho khách hàng. Chúng tôi tin rằng thời trang là cách để thể hiện cá tính và sự tự tin.`)}
              </p>
              <p className="text-muted px-md-3">
                {t('about.ourStoryP2', 'Qua nhiều năm phát triển, chúng tôi đã không ngừng nỗ lực, lắng nghe và cải tiến để phục vụ bạn tốt hơn mỗi ngày. Sự hài lòng của bạn là động lực lớn nhất của chúng tôi, và chúng tôi tự hào về cộng đồng mà mình đã xây dựng.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission and Vision Section */}
      <section className="bg-light py-5">
        <div className="container">
          <div className="row g-4 align-items-md-stretch"> {/* align-items-md-stretch để các cột bằng chiều cao */}
            <div className="col-md-6 d-flex">
              <div className="p-4 rounded border bg-white w-100"> {/* Thêm border và bg-white */}
                <h3 className="h4 fw-bold text-dark mb-2 d-flex align-items-center">
                  <Bullseye size={24} className="me-2 text-primary" /> {t('about.ourMissionTitle', 'Sứ Mệnh Của Chúng Tôi')}
                </h3>
                <p className="text-muted mb-0">
                  {t('about.ourMissionText', `${APP_NAME} có sứ mệnh cung cấp những sản phẩm thời trang không chỉ đẹp về mẫu mã mà còn vượt trội về chất lượng, đồng thời xây dựng một cộng đồng nơi mọi người có thể tự do thể hiện phong cách cá nhân và cảm thấy được truyền cảm hứng.`)}
                </p>
              </div>
            </div>
            <div className="col-md-6 d-flex">
              <div className="p-4 rounded border bg-white w-100"> {/* Thêm border và bg-white */}
                <h3 className="h4 fw-bold text-dark mb-2 d-flex align-items-center">
                  <Award size={24} className="me-2 text-primary" /> {t('about.ourVisionTitle', 'Tầm Nhìn Của Chúng Tôi')}
                </h3>
                <p className="text-muted mb-0">
                  {t('about.ourVisionText', `Chúng tôi hướng tới việc trở thành thương hiệu thời trang hàng đầu, được yêu mến bởi sự sáng tạo, cam kết về chất lượng, và trách nhiệm với cộng đồng cũng như môi trường. Mục tiêu của chúng tôi là định hình tương lai của thời trang bền vững.`)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-9 text-center mb-4">
              <h2 className="h3 fw-bold text-dark mb-3 d-inline-flex align-items-center">
                <People size={28} className="me-2 text-primary" /> {t('about.meetTheTeamTitle', 'Gặp Gỡ Đội Ngũ')}
              </h2>
              <p className="text-muted px-md-3">
                {t('about.teamIntro', `Những con người đầy nhiệt huyết, sáng tạo và tận tâm đứng sau thành công và sự phát triển không ngừng của ${APP_NAME}.`)}
              </p>
            </div>
          </div>
          <div className="row g-4 justify-content-center">
            {teamMembers.map((member, index) => (
              <div key={index} className="col-sm-6 col-md-4 col-lg-3 d-flex">
                <div className="card text-center border-0 shadow-sm h-100 w-100 custom-hover-shadow">
                  <div className="card-body p-4">
                    <OptimizedImage
                      src={member.image}
                      alt={t(member.nameKey, member.defaultName)}
                      containerClassName="rounded-circle mx-auto mb-3 overflow-hidden border border-2 border-light shadow-sm"
                      style={{ width: '120px', height: '120px' }}
                      objectFitClass="object-fit-cover"
                    />
                    <h5 className="card-title h6 fw-bold text-dark mb-1">{t(member.nameKey, member.defaultName)}</h5>
                    <p className="card-text small text-primary mb-0">{t(member.roleKey, member.roleKey.split('.').pop())}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Values Section (Optional - Bootstrap hóa) */}
      <section className="bg-light py-5">
        <div className="container">
          <h2 className="h3 fw-bold text-dark text-center mb-4">Giá trị cốt lõi</h2>
          <div className="row text-center g-4">
            <div className="col-md-4 d-flex">
              <div className="p-4 bg-white rounded border w-100 custom-hover-shadow">
                <Gem size={32} className="text-primary mb-3" /> 
                <h5 className="h6 fw-semibold">Chất lượng</h5>
                <p className="small text-muted mb-0">Chúng tôi cam kết về chất lượng vượt trội trong từng sản phẩm và dịch vụ.</p>
              </div>
            </div>
            <div className="col-md-4 d-flex">
              <div className="p-4 bg-white rounded border w-100 custom-hover-shadow">
                <Lightbulb size={32} className="text-primary mb-3" />
                <h5 className="h6 fw-semibold">Sáng tạo</h5>
                <p className="small text-muted mb-0">Luôn không ngừng đổi mới để mang đến những thiết kế độc đáo và dẫn đầu xu hướng.</p>
              </div>
            </div>
            <div className="col-md-4 d-flex">
              <div className="p-4 bg-white rounded border w-100 custom-hover-shadow">
                <HeartFill size={32} className="text-primary mb-3" />
                <h5 className="h6 fw-semibold">Khách hàng là trung tâm</h5>
                <p className="small text-muted mb-0">Sự hài lòng của bạn là ưu tiên hàng đầu và là kim chỉ nam cho mọi hoạt động của chúng tôi.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
       <style jsx global>{`
            .custom-hover-shadow:hover {
                box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.1) !important;
                transform: translateY(-3px);
                transition: box-shadow 0.25s ease-in-out, transform 0.25s ease-in-out;
            }
            .opacity-25 { opacity: 0.25 !important; } /* Đảm bảo opacity được áp dụng */
        `}</style>
    </div>
  );
};

export default AboutPage;
