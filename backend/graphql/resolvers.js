// backend/graphql/resolvers.js (PHIÊN BẢN KẾT HỢP HOÀN CHỈNH)
const bcrypt = require('bcryptjs'); // [cite: 1, 314]
const jwt = require('jsonwebtoken'); // [cite: 2, 315]
const crypto = require('crypto'); // For password reset token [cite: 2, 315]
const { GraphQLError } = require('graphql'); // [cite: 2, 316]
const { Op } = require('sequelize'); // [cite: 3, 316]
// const sendEmail = require('../utils/sendEmail'); // Uncomment if using email utility [cite: 4, 317]
const logger = require('../utils/logger')
// --- HÀM HELPER ---

// Hàm tạo JWT token
const generateToken = (customer) => {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    if (!secret) {
        logger.error("FATAL ERROR: JWT_SECRET is not defined for token generation.");
        throw new Error("JWT Secret is missing.");
    }
    if (!customer || customer.customer_id === undefined) { // << SỬA: Kiểm tra customer_id
        logger.error("Error generating token: Invalid customer object provided (customer_id is undefined).", customer);
        throw new Error("Cannot generate token for invalid user data.");
    }
    // logger.debug('[BACKEND generateToken] Customer object received:', customer);
    const payload = {
        user: {
            id: customer.customer_id, // << SỬA: Đảm bảo đây là customer_id
            username: customer.username,
            isAdmin: customer.isAdmin
        }
    };
    // logger.debug('[BACKEND generateToken] JWT Payload to be signed:', payload);
    try {
        return jwt.sign(payload, secret, { expiresIn }); // Sử dụng expiresIn đã khai báo
    } catch (err) {
        logger.error("Error signing JWT:", err);
        throw new GraphQLError('Could not generate authentication token.', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
    }
};

// Hàm kiểm tra quyền Admin trong context
const checkAdmin = (context) => {
    if (!context.user || context.user.isAdmin !== true) {
        logger.warn('[Backend Resolver checkAdmin] Access DENIED. User details (or lack thereof):', context.user);
        throw new GraphQLError('Forbidden: Administrator privileges required.', {
            extensions: { code: 'FORBIDDEN', http: { status: 403 } },
        });
    }
};

// Hàm kiểm tra đã xác thực (đăng nhập) trong context
const checkAuth = (context) => {
    if (!context.user || context.user.id === undefined) { // << SỬA: Kiểm tra context.user.id
        logger.warn('[Backend Resolver checkAuth] Authentication failed: User or user.id missing from context.', context.user);
        throw new GraphQLError('Authentication required. Please log in.', {
            extensions: { code: 'UNAUTHENTICATED' }
        });
    }
};

// --- RESOLVERS ---
const resolvers = {
    // --- Query Resolvers ---
    Query: {
        // Lấy danh sách sản phẩm (có filter, pagination)
        products: async (_, { filter = {}, limit = 10, offset = 0 }, context) => { // [cite: 13, 326]
           try {
                const { db } = context;
                if (!db || !db.Product || !db.Category || !db.Size || !db.Color || !db.Collection || !db.Inventory) { // << THÊM db.Inventory
                    throw new GraphQLError('DB setup error in context: Missing one or more models (Product, Category, Size, Color, Collection, Inventory)');
                }

                const whereClause = { is_active: true }; // Chỉ lấy sản phẩm active
                const includeClause = [
                    { model: db.Category, as: 'category', required: false },
                    { model: db.Size, as: 'sizes', required: false, through: { attributes: [] } },
                    { model: db.Color, as: 'colors', required: false, through: { attributes: [] } },
                    { model: db.Collection, as: 'collections', required: false, through: { attributes: [] } },
                    {
                        model: db.Inventory, // << THÊM INCLUDE INVENTORY
                        as: 'inventory',
                        required: false, // Left join
                        include: [ // Lấy luôn tên size, màu từ inventory nếu cần
                            { model: db.Size, as: 'size', attributes: ['size_id', 'size_name'] },
                            { model: db.Color, as: 'color', attributes: ['color_id', 'color_name', 'color_hex'] }
                        ]
                    }
                ];

                // Filtering logic (tương tự controller REST)
                if (filter.categoryId) whereClause.category_id = filter.categoryId; // [cite: 15, 331]
                if (typeof filter.isNewArrival === 'boolean') whereClause.is_new_arrival = filter.isNewArrival; // [cite: 15, 332]
                if (typeof filter.inStock === 'boolean') { // [cite: 15, 333]
                   logger.warn("Filter 'inStock' for products query with variant inventory requires specific logic (e.g., subquery or post-filter).");
                }
                 if (filter.searchTerm) {
                    whereClause[Op.or] = [
                        { product_name: { [Op.like]: `%${filter.searchTerm}%` } },
                        { product_description: { [Op.like]: `%${filter.searchTerm}%` } }
                    ];
                }
                // Thêm filter giá nếu có
                 if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
                    whereClause.product_price = {};
                    if (filter.minPrice !== undefined) whereClause.product_price[Op.gte] = filter.minPrice;
                    if (filter.maxPrice !== undefined) whereClause.product_price[Op.lte] = filter.maxPrice;
                }
                
                // Include associations (luôn include Category)
                if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
                    whereClause.product_price = {};
                    if (filter.minPrice !== undefined) whereClause.product_price[Op.gte] = filter.minPrice;
                    if (filter.maxPrice !== undefined) whereClause.product_price[Op.lte] = filter.maxPrice;
                }

                if (filter.sizeId) { // Lọc sản phẩm CÓ size đó (qua bảng ProductSize)
                    includeClause.find(inc => inc.as === 'sizes').where = { size_id: filter.sizeId };
                    includeClause.find(inc => inc.as === 'sizes').required = true;
                }
                if (filter.colorId) { // Lọc sản phẩm CÓ màu đó (qua bảng ProductColor)
                    includeClause.find(inc => inc.as === 'colors').where = { color_id: filter.colorId };
                    includeClause.find(inc => inc.as === 'colors').required = true;
                }
                if (filter.collectionId) {
                    includeClause.find(inc => inc.as === 'collections').where = { collection_id: filter.collectionId };
                    includeClause.find(inc => inc.as === 'collections').required = true;
                }

                // Query DB
                const { count, rows } = await db.Product.findAndCountAll({
                    where: whereClause,
                    include: includeClause,
                    limit,
                    offset,
                    order: [['product_name', 'ASC']],
                    distinct: true
                });
                return { count, products: rows };
            } catch (error) {
                logger.error("Error fetching products (GraphQL):", error);
                throw new GraphQLError('Could not fetch products.', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' }
                });
            }
        },

        // Lấy chi tiết một sản phẩm
       product: async (_, { id }, context) => {
            try {
                const { db } = context;
                if (!db || !db.Product || !db.Inventory) { // << THÊM db.Inventory
                    throw new GraphQLError('DB setup error in context for product query (missing Product or Inventory model)');
                }
                const product = await db.Product.findOne({
                    where: { product_id: id, is_active: true },
                    include: [
                        { model: db.Category, as: 'category' },
                        { model: db.Size, as: 'sizes', through: { attributes: [] } },
                        { model: db.Color, as: 'colors', through: { attributes: [] } },
                        { model: db.Collection, as: 'collections', through: { attributes: [] } },
                        {
                            model: db.Inventory, // << THÊM INCLUDE INVENTORY
                            as: 'inventory',
                            required: false,
                            include: [
                                { model: db.Size, as: 'size', attributes: ['size_id', 'size_name'] },
                                { model: db.Color, as: 'color', attributes: ['color_id', 'color_name', 'color_hex'] }
                            ]
                        }
                    ]
                });
                if (!product) {
                    throw new GraphQLError('Product not found or inactive.', { extensions: { code: 'NOT_FOUND' } });
                }
                return product;
            } catch (error) {
                logger.error(`Error fetching product ID ${id} (GraphQL):`, error);
                if (error instanceof GraphQLError && error.extensions.code === 'NOT_FOUND') throw error;
                throw new GraphQLError('Could not fetch product details.', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' }
                });
            }
        },

        // Lấy danh sách Categories
        categories: async (_, __, context) => {
            try {
                const { db } = context;
                if (!db || !db.Category) throw new GraphQLError('DB setup error');
                return await db.Category.findAll({ order: [['category_name', 'ASC']] });
            } catch (e) {
                logger.error("Error fetching categories:", e);
                throw new GraphQLError('Could not fetch categories.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Lấy danh sách Sizes
        sizes: async (_, __, context) => {
            try {
                const { db } = context;
                if (!db || !db.Size) throw new GraphQLError('DB setup error');
                return await db.Size.findAll({ order: [['size_name', 'ASC']] });
            } catch (e) {
                logger.error("Error fetching sizes:", e);
                throw new GraphQLError('Could not fetch sizes.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },
        publicGetAllColors: async (_, __, context) => {
            try {
                const { db } = context;
                if (!db || !db.Color) throw new GraphQLError('DB setup error');
                return await db.Color.findAll({ order: [['color_name', 'ASC']] });
            } catch (e) {
                logger.error("Error fetching public colors:", e);
                throw new GraphQLError('Could not fetch colors.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },
        // Lấy thông tin profile của user đang đăng nhập
        myProfile: async (_, __, context) => {
            checkAuth(context);
            try {
                const { db } = context;
                if (!db || !db.Customer) throw new GraphQLError('DB setup error in context');
                const customer = await db.Customer.findByPk(context.user.id, {
                    attributes: { exclude: ['customer_password', 'password_reset_token', 'password_reset_expires'] }
                });
                if (!customer) throw new GraphQLError('Profile not found', { extensions: { code: 'NOT_FOUND' } });
                return customer;
            } catch (e) {
                logger.error("Error fetching myProfile:", e);
                if (e instanceof GraphQLError) throw e;
                throw new GraphQLError('Could not fetch profile.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Lấy lịch sử đơn hàng của user đang đăng nhập
        mySales: async (_, { limit = 10, offset = 0 }, context) => {
            checkAuth(context);
            try {
                const { db } = context;
                if (!db || !db.Sale || !db.Customer || !db.SalesTotals || !db.SalesItems || !db.Product || !db.Size || !db.Color) {
                    throw new GraphQLError('DB setup error in context for mySales');
                }
                const customerId = context.user.id;
                if (customerId === undefined) {
                    throw new GraphQLError('Authentication error: User ID is missing.', { extensions: { code: 'UNAUTHENTICATED' } });
                }
                const { count, rows } = await db.Sale.findAndCountAll({
                    where: { customer_id: customerId },
                    limit: limit,
                    offset: offset,
                    order: [['sale_id', 'DESC']],
                    include: [
                        { model: db.Customer, as: 'customer', attributes: ['customer_id', 'customer_name'] },
                        { model: db.SalesTotals, as: 'totals', attributes: ['total_amount'] },
                        {
                            model: db.SalesItems,
                            as: 'items',
                            // limit: 1, // Bỏ limit ở đây nếu muốn lấy hết items cho mỗi order, hoặc xử lý ở Sale.items resolver
                            include: [
                                { model: db.Product, as: 'product', attributes: ['product_id', 'product_name', 'imageUrl'] },
                                { model: db.Size, as: 'size'}, // Lấy thông tin size của item
                                { model: db.Color, as: 'color'} // Lấy thông tin color của item
                            ]
                        }
                    ],
                    distinct: true
                });
                return { count: count, sales: rows };
            } catch (e) {
                logger.error("Error fetching mySales:", e);
                if (e instanceof GraphQLError) { throw e; }
                throw new GraphQLError('Could not fetch sales history.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },
        mySaleDetail: async (_, { id }, context) => {
            checkAuth(context);
            const { db } = context;
            if (!db || !db.Sale || !db.Customer || !db.SalesItems || !db.Product || !db.SalesTotals || !db.SalesHistory || !db.Inventory || !db.Size || !db.Color) {
                throw new GraphQLError('DB setup error in context for mySaleDetail');
            }
            const customerId = context.user.id;
             if (customerId === undefined) {
                throw new GraphQLError('Authentication error: User ID is missing.', { extensions: { code: 'UNAUTHENTICATED' } });
            }
            try {
                const sale = await db.Sale.findByPk(id, {
                    include: [
                        { model: db.Customer, as: 'customer', attributes: ['customer_id', 'customer_name', 'customer_email', 'customer_tel', 'customer_address']},
                        {
                            model: db.SalesItems,
                            as: 'items',
                            include: [
                                {model: db.Product, as: 'product' }, // Lấy đầy đủ thông tin Product liên quan
                                {model: db.Size, as: 'size'}, // Lấy Size cho từng item
                                {model: db.Color, as: 'color'} // Lấy Color cho từng item
                            ]
                        },
                        { model: db.SalesTotals, as: 'totals' },
                        { model: db.SalesHistory, as: 'history', order: [['history_date', 'DESC']] }
                    ]
                });
                if (!sale) {
                    throw new GraphQLError('Order not found.', { extensions: { code: 'NOT_FOUND' } });
                }
                if (sale.customer_id !== customerId) {
                    logger.warn(`Forbidden access attempt: User ${customerId} tried to access order ${id} owned by ${sale.customer_id}`);
                    throw new GraphQLError('Order not found or access denied.', { extensions: { code: 'NOT_FOUND' } }); // Giả vờ not found
                }
                return sale;
            } catch (error) {
                logger.error(`Error fetching sale detail for ID ${id}:`, error);
                if (error instanceof GraphQLError) { throw error; }
                throw new GraphQLError('Could not fetch order details.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },
        // --- Admin Queries ---

        // Admin: Lấy danh sách tất cả người dùng (có phân trang)
        adminGetAllUsers: async (_, { limit = 20, offset = 0 }, context) => {
            checkAdmin(context);
            try {
                const { db } = context;
                if (!db || !db.Customer) throw new GraphQLError('DB setup error in context');
                const { count, rows } = await db.Customer.findAndCountAll({
                    limit,
                    offset,
                    attributes: { exclude: ['customer_password', 'password_reset_token', 'password_reset_expires'] },
                    order: [['customer_name', 'ASC']]
                });
                return { count, users: rows };
            } catch (e) {
                logger.error("Error fetching adminGetAllUsers:", e);
                throw new GraphQLError('Could not fetch users.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Admin: Lấy danh sách tất cả đơn hàng (có phân trang, filter)
        adminGetAllSales: async (_, { limit = 15, offset = 0, filter = {} }, context) => {
            checkAdmin(context);
            const { db } = context;
            if (!db || !db.Sale || !db.Customer || !db.SalesTotals) {
                throw new GraphQLError('Database models not available in context for adminGetAllSales');
            }
            try {
                const whereClause = {};
                if (filter.status) whereClause.sale_status = filter.status;
                if (filter.customerId) whereClause.customer_id = filter.customerId;

                const { count, rows } = await db.Sale.findAndCountAll({
                    where: whereClause,
                    limit,
                    offset,
                    order: [['sale_id', 'DESC']],
                    include: [
                        { model: db.Customer, as: 'customer' },
                        { model: db.SalesTotals, as: 'totals', attributes: ['total_amount'] }
                    ],
                    distinct: true
                });
                return { count, sales: rows };
            } catch (e) {
                logger.error("Error fetching adminGetAllSales in resolver:", e);
                if (e instanceof GraphQLError) throw e;
                throw new GraphQLError('Could not fetch sales for admin.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Admin: Lấy danh sách tất cả màu sắc
        adminGetAllColors: async (_, __, context) => {
            checkAdmin(context);
            try {
                const { db } = context;
                if (!db || !db.Color) throw new GraphQLError('DB setup error');
                return await db.Color.findAll({ order: [['color_name', 'ASC']] });
            } catch (e) {
                logger.error("Error fetching admin colors:", e);
                throw new GraphQLError('Could not fetch colors.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },
        adminGetAllSizes: async (_, __, context) => {
    checkAdmin(context); // Đảm bảo user là admin
    try {
        const { db } = context;
        if (!db || !db.Size) { // Quan trọng: Kiểm tra model Size
            logger.error("[adminGetAllSizes] DB setup error: Size model is not available in context.");
            throw new GraphQLError('Internal server error: Size data is unavailable.', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' }
            });
        }
        const sizes = await db.Size.findAll({ order: [['size_name', 'ASC']] });
        // findAll trả về mảng rỗng [] nếu không có dữ liệu, điều này là hợp lệ.
        // Lỗi "Cannot return null" xảy ra nếu bản thân hàm này trả về null do lỗi trước đó.
        return sizes; // Sẽ là [] nếu không có size nào, không phải null
    } catch (e) {
        logger.error("Error fetching adminGetAllSizes in resolver:", e);
        // Ném lỗi để client biết có vấn đề, thay vì trả về null ngầm định
        throw new GraphQLError('Could not fetch sizes due to a server error.', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
    }
},
        // Admin: Lấy danh sách tất cả bộ sưu tập
        adminGetAllCollections: async (_, __, context) => {
            checkAdmin(context);
            try {
                const { db } = context;
                if (!db || !db.Collection) throw new GraphQLError('DB setup error');
                return await db.Collection.findAll({ order: [['collection_name', 'ASC']] });
            } catch (e) {
                logger.error("Error fetching collections:", e);
                throw new GraphQLError('Could not fetch collections.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Admin: Lấy chi tiết một đơn hàng (đầy đủ)
        adminGetSaleDetails: async (_, { id }, context) => {
            checkAdmin(context);
            try {
                const { db } = context;
                if (!db || !db.Sale) throw new GraphQLError('DB setup error in context');
                const sale = await db.Sale.findByPk(id, {
                    include: [
                        { model: db.Customer, as: 'customer'},
                        {
                            model: db.SalesItems,
                            as: 'items',
                            include: [ // Lồng include để lấy thông tin chi tiết
                                {model: db.Product, as: 'product'},
                                {model: db.Size, as: 'size'},
                                {model: db.Color, as: 'color'}
                            ]
                        },
                        { model: db.SalesTotals, as: 'totals' },
                        { model: db.SalesHistory, as: 'history', order: [['history_date', 'DESC']] } // Sắp xếp history
                    ]
                });
                if (!sale) throw new GraphQLError('Sale not found', { extensions: { code: 'NOT_FOUND' } });
                return sale;
            } catch (e) {
                logger.error("Error fetching adminGetSaleDetails:", e);
                if (e instanceof GraphQLError) throw e;
                throw new GraphQLError('Could not fetch sale details.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Admin: Lấy danh sách tất cả sản phẩm (giống 'products' query nhưng có thể có filter/limit khác)
        adminGetAllProducts: async (_, { filter = {}, limit = 20, offset = 0 }, context) => {
            checkAdmin(context);
            logger.debug('[Backend Resolver adminGetAllProducts] Context DB keys:', Object.keys(context.db || {})); // LOG CÁC KEYS CỦA DB
            logger.debug('[Backend Resolver adminGetAllProducts] Received filter:', filter, 'Limit:', limit, 'Offset:', offset);
            try {
                const { db } = context;
                if (!db || !db.Product || !db.Category || !db.Size || !db.Color || !db.Collection || !db.Inventory) { // << THÊM db.Inventory
                    throw new GraphQLError('DB setup error in context for adminGetAllProducts (missing one or more models)');
                }

                const whereClause = {};
                const includeClause = [
                    { model: db.Category, as: 'category', required: false },
                    { model: db.Size, as: 'sizes', required: false, through: { attributes: [] } }, // Để biết SP có những size nào
                    { model: db.Color, as: 'colors', required: false, through: { attributes: [] } }, // Để biết SP có những màu nào
                    { model: db.Collection, as: 'collections', required: false, through: { attributes: [] } },
                    {
                        model: db.Inventory, // << THÊM INCLUDE INVENTORY
                        as: 'inventory',
                        required: false,
                        include: [
                            { model: db.Size, as: 'size', attributes: ['size_id', 'size_name'] },
                            { model: db.Color, as: 'color', attributes: ['color_id', 'color_name', 'color_hex'] }
                        ]
                    }
                ];

                if (filter.categoryId) whereClause.category_id = filter.categoryId;
                if (typeof filter.isNewArrival === 'boolean') whereClause.is_new_arrival = filter.isNewArrival;
                if (typeof filter.isActive === 'boolean') whereClause.is_active = filter.isActive; // Thêm filter is_active


                // Xóa bỏ logic filter `inStock` dựa trên `product_stock` cũ
                if (typeof filter.inStock === 'boolean') {
                    logger.warn("Filter 'inStock' for adminGetAllProducts with variant inventory requires specific logic based on Inventory table.");
                    // Bạn cần một cách join hoặc subquery để lọc dựa trên tổng quantity trong Inventory
                    // Hoặc lọc ở client-side/sau khi lấy dữ liệu.
                    // Ví dụ: Nếu filter.inStock là true, bạn muốn lấy sản phẩm có ít nhất 1 variant còn hàng.
                    // Nếu false, bạn muốn lấy sản phẩm mà tất cả variant đều hết hàng hoặc không có inventory.
                    // Điều này phức tạp và thường yêu cầu raw query hoặc thay đổi cấu trúc.
                }

                if (filter.searchTerm) {
                    whereClause[Op.or] = [
                        { product_name: { [Op.like]: `%${filter.searchTerm}%` } },
                        { product_description: { [Op.like]: `%${filter.searchTerm}%` } }
                    ];
                }
                if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
                    whereClause.product_price = {};
                    if (filter.minPrice !== undefined) whereClause.product_price[Op.gte] = filter.minPrice;
                    if (filter.maxPrice !== undefined) whereClause.product_price[Op.lte] = filter.maxPrice;
                }
                 if (filter.sizeId) {
                    // Để lọc sản phẩm CÓ size này (thông qua bảng ProductSize)
                    const sizeFilterInclude = includeClause.find(inc => inc.as === 'sizes');
                    if (sizeFilterInclude) {
                        sizeFilterInclude.where = { size_id: filter.sizeId };
                        sizeFilterInclude.required = true;
                    }
                }
                if (filter.colorId) {
                    const colorFilterInclude = includeClause.find(inc => inc.as === 'colors');
                    if (colorFilterInclude) {
                        colorFilterInclude.where = { color_id: filter.colorId };
                        colorFilterInclude.required = true;
                    }
                }
                if (filter.collectionId) {
                    const collectionFilterInclude = includeClause.find(inc => inc.as === 'collections');
                    if (collectionFilterInclude) {
                        collectionFilterInclude.where = { collection_id: filter.collectionId };
                        collectionFilterInclude.required = true;
                    }
                }
                 if (!context.db || !context.db.Product || !context.db.Category || !context.db.Size || !context.db.Color || !context.db.Collection || !context.db.Inventory) {
        logger.error('[Backend Resolver adminGetAllProducts] One or more models missing from context.db.');
        logger.error('[Backend Resolver adminGetAllProducts] Product present:', !!context.db?.Product);
        logger.error('[Backend Resolver adminGetAllProducts] Category present:', !!context.db?.Category);
        logger.error('[Backend Resolver adminGetAllProducts] Size present:', !!context.db?.Size);
        logger.error('[Backend Resolver adminGetAllProducts] Color present:', !!context.db?.Color);
        logger.error('[Backend Resolver adminGetAllProducts] Collection present:', !!context.db?.Collection);
        logger.error('[Backend Resolver adminGetAllProducts] Inventory present:', !!context.db?.Inventory);
        throw new GraphQLError('DB setup error in context for adminGetAllProducts (missing one or more models)');
    }

                const { count, rows } = await db.Product.findAndCountAll({
                    where: whereClause,
                    include: includeClause,
                    limit,
                    offset,
                    order: [['product_name', 'ASC']],
                    distinct: true
                });
                return { count, products: rows };
            } catch (error) {
                logger.error("[Backend Resolver adminGetAllProducts] Error:", error);
                throw new GraphQLError('Could not fetch products.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Admin: Lấy chi tiết một sản phẩm (đầy đủ associations)
        adminGetProductDetails: async (_, { id }, context) => {
            checkAdmin(context);
            try {
                const { db } = context;
                if (!db || !db.Product || !db.Category || !db.Size || !db.Color || !db.Collection || !db.Inventory) { // << THÊM db.Inventory
                    throw new GraphQLError('DB setup error in context for adminGetProductDetails (missing one or more models)');
                }
                const product = await db.Product.findByPk(id, {
                    include: [
                        { model: db.Category, as: 'category' },
                        { model: db.Size, as: 'sizes', through: { attributes: [] } },
                        { model: db.Color, as: 'colors', through: { attributes: [] } },
                        { model: db.Collection, as: 'collections', through: { attributes: [] } },
                        {
                            model: db.Inventory, // << THÊM INCLUDE INVENTORY
                            as: 'inventory',
                            required: false,
                             include: [
                                { model: db.Size, as: 'size', attributes: ['size_id', 'size_name'] },
                                { model: db.Color, as: 'color', attributes: ['color_id', 'color_name', 'color_hex'] }
                            ]
                        }
                    ]
                });
                if (!product) throw new GraphQLError('Product not found', { extensions: { code: 'NOT_FOUND' } });
                return product;
            } catch (error) {
                logger.error(`Error fetching admin product ID ${id} (GraphQL):`, error);
                if (error instanceof GraphQLError && error.extensions.code === 'NOT_FOUND') throw error;
                throw new GraphQLError('Could not fetch product details.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Admin: Lấy thống kê dashboard
        adminDashboardStats: async (_, __, context) => {
            checkAdmin(context);
            const { db, sequelize } = context;
            if (!db || !db.Customer || !db.SalesTotals || !db.Sale || !sequelize) {
                throw new GraphQLError('Database models or sequelize not available in context for adminDashboardStats');
            }
            try {
                const totalUsers = await db.Customer.count({ where: { isAdmin: false } });
                const salesAgg = await db.SalesTotals.findOne({
                    attributes: [
                        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalSalesAmount'],
                        [sequelize.fn('COUNT', sequelize.col('sale_id')), 'totalOrders']
                    ],
                    raw: true,
                });
                return {
                    totalUsers: totalUsers || 0,
                    totalSalesAmount: parseFloat(salesAgg?.totalSalesAmount || 0),
                    totalOrders: parseInt(salesAgg?.totalOrders || 0, 10)
                };
            } catch (e) {
                logger.error("Error fetching adminDashboardStats in resolver:", e);
                if (e instanceof GraphQLError) throw e;
                throw new GraphQLError('Could not fetch dashboard stats.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

    }, // End Query

    // --- Mutation Resolvers ---
    Mutation: {
        // Đăng ký user mới
        register: async (_, { input }, context) => {
            const { username, customer_name, customer_email, customer_password, customer_tel, customer_address } = input;
            const { db } = context;
            if (!db || !db.Customer) throw new GraphQLError('DB setup error in context');

            if (!customer_name || !customer_email || !customer_password || !customer_tel) {
                throw new GraphQLError('Name, email, password, and phone number are required.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            // Basic validation (thêm regex nếu muốn chặt chẽ hơn)
            if (customer_password.length < 6) {
                throw new GraphQLError('Password must be at least 6 characters.', { extensions: { code: 'BAD_USER_INPUT', field: 'customer_password' }});
            }

            try {
                const existing = await db.Customer.findOne({ where: { [Op.or]: [{ customer_email }, { customer_tel }] } });
                if (existing) {
                    let msg = existing.customer_email === customer_email ? 'Email already exists.' : 'Phone number already exists.';
                    const field = existing.customer_email === customer_email ? 'customer_email' : 'customer_tel';
                    throw new GraphQLError(msg, { extensions: { code: 'BAD_USER_INPUT', field: field } });
                }
                if (username) {
                    const usernameExists = await db.Customer.findOne({ where: { username } });
                    if (usernameExists) throw new GraphQLError('Username already exists.', { extensions: { code: 'BAD_USER_INPUT', field: 'username' } });
                }

                const newCustomer = await db.Customer.create({
                    username: username || null,
                    customer_name,
                    customer_email,
                    customer_password, // Hook sẽ hash
                    customer_tel,
                    customer_address: customer_address || null,
                    virtual_balance: 2000000,
                    isAdmin: false
                });

                const token = generateToken(newCustomer); // customer_id đã có sau khi create

                return {
                    token,
                    customer_id: newCustomer.customer_id,
                    customer_name: newCustomer.customer_name,
                    username: newCustomer.username,
                    customer_email: newCustomer.customer_email,
                    isAdmin: newCustomer.isAdmin,
                    virtual_balance: newCustomer.virtual_balance
                };

            } catch (error) {
                logger.error("Error during registration:", error);
                if (error instanceof GraphQLError) throw error;
                if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                    const message = error.errors ? error.errors.map(e => e.message).join(', ') : 'Validation or unique constraint error.';
                    const field = error.errors?.[0]?.path;
                    throw new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT', field: field } });
                }
                throw new GraphQLError('Registration failed. Please try again.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Đăng nhập (bằng email hoặc username)
        login: async (_, { identifier, customer_password }, context) => {
            const { db } = context;
            if (!db || !db.Customer) {
                logger.error("Login Resolver Error: DB context or Customer model missing.");
                throw new GraphQLError('Server configuration error.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
            if (!identifier || !customer_password) throw new GraphQLError('Identifier and password required', { extensions: { code: 'BAD_USER_INPUT' } });

            try {
                const customer = await db.Customer.findOne({ where: { [Op.or]: [{ customer_email: identifier }, { username: identifier }] } });
                if (!customer) {
                    logger.warn(`Login attempt failed: Identifier not found - ${identifier}`);
                    throw new GraphQLError('Invalid identifier or password', { extensions: { code: 'UNAUTHENTICATED' } });
                }
                const isMatch = await customer.comparePassword(customer_password);
                if (!isMatch) {
                    logger.warn(`Login attempt failed: Invalid password for identifier - ${identifier}`);
                    throw new GraphQLError('Invalid identifier or password.', { extensions: { code: 'UNAUTHENTICATED' } });
                }
                logger.info(`Customer logged in: ${customer.customer_email} (ID: ${customer.customer_id})`);
                const token = generateToken(customer); // customer_id đã có

                return {
                    token,
                    customer_id: customer.customer_id,
                    customer_name: customer.customer_name,
                    username: customer.username,
                    customer_email: customer.customer_email,
                    isAdmin: customer.isAdmin,
                    virtual_balance: customer.virtual_balance
                };
            } catch (error) {
                logger.error("Error during login process:", error);
                if (error instanceof GraphQLError) {throw error;}
                throw new GraphQLError('An internal error occurred during login.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Tạo đơn hàng mới
        createSale: async (_, { items }, context) => {
            checkAuth(context);
            if (!items || items.length === 0) throw new GraphQLError('Sale items required', { extensions: { code: 'BAD_USER_INPUT' } });

            const customer_id = context.user.id;
            if (customer_id === undefined) { // Double check user ID từ context
                throw new GraphQLError('Authentication error: User ID is missing.', { extensions: { code: 'UNAUTHENTICATED' } });
            }

            const { db, sequelize } = context;
            if (!db || !sequelize || !db.Product || !db.Sale || !db.SalesItems || !db.SalesTotals || !db.SalesHistory || !db.Customer || !db.Inventory || !db.Size || !db.Color) { // << THÊM CHECK Inventory, Size, Color
                throw new GraphQLError('DB setup error in context for createSale: Missing one or more models');
            }

            const transaction = await sequelize.transaction();
            try {
                let grossTotalAmount = 0;
                let totalDiscountApplied = 0;

                const customer = await db.Customer.findByPk(customer_id, { transaction, lock: transaction.LOCK.UPDATE });
                if (!customer) {
                    await transaction.rollback();
                    throw new GraphQLError(`Customer with ID ${customer_id} not found.`, { extensions: { code: 'NOT_FOUND' } });
                }
                let currentVirtualBalance = customer.virtual_balance;

                const saleItemsData = [];
                const inventoryUpdates = []; // Mảng lưu các promise cập nhật inventory

                for (const itemInput of items) {
                    const { product_id, product_qty, sizeId, colorId } = itemInput; // << LẤY sizeId, colorId

                    if (!product_qty || product_qty <= 0) {
                        throw new GraphQLError(`Invalid quantity for product ID ${product_id}.`, { extensions: { code: 'BAD_USER_INPUT' } });
                    }

                    // Lấy thông tin sản phẩm (chỉ cần giá)
                    const product = await db.Product.findByPk(product_id, { attributes: ['product_id', 'product_name', 'product_price'], transaction });
                    if (!product) {
                        throw new GraphQLError(`Product with ID ${product_id} not found.`, { extensions: { code: 'BAD_USER_INPUT', field: `items[product:${product_id}]` } });
                    }

                    // Tìm và khóa bản ghi inventory tương ứng
                    const inventoryRecord = await db.Inventory.findOne({
                        where: {
                            product_id: product_id,
                            size_id: sizeId || null, // Xử lý trường hợp không có size/color
                            color_id: colorId || null
                        },
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    });

                    if (!inventoryRecord || inventoryRecord.quantity < product_qty) {
                        let sizeName = sizeId ? (await db.Size.findByPk(sizeId, {transaction}))?.size_name : '';
                        let colorName = colorId ? (await db.Color.findByPk(colorId, {transaction}))?.color_name : '';
                        let variantInfo = `${product.product_name}${sizeName ? ' - Size: '+sizeName : ''}${colorName ? ' - Color: '+colorName : ''}`;
                        throw new GraphQLError(`Insufficient stock for ${variantInfo}. Available: ${inventoryRecord?.quantity || 0}`, { extensions: { code: 'BAD_USER_INPUT', field: `items[product:${product_id}]` } });
                    }

                    // Thay vì cập nhật trực tiếp, dùng decrement để an toàn hơn
                    inventoryUpdates.push(
                        db.Inventory.decrement('quantity', {
                            by: product_qty,
                            where: { inventory_id: inventoryRecord.inventory_id },
                            transaction
                        })
                    );


                    const priceAtSale = product.product_price;
                    let discountForItem = 0;
                    if (currentVirtualBalance > 0) {
                        discountForItem = Math.min(100000, currentVirtualBalance);
                        currentVirtualBalance -= discountForItem;
                        totalDiscountApplied += discountForItem;
                    }

                    saleItemsData.push({
                        sale_id: null, // Will be set after Sale is created
                        product_id: product_id,
                        product_qty: product_qty,
                        size_id: sizeId || null, // << LƯU sizeId
                        color_id: colorId || null, // << LƯU colorId
                        price_at_sale: priceAtSale,
                        discount_amount: discountForItem,
                        product_name_at_sale: product.product_name // Lưu tên SP tại thời điểm bán
                    });
                    grossTotalAmount += priceAtSale * product_qty;
                }

                // Thực hiện tất cả các cập nhật tồn kho
                await Promise.all(inventoryUpdates);


                const newSale = await db.Sale.create({
                    customer_id,
                    sale_date: new Date(),
                    sale_status: 'Pending',
                    // Lấy thông tin shipping từ input nếu có, ví dụ:
                    shipping_name: shippingInfo.name, // Cần truyền shippingInfo vào mutation nếu có
                    shipping_phone: shippingInfo.phone,
                    shipping_address: shippingInfo.address,
                    shipping_notes: shippingInfo.notes,
                    payment_method: 'COD' // Mặc định hoặc lấy từ input
                }, { transaction });
                const saleId = newSale.sale_id;

                saleItemsData.forEach(item => item.sale_id = saleId);
                await db.SalesItems.bulkCreate(saleItemsData, { transaction });

                const finalTotalAmount = grossTotalAmount - totalDiscountApplied;
                const shippingFee = 0; // Tính phí ship nếu cần
                await db.SalesTotals.create({
                    sale_id: saleId,
                    subtotal_amount: grossTotalAmount,
                    discount_total: totalDiscountApplied,
                    shipping_fee: shippingFee,
                    total_amount: finalTotalAmount + shippingFee
                }, { transaction });

                customer.virtual_balance = currentVirtualBalance;
                await customer.save({ transaction });

                await db.SalesHistory.create({
                    sale_id: saleId,
                    history_date: new Date(), // Đảm bảo new Date()
                    history_status: newSale.sale_status,
                    history_notes: `Sale created. Virtual balance used: ${totalDiscountApplied.toLocaleString('vi-VN')} VND.`
                }, { transaction });

                await transaction.commit();

                // Trả về sale đã tạo, bao gồm các thông tin liên quan
                // Resolver lồng nhau (Sale.customer, Sale.items, etc.) sẽ xử lý việc load các chi tiết này
                // nếu client yêu cầu trong query.
                const createdSale = await db.Sale.findByPk(saleId, {
                    include: [
                        { model: db.Customer, as: 'customer', attributes: ['customer_id', 'virtual_balance']}, // Trả về số dư mới
                        {
                            model: db.SalesItems,
                            as: 'items',
                            include: [
                                {model: db.Product, as: 'product'},
                                {model: db.Size, as: 'size'},
                                {model: db.Color, as: 'color'}
                            ]
                        },
                        { model: db.SalesTotals, as: 'totals' }
                    ]
                });
                return createdSale;

            } catch (error) {
                await transaction.rollback();
                logger.error("Error creating sale (GraphQL):", error);
                let errorCode = 'INTERNAL_SERVER_ERROR';
                if (error.message.includes('Insufficient stock') || error.message.includes('Invalid quantity') || error.message.includes('not found')) {
                    errorCode = 'BAD_USER_INPUT';
                }
                throw new GraphQLError(error.message || 'Failed to create sale. Please try again.', {
                    extensions: { code: errorCode }
                });
            }
        },

        // Yêu cầu reset mật khẩu
        forgotPassword: async (_, { email }, context) => {
            const { db } = context;
            if (!db || !db.Customer) throw new GraphQLError('DB setup error in context');
            if (!email) throw new GraphQLError('Email is required.', { extensions: { code: 'BAD_USER_INPUT' } });

            try {
                const customer = await db.Customer.findOne({ where: { customer_email: email } });
                if (customer) {
                    const resetToken = crypto.randomBytes(32).toString('hex');
                    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
                    const resetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

                    customer.password_reset_token = hashedToken;
                    customer.password_reset_expires = new Date(resetExpires); // Lưu dạng Date
                    await customer.save();

                    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`; // Gửi token gốc cho user
                    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl} \n\nIf you did not request this, please ignore this email and your password will remain unchanged. This link will expire in 10 minutes.`;

                    try {
                        // await sendEmail({ email: customer.customer_email, subject: 'Password Reset Request', message });
                        logger.info(`Password reset email supposedly sent to ${email}. Reset URL (for testing): ${resetUrl}`);
                    } catch (emailError) {
                        logger.error("Failed to send reset email:", emailError);
                        // Quan trọng: Không rollback token ở đây, vì user đã yêu cầu, chỉ là email lỗi
                        // User vẫn có thể thử lại sau hoặc dùng link nếu đã nhận được.
                        throw new GraphQLError('Failed to send password reset email. Please try again later.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
                    }
                } else {
                    logger.info(`Password reset request for non-existent email: ${email}`);
                }
                return { success: true, message: 'If your email is registered, you will receive reset instructions.' };
            } catch (error) {
                logger.error("Forgot Password Error:", error);
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError('An error occurred processing your request.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Reset mật khẩu bằng token
        resetPassword: async (_, { token, newPassword }, context) => {
            const { db } = context;
            if (!db || !db.Customer) throw new GraphQLError('DB setup error in context');
            if (!token || !newPassword) throw new GraphQLError('Token and new password are required.', { extensions: { code: 'BAD_USER_INPUT' } });
            if (newPassword.length < 6) { // Thêm validation độ dài
                throw new GraphQLError('Password must be at least 6 characters.', { extensions: { code: 'BAD_USER_INPUT', field: 'newPassword' }});
            }

            try {
                const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
                const customer = await db.Customer.findOne({
                    where: {
                        password_reset_token: hashedToken,
                        password_reset_expires: { [Op.gt]: new Date() } // Quan trọng: so sánh với Date object
                    }
                });

                if (!customer) {
                    throw new GraphQLError('Invalid or expired password reset token.', { extensions: { code: 'BAD_USER_INPUT' } });
                }

                customer.customer_password = newPassword; // Hook sẽ hash
                customer.password_reset_token = null;
                customer.password_reset_expires = null;
                await customer.save();

                const loginToken = generateToken(customer);
                // Lấy lại thông tin customer không có password để trả về
                 const safeCustomer = await db.Customer.findByPk(customer.customer_id, {
                    attributes: { exclude: ['customer_password', 'password_reset_token', 'password_reset_expires'] }
                });

                return {
                    success: true,
                    message: 'Password reset successfully.',
                    token: loginToken, // Trả về token để tự động đăng nhập
                    customer: safeCustomer
                };
            } catch (error) {
                logger.error("Reset Password Error:", error);
                if (error instanceof GraphQLError) throw error;
                if (error.name === 'SequelizeValidationError') { // Lỗi từ model validation (vd: độ mạnh password)
                    throw new GraphQLError(error.errors ? error.errors.map(e => e.message).join(', ') : 'Invalid new password.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                throw new GraphQLError('Failed to reset password.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Admin: Cập nhật trạng thái đơn hàng
        adminUpdateSaleStatus: async (_, { saleId, status, notes }, context) => {
            checkAdmin(context);
            const { db, sequelize } = context;
            if (!db || !sequelize || !db.Sale || !db.SalesHistory || !db.Product || !db.SalesItems || !db.Inventory) { // << THÊM CHECK Inventory
                throw new GraphQLError('DB setup error in context for adminUpdateSaleStatus');
            }

            const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Completed'];
            if (!allowedStatuses.includes(status)) {
                throw new GraphQLError('Invalid status value.', { extensions: { code: 'BAD_USER_INPUT' } });
            }

            const transaction = await sequelize.transaction();
            try {
                const sale = await db.Sale.findByPk(saleId, {
                    include: [{model: db.SalesItems, as: 'items'}], // Lấy items để hoàn kho nếu cần
                    transaction
                });
                if (!sale) {
                     await transaction.rollback();
                    throw new GraphQLError('Sale not found', { extensions: { code: 'NOT_FOUND' } });
                }

                const oldStatus = sale.sale_status;
                if (oldStatus === status) {
                    await transaction.rollback();
                    logger.info(`Sale ID ${saleId} status unchanged (${status}). No update performed.`);
                    return sale; // Trả về sale hiện tại
                }

                sale.sale_status = status;
                await sale.save({ transaction });

                await db.SalesHistory.create({
                    sale_id: saleId,
                    history_date: new Date(),
                    history_status: status,
                    history_notes: notes || `Admin updated status from ${oldStatus} to ${status}.`
                }, { transaction });

                // Xử lý hoàn trả tồn kho nếu HỦY đơn hàng đã xử lý/giao
                if (status === 'Cancelled' && ['Processing', 'Shipped', 'Delivered', 'Completed'].includes(oldStatus)) {
                    if (sale.items && sale.items.length > 0) {
                        const inventoryUpdates = sale.items.map(item => {
                             // Cập nhật bảng Inventory thay vì Product.product_stock
                            return db.Inventory.increment('quantity', {
                                by: item.product_qty,
                                where: {
                                    product_id: item.product_id,
                                    size_id: item.size_id || null, // Sử dụng size_id và color_id từ SalesItems
                                    color_id: item.color_id || null
                                },
                                transaction
                            });
                        });
                        await Promise.all(inventoryUpdates);
                        logger.info(`Restored stock in Inventory table for cancelled sale ID: ${saleId}`);
                    }
                }

                await transaction.commit();
                // Lấy lại sale đã cập nhật với đầy đủ thông tin để trả về
                return await db.Sale.findByPk(saleId, {
                     include: [
                        { model: db.Customer, as: 'customer'},
                        {
                            model: db.SalesItems,
                            as: 'items',
                            include: [
                                {model: db.Product, as: 'product'},
                                {model: db.Size, as: 'size'}, // Bao gồm Size
                                {model: db.Color, as: 'color'} // Bao gồm Color
                            ]
                        },
                        {model: db.SalesHistory, as: 'history', order: [['history_date', 'DESC']]}, // Sắp xếp history
                        {model: db.SalesTotals, as: 'totals'}
                    ]
                });
            } catch (error) {
                await transaction.rollback();
                logger.error("Admin Update Sale Status Error:", error);
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError('Failed to update sale status.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // === Admin Product Mutations ===
        adminCreateProduct: async (_, { input }, context) => {
            checkAdmin(context);
            // Bây giờ input sẽ là ProductCreateInput, bao gồm inventoryItems
            const { categoryId, collectionIds = [], inventoryItems, ...productData } = input; // << SỬA: Lấy inventoryItems
            const { product_name, product_price } = productData; // Lấy các trường bắt buộc

            if (!product_name || product_price === undefined ) { // Bỏ check product_stock
                throw new GraphQLError('Product name and price are required.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            if (!categoryId) {
                throw new GraphQLError('Category is required.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            if (!inventoryItems || !Array.isArray(inventoryItems) || inventoryItems.length === 0) { // << THÊM: Kiểm tra inventoryItems
                throw new GraphQLError('At least one inventory variant (with size, color, quantity) is required.', { extensions: { code: 'BAD_USER_INPUT' } });
            }


            const { db, sequelize } = context;
            if (!db || !sequelize || !db.Product || !db.Category || !db.Size || !db.Color || !db.Collection || !db.Inventory) { // << THÊM db.Inventory
                throw new GraphQLError('DB setup error: Missing one or more models for adminCreateProduct');
            }

            const transaction = await sequelize.transaction();
            try {
                const categoryExists = await db.Category.findByPk(categoryId, { transaction });
                if (!categoryExists) throw new GraphQLError(`Category with ID ${categoryId} not found.`, { extensions: { code: 'BAD_USER_INPUT' } });

                // Tạo Product trước
                const newProduct = await db.Product.create({
                    ...productData,
                    category_id: categoryId,
                    is_new_arrival: productData.isNewArrival ?? false,
                    is_active: productData.is_active ?? true, // Mặc định active
                    // KHÔNG còn product_stock ở đây
                }, { transaction });
                const productId = newProduct.product_id;

                // Xử lý inventoryItems
                const inventoryDataToCreate = [];
                const sizeIdsToLink = new Set(); // Để liên kết với ProductSize
                const colorIdsToLink = new Set(); // Để liên kết với ProductColor

                for (const item of inventoryItems) {
                    const { sizeId, colorId, quantity, sku } = item;
                    if (quantity === undefined || quantity === null || quantity < 0) {
                         throw new GraphQLError(`Invalid quantity provided for a variant of product "${product_name}".`, { extensions: { code: 'BAD_USER_INPUT' } });
                    }

                    // Validate sizeId và colorId nếu có
                    if (sizeId) {
                        const sizeExists = await db.Size.findByPk(sizeId, { transaction });
                        if (!sizeExists) throw new GraphQLError(`Invalid Size ID: ${sizeId}`, { extensions: { code: 'BAD_USER_INPUT' } });
                        sizeIdsToLink.add(sizeId);
                    }
                    if (colorId) {
                        const colorExists = await db.Color.findByPk(colorId, { transaction });
                        if (!colorExists) throw new GraphQLError(`Invalid Color ID: ${colorId}`, { extensions: { code: 'BAD_USER_INPUT' } });
                        colorIdsToLink.add(colorId);
                    }

                    inventoryDataToCreate.push({
                        product_id: productId,
                        size_id: sizeId || null,
                        color_id: colorId || null,
                        quantity: quantity,
                        sku: sku || null
                    });
                }

                if (inventoryDataToCreate.length > 0) {
                    await db.Inventory.bulkCreate(inventoryDataToCreate, { transaction });
                }

                // Liên kết Product với Sizes và Colors dựa trên các variant đã tạo
                if (sizeIdsToLink.size > 0) await newProduct.setSizes(Array.from(sizeIdsToLink), { transaction });
                if (colorIdsToLink.size > 0) await newProduct.setColors(Array.from(colorIdsToLink), { transaction });


                if (collectionIds && Array.isArray(collectionIds) && collectionIds.length > 0) {
                    const validCollections = await db.Collection.count({ where: { collection_id: { [Op.in]: collectionIds } }, transaction });
                    if (validCollections !== collectionIds.length) throw new GraphQLError('One or more Collection IDs are invalid.');
                    await newProduct.setCollections(collectionIds, { transaction });
                }

                await transaction.commit();
                // Reload để trả về với associations populated
                const createdProduct = await db.Product.findByPk(productId, {
                    include: [
                        'category', 'sizes', 'colors', 'collections',
                        { model: db.Inventory, as: 'inventory', include: ['size', 'color'] } // << LẤY INVENTORY
                    ]
                });
                logger.info(`Product created: ${createdProduct.product_name} (ID: ${productId}) with inventory.`);
                return createdProduct;

            } catch (error) {
                await transaction.rollback();
                logger.error("Admin Create Product Error:", error);
                if (error instanceof GraphQLError) throw error;
                if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                    throw new GraphQLError(error.errors?.map(e => e.message).join(', ') || 'Validation/Unique constraint error.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                throw new GraphQLError('Failed to create product.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Admin: Cập nhật sản phẩm
        adminUpdateProduct: async (_, { id, input }, context) => {
            checkAdmin(context);
            // Input là ProductUpdateInput, cũng cần xử lý inventoryItems
            const { categoryId, collectionIds, inventoryItems, ...productData } = input; // << SỬA: Lấy inventoryItems
            // Bỏ product_stock khỏi productData nếu có

            const { db, sequelize } = context;
             if (!db || !sequelize || !db.Product || !db.Category || !db.Size || !db.Color || !db.Collection || !db.Inventory) { // << THÊM db.Inventory
                throw new GraphQLError('DB setup error: Missing one or more models for adminUpdateProduct');
            }

            const transaction = await sequelize.transaction();
            try {
                const product = await db.Product.findByPk(id, { transaction });
                if (!product) throw new GraphQLError('Product not found', { extensions: { code: 'NOT_FOUND' } });

                const updateData = {};
                // Lấy các trường Product cơ bản từ productData
                ['product_name', 'product_description', 'product_price', 'imageUrl', 'secondaryImageUrl', 'is_active'].forEach(field => {
                    if (productData[field] !== undefined) updateData[field] = productData[field];
                });
                if (productData.isNewArrival !== undefined) updateData.is_new_arrival = productData.isNewArrival;
                // Không cập nhật product_stock ở đây nữa

                if (categoryId !== undefined) {
                    if (categoryId === null) {
                        updateData.category_id = null;
                    } else {
                        const categoryExists = await db.Category.findByPk(categoryId, { transaction });
                        if (!categoryExists) throw new GraphQLError(`Category ID ${categoryId} not found.`);
                        updateData.category_id = categoryId;
                    }
                }
                await product.update(updateData, { transaction });

                // Xử lý cập nhật inventoryItems
                // Đây là phần phức tạp: cần so sánh inventoryItems mới với inventory cũ,
                // sau đó quyết định xóa, cập nhật hay tạo mới các bản ghi trong bảng Inventory.
                if (inventoryItems && Array.isArray(inventoryItems)) {
                    logger.info(`Updating inventory for product ID ${id}:`, inventoryItems);

                    const existingInventory = await db.Inventory.findAll({ where: { product_id: id }, transaction });
                    const existingMap = new Map(); // key: 'sizeId-colorId', value: inventoryRecord
                    existingInventory.forEach(inv => {
                        const key = `${inv.size_id || 'null'}-${inv.color_id || 'null'}`;
                        existingMap.set(key, inv);
                    });

                    const inventoryUpdates = []; // Promises to save/update
                    const inventoryCreates = []; // Data for new records
                    const sizeIdsToLink = new Set();
                    const colorIdsToLink = new Set();

                    for (const item of inventoryItems) {
                        const { sizeId, colorId, quantity, sku } = item;
                         if (quantity === undefined || quantity === null || quantity < 0) {
                             throw new GraphQLError(`Invalid quantity provided for a variant of product "${product.product_name}".`, { extensions: { code: 'BAD_USER_INPUT' } });
                         }

                        if (sizeId) {
                            const sizeExists = await db.Size.findByPk(sizeId, { transaction });
                            if (!sizeExists) throw new GraphQLError(`Invalid Size ID: ${sizeId}`);
                            sizeIdsToLink.add(sizeId);
                        }
                        if (colorId) {
                            const colorExists = await db.Color.findByPk(colorId, { transaction });
                            if (!colorExists) throw new GraphQLError(`Invalid Color ID: ${colorId}`);
                            colorIdsToLink.add(colorId);
                        }

                        const itemKey = `${sizeId || 'null'}-${colorId || 'null'}`;
                        const existingVariant = existingMap.get(itemKey);

                        if (existingVariant) { // Variant đã tồn tại -> Cập nhật
                            existingVariant.quantity = quantity;
                            existingVariant.sku = sku || null;
                            inventoryUpdates.push(existingVariant.save({ transaction }));
                            existingMap.delete(itemKey); // Xóa khỏi map để biết những cái nào còn lại cần xóa khỏi DB
                        } else { // Variant mới -> Thêm
                            inventoryCreates.push({
                                product_id: id,
                                size_id: sizeId || null,
                                color_id: colorId || null,
                                quantity: quantity,
                                sku: sku || null
                            });
                        }
                    }

                    // Xóa các variant cũ không còn trong input mới
                    const inventoryToDelete = Array.from(existingMap.values());
                    if (inventoryToDelete.length > 0) {
                        await db.Inventory.destroy({
                            where: { inventory_id: { [Op.in]: inventoryToDelete.map(inv => inv.inventory_id) } },
                            transaction
                        });
                    }

                    // Tạo các variant mới
                    if (inventoryCreates.length > 0) {
                        await db.Inventory.bulkCreate(inventoryCreates, { transaction });
                    }
                    // Chờ tất cả các promise update hoàn thành
                    await Promise.all(inventoryUpdates);

                    // Cập nhật liên kết ProductSize và ProductColor dựa trên inventory mới
                     await product.setSizes(Array.from(sizeIdsToLink), { transaction });
                     await product.setColors(Array.from(colorIdsToLink), { transaction });
                }


                // Xử lý collectionIds (giữ nguyên nếu có)
                if (collectionIds !== undefined && Array.isArray(collectionIds)) {
                    if (collectionIds.length > 0) {
                        const validCollections = await db.Collection.count({ where: { collection_id: { [Op.in]: collectionIds } }, transaction });
                        if (validCollections !== collectionIds.length) throw new GraphQLError('One or more Collection IDs invalid.');
                    }
                    await product.setCollections(collectionIds, { transaction });
                }

                await transaction.commit();
                const updatedProduct = await db.Product.findByPk(id, {
                     include: [
                        'category', 'sizes', 'colors', 'collections',
                        { model: db.Inventory, as: 'inventory', include: ['size', 'color'] } // << LẤY INVENTORY
                    ]
                });
                logger.info(`Product updated: ${updatedProduct.product_name} (ID: ${id}) with inventory.`);
                return updatedProduct;

            } catch (error) {
                await transaction.rollback();
                logger.error("Admin Update Product Error:", error);
                if (error instanceof GraphQLError) throw error;
                 if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
                    throw new GraphQLError(error.errors?.map(e => e.message).join(', ') || 'Validation/Unique constraint error.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                throw new GraphQLError('Failed to update product.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // Admin: Xóa sản phẩm
       adminDeleteProduct: async (_, { id }, context) => {
            checkAdmin(context);
            const { db, sequelize } = context;
            if (!db || !sequelize || !db.Product || !db.SalesItems || !db.ProductSize || !db.ProductColor || !db.ProductCollection || !db.Inventory) { // << THÊM db.Inventory
                throw new GraphQLError('DB setup error in context for adminDeleteProduct');
            }

            const transaction = await sequelize.transaction();
            try {
                const product = await db.Product.findByPk(id, { transaction });
                if (!product) {
                    await transaction.rollback();
                    throw new GraphQLError('Product not found', { extensions: { code: 'NOT_FOUND' } });
                }

                // Kiểm tra xem sản phẩm có trong đơn hàng nào không (SalesItems)
                // Thay đổi: Nếu bạn muốn cho phép xóa SP đã bán (ví dụ, lưu trữ thông tin SP tại thời điểm bán trong SalesItems),
                // thì bạn có thể bỏ qua check này hoặc điều chỉnh logic.
                // Hiện tại, với ON DELETE CASCADE trên SalesItems -> Product, việc xóa Product sẽ xóa cả SalesItems.
                // Điều này có thể không mong muốn nếu bạn muốn giữ lại lịch sử bán hàng.
                // Cân nhắc sửa ràng buộc FK trên SalesItems.product_id thành ON DELETE SET NULL hoặc ON DELETE RESTRICT
                // và xử lý phù hợp ở đây. Giả sử hiện tại bạn muốn xóa cả SalesItems liên quan.

                // Xóa các bản ghi trong Inventory liên quan đến sản phẩm này
                await db.Inventory.destroy({ where: { product_id: id }, transaction });
                logger.info(`Deleted inventory records for product ID: ${id}`);

                // Xóa các liên kết Many-to-Many (Sequelize thường tự xử lý qua `product.destroy()` nếu `onDelete: 'CASCADE'` được đặt đúng trong model ProductCollection, ProductSize, ProductColor)
                // Tuy nhiên, để chắc chắn:
                await db.ProductSize.destroy({ where: { product_id: id }, transaction });
                await db.ProductColor.destroy({ where: { product_id: id }, transaction });
                await db.ProductCollection.destroy({ where: { product_id: id }, transaction });
                logger.info(`Deleted M-M associations for product ID: ${id}`);

                // Cuối cùng, xóa sản phẩm
                await product.destroy({ transaction });

                await transaction.commit();
                logger.info(`Admin deleted product ID: ${id}`);
                return true;
            } catch (error) {
                await transaction.rollback();
                logger.error("Admin Delete Product Error:", error);
                if (error instanceof GraphQLError) throw error;
                // Xử lý lỗi FK nếu có (ví dụ, từ SalesItems nếu không có CASCADE hoặc SET NULL)
                if (error.name === 'SequelizeForeignKeyConstraintError') {
                    throw new GraphQLError('Cannot delete product due to existing references (e.g., sales items). Consider deactivating or ensuring cascading deletes are properly set up.', { extensions: { code: 'BAD_REQUEST' } });
                }
                throw new GraphQLError('Failed to delete product.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
        },

        // === Admin Color Mutations ===
        adminCreateColor: async (_, { input }, context) => {
            checkAdmin(context);
            const { color_name, color_hex } = input;
            if (!color_name || color_name.trim() === '') {
                throw new GraphQLError('Color name is required.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            const { db } = context;
            if (!db || !db.Color) throw new GraphQLError('DB setup error');
            try {
                const createData = { color_name: color_name.trim() };
                if (color_hex !== undefined) {
                    createData.color_hex = color_hex === '' || color_hex === null ? null : color_hex;
                }
                const existing = await db.Color.findOne({
                    where: {
                        [Op.or]: [
                            { color_name: createData.color_name },
                            ...(createData.color_hex ? [{ color_hex: createData.color_hex }] : [])
                        ]
                    }
                });
                if (existing) {
                    if (existing.color_name === createData.color_name) throw new GraphQLError(`Color name "${createData.color_name}" already exists.`);
                    if (createData.color_hex && existing.color_hex === createData.color_hex) throw new GraphQLError(`Color hex "${createData.color_hex}" already exists.`);
                }
                return await db.Color.create(createData);
            } catch(e){
                logger.error("Create Color Error:", e);
                if(e.name === 'SequelizeUniqueConstraintError'){
                    const field = e.errors?.[0]?.path;
                    if (field === 'color_name') throw new GraphQLError(`Color name "${color_name.trim()}" already exists.`);
                    if (field === 'color_hex' && color_hex && color_hex !== '') throw new GraphQLError(`Color hex "${color_hex}" already exists.`);
                    throw new GraphQLError(`Color name or hex already exists.`);
                }
                throw new GraphQLError(e.message || 'Failed to create color.');
            }
        },
        adminUpdateColor: async (_, { id, input }, context) => {
            checkAdmin(context);
            if (!id) throw new GraphQLError('Color ID is required.', { extensions: { code: 'BAD_USER_INPUT' } });
            const { db } = context;
            if (!db || !db.Color) throw new GraphQLError('DB setup error');
            try {
                const color = await db.Color.findByPk(id);
                if (!color) throw new GraphQLError('Color not found', { extensions: { code: 'NOT_FOUND' }});

                const updateData = {};
                if(input.color_name !== undefined) {
                    if (input.color_name.trim() === '') throw new GraphQLError('Color name cannot be empty.', { extensions: { code: 'BAD_USER_INPUT' } });
                    updateData.color_name = input.color_name.trim();
                }
                if(input.color_hex !== undefined) {
                    updateData.color_hex = (input.color_hex === '' || input.color_hex === null) ? null : input.color_hex;
                }

                if (Object.keys(updateData).length === 0) { return color; }

                // Check for uniqueness before updating
                const checkWhere = { [Op.or]: [], color_id: { [Op.ne]: id } };
                if (updateData.color_name) checkWhere[Op.or].push({ color_name: updateData.color_name });
                if (updateData.color_hex) checkWhere[Op.or].push({ color_hex: updateData.color_hex });

                if (checkWhere[Op.or].length > 0) {
                    const existing = await db.Color.findOne({ where: checkWhere });
                    if (existing) {
                        if (updateData.color_name && existing.color_name === updateData.color_name) throw new GraphQLError(`Color name "${updateData.color_name}" already exists.`);
                        if (updateData.color_hex && existing.color_hex === updateData.color_hex) throw new GraphQLError(`Color hex "${updateData.color_hex}" already exists.`);
                    }
                }

                await color.update(updateData);
                return color;
            } catch(e){
                logger.error("Update Color Error:", e);
                if (e.name === 'SequelizeUniqueConstraintError') {
                    const field = e.errors?.[0]?.path;
                    if (field === 'color_name') throw new GraphQLError(`Color name "${input.color_name?.trim()}" already exists.`);
                    if (field === 'color_hex' && input.color_hex && input.color_hex !== '') throw new GraphQLError(`Color hex "${input.color_hex}" already exists.`);
                    throw new GraphQLError(`Color name or hex already exists.`);
                }
                if (e instanceof GraphQLError) throw e;
                throw new GraphQLError(e.message || 'Failed to update color.');
            }
        },
        adminDeleteColor: async (_, { id }, context) => {
            checkAdmin(context);
            if (!id) { throw new GraphQLError('Color ID is required.', { extensions: { code: 'BAD_USER_INPUT' }}); }
            const { db, sequelize } = context;
            if (!db || !sequelize || !db.Color || !db.ProductColor || !db.Inventory) throw new GraphQLError('DB setup error for adminDeleteColor'); // << THÊM db.Inventory

            const transaction = await sequelize.transaction();
            try {
                logger.debug(`Attempting to delete color with ID: ${id}`);
                const color = await db.Color.findByPk(id, { transaction });
                if (!color) {
                    await transaction.rollback();
                    throw new GraphQLError('Color not found.', { extensions: { code: 'NOT_FOUND' } });
                }
                // 1. Xóa liên kết trong ProductColor
                await db.ProductColor.destroy({ where: { color_id: id }, transaction });
                logger.debug(`Deleted associations in ProductColor for color ID: ${id}`);

                // 2. Cập nhật color_id thành NULL trong bảng Inventory
                await db.Inventory.update({ color_id: null }, { where: { color_id: id }, transaction });
                logger.debug(`Updated Inventory records to set color_id=NULL for color ID: ${id}`);

                // 3. Xóa màu
                await color.destroy({ transaction });
                await transaction.commit();
                logger.info(`Admin deleted color ID: ${id}`);
                return true;
            } catch (error) {
                await transaction.rollback();
                logger.error("Admin Delete Color Error:", error);
                if (error.name === 'SequelizeForeignKeyConstraintError') { // Lỗi này có thể xảy ra nếu có ràng buộc khác chưa xử lý
                    throw new GraphQLError('Cannot delete color due to other existing references. Please check constraints.', { extensions: { code: 'BAD_REQUEST' } });
                }
                throw new GraphQLError(error.message || 'Failed to delete color.');
            }
        },

        // === Admin Collection Mutations ===
        adminCreateCollection: async (_, { input }, context) => {
            checkAdmin(context); // [cite: 704]
            const { collection_name, collection_description, slug } = input; // Lấy input
             if (!collection_name || collection_name.trim() === '') throw new GraphQLError('Collection name is required.', { extensions: { code: 'BAD_USER_INPUT' } }); // [cite: 705]
             if (!slug || slug.trim() === '') throw new GraphQLError('Collection slug is required.', { extensions: { code: 'BAD_USER_INPUT' } }); // Giả sử slug bắt buộc [cite: 706]

             const { db } = context; // [cite: 707]
             if (!db || !db.Collection) throw new GraphQLError('DB setup error'); //
            try {
                // Kiểm tra unique trước khi tạo
                const existing = await db.Collection.findOne({ where: { [Op.or]: [{ collection_name: collection_name.trim() }, { slug: slug.trim() }] } });
                if (existing) {
                    if (existing.collection_name === collection_name.trim()) throw new GraphQLError(`Collection name "${collection_name.trim()}" already exists.`);
                    if (existing.slug === slug.trim()) throw new GraphQLError(`Collection slug "${slug.trim()}" already exists.`);
                }
                // Tạo collection
                return await db.Collection.create({ //
                    collection_name: collection_name.trim(),
                    collection_description: collection_description || null, // Cho phép null
                    slug: slug.trim() //
                }); // [cite: 708]
            } catch(e){
                console.error("Create Collection Error:", e); // [cite: 710]
                if (e.name === 'SequelizeUniqueConstraintError') { // Lỗi unique từ DB
                    const field = e.errors?.[0]?.path; // [cite: 711]
                    if (field === 'collection_name') throw new GraphQLError(`Collection name "${collection_name.trim()}" already exists.`); // [cite: 712]
                    if (field === 'slug') throw new GraphQLError(`Collection slug "${slug.trim()}" already exists.`); // [cite: 712]
                    throw new GraphQLError(`Collection name or slug already exists.`); // [cite: 713]
                }
                 throw new GraphQLError(e.message || 'Failed to create collection.'); // [cite: 714]
            }
        },
        adminUpdateCollection: async (_, { id, input }, context) => {
             checkAdmin(context); // [cite: 715]
             if (!id) throw new GraphQLError('Collection ID is required.', { extensions: { code: 'BAD_USER_INPUT' } }); //
             const {db}=context; // [cite: 716]
             if (!db || !db.Collection) throw new GraphQLError('DB setup error'); //
             try{
                 const collection = await db.Collection.findByPk(id); // Tìm collection [cite: 716]
                 if (!collection) throw new GraphQLError('Collection not found', { extensions: { code: 'NOT_FOUND' }}); // [cite: 717]

                 const updateData = {}; // Dữ liệu cập nhật [cite: 718]
                 if(input.collection_name !== undefined) { // Cập nhật tên
                     if (input.collection_name === null || input.collection_name.trim() === '') throw new GraphQLError('Collection name cannot be empty.', { extensions: { code: 'BAD_USER_INPUT' } }); // [cite: 718]
                     updateData.collection_name = input.collection_name.trim(); // [cite: 719]
                 }
                 if(input.collection_description !== undefined) updateData.collection_description = input.collection_description; // Cập nhật mô tả (cho phép null) [cite: 720]
                 if(input.slug !== undefined) { // Cập nhật slug
                     if (input.slug === null || input.slug.trim() === '') throw new GraphQLError('Collection slug cannot be empty.', { extensions: { code: 'BAD_USER_INPUT' } }); // [cite: 720]
                     updateData.slug = input.slug.trim(); // [cite: 721]
                 }

                 if (Object.keys(updateData).length === 0) { // Nếu không có gì thay đổi
                    return collection; // [cite: 722]
                 }

                 // Kiểm tra unique trước khi update
                // ... (tương tự create)

                 await collection.update(updateData); // Cập nhật [cite: 723]
                 return collection; // Trả về collection đã cập nhật

             } catch(e){
                 console.error("Update Collection Error:", e); // [cite: 724]
                 if (e.name === 'SequelizeUniqueConstraintError') { // Lỗi unique từ DB
                     const field = e.errors?.[0]?.path; // [cite: 725]
                     if (field === 'collection_name') throw new GraphQLError(`Collection name "${input.collection_name?.trim()}" already exists.`); // [cite: 726]
                     if (field === 'slug') throw new GraphQLError(`Collection slug "${input.slug?.trim()}" already exists.`); // [cite: 726]
                     throw new GraphQLError(`Collection name or slug already exists.`); // [cite: 727]
                 }
                  if (e instanceof GraphQLError) throw e; // [cite: 728]
                  throw new GraphQLError(e.message || 'Failed to update collection.'); //
             }
        },
        adminDeleteCollection: async (_, { id }, context) => {
             checkAdmin(context); // [cite: 729]
             if (!id) { throw new GraphQLError('Collection ID required.'); } //
             const { db, sequelize } = context; // [cite: 730]
             if (!db || !sequelize || !db.Collection || !db.ProductCollection) throw new GraphQLError('DB setup error'); //

             const transaction = await sequelize.transaction(); // [cite: 731]
             try {
                 const collection = await db.Collection.findByPk(id, { transaction }); // Tìm collection [cite: 731]
                 if (!collection) { await transaction.rollback(); throw new GraphQLError('Collection not found.', { extensions: { code: 'NOT_FOUND' }}); } // [cite: 733]

                 // Xóa liên kết trong ProductCollection trước
                 await db.ProductCollection.destroy({ where: { collection_id: id }, transaction }); // [cite: 734]
                 console.log(`Deleted associations for collection ID: ${id}`); //

                 // Xóa collection
                 await collection.destroy({ transaction }); //
                 await transaction.commit(); //
                 console.log(`Admin deleted collection ID: ${id}`); //
                 return true; // [cite: 735]

             } catch (e) {
                 await transaction.rollback(); // [cite: 736]
                 console.error("Admin Delete Collection Error:", e); //
                 // Check lỗi FK nếu xóa ProductCollection thất bại
                  if (e.name === 'SequelizeForeignKeyConstraintError') { //
                      throw new GraphQLError('Cannot delete collection as it is still referenced by products.', { extensions: { code: 'BAD_REQUEST' } }); // [cite: 737]
                  }
                 throw new GraphQLError(e.message || 'Failed to delete collection.'); // [cite: 738]
             }
        },

        // === Admin Category Mutations ===
        adminCreateCategory: async (_, { name }, context) => {
            checkAdmin(context); // [cite: 739]
            if (!name || name.trim() === '') throw new GraphQLError('Category name is required.', { extensions: { code: 'BAD_USER_INPUT' }}); // [cite: 740]
            const { db } = context; if (!db || !db.Category) throw new GraphQLError('DB setup error'); // [cite: 741]
            try {
                const trimmedName = name.trim(); // [cite: 742]
                const existing = await db.Category.findOne({ where: { category_name: trimmedName } }); // Kiểm tra trùng
                if (existing) throw new GraphQLError(`Category name "${trimmedName}" already exists.`); // [cite: 743]
                return await db.Category.create({ category_name: trimmedName }); // Tạo
            } catch (e) {
                 console.error("Admin Create Category Error:", e); // [cite: 744]
                 if (e instanceof GraphQLError) throw e; //
                 if (e.name === 'SequelizeUniqueConstraintError') { // Lỗi unique từ DB (fallback)
                    throw new GraphQLError(`Category name "${name.trim()}" already exists.`); // [cite: 745]
                 }
                 throw new GraphQLError('Failed to create category.'); // [cite: 746]
            }
        },
        adminUpdateCategory: async (_, { id, name }, context) => {
            checkAdmin(context); // [cite: 747]
            if (!id || !name || name.trim() === '') throw new GraphQLError('Category ID and new name are required.', { extensions: { code: 'BAD_USER_INPUT' }}); // [cite: 748]
            const { db } = context; if (!db || !db.Category) throw new GraphQLError('DB setup error'); // [cite: 749]
            try {
                const category = await db.Category.findByPk(id); // Tìm category [cite: 749]
                if (!category) throw new GraphQLError('Category not found.', { extensions: { code: 'NOT_FOUND' }}); // [cite: 750]
                const trimmedName = name.trim(); // [cite: 751]
                if (category.category_name === trimmedName) return category; // Không đổi

                // Kiểm tra trùng tên mới (trừ chính nó)
                const existing = await db.Category.findOne({ where: { category_name: trimmedName, category_id: { [Op.ne]: id } } }); // [cite: 752]
                if (existing) throw new GraphQLError(`Category name "${trimmedName}" already exists.`); //

                category.category_name = trimmedName; // Cập nhật tên
                await category.save(); // Lưu
                return category; // [cite: 753]
            } catch (e) {
                 console.error("Admin Update Category Error:", e); // [cite: 754]
                 if (e instanceof GraphQLError) throw e; //
                 if (e.name === 'SequelizeUniqueConstraintError') { // Lỗi unique từ DB (fallback)
                     throw new GraphQLError(`Category name "${name.trim()}" already exists.`); // [cite: 755]
                 }
                 throw new GraphQLError('Failed to update category.'); // [cite: 756]
            }
        },
        adminDeleteCategory: async (_, { id }, context) => {
             checkAdmin(context); // [cite: 757]
             if (!id) throw new GraphQLError('Category ID required.', { extensions: { code: 'BAD_USER_INPUT' }}); //
             const { db, sequelize } = context; // [cite: 758]
             if (!db || !sequelize || !db.Category || !db.Product) throw new GraphQLError('DB setup error'); //

             const transaction = await sequelize.transaction(); // [cite: 759]
             try {
                 const category = await db.Category.findByPk(id, { transaction }); // Tìm category [cite: 759]
                 if (!category) { await transaction.rollback(); throw new GraphQLError('Category not found.', { extensions: { code: 'NOT_FOUND' }}); } // [cite: 761]

                 // Quan trọng: Giả sử Product.category_id có ON DELETE SET NULL hoặc bạn muốn set null thủ công
                 // Cập nhật các Product liên quan để set category_id thành NULL trước khi xóa Category
                 console.log(`Updating products linked to category ID: ${id} to NULL`); // [cite: 762]
                 const [affectedCount] = await db.Product.update( // [cite: 762]
                     { category_id: null }, // Set null
                     { where: { category_id: id }, transaction } // Cho các product thuộc category này
                 ); // [cite: 763]
                 console.log(`Products updated: ${affectedCount}. Now deleting category ID: ${id}`); //

                 // Xóa category
                 await category.destroy({ transaction }); //
                 await transaction.commit(); //
                 console.log(`Admin deleted category ID: ${id}`); //
                 return true; // [cite: 764]

             } catch (e) {
                 await transaction.rollback(); // [cite: 765]
                 console.error("Admin Delete Category Error:", e); //
                 // Lỗi FK nếu update Product thất bại hoặc FK không cho phép NULL
                  if (e.name === 'SequelizeForeignKeyConstraintError') { //
                     throw new GraphQLError('Cannot delete category as it is still referenced by products (update failed?).', { extensions: { code: 'BAD_REQUEST' } }); // [cite: 766]
                  }
                 throw new GraphQLError('Failed to delete category.'); // [cite: 767]
             }
        },

        // === Admin Size Mutations ===
         adminCreateSize: async (_, { name }, context) => {
             checkAdmin(context); // [cite: 768]
             if (!name || name.trim() === '') throw new GraphQLError('Size name required.', { extensions: { code: 'BAD_USER_INPUT' }}); // [cite: 769]
             const { db } = context; if (!db || !db.Size) throw new GraphQLError('DB setup error'); // [cite: 770]
             try {
                 const trimmedName = name.trim(); // [cite: 771]
                 const existing = await db.Size.findOne({ where: { size_name: trimmedName } }); // Kiểm tra trùng
                 if (existing) throw new GraphQLError(`Size name "${trimmedName}" already exists.`); // [cite: 772]
                 return await db.Size.create({ size_name: trimmedName }); // Tạo
             } catch (e) {
                 console.error("Admin Create Size Error:", e); // [cite: 773]
                 if (e instanceof GraphQLError) throw e;
                 if (e.name === 'SequelizeUniqueConstraintError') {throw new GraphQLError(`Size name "${name.trim()}" already exists.`);}
                 throw new GraphQLError('Failed to create size.');
             }
         },
         adminUpdateSize: async (_, { id, name }, context) => {
             checkAdmin(context); // [cite: 774]
             if (!id || !name || name.trim() === '') throw new GraphQLError('Size ID and name required.', { extensions: { code: 'BAD_USER_INPUT' }}); // [cite: 775]
             const { db } = context; if (!db || !db.Size) throw new GraphQLError('DB setup error'); // [cite: 776]
             try {
                 const size = await db.Size.findByPk(id); // Tìm size [cite: 776]
                 if (!size) throw new GraphQLError('Size not found.', { extensions: { code: 'NOT_FOUND' }}); // [cite: 777]
                 const trimmedName = name.trim(); // [cite: 778]
                 if (size.size_name === trimmedName) return size; // Không đổi

                 // Kiểm tra trùng tên mới
                 const existing = await db.Size.findOne({ where: { size_name: trimmedName, size_id: { [Op.ne]: id } } }); // [cite: 779]
                 if (existing) throw new GraphQLError(`Size name "${trimmedName}" already exists.`); //

                 size.size_name = trimmedName; // Cập nhật
                 await size.save(); // Lưu
                 return size; // [cite: 780]
             } catch (e) {
                 console.error("Admin Update Size Error:", e); //
                 if (e instanceof GraphQLError) throw e; // [cite: 781]
                 if (e.name === 'SequelizeUniqueConstraintError') {throw new GraphQLError(`Size name "${name.trim()}" already exists.`);}
                 throw new GraphQLError('Failed to update size.');
             }
         },
         adminDeleteSize: async (_, { id }, context) => {
              checkAdmin(context); // [cite: 782]
              if (!id) throw new GraphQLError('Size ID required.', { extensions: { code: 'BAD_USER_INPUT' }}); //
              const { db, sequelize } = context; // [cite: 783]
              if (!db || !sequelize || !db.Size || !db.ProductSize) throw new GraphQLError('DB setup error'); //

              const transaction = await sequelize.transaction(); // [cite: 784]
              try {
                  const size = await db.Size.findByPk(id, { transaction }); // Tìm size [cite: 784]
                  if (!size) { await transaction.rollback(); throw new GraphQLError('Size not found.', { extensions: { code: 'NOT_FOUND' }}); } // [cite: 786]

                  // Xóa liên kết trong ProductSizes trước
                  await db.ProductSize.destroy({ where: { size_id: id }, transaction }); // [cite: 787]
                  console.log(`Deleted associations for size ID: ${id}`); //

                  // Xóa size
                  await size.destroy({ transaction }); //
                  await transaction.commit(); //
                  console.log(`Admin deleted size ID: ${id}`); //
                  return true; // [cite: 788]

              } catch (e) {
                  await transaction.rollback(); // [cite: 789]
                  console.error("Admin Delete Size Error:", e); //
                   if (e.name === 'SequelizeForeignKeyConstraintError') { // Lỗi FK từ ProductSize (ít khả năng nếu destroy ở trên thành công)
                      throw new GraphQLError('Cannot delete size as it is still referenced by products.', { extensions: { code: 'BAD_REQUEST' } }); // [cite: 790]
                   }
                  throw new GraphQLError('Failed to delete size.'); // [cite: 791]
              }
         },
         
        // ========================================================

    }, // End Mutation

    // --- Type Resolvers for Nested/Associated Data ---
    // Các resolver này giúp GraphQL tự động lấy dữ liệu liên quan khi client yêu cầu
    // Ví dụ: khi query một Product và yêu cầu field 'colors', resolver này sẽ được gọi
    Product: {
        // Lấy danh sách Color của Product
        inventory: async (parentProduct, _, context) => {
            if (parentProduct.inventory) return parentProduct.inventory; // Nếu đã eager load
            if (parentProduct.getInventory) { // Dùng hàm getter của Sequelize
                const { db } = context; // Cần db để include Size, Color
                if (!db || !db.Size || !db.Color) {
                    logger.warn("DB context or Size/Color models missing for Product.inventory resolver");
                    return await parentProduct.getInventory(); // Trả về inventory cơ bản
                }
                return await parentProduct.getInventory({
                    include: [
                        { model: db.Size, as: 'size' },
                        { model: db.Color, as: 'color' }
                    ]
                });
            }
            return [];
        },
        colors: async (parentProduct) => { if (parentProduct.colors) return parentProduct.colors; if (parentProduct.getColors) return await parentProduct.getColors({ joinTableAttributes: [] }); return []; },
        collections: async (parentProduct) => { if (parentProduct.collections) return parentProduct.collections; if (parentProduct.getCollections) return await parentProduct.getCollections({ joinTableAttributes: [] }); return []; },
        category: async (parentProduct) => { if (parentProduct.category) return parentProduct.category; if (parentProduct.getCategory) return await parentProduct.getCategory(); return null; },
        sizes: async (parentProduct) => { if (parentProduct.sizes) return parentProduct.sizes; if (parentProduct.getSizes) return await parentProduct.getSizes({ joinTableAttributes: [] }); return []; }
    },
    Sale: {
        // Lấy Customer của Sale
        customer: async (parentSale) => { if (parentSale.customer) { return parentSale.customer; } if (parentSale.getCustomer) { try { const customer = await parentSale.getCustomer({ attributes: { exclude: ['customer_password', 'password_reset_token', 'password_reset_expires'] } }); return customer; } catch(err) { logger.error(`Sale ${parentSale.sale_id}: Error calling parentSale.getCustomer():`, err); return null; } } return null; },
        // Lấy danh sách SalesItem của Sale (bao gồm Product)
        items: async (parentSale, _, context) => { // Thêm context
            if (parentSale.items) return parentSale.items;
            if (parentSale.getItems) {
                const { db } = context; // Lấy db từ context
                 if (!db || !db.Product || !db.Size || !db.Color) {
                    logger.warn("DB context or Product/Size/Color models missing for Sale.items resolver");
                    return await parentSale.getItems(); // Trả về items cơ bản
                }
                return await parentSale.getItems({
                    include: [
                        { model: db.Product, as: 'product' },
                        { model: db.Size, as: 'size' },
                        { model: db.Color, as: 'color' }
                    ]
                });
            }
            return [];
        },
        // Lấy lịch sử SaleHistory của Sale
        history: async (parentSale) => { if (parentSale.history) return parentSale.history; if (parentSale.getHistory) return await parentSale.getHistory({ order: [['history_date', 'DESC']] }); return []; },
        totals: async (parentSale) => { if (parentSale.totals) return parentSale.totals; if (parentSale.getTotals) return await parentSale.getTotals(); return null; },
    },
    SalesItem: {
        // Lấy Product của SalesItem
        product: async (parentSalesItem) => { if (parentSalesItem.product) return parentSalesItem.product; if (parentSalesItem.getProduct) return await parentSalesItem.getProduct(); return null; },
        size: async (parentSalesItem) => { // Resolver để lấy thông tin Size
            if (parentSalesItem.size) return parentSalesItem.size; // Nếu đã include
            if (parentSalesItem.getSize) return await parentSalesItem.getSize(); // Dùng getter
            return null;
        },
        color: async (parentSalesItem) => { // Resolver để lấy thông tin Color
            if (parentSalesItem.color) return parentSalesItem.color; // Nếu đã include
            if (parentSalesItem.getColor) return await parentSalesItem.getColor(); // Dùng getter
            return null;
        }
    },
    Inventory: { // Type resolver cho Inventory (nếu cần lấy chi tiết từ variant)
        size: async (parentInventory, _, context) => {
            if (parentInventory.size) return parentInventory.size; // Nếu đã eager load
            if (parentInventory.getSize) return await parentInventory.getSize();
            return null;
        },
        color: async (parentInventory, _, context) => {
            if (parentInventory.color) return parentInventory.color; // Nếu đã eager load
            if (parentInventory.getColor) return await parentInventory.getColor();
            return null;
        }
    }

};

module.exports = resolvers; //