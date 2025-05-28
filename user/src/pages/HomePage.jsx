// src/pages/HomePage.jsx
import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiGift, FiPackage, FiShield, FiCheckCircle } from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useGSAP } from '@gsap/react';

// Đăng ký plugin một lần ở đây hoặc trong main.jsx
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Import API Queries
import {
  GET_FEATURED_PRODUCTS_QUERY,
  GET_NEW_ARRIVALS_QUERY,
} from '../api/graphql/productQueries';
// import { GET_LATEST_BLOG_POSTS_QUERY } from '../api/graphql/blogQueries';

// Import Components
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import ProductGrid from '../components/product/ProductGrid';
import BlogPostCard from '../components/blog/BlogPostCard';
import OptimizedImage from '../components/common/OptimizedImage';

// --- HERO VIDEO SECTION COMPONENT ---
const HeroVideoSection = ({ videos, texts }) => {
  const { t } = useTranslation();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const heroContentRef = useRef(null);
  const videoRefs = useRef([]);
  const masterTimelineRef = useRef(null);

  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, videos.length);
  }, [videos]);

  useGSAP(() => {
    if (!heroContentRef.current || videoRefs.current.length === 0 || videos.length === 0) return;

    if (masterTimelineRef.current) {
      masterTimelineRef.current.kill();
    }

    const masterTl = gsap.timeline({
      repeat: -1,
    });
    masterTimelineRef.current = masterTl;

    gsap.set(videoRefs.current, { autoAlpha: 0 });
    gsap.set(heroContentRef.current.querySelectorAll('h1, p'), { autoAlpha: 0, y: 30 });

    videos.forEach((_, index) => {
      const videoEl = videoRefs.current[index];
      const h1 = heroContentRef.current.querySelector(`h1[data-index="${index}"]`);
      const p = heroContentRef.current.querySelector(`p[data-index="${index}"]`);

      const tl = gsap.timeline({
        onStart: () => {
          setCurrentVideoIndex(index);
          if (videoEl) {
            videoEl.currentTime = 0;
            videoEl.play().catch(error => console.warn("Video play interrupted or failed:", error));
          }
        },
        onComplete: () => {
          if (videoEl) gsap.to(videoEl, { autoAlpha: 0, duration: 0.3 });
          if (h1) gsap.to(h1, { autoAlpha: 0, y: 30, duration: 0.3 });
          if (p) gsap.to(p, { autoAlpha: 0, y: 30, duration: 0.3 }, "<");
        }
      });

      if (videoEl) {
        tl.to(videoEl, { autoAlpha: 1, duration: 0.5 }, 0);
      }

      if (h1) {
        tl.to(h1, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, ">-0.2");
      }
      if (p) {
        tl.to(p, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, ">-0.5");
      }

      const videoDuration = videoEl && videoEl.duration && isFinite(videoEl.duration) ? videoEl.duration : 5;
      const displayDuration = Math.max(3, videoDuration - 1);
      tl.to({}, { duration: displayDuration });

      masterTl.add(tl);
    });

    return () => {
      if (masterTimelineRef.current) {
        masterTimelineRef.current.kill();
        masterTimelineRef.current = null;
      }
      videoRefs.current.forEach(video => {
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      });
    };
  }, [videos, texts, t]); // Thêm t vào dependencies nếu các key dịch thay đổi


  return (
    <section className="panel hero-video-panel">
      <div className="video-background-container">
        {videos.map((videoSrc, index) => (
          <video
            key={index}
            ref={el => videoRefs.current[index] = el}
            className={`video-background`}
            src={videoSrc}
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={(e) => {
                // Logic này có thể hữu ích nếu bạn cần re-calculate timeline
                // dựa trên thời lượng thực tế sau khi video đã tải metadata.
                // Hiện tại, logic fallback duration đã xử lý trường hợp này.
            }}
          />
        ))}
      </div>
      <div ref={heroContentRef} className="hero-video-content container">
        {texts.map((text, index) => (
          <div key={index} style={{ display: index === currentVideoIndex ? 'block' : 'none' }} className="hero-text-group">
            <h1 data-index={index} className="display-3 fw-bold logo-text">
              {t(text.titleKey, text.titleDefault)}
            </h1>
            <p data-index={index} className="lead hero-subtitle">
              {t(text.subtitleKey, text.subtitleDefault)}
            </p>
          </div>
        ))}
        <Link
          to="/products"
          className="btn btn-light btn-lg mt-4"
        >
          {t('home.hero.ctaButton', 'Mua sắm ngay')} <i className="bi bi-arrow-right ms-2"></i>
        </Link>
      </div>
      <div className="scroll-down d-none d-md-block">
        {t('common.scrollDown', 'Scroll down')}<div className="arrow"></div>
      </div>
    </section>
  );
};


