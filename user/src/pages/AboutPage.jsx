// user/src/pages/AboutPage.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiUsers, FiAward, FiTarget, FiCoffee } from 'react-icons/fi';
import OptimizedImage from '../components/common/OptimizedImage'; // Component OptimizedImage
import { APP_NAME } from '../utils/constants';

// import './AboutPage.css'; // Tạo file CSS riêng nếu cần nhiều style phức tạp

const AboutPage = () => {
  const { t } = useTranslation();

  // Bạn sẽ cần thay thế nội dung này bằng nội dung thực tế của trang "The Noizee" hoặc "About Us"
  // Hình ảnh cũng cần được thay thế bằng hình ảnh của bạn
  const teamMembers = [
    { name: 'Người Sáng Lập 1', roleKey: 'about.roles.founder', image: 'https://via.placeholder.com/150/771796/FFFFFF?Text=User1' },
    { name: 'Người Sáng Lập 2', roleKey: 'about.roles.ceo', image: 'https://via.placeholder.com/150/24f057/FFFFFF?Text=User2' },
    { name: 'Trưởng Nhóm Thiết Kế', roleKey: 'about.roles.leadDesigner', image: 'https://via.placeholder.com/150/f77940/FFFFFF?Text=User3' },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-indigo-700">
        <div className="absolute inset-0">
          {/* <OptimizedImage src="/path/to/your/about-hero-banner.jpg" alt="Our Team" containerClassName="w-full h-full" objectFit="object-cover" className="opacity-30"/> */}
           <div className="w-full h-full bg-gray-800 opacity-40"></div> {/* Fallback màu nếu không có ảnh */}
        </div>
        <div className="relative container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            {t('about.title', `Về ${APP_NAME}`)}
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-xl text-indigo-100">
            {t('about.subtitle', 'Chúng tôi là ai và điều gì thúc đẩy chúng tôi tạo ra những sản phẩm tuyệt vời cho bạn.')}
          </p>
        </div>
      </div>

      {/* Our Story Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <FiCoffee className="mr-3 text-indigo-600 h-8 w-8" /> {t('about.ourStoryTitle', 'Câu Chuyện Của Chúng Tôi')}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {t('about.ourStoryP1', 'Được thành lập vào năm YYYY, Noizee bắt đầu với một ý tưởng đơn giản: mang đến những sản phẩm chất lượng cao, thiết kế độc đáo và trải nghiệm mua sắm tuyệt vời cho khách hàng. Chúng tôi tin rằng...')}
            </p>
            <p className="text-lg text-gray-600">
              {t('about.ourStoryP2', 'Qua nhiều năm phát triển, chúng tôi đã không ngừng nỗ lực, lắng nghe và cải tiến để phục vụ bạn tốt hơn mỗi ngày. Sự hài lòng của bạn là động lực lớn nhất của chúng tôi.')}
            </p>
          </div>
        </div>
      </section>

      {/* Mission and Vision Section */}
      <section className="bg-gray-50 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
                <FiTarget className="mr-2 text-indigo-600 h-7 w-7" /> {t('about.ourMissionTitle', 'Sứ Mệnh Của Chúng Tôi')}
              </h3>
              <p className="text-gray-600">
                {t('about.ourMissionText', 'Sứ mệnh của Noizee là cung cấp những sản phẩm thời trang không chỉ đẹp về mẫu mã mà còn vượt trội về chất lượng, đồng thời xây dựng một cộng đồng nơi mọi người có thể tự do thể hiện phong cách cá nhân.')}
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
                <FiAward className="mr-2 text-indigo-600 h-7 w-7" /> {t('about.ourVisionTitle', 'Tầm Nhìn Của Chúng Tôi')}
              </h3>
              <p className="text-gray-600">
                {t('about.ourVisionText', 'Chúng tôi hướng tới việc trở thành thương hiệu thời trang hàng đầu, được yêu mến bởi sự sáng tạo, cam kết về chất lượng và trách nhiệm với cộng đồng và môi trường.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section (Optional) */}
      {/* <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <FiUsers className="mr-3 text-indigo-600 h-8 w-8" /> {t('about.meetTheTeamTitle', 'Gặp Gỡ Đội Ngũ')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('about.teamIntro', 'Những con người đầy nhiệt huyết đứng sau thành công của Noizee.')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <OptimizedImage
                  src={member.image}
                  alt={member.name}
                  containerClassName="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg"
                  objectFit="object-cover"
                />
                <h4 className="text-lg font-semibold text-gray-800">{member.name}</h4>
                <p className="text-sm text-indigo-600">{t(member.roleKey, member.roleKey.split('.').pop())}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}
      
      {/* Values Section (Optional) */}
      {/* ... */}
    </div>
  );
};

export default AboutPage;