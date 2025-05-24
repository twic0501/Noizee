  
    const { gql } = require('graphql-tag');

    const typeDefs = gql`
        scalar Date
        scalar DateTime # Đảm bảo bạn có resolver cho scalar này

        type Color {
            color_id: ID!
            color_name: String!
            color_name_en: String # Thêm nếu model Color của bạn có
            color_hex: String
            name(lang: String): String # Trường ảo
        }

        type Collection {
            collection_id: ID!
            collection_name_vi: String!
            collection_name_en: String
            collection_description_vi: String
            collection_description_en: String
            slug: String!
            name(lang: String): String
            description(lang: String): String
            # productCount: Int # Nếu bạn có resolver cho trường này
        }

        type Category {
            category_id: ID!
            category_name_vi: String!
            category_name_en: String
            name(lang: String): String
        }

        type Size {
            size_id: ID!
            size_name: String!
        }

        type ProductImage {
            image_id: ID!
            image_url: String!
            alt_text_vi: String
            alt_text_en: String
            display_order: Int!
            color: Color # Màu của ảnh (ví dụ: swatch, có thể null nếu là ảnh chung)
            alt_text(lang: String): String
        }

        type Inventory {
            inventory_id: ID!
            quantity: Int!
            sku: String
            size_id: ID # ID của Size
            color_id: ID # ID của Color (màu của biến thể này)
            size: Size
            color: Color # Thông tin chi tiết của Color cho biến thể này
        }

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
            collections: [Collection!] # Danh sách các bộ sưu tập mà sản phẩm thuộc về
            images: [ProductImage!] # Tất cả ảnh của sản phẩm (cả chung và theo màu)
            inventory: [Inventory!]! # Tất cả các mục tồn kho của sản phẩm (theo màu và size)
        }

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
            # Không nên expose password hash hoặc reset tokens ở đây
        }

        type SalesItem {
            sale_item_id: ID!
            product_qty: Int!
            price_at_sale: Float!
            discount_amount: Float! # Số tiền đã giảm cho item này
            product: Product # Thông tin sản phẩm tại thời điểm bán (có thể là snapshot hoặc tham chiếu)
            size: Size
            color: Color
            product_name_at_sale: String # Tên SP tại thời điểm bán (để không bị ảnh hưởng nếu SP gốc đổi tên)
            # product_sku_at_sale: String # SKU tại thời điểm bán
        }

        type SalesTotal {
            total_id: ID!
            sale_id: ID! # Khóa ngoại đến Sale
            subtotal_amount: Float! # Tổng tiền hàng trước giảm giá, trước phí ship
            discount_total: Float!  # Tổng tiền giảm giá toàn đơn
            shipping_fee: Float!
            total_amount: Float!    # Tổng tiền cuối cùng khách trả
        }

        type SalesHistory {
            history_id: ID!
            # sale_id: ID! # Không cần thiết nếu chỉ truy cập từ Sale.history
            history_date: DateTime!
            history_status: String!
            history_notes: String
        }

        type Sale {
            sale_id: ID!
            sale_date: DateTime! # Đổi thành DateTime để có cả giờ
            sale_status: String!
            customer: Customer
            items: [SalesItem!]!
            history: [SalesHistory!]
            totals: SalesTotal # Thông tin tổng tiền
            shipping_name: String
            shipping_phone: String
            shipping_address: String
            shipping_notes: String
            payment_method: String
        }

        type AuthPayload {
            token: String!
            customer_id: ID!
            customer_name: String!
            username: String
            customer_email: String!
            isAdmin: Boolean!
            virtual_balance: Float! # Trả về số dư ảo khi đăng nhập/đăng ký
        }

        # ================= BLOG TYPES =================
        type BlogAuthor { # Có thể dùng lại Customer type nếu các trường giống nhau
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
            # postCount: Int # Số bài viết thuộc về tag này
        }

        type BlogPost {
            post_id: ID!
            author: BlogAuthor # Hoặc Customer
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
            status: String! # e.g., "draft", "published", "archived"
            visibility: String! # e.g., "public", "private"
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
            comments(limit: Int, offset: Int): BlogCommentListPayload # Để phân trang bình luận
        }

        type BlogComment {
            comment_id: ID!
            post_id: ID! # Để biết comment thuộc bài viết nào
            author: BlogAuthor # Hoặc Customer
            parent_comment_id: ID
            content: String!
            status: String! # e.g., "pending_approval", "approved", "spam"
            created_at: DateTime!
            updated_at: DateTime!
            replies(limit: Int, offset: Int): BlogCommentListPayload # Để phân trang replies
        }
        # ================= END BLOG TYPES =================

        # --- Input Types ---

        # Input cho hình ảnh sản phẩm (dùng chung cho ảnh biến thể và ảnh chung)
        input ProductImageInput {
            image_url: String!
            alt_text_vi: String
            alt_text_en: String
            display_order: Int!
            # color_id không cần ở đây, vì nó sẽ được xác định bởi context (là ảnh của biến thể màu nào, hoặc là ảnh chung)
            # Backend resolver sẽ xử lý việc gán color_id (nếu là ảnh của biến thể) hoặc để null (nếu là ảnh chung).
        }

        # Input cho một mục tồn kho (trong một biến thể màu)
        input InventoryEntryInput {
            # inventory_id: ID # Chỉ dùng khi update một entry cụ thể, thường không cần cho create/full update
            size_id: ID # Có thể null nếu sản phẩm không có size hoặc đây là tồn kho chung cho màu đó
            quantity: Int!
            sku: String
            # color_id không cần ở đây, vì nó được xác định bởi ProductColorVariantInput cha
        }

        # Input cho một biến thể màu của sản phẩm
        input ProductColorVariantInput {
            color_id: ID! # ID của màu sắc cho biến thể này
            variant_specific_images: [ProductImageInput!] # Danh sách ảnh dành riêng cho màu này
            inventory_entries: [InventoryEntryInput!]! # Danh sách tồn kho (theo size) cho màu này
        }

        # Input để tạo sản phẩm mới (Admin)
        input CreateProductAdminInput {
            product_name_vi: String!
            product_name_en: String
            product_description_vi: String
            product_description_en: String
            product_price: Float!
            category_id: ID # ID của Category
            collection_ids: [ID!] # Mảng các ID của Collection
            is_new_arrival: Boolean
            is_active: Boolean
            color_variants_data: [ProductColorVariantInput!]! # Mảng các biến thể màu
            general_gallery_images: [ProductImageInput!] # Mảng các ảnh chung (không theo màu)
        }

        # Input để cập nhật sản phẩm (Admin)
        input UpdateProductAdminInput {
            id: ID! # ID của sản phẩm cần cập nhật
            product_name_vi: String
            product_name_en: String
            product_description_vi: String
            product_description_en: String
            product_price: Float
            category_id: ID
            collection_ids: [ID!]
            is_new_arrival: Boolean
            is_active: Boolean
            # Khi cập nhật, việc gửi color_variants_data và general_gallery_images
            # sẽ thay thế hoàn toàn các biến thể và ảnh chung hiện có của sản phẩm.
            color_variants_data: [ProductColorVariantInput!]
            general_gallery_images: [ProductImageInput!]
        }

        input SaleItemInput {
            product_id: ID!
            product_qty: Int!
            size_id: ID # ID của Size (nếu có)
            color_id: ID # ID của Color (cho biến thể đã chọn)
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
            is_active: Boolean # Cho admin filter cả sản phẩm inactive
            search_term: String
            min_price: Float
            max_price: Float
            in_stock: Boolean # true = còn hàng, false = hết hàng
        }

        input AdminColorInput {
            color_name: String! # Tên màu chính
            color_name_en: String # Tên màu tiếng Anh (nếu có)
            color_hex: String # Mã HEX, ví dụ: #FF0000
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
            slug: String # Nếu để trống, backend có thể tự tạo từ name_vi
        }

        input AdminSaleFilterInput {
            status: String
            customer_id: ID
            date_from: Date # Sử dụng scalar Date đã định nghĩa
            date_to: Date
            search_term: String # Tìm theo ID đơn hàng, tên/email khách hàng, SĐT
        }

        input SaleShippingInfoInput { # Thông tin giao hàng cho đơn hàng
            name: String
            phone: String
            address: String
            notes: String
            payment_method: String # Ví dụ: "COD", "OnlinePayment"
            fee: Float # Phí vận chuyển
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
            content_html_vi: String! # Bắt buộc nội dung tiếng Việt
            content_html_en: String
            meta_title_vi: String
            meta_title_en: String
            meta_description_vi: String
            meta_description_en: String
            slug: String # Optional, can be auto-generated
            featured_image_url: String
            status: String # "draft", "published", "archived"
            visibility: String # "public", "private", "members_only"
            allow_comments: Boolean
            template_key: String
            tag_ids: [ID!] # Mảng các ID của BlogTag
        }

        input UpdateBlogPostAdminInput {
            # id: ID! # Sẽ được truyền riêng trong mutation
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

        # --- Payload Types (cho các mutation trả về nhiều hơn boolean/message) ---
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

        type UserListPayload { # Dùng cho adminGetAllUsers
            count: Int!
            users: [Customer!]!
        }
        type SalesListPayload { # Dùng cho adminGetAllSales và mySales
            count: Int!
            sales: [Sale!]!
        }
        type ProductListPayload { # Dùng cho products và adminGetAllProducts
            count: Int!
            products: [Product!]!
        }
        type AdminStatsPayload {
            totalUsers: Int!
            totalSalesAmount: Float!
            totalOrders: Int!
            totalProducts: Int! # Thêm nếu có
            totalBlogPosts: Int! # Thêm nếu có
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
            product(id: ID!, lang: String = "vi"): Product
            categories(lang: String = "vi"): [Category!]!
            sizes: [Size!]! # Sizes thường không cần lang
            publicGetAllColors(lang: String = "vi"): [Color!]! # Đổi tên để phân biệt với admin
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
            adminGetAllUsers(limit: Int, offset: Int, filter: UserFilterInput): UserListPayload! # Thêm filter cho user nếu cần
            adminGetProductDetails(id: ID!, lang: String = "vi"): Product
            adminGetAllProducts(limit: Int, offset: Int, filter: ProductFilterInput, lang: String = "vi"): ProductListPayload!
            adminGetAllColors(lang: String = "vi"): [Color!]!
            adminGetAllCollections(lang: String = "vi"): [Collection!]!
            adminGetAllSizes: [Size!]!
            adminGetAllCategories(lang: String = "vi"): [Category!]!

            # Blog Admin Queries
            adminGetAllBlogPosts(filter: BlogPostFilterInput, limit: Int, offset: Int, lang: String = "vi"): BlogPostListPayload!
            adminGetBlogPostById(id: ID!, lang: String = "vi"): BlogPost
            adminGetAllBlogTags(lang: String = "vi"): [BlogTag!]!
            adminGetAllBlogComments(post_id: ID, filter_status: String, limit: Int, offset: Int): BlogCommentListPayload!
        }
        # Input type cho User filter (ví dụ)
        input UserFilterInput {
            searchTerm: String
            isAdmin: Boolean
        }


        type Mutation {
            register(input: RegisterInput!): AuthPayload!
            login(identifier: String!, customer_password: String!): AuthPayload! # Sửa lại cho khớp resolver
            forgotPassword(email: String!): ForgotPasswordPayload!
            resetPassword(token: String!, newPassword: String!): ResetPasswordPayload! # Sửa tên argument

            # Authenticated user mutations
            createSale(items: [SaleItemInput!]!, shippingInfo: SaleShippingInfoInput): Sale!

            # Admin Product Mutations
            adminCreateProduct(input: CreateProductAdminInput!): Product! # lang không cần ở đây, resolver sẽ lấy từ context
            adminUpdateProduct(input: UpdateProductAdminInput!): Product # lang không cần ở đây
            adminDeleteProduct(id: ID!): Boolean!

            # Admin Sale Mutations
            adminUpdateSaleStatus(saleId: ID!, status: String!, notes: String): Sale

            # Admin Category Mutations
            adminCreateCategory(input: AdminCategoryInput!): Category!
            adminUpdateCategory(id: ID!, input: AdminCategoryInput!): Category
            adminDeleteCategory(id: ID!): Boolean!

            # Admin Size Mutations
            adminCreateSize(name: String!): Size! # Input đơn giản cho Size
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
            adminRejectBlogComment(comment_id: ID!): BlogComment!
            adminDeleteBlogComment(comment_id: ID!): Boolean!

            # Blog User Mutations
            createBlogComment(input: CreateBlogCommentInput!): BlogComment!
        }
    `;

    module.exports = typeDefs;