// --- CÁC SECTION KHÁC (ĐÃ CHUYỂN SANG BOOTSTRAP) ---
const SectionTitle = ({ title, viewAllLink, viewAllTextKey = "common.viewAll" }) => {
  const { t } = useTranslation();
  return (
    <div className="d-flex align-items-center justify-content-between mb-4 mb-md-5">
      <h2 className="section-title fs-2 text-dark">{title}</h2>
      {viewAllLink && (
        <Link to={viewAllLink} className="btn btn-sm btn-outline-primary main-menu-link">
          {t(viewAllTextKey, 'Xem tất cả')} <i className="bi bi-arrow-right ms-1"></i>
        </Link>
      )}
    </div>
  );
};

const FeaturedCollectionsSection = ({ collections, loading, error }) => {
    const { t } = useTranslation();
    if (loading) return <div className="text-center py-5"><LoadingSpinner /></div>;
    if (error) return <AlertMessage type="error" message={t('home.errors.loadCollections')} />;
    if (!collections || collections.length === 0) return null;

    return (
        <section className="panel light">
            <div className="container py-5">
                <SectionTitle title={t('home.featuredCollections.title', 'Bộ sưu tập nổi bật')} viewAllLink="/collections" />
                <div className="row g-3 g-md-4">
                    {collections.map(collection => (
                        <div key={collection.id} className="col-12 col-sm-6 col-lg-4">
                            <Link to={`/collections/${collection.slug}`} className="card text-decoration-none shadow-sm hover-shadow-lg h-100">
                                <div className="ratio ratio-16x9">
                                    <OptimizedImage
                                        src={collection.imageUrl || `https://picsum.photos/seed/${collection.slug}/600/338`}
                                        alt={collection.name}
                                        containerClassName="w-100 h-100"
                                        objectFit="object-fit-cover"
                                        className="rounded-top"
                                    />
                                </div>
                                <div className="card-body d-flex flex-column">
                                    <h3 className="card-title fs-5 main-menu-link text-dark">{collection.name}</h3>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const ServicesSection = () => {
    const { t } = useTranslation();
    const services = [
        { icon: <FiPackage className="text-primary mb-3" size={40}/>, titleKey: 'home.services.freeShipping.title', defaultTitle: 'Miễn phí giao hàng', descKey: 'home.services.freeShipping.desc', defaultDesc: 'Cho đơn hàng trên 500K' },
        { icon: <FiShield className="text-primary mb-3" size={40}/>, titleKey: 'home.services.securePayment.title', defaultTitle: 'Thanh toán bảo mật', descKey: 'home.services.securePayment.desc', defaultDesc: 'Giao dịch an toàn 100%' },
        { icon: <FiCheckCircle className="text-primary mb-3" size={40}/>, titleKey: 'home.services.qualityGuarantee.title', defaultTitle: 'Đảm bảo chất lượng', descKey: 'home.services.qualityGuarantee.desc', defaultDesc: 'Sản phẩm chính hãng' },
        { icon: <FiGift className="text-primary mb-3" size={40}/>, titleKey: 'home.services.memberOffers.title', defaultTitle: 'Ưu đãi thành viên', descKey: 'home.services.memberOffers.desc', defaultDesc: 'Nhiều quà tặng hấp dẫn' },
    ];
    return (
        <section className="panel light">
            <div className="container py-5 text-center">
                <div className="row g-4">
                    {services.map(service => (
                        <div key={service.titleKey} className="col-12 col-sm-6 col-lg-3">
                            {service.icon}
                            <h4 className="fs-5 fw-semibold text-dark mb-1">{t(service.titleKey, service.defaultTitle)}</h4>
                            <p className="small text-muted mb-0">{t(service.descKey, service.defaultDesc)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};


// --- HOMEPAGE COMPONENT ---
const HomePage = () => {
  const { t } = useTranslation();
  const mainRef = useRef();
  const scrollTween = useRef();

  const heroVideos = [
    { src: "/videos/vid_1.mp4", alt: "Fashion Model 1" },
    { src: "/videos/vid_2.mp4", alt: "Woman Walking" },
    { src: "/videos/vid_3.mp4", alt: "Couple in Flowers" },
  ];
  const heroTexts = [
    { titleKey: "home.hero.video1.title", titleDefault: "Phong Cách Đường Phố", subtitleKey: "home.hero.video1.subtitle", subtitleDefault: "Khám phá những bộ sưu tập cá tính và năng động." },
    { titleKey: "home.hero.video2.title", titleDefault: "Thanh Lịch Mỗi Ngày", subtitleKey: "home.hero.video2.subtitle", subtitleDefault: "Trang phục tinh tế cho cuộc sống hiện đại." },
    { titleKey: "home.hero.video3.title", titleDefault: "Khoảnh Khắc Tự Do", subtitleKey: "home.hero.video3.subtitle", subtitleDefault: "Thể hiện chính bạn với những thiết kế độc đáo." },
  ];

  const { contextSafe } = useGSAP(() => {
      const panels = gsap.utils.toArray('.panel', mainRef.current);
      if (panels.length === 0) return;

      panels.forEach((panel, i) => {
        ScrollTrigger.create({
          trigger: panel,
          start: 'top bottom',
          end: 'bottom top',
          // markers: import.meta.env.DEV,
          onEnter: () => goToSection(i, panels),
          onEnterBack: () => goToSection(i, panels),
        });
      });
    }, { scope: mainRef, dependencies: [] }
  );

  const goToSection = contextSafe((i, panels) => {
    if (!panels[i]) return; // Kiểm tra panel có tồn tại không
    if (scrollTween.current) {
      // scrollTween.current.kill(); // Cân nhắc nếu cần thiết
    }
    scrollTween.current = gsap.to(window, {
      scrollTo: { y: panels[i].offsetTop, autoKill: false },
      duration: 1,
      ease: 'power2.inOut',
      id: 'scrollTweenHomePage',
      overwrite: true,
      onComplete: () => (scrollTween.current = null),
    });
  });

  const { data: featuredData, loading: featuredLoading, error: featuredError } = useQuery(GET_FEATURED_PRODUCTS_QUERY, { variables: { limit: 4 } });
  const featuredProducts = featuredData?.products?.items || [];
  const { data: newArrivalsData, loading: newArrivalsLoading, error: newArrivalsError } = useQuery(GET_NEW_ARRIVALS_QUERY, { variables: { limit: 8 } });
  const newArrivals = newArrivalsData?.products?.items || [];

    const placeholderCollections = [
        { id: '1', name: 'Xu Hướng Hè 2024', slug: 'summer-2024-trends', imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80' },
        { id: '2', name: 'Thời Trang Công Sở', slug: 'office-wear', imageUrl: 'https://images.unsplash.com/photo-1581044777550-4cfa6ce670c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80' },
        { id: '3', name: 'Dạo Phố Cuối Tuần', slug: 'weekend-stroll', imageUrl: 'https://images.unsplash.com/photo-1552727793-1040943a3143?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80' },
    ];
    const homepageCollections = placeholderCollections;
    const collectionsLoading = false;
    const collectionsError = null;

    const placeholderLatestPosts = [
        { id: 'bp1', title: '10 Tips Phối Đồ Mùa Hè Bạn Cần Biết', slug: 'summer-styling-tips', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80', date: '2024-05-20', excerpt: 'Mùa hè đã đến, hãy cùng khám phá những cách phối đồ thật trendy và thoải mái...' },
        { id: 'bp2', title: 'Cách Chọn Phụ Kiện "Đinh" Cho Set Đồ', slug: 'choosing-accessories', imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80', date: '2024-05-15', excerpt: 'Phụ kiện tuy nhỏ bé nhưng lại có võ, chúng có thể nâng tầm bộ trang phục của bạn...' },
        { id: 'bp3', title: 'Chăm Sóc Trang Phục Đúng Cách Để Luôn Bền Đẹp', slug: 'clothing-care', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=872&q=80', date: '2024-05-10', excerpt: 'Để quần áo yêu thích luôn như mới, việc chăm sóc đúng cách là vô cùng quan trọng...' },
    ];
    const latestPosts = placeholderLatestPosts;
    const blogLoading = false;
    const blogError = null;


  return (
    <div ref={mainRef} className="homepage gsap-layers-main">
      <HeroVideoSection videos={heroVideos.map(v => v.src)} texts={heroTexts} />
      <FeaturedCollectionsSection collections={homepageCollections} loading={collectionsLoading} error={collectionsError} />
      <ServicesSection />
      <section className="panel light">
        <div className="container py-5">
          <SectionTitle title={t('home.newArrivals.title', 'Hàng mới về')} viewAllLink="/products?sortBy=createdAt_DESC" />
          <ProductGrid products={newArrivals} loading={newArrivalsLoading} error={newArrivalsError} />
        </div>
      </section>
      <section className="panel dark">
        <div className="container py-5">
          <SectionTitle title={t('home.featuredProducts.title', 'Sản phẩm nổi bật')} viewAllLink="/products?filter=featured" />
          <ProductGrid products={featuredProducts} loading={featuredLoading} error={featuredError} />
        </div>
      </section>
      {latestPosts && latestPosts.length > 0 && (
        <section className="panel light">
          <div className="container py-5">
            <SectionTitle title={t('home.blogHighlights.title', 'Bài viết mới nhất')} viewAllLink="/blog" />
            {blogLoading && <div className="text-center"><LoadingSpinner /></div>}
            {blogError && <AlertMessage type="error" message={t('home.errors.loadBlog')} />}
            {!blogLoading && !blogError && (
              <div className="row g-4">
                {latestPosts.map(post => (
                  <div key={post.id} className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
                    <BlogPostCard post={post} className="h-100"/>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;