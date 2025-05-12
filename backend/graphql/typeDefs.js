// backend/graphql/typeDefs.js
const { gql } = require('graphql-tag');

const typeDefs = gql`
    scalar Date
    scalar DateTime

    type Color {
        color_id: ID!
        color_name: String!
        color_hex: String
    }

    type Collection {
        collection_id: ID!
        collection_name: String!
        collection_description: String
        slug: String!
        # productCount: Int # Ví dụ nếu bạn muốn đếm số sản phẩm
    }

    type Category {
        category_id: ID!
        category_name: String!
    }

    type Size {
        size_id: ID!
        size_name: String!
    }

    type Inventory {
        inventory_id: ID!
        product_id: ID! # Thêm để có thể truy vấn ngược nếu cần
        size: Size
        color: Color
        quantity: Int!
        sku: String
        size_id: ID # Thường dùng để frontend gửi lên, và backend trả về
        color_id: ID # Thường dùng để frontend gửi lên, và backend trả về
    }

    type Product {
        product_id: ID!
        product_name: String!
        product_description: String
        product_price: Float!
        imageUrl: String
        secondaryImageUrl: String
        isNewArrival: Boolean
        is_active: Boolean!
        category: Category
        sizes: [Size!] # Các size mà sản phẩm này có thể có (từ ProductSizes nếu còn dùng)
        colors: [Color!] # Các color mà sản phẩm này có thể có (từ ProductColors nếu còn dùng)
        collections: [Collection!]
        inventory: [Inventory!]! # Tồn kho chi tiết theo variant
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
        googleId: String # Nếu dùng Google OAuth
        # password_reset_token: String # Không expose
        # password_reset_expires: DateTime # Không expose
    }

    type SalesItem {
        sale_item_id: ID!
        product_qty: Int!
        price_at_sale: Float!
        discount_amount: Float!
        product: Product # Sản phẩm liên quan
        size: Size     # Size của variant đã mua (nếu có)
        color: Color   # Color của variant đã mua (nếu có)
        product_name_at_sale: String # Nên lưu lại để tránh mất mát nếu sản phẩm bị sửa/xóa
        # product_sku_at_sale: String # SKU của variant đã mua
    }

    type SalesTotal {
        # total_id: ID! # Có thể không cần ID riêng nếu là 1-1 với Sale
        sale_id: ID! # Để liên kết
        subtotal_amount: Float!
        discount_total: Float!
        shipping_fee: Float!
        total_amount: Float!
    }

    type SalesHistory {
        history_id: ID!
        history_date: DateTime!
        history_status: String!
        history_notes: String
    }

    type Sale {
        sale_id: ID!
        sale_date: Date! # Hoặc DateTime
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

    type AuthPayload {
        token: String!
        customer_id: ID!
        customer_name: String!
        username: String
        customer_email: String!
        isAdmin: Boolean!
        virtual_balance: Float!
    }

    # --- Input Types ---
    input SaleItemInput {
        product_id: ID!
        product_qty: Int!
        sizeId: ID    # Cho phép null nếu sản phẩm không có size
        colorId: ID   # Cho phép null nếu sản phẩm không có màu
        # sku: String # SKU của variant, nếu dùng để tìm InventoryItem
    }

    input RegisterInput {
        username: String
        customer_name: String!
        customer_email: String!
        customer_password: String!
        customer_tel: String!
        customer_address: String
    }

    input ProductFilterInput { # Dùng cho cả public và admin product list
        categoryId: ID
        sizeId: ID         # Filter theo size chung của sản phẩm
        colorId: ID        # Filter theo color chung của sản phẩm
        collectionId: ID
        isNewArrival: Boolean
        isActive: Boolean    # Chỉ dùng cho admin
        # inStock: Boolean     # Sẽ phức tạp, cần filter trên Inventory
        searchTerm: String
        minPrice: Float
        maxPrice: Float
    }

    input InventoryVariantInput { # Dùng cho tạo/sửa Product để định nghĩa các biến thể tồn kho
        inventory_id: ID # Chỉ cần khi update một variant cụ thể, bỏ qua khi create
        size_id: ID      # ID của Size (có thể null)
        color_id: ID     # ID của Color (có thể null)
        quantity: Int!   # Bắt buộc
        sku: String      # SKU cho biến thể này (tùy chọn, nên unique nếu có)
    }

    input ProductCreateInput {
        product_name: String!
        product_description: String
        product_price: Float!
        imageUrl: String
        secondaryImageUrl: String
        categoryId: ID!
        isNewArrival: Boolean
        is_active: Boolean # Mặc định true ở backend
        # Các trường liên kết M-M nếu bạn vẫn dùng ProductSizes, ProductColors, ProductCollections riêng
        # sizeIds: [ID!] # Các size chung mà sản phẩm này CÓ THỂ CÓ
        # colorIds: [ID!] # Các color chung mà sản phẩm này CÓ THỂ CÓ
        collectionIds: [ID!] # Các collection mà sản phẩm thuộc về
        inventoryItems: [InventoryVariantInput!]! # Danh sách các biến thể tồn kho
    }

    input ProductUpdateInput {
        product_name: String
        product_description: String
        product_price: Float
        imageUrl: String
        secondaryImageUrl: String
        categoryId: ID
        isNewArrival: Boolean
        is_active: Boolean
        # sizeIds: [ID!]
        # colorIds: [ID!]
        collectionIds: [ID!]
        inventoryItems: [InventoryVariantInput!] # Cho phép cập nhật, thêm, xóa inventory items
    }

    input AdminColorInput { # Dùng cho adminCreateColor
        color_name: String!
        color_hex: String # Cho phép null/rỗng
    }
    input AdminUpdateColorInput { # Dùng cho adminUpdateColor
        color_name: String
        color_hex: String
    }

    input AdminCollectionInput { # Dùng cho adminCreateCollection
        collection_name: String!
        collection_description: String
        slug: String!
    }
    input AdminUpdateCollectionInput { # Dùng cho adminUpdateCollection
        collection_name: String
        collection_description: String
        slug: String
    }

    input AdminSaleFilterInput { # Dùng cho adminGetAllSales
        status: String
        customerId: ID
        dateFrom: Date
        dateTo: Date
        searchTerm: String # Tìm theo sale_id, customer name/email
    }

    # --- Payload Types ---
    type ForgotPasswordPayload {
        success: Boolean!
        message: String!
    }
    type ResetPasswordPayload {
        success: Boolean!
        message: String!
        token: String
        customer: Customer
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
        totalSalesAmount: Float!
        totalOrders: Int!
        # pendingOrdersCount: Int # Nếu bạn thêm vào resolver
    }

    # --- Query Type ---
    type Query {
        # Public queries
        products(filter: ProductFilterInput, limit: Int, offset: Int): ProductListPayload!
        product(id: ID!): Product
        categories: [Category!]!
        sizes: [Size!]!
        publicGetAllColors: [Color!]! # <<<< ĐÃ THÊM ĐỂ FIX LỖI
        # publicGetAllCollections: [Collection!]! # Thêm nếu cần

        # Authenticated user queries
        myProfile: Customer
        mySales(limit: Int, offset: Int): SalesListPayload!
        mySaleDetail(id: ID!): Sale

        # Admin queries
        adminDashboardStats: AdminStatsPayload!
        adminGetAllSales(limit: Int, offset: Int, filter: AdminSaleFilterInput): SalesListPayload!
        adminGetSaleDetails(id: ID!): Sale
        adminGetAllUsers(limit: Int, offset: Int): UserListPayload!
        adminGetAllProducts(filter: ProductFilterInput, limit: Int, offset: Int): ProductListPayload!
        adminGetProductDetails(id: ID!): Product
        adminGetAllColors: [Color!]! # Dành cho admin quản lý màu
        adminGetAllCollections: [Collection!]!
        adminGetAllSizes: [Size!]!
        adminGetAllCategories: [Category!]!
    }

    # --- Mutation Type ---
    type Mutation {
        register(input: RegisterInput!): AuthPayload!
        login(identifier: String!, customer_password: String!): AuthPayload!
        forgotPassword(email: String!): ForgotPasswordPayload!
        resetPassword(token: String!, newPassword: String!): ResetPasswordPayload!

        createSale(items: [SaleItemInput!]!): Sale!

        adminCreateProduct(input: ProductCreateInput!): Product!
        adminUpdateProduct(id: ID!, input: ProductUpdateInput!): Product
        adminDeleteProduct(id: ID!): Boolean!

        adminUpdateSaleStatus(saleId: ID!, status: String!, notes: String): Sale

        adminCreateCategory(name: String!): Category!
        adminUpdateCategory(id: ID!, name: String!): Category
        adminDeleteCategory(id: ID!): Boolean!

        adminCreateSize(name: String!): Size!
        adminUpdateSize(id: ID!, name: String!): Size
        adminDeleteSize(id: ID!): Boolean!

        adminCreateColor(input: AdminColorInput!): Color!
        adminUpdateColor(id: ID!, input: AdminUpdateColorInput!): Color
        adminDeleteColor(id: ID!): Boolean!

        adminCreateCollection(input: AdminCollectionInput!): Collection!
        adminUpdateCollection(id: ID!, input: AdminUpdateCollectionInput!): Collection
        adminDeleteCollection(id: ID!): Boolean!
    }
`;

module.exports = typeDefs;