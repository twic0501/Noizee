// user/src/pages/HomePage.jsx
import React from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiGift, FiPackage, FiShield, FiCheckCircle } from 'react-icons/fi';

// Import API Queries
import {
  GET_FEATURED_PRODUCTS_QUERY,
  GET_NEW_ARRIVALS_QUERY,
  // GET_HOMEPAGE_COLLECTIONS_QUERY, // Bỏ comment khi có API
} from '../api/graphql/productQueries'; // Đảm bảo đã tạo các query này
import {
  // GET_LATEST_BLOG_POSTS_QUERY // Bỏ comment khi có API
} from '../api/graphql/blogQueries';

// Import Components
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertMessage from '../components/common/AlertMessage';
import ProductGrid from '../components/product/ProductGrid'; // Component ProductGrid
import BlogPostCard from '../components/blog/BlogPostCard';   // Component BlogPostCard
import OptimizedImage from '../components/common/OptimizedImage';

// Placeholder components cho các section (sẽ tạo file riêng sau)
const HeroSection = () => {
  const { t } = useTranslation();
  // Ví dụ Hero Section với một ảnh nền và CTA
  // Bạn có thể dùng thư viện carousel như react-slick hoặc swiperjs ở đây
  return (
    <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden">
      <div className="absolute inset-0">
        <OptimizedImage
          src="https://images.unsplash.com/photo-1523381294911-8d3cead13475?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80" // Thay bằng ảnh hero của bạn
          alt={t('home.hero.alt', "Bộ sưu tập mới")}
          containerClassName="w-full h-full"
          objectFit="object-cover"
          className="opacity-40"
        />
      </div>
      <div className="relative container mx-auto px-4 py-24 md:py-32 lg:py-40 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          {t('home.hero.title', 'Khám Phá Phong Cách Mới')}
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-indigo-100 mb-10">
          {t('home.hero.subtitle', 'Những thiết kế độc đáo, chất liệu cao cấp đang chờ bạn. Đừng bỏ lỡ ưu đãi đặc biệt mùa này!')}
        </p>
        <Link
          to="/products"
          className="inline-block bg-white text-indigo-600 font-semibold px-8 py-3 rounded-md shadow-lg hover:bg-indigo-50 transition-colors duration-300 text-lg"
        >
          {t('home.hero.ctaButton', 'Mua sắm ngay')} <FiArrowRight className="inline ml-2 h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};

const SectionTitle = ({ title, viewAllLink, viewAllTextKey = "common.viewAll" }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between mb-6 md:mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h2>
      {viewAllLink && (
        <Link to={viewAllLink} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
          {t(viewAllTextKey, 'Xem tất cả')} <FiArrowRight className="inline h-4 w-4" />
        </Link>
      )}
    </div>
  );
};

const FeaturedCollectionsSection = ({ collections, loading, error }) => {
    const { t } = useTranslation();
    if (loading) return <div className="text-center py-8"><LoadingSpinner /></div>;
    if (error) return <AlertMessage type="error" message={t('home.errors.loadCollections')} />;
    if (!collections || collections.length === 0) return null;

    return (
        <section className="py-12 md:py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                <SectionTitle title={t('home.featuredCollections.title', 'Bộ sưu tập nổi bật')} viewAllLink="/collections" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {collections.map(collection => (
                        <Link key={collection.id} to={`/collections/${collection.slug}`} className="group block relative rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
                            <OptimizedImage
                                src={collection.imageUrl || `https://picsum.photos/seed/${collection.slug}/600/400`}
                                alt={collection.name}
                                containerClassName="w-full aspect-video" // hoặc aspect-[4/3]
                                objectFit="object-cover"
                                className="transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-6">
                                <h3 className="text-xl lg:text-2xl font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">{collection.name}</h3>
                                {/* <p className="text-sm text-indigo-200 line-clamp-2">{collection.description || ''}</p> */}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};


const ServicesSection = () => {
    const { t } = useTranslation();
    const services = [
        { icon: FiPackage, titleKey: 'home.services.freeShipping.title', descKey: 'home.services.freeShipping.desc' },
        { icon: FiShield, titleKey: 'home.services.securePayment.title', descKey: 'home.services.securePayment.desc' },
        { icon: FiCheckCircle, titleKey: 'home.services.qualityGuarantee.title', descKey: 'home.services.qualityGuarantee.desc' },
        { icon: FiGift, titleKey: 'home.services.memberOffers.title', descKey: 'home.services.memberOffers.desc' },
    ];
    return (
        <section className="py-12 md:py-16">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                    {services.map(service => (
                        <div key={service.titleKey} className="p-4">
                            <service.icon className="h-10 w-10 text-indigo-600 mx-auto mb-4" />
                            <h4 className="text-lg font-semibold text-gray-800 mb-1">{t(service.titleKey)}</h4>
                            <p className="text-sm text-gray-600">{t(service.descKey)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};


const HomePage = () => {
  const { t } = useTranslation();

  // Fetch Featured Products
  const { data: featuredData, loading: featuredLoading, error: featuredError } = useQuery(GET_FEATURED_PRODUCTS_QUERY, {
    variables: { limit: 4 },
  });
  const featuredProducts = featuredData?.products?.items || [];
  
  // Fetch New Arrivals
  const { data: newArrivalsData, loading: newArrivalsLoading, error: newArrivalsError } = useQuery(GET_NEW_ARRIVALS_QUERY, {
    variables: { limit: 8 }, // Hiển thị nhiều hơn cho New Arrivals
  });
  const newArrivals = newArrivalsData?.products?.items || [];

  // Fetch Homepage Collections (Bỏ comment khi có API)
  // const { data: collectionsData, loading: collectionsLoading, error: collectionsError } = useQuery(GET_HOMEPAGE_COLLECTIONS_QUERY, {
  //   variables: { limit: 3 },
  // });
  // const homepageCollections = collectionsData?.collections || [];
   const placeholderCollections = [
        { id: 'col1', name: 'Xu Hướng Hè 2025', slug: 'xu-huong-he-2025', imageUrl: 'https://images.unsplash.com/photo-1551488831-00ddcb6ac6bd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60'},
        { id: 'col2', name: 'Thời Trang Công Sở', slug: 'thoi-trang-cong-so', imageUrl: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60'},
        { id: 'col3', name: 'Dạo Phố Cuối Tuần', slug: 'dao-pho-cuoi-tuan', imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60'},
    ];
  const homepageCollections = placeholderCollections;
  const collectionsLoading = false;
  const collectionsError = null;


  // Fetch Latest Blog Posts (Bỏ comment khi có API)
  // const { data: blogData, loading: blogLoading, error: blogError } = useQuery(GET_LATEST_BLOG_POSTS_QUERY, {
  //   variables: { limit: 3 },
  // });
  // const latestPosts = blogData?.blogPosts?.posts || blogData?.blogPosts || []; // Tùy cấu trúc trả về
  const placeholderLatestPosts = Array.from({ length: 3 }).map((_, i) => ({
    id: `homeblog${i+1}`, title: `Mẹo phối đồ cực chất cho mùa hè ${2025+i}`, slug: `meo-phoi-do-${i+1}`,
    excerpt: 'Khám phá những cách mix & match trang phục để bạn luôn nổi bật và tự tin trong mọi hoàn cảnh...',
    featuredImageUrl: `https://picsum.photos/seed/homeblog${i+1}/600/400`,
    publishedAt: new Date(Date.now() - i * 86400000 * 7).toISOString(),
    author: { firstName: 'Fashionista', lastName: '' }
  }));
  const latestPosts = placeholderLatestPosts;
  const blogLoading = false;
  const blogError = null;


  return (
    <div className="homepage">
      <HeroSection />

      {/* Featured Collections Section */}
      <FeaturedCollectionsSection collections={homepageCollections} loading={collectionsLoading} error={collectionsError} />
      
      {/* Services Section / USP (Unique Selling Proposition) */}
      <ServicesSection />

      {/* New Arrivals Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <SectionTitle title={t('home.newArrivals.title', 'Hàng mới về')} viewAllLink="/products?sortBy=createdAt_DESC" />
          <ProductGrid products={newArrivals} loading={newArrivalsLoading} error={newArrivalsError} />
        </div>
      </section>
      
      {/* Featured Products Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <SectionTitle title={t('home.featuredProducts.title', 'Sản phẩm nổi bật')} viewAllLink="/products?filter=featured" />
          <ProductGrid products={featuredProducts} loading={featuredLoading} error={featuredError} />
        </div>
      </section>

      {/* Blog Highlights Section */}
      {latestPosts && latestPosts.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <SectionTitle title={t('home.blogHighlights.title', 'Bài viết mới nhất')} viewAllLink="/blog" />
            {blogLoading && <div className="text-center"><LoadingSpinner /></div>}
            {blogError && <AlertMessage type="error" message={t('home.errors.loadBlog')} />}
            {!blogLoading && !blogError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {latestPosts.map(post => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* (Optional) Newsletter Signup Section */}
      {/* <section className="py-16 bg-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('home.newsletter.title', 'Đăng ký nhận bản tin')}</h2>
          <p className="mb-8 max-w-xl mx-auto">{t('home.newsletter.prompt', 'Nhận thông tin cập nhật về sản phẩm mới, ưu đãi đặc biệt và các sự kiện của chúng tôi.')}</p>
          // Form đăng ký newsletter
        </div>
      </section> */}
    </div>
  );
};

export default HomePage;