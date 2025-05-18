    // backend/graphql/typeDefs.js
    const { gql } = require('graphql-tag');
    
    const typeDefs = gql`
        scalar Date
        scalar DateTime
    
        # Type cho Màu sắc
        type Color {
            color_id: ID!
            color_name: String! 
            color_name_en: String # Assuming you might have English names too
            color_hex: String
            name(lang: String): String # Virtual field
        }
    
        # Type cho Bộ sưu tập sản phẩm
        type Collection {
            collection_id: ID!
            collection_name_vi: String!
            collection_name_en: String
            collection_description_vi: String
            collection_description_en: String
            slug: String!
            name(lang: String): String
            description(lang: String): String
        }
    
        # Type cho Loại sản phẩm
        type Category {
            category_id: ID!
            category_name_vi: String!
            category_name_en: String
            name(lang: String): String
        }
    
        # Type cho Kích cỡ sản phẩm
        type Size {
            size_id: ID!
            size_name: String!
        }
    
        # Type cho Hình ảnh sản phẩm
        type ProductImage {
            image_id: ID!
            image_url: String!
            alt_text_vi: String
            alt_text_en: String
            display_order: Int!
            color: Color # Color specifically for this image (e.g., swatch)
            alt_text(lang: String): String
        }
    
        # Type cho một mục Tồn kho (biến thể sản phẩm)
        type Inventory {
            inventory_id: ID!
            quantity: Int!
            sku: String
            size_id: ID 
            color_id: ID 
            size: Size
            color: Color # CORRECTED: This is the field for the associated Color object
        }
    
        # Type cho Sản phẩm
        type Product {
            product_id: ID!
            product_name_vi: String!
            product_name_en: String
            product_description_vi: String
            product_description_en: String
            name(lang: String): String
            description(lang: String): String
            product_price: Float!
            is_new_arrival: Boolean
            is_active: Boolean!
            category: Category
            collections: [Collection!]
            images: [ProductImage!] # Field 'images' on Product type
            inventory: [Inventory!]! # Field 'inventory' on Product type
        }
    
        # Type cho Khách hàng
        type Customer {
            customer_id: ID!
            customer_name: String!
            username: String
            customer_email: String!
            customer_tel: String!
            customer_address: String
            isAdmin: Boolean!
            virtual_balance: Float!
            googleId: String
        }
    
        # Type cho một mục trong Đơn hàng chi tiết
        type SalesItem {
            sale_item_id: ID!
            product_qty: Int!
            price_at_sale: Float!
            discount_amount: Float!
            product: Product
            size: Size
            color: Color
            product_name_at_sale: String
        }
    
        # Type cho Tổng tiền Đơn hàng
        type SalesTotal {
            total_id: ID!
            sale_id: ID!
            subtotal_amount: Float!
            discount_total: Float!
            shipping_fee: Float!
            total_amount: Float!
        }
    
        # Type cho Lịch sử Đơn hàng
        type SalesHistory {
            history_id: ID!
            history_date: DateTime!
            history_status: String!
            history_notes: String
        }
    
        # Type cho Đơn hàng
        type Sale {
            sale_id: ID!
            sale_date: Date!
            sale_status: String!
            customer: Customer
            items: [SalesItem!]!
            history: [SalesHistory!]
            totals: SalesTotal
            shipping_name: String
            shipping_phone: String
            shipping_address: String
            shipping_notes: String
            payment_method: String
        }
    
        # Type cho Payload trả về khi xác thực (đăng ký/đăng nhập)
        type AuthPayload {
            token: String!
            customer_id: ID!
            customer_name: String!
            username: String
            customer_email: String!
            isAdmin: Boolean!
            virtual_balance: Float!
        }
    
        # ================= BLOG TYPES =================
        type BlogAuthor {
            customer_id: ID!
            customer_name: String!
            username: String
        }
    
        type BlogTag {
            tag_id: ID!
            name_vi: String!
            name_en: String
            slug: String!
            name(lang: String): String
        }
    
        type BlogPost {
            post_id: ID!
            author: BlogAuthor
            title_vi: String!
            title_en: String
            excerpt_vi: String
            excerpt_en: String
            content_html_vi: String
            content_html_en: String
            title(lang: String): String
            excerpt(lang: String): String
            content_html(lang: String): String
            slug: String!
            featured_image_url: String
            status: String!
            visibility: String!
            allow_comments: Boolean!
            template_key: String
            meta_title_vi: String
            meta_title_en: String
            meta_description_vi: String
            meta_description_en: String
            meta_title(lang: String): String
            meta_description(lang: String): String
            published_at: DateTime
            created_at: DateTime!
            updated_at: DateTime!
            tags: [BlogTag!]
            comments(limit: Int, offset: Int): BlogCommentListPayload
        }
    
        type BlogComment {
            comment_id: ID!
            post_id: ID!
            author: BlogAuthor
            parent_comment_id: ID
            content: String!
            status: String!
            created_at: DateTime!
            updated_at: DateTime!
            replies(limit: Int, offset: Int): BlogCommentListPayload
        }
        # ================= END BLOG TYPES =================
    
        # --- Input Types ---
        input ProductImageInput {
            image_url: String!
            alt_text_vi: String
            alt_text_en: String
            display_order: Int!
            color_id: ID # For associating image with a specific color of the product variant
        }
    
        input InventoryEntryInput {
            # inventory_id: ID # Only for update
            size_id: ID
            quantity: Int!
            sku: String
            # For update, you might need inventory_id to identify existing entries
        }
    
        input ProductColorVariantInput {
            # tempId: String # Frontend only
            color_id: ID! # Must be a valid existing Color ID
            variant_specific_images: [ProductImageInput!] # Images specific to this color variant
            inventory_entries: [InventoryEntryInput!]! # Stock details for this color variant
        }
    
        input CreateProductAdminInput {
            product_name_vi: String!
            product_name_en: String
            product_description_vi: String
            product_description_en: String
            product_price: Float!
            category_id: ID
            collection_ids: [ID!]
            is_new_arrival: Boolean
            is_active: Boolean
            color_variants_data: [ProductColorVariantInput!]! # Renamed for clarity
            general_gallery_images: [ProductImageInput!] # Images not tied to a specific color
        }
    
        input UpdateProductAdminInput {
            id: ID! # Product ID to update
            product_name_vi: String
            product_name_en: String
            product_description_vi: String
            product_description_en: String
            product_price: Float
            category_id: ID
            collection_ids: [ID!]
            is_new_arrival: Boolean
            is_active: Boolean
            # For variants and images, decide if you want full replacement or partial updates.
            # Full replacement is simpler to implement initially.
            color_variants_data: [ProductColorVariantInput!] # If provided, replaces all existing variants and their images/inventory
            general_gallery_images: [ProductImageInput!]    # If provided, replaces all existing general images
        }
    
        input SaleItemInput {
            product_id: ID!
            product_qty: Int!
            size_id: ID
            color_id: ID
        }
    
        input RegisterInput {
            username: String
            customer_name: String!
            customer_email: String!
            customer_password: String!
            customer_tel: String!
            customer_address: String
        }
    
        input ProductFilterInput {
            category_id: ID
            size_id: ID
            color_id: ID
            collection_id: ID
            is_new_arrival: Boolean
            is_active: Boolean # For admin filtering
            search_term: String
            min_price: Float
            max_price: Float
            in_stock: Boolean # True for in stock, False for out of stock
        }
    
        input AdminColorInput { 
            color_name: String! 
            color_name_en: String # Optional English name for color
            color_hex: String
        }
    
        input AdminCategoryInput {
            category_name_vi: String!
            category_name_en: String
        }
    
        input AdminCollectionInput {
            collection_name_vi: String!
            collection_name_en: String
            collection_description_vi: String
            collection_description_en: String
            slug: String
        }
    
        input AdminSaleFilterInput {
            status: String
            customer_id: ID
            date_from: Date
            date_to: Date
            search_term: String # Could search customer name/email or order ID
        }
    
        input SaleShippingInfoInput {
            name: String
            phone: String
            address: String
            notes: String
            payment_method: String # e.g., "COD", "OnlinePayment"
            fee: Float # Shipping fee
        }
    
        # ================= BLOG INPUT TYPES =================
        input BlogPostFilterInput {
            tag_slug: String
            author_id: ID
            status: String # e.g., "published", "draft" (for admin)
            search_term: String
        }
    
        input CreateBlogPostAdminInput {
            title_vi: String!
            title_en: String
            excerpt_vi: String
            excerpt_en: String
            content_html_vi: String!
            content_html_en: String
            meta_title_vi: String
            meta_title_en: String
            meta_description_vi: String
            meta_description_en: String
            slug: String # Optional, can be auto-generated
            featured_image_url: String
            status: String # "draft", "published"
            visibility: String # "public", "private"
            allow_comments: Boolean
            template_key: String # For different post layouts
            tag_ids: [ID!]
        }
    
        input UpdateBlogPostAdminInput {
            # id: ID! # Passed as separate argument in mutation
            title_vi: String
            title_en: String
            excerpt_vi: String
            excerpt_en: String
            content_html_vi: String
            content_html_en: String
            meta_title_vi: String
            meta_title_en: String
            meta_description_vi: String
            meta_description_en: String
            slug: String
            featured_image_url: String
            status: String
            visibility: String
            allow_comments: Boolean
            template_key: String
            tag_ids: [ID!]
        }
    
        input AdminBlogTagInput {
            name_vi: String!
            name_en: String
            slug: String # Optional, can be auto-generated
        }
    
        input CreateBlogCommentInput {
            post_id: ID!
            parent_comment_id: ID # For replies
            content: String!
        }
        # ================= END BLOG INPUT TYPES =================
    
        # --- Payload Types ---
        type ForgotPasswordPayload {
            success: Boolean!
            message: String!
        }
        type ResetPasswordPayload {
            success: Boolean!
            message: String!
            token: String # Optionally return a new login token
            customer: Customer # Optionally return updated customer info
        }
        type UserListPayload {
            count: Int!
            users: [Customer!]!
        }
        type SalesListPayload {
            count: Int!
            sales: [Sale!]!
        }
        type ProductListPayload {
            count: Int!
            products: [Product!]!
        }
        type AdminStatsPayload {
            totalUsers: Int!
            totalSalesAmount: Float! # Sum of SalesTotals.total_amount
            totalOrders: Int!    # Count of Sales
        }
        # ================= BLOG PAYLOAD TYPES =================
        type BlogPostListPayload {
            count: Int!
            posts: [BlogPost!]!
        }
        type BlogCommentListPayload {
            count: Int!
            comments: [BlogComment!]!
        }
        # ================= END BLOG PAYLOAD TYPES =================
    
        type Query {
            # Public queries
            products(filter: ProductFilterInput, limit: Int, offset: Int, lang: String = "vi"): ProductListPayload!
            product(id: ID!, lang: String = "vi"): Product # For single product view
            categories(lang: String = "vi"): [Category!]!
            sizes: [Size!]!
            publicGetAllColors(lang: String): [Color!]! # Added lang
            collections(lang: String = "vi"): [Collection!]!
    
            # Blog Public Queries
            blogPosts(filter: BlogPostFilterInput, limit: Int, offset: Int, lang: String = "vi"): BlogPostListPayload!
            blogPostBySlug(slug: String!, lang: String = "vi"): BlogPost
            blogTags(lang: String = "vi"): [BlogTag!]!
            blogCommentsByPost(post_id: ID!, limit: Int, offset: Int): BlogCommentListPayload!
    
            # Authenticated user queries
            myProfile: Customer
            mySales(limit: Int, offset: Int): SalesListPayload!
            mySaleDetail(id: ID!): Sale
    
            # Admin queries
            adminDashboardStats: AdminStatsPayload!
            adminGetAllSales(limit: Int, offset: Int, filter: AdminSaleFilterInput): SalesListPayload!
            adminGetSaleDetails(id: ID!): Sale
            adminGetAllUsers(limit: Int, offset: Int): UserListPayload!
            adminGetProductDetails(id: ID!, lang: String): Product # For admin edit page
            adminGetAllProducts(limit: Int, offset: Int, filter: ProductFilterInput, lang: String): ProductListPayload!
            adminGetAllColors(lang: String): [Color!]! # MODIFIED: Added lang argument
            adminGetAllCollections(lang: String): [Collection!]!
            adminGetAllSizes: [Size!]! # Sizes usually don't need lang
            adminGetAllCategories(lang: String): [Category!]!
    
            # Blog Admin Queries
            adminGetAllBlogPosts(filter: BlogPostFilterInput, limit: Int, offset: Int, lang: String = "vi"): BlogPostListPayload!
            adminGetBlogPostById(id: ID!, lang: String = "vi"): BlogPost
            adminGetAllBlogTags(lang: String = "vi"): [BlogTag!]!
            adminGetAllBlogComments(post_id: ID, filter_status: String, limit: Int, offset: Int): BlogCommentListPayload!
        }
    
        type Mutation {
            register(input: RegisterInput!): AuthPayload!
            login(identifier: String!, customer_password: String!): AuthPayload!
            forgotPassword(email: String!): ForgotPasswordPayload!
            resetPassword(token: String!, newPassword: String!): ResetPasswordPayload!
    
            # Authenticated user mutations
            createSale(items: [SaleItemInput!]!, shippingInfo: SaleShippingInfoInput): Sale!
    
            # Admin Product Mutations
            adminCreateProduct(input: CreateProductAdminInput!, lang: String): Product! # lang for return type resolution
            adminUpdateProduct(input: UpdateProductAdminInput!, lang: String): Product # lang for return type resolution
            adminDeleteProduct(id: ID!): Boolean!
    
            # Admin Sale Mutations
            adminUpdateSaleStatus(saleId: ID!, status: String!, notes: String): Sale
    
            # Admin Category Mutations
            adminCreateCategory(input: AdminCategoryInput!): Category!
            adminUpdateCategory(id: ID!, input: AdminCategoryInput!): Category
            adminDeleteCategory(id: ID!): Boolean!
    
            # Admin Size Mutations
            adminCreateSize(name: String!): Size!
            adminUpdateSize(id: ID!, name: String!): Size
            adminDeleteSize(id: ID!): Boolean!
    
            # Admin Color Mutations
            adminCreateColor(input: AdminColorInput!): Color!
            adminUpdateColor(id: ID!, input: AdminColorInput!): Color
            adminDeleteColor(id: ID!): Boolean!
    
            # Admin Collection Mutations
            adminCreateCollection(input: AdminCollectionInput!): Collection!
            adminUpdateCollection(id: ID!, input: AdminCollectionInput!): Collection
            adminDeleteCollection(id: ID!): Boolean!
    
            # Blog Admin Mutations
            adminCreateBlogPost(input: CreateBlogPostAdminInput!): BlogPost!
            adminUpdateBlogPost(id: ID!, input: UpdateBlogPostAdminInput!): BlogPost
            adminDeleteBlogPost(id: ID!): Boolean!
    
            adminCreateBlogTag(input: AdminBlogTagInput!): BlogTag!
            adminUpdateBlogTag(id: ID!, input: AdminBlogTagInput!): BlogTag
            adminDeleteBlogTag(id: ID!): Boolean!
    
            adminApproveBlogComment(comment_id: ID!): BlogComment!
            adminRejectBlogComment(comment_id: ID!): BlogComment! # Changed from "Pending" to "Reject"
            adminDeleteBlogComment(comment_id: ID!): Boolean!
    
            # Blog User Mutations
            createBlogComment(input: CreateBlogCommentInput!): BlogComment!
        }
    `;
    
    module.exports = typeDefs;