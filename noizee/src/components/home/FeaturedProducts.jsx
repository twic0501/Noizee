import React from 'react';
// import ProductGrid from '../product/ProductGrid';
// import { useQuery } from '@apollo/client';
// import { GET_PRODUCTS } from '../../api/graphql/queries/productQueries';

const FeaturedProducts = ({ title }) => {
    // Logic fetch sản phẩm nổi bật (ví dụ: query GET_PRODUCTS với filter/sort phù hợp)
    // const { data, loading, error } = useQuery(GET_PRODUCTS, { variables: { /* filter: {isFeatured: true}, limit: 8 */ }});
    return (
        <section className="container py-4 py-md-5">
            <div className="text-center mb-4">
                <h2 className="h3 text-uppercase fw-bold text-dark">{title || 'Featured Products'}</h2>
            </div>
            {/* {loading && <p>Loading featured products...</p>}
            {error && <p>Error loading products.</p>}
            {data && data.products && <ProductGrid products={data.products.items} />} */}
            <p>Featured Products Placeholder</p>
        </section>
    );
};
export default FeaturedProducts;