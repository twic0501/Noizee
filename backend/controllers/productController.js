// controllers/productController.js (Phiên bản hoàn chỉnh đã sửa đổi)
const { db, sequelize } = require('../config/db'); // Import cả sequelize instance để dùng transaction
const { Op } = require("sequelize"); // Import Operators
const Product = db.Product; //
const Category = db.Category; // Import model Category
const Size = db.Size;         // Import model Size
const ProductSizes = db.ProductSizes; // Import model bảng trung gian (Nếu cần truy cập trực tiếp)
const logger = require('../utils/logger'); //

// --- Helper Function (ví dụ) ---
// Hàm xử lý các tham số filter từ req.query để xây dựng điều kiện where và include
const buildProductWhereClause = (query) => {
    const whereClause = {}; // Điều kiện WHERE cho bảng Product
    const includeClause = []; // Mảng để thêm các include cần thiết cho filter phức tạp (như size)

    // Filter theo search term (tên hoặc mô tả)
    if (query.search) { //
        whereClause[Op.or] = [ // Tìm trong tên HOẶC mô tả
            { product_name: { [Op.like]: `%${query.search}%` } },
            { product_description: { [Op.like]: `%${query.search}%` } }
        ];
    }

    // Filter theo khoảng giá
    const priceConditions = {}; //
    if (query.minPrice) { //
        // Lớn hơn hoặc bằng minPrice
        priceConditions[Op.gte] = parseFloat(query.minPrice);
    }
    if (query.maxPrice) { //
        // Nhỏ hơn hoặc bằng maxPrice
        priceConditions[Op.lte] = parseFloat(query.maxPrice);
    }
    // Nếu có điều kiện giá thì gán vào whereClause
    if (Object.keys(priceConditions).length > 0) { //
        whereClause.product_price = priceConditions; //
    }

    // Filter theo categoryId
    if (query.categoryId) { //
        whereClause.category_id = parseInt(query.categoryId, 10); // Chuyển sang số nguyên
    }

    // Filter theo isNewArrival (true/false)
    if (query.isNewArrival !== undefined) { //
        whereClause.is_new_arrival = query.isNewArrival === 'true'; // Chuyển string 'true' thành boolean true
    }

    // Filter theo còn hàng/hết hàng
    if (query.inStock !== undefined) {
        if (query.inStock === 'true') { // Nếu muốn lọc sản phẩm còn hàng
            whereClause.product_stock = { [Op.gt]: 0 }; // Lớn hơn 0
        } else { // Nếu muốn lọc sản phẩm hết hàng
            whereClause.product_stock = { [Op.lte]: 0 }; // Nhỏ hơn hoặc bằng 0
        }
    }

    // Filter theo sizeId (Cần join bảng Sizes thông qua ProductSizes)
    // Cách này sử dụng `include` để lọc. Sequelize sẽ tạo subquery hoặc join phù hợp.
    if (query.sizeId) { //
        includeClause.push({
            model: Size,        // Include model Size
            as: 'sizes',        // Với alias 'sizes' đã định nghĩa
            where: { size_id: parseInt(query.sizeId, 10) }, // Điều kiện lọc trên bảng Sizes
            attributes: [],     // Không cần lấy cột nào từ bảng Sizes (chỉ dùng để lọc)
            through: { attributes: [] } // Không cần lấy cột nào từ bảng trung gian ProductSizes
        }); //
    }
    // Có thể thêm filter theo colorId, collectionId tương tự nếu cần

    return { whereClause, includeClause }; // Trả về các điều kiện đã xây dựng
};

// @desc    Fetch all products (có filter, pagination, eager loading)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
    try {
        // Lấy tham số phân trang từ query string, đặt giá trị mặc định nếu không có
        const page = parseInt(req.query.page, 10) || 1; // Trang hiện tại, mặc định là 1
        const limit = parseInt(req.query.limit, 10) || 10; // Số sản phẩm/trang, mặc định 10
        const offset = (page - 1) * limit; // Tính offset cho query DB

        // Xây dựng điều kiện lọc và include cần thiết cho filter từ req.query
        const { whereClause, includeClause: filterIncludes } = buildProductWhereClause(req.query); //

        // Include chính để lấy cả thông tin Category và Sizes (luôn lấy nếu không có filter đặc biệt)
        const mainInclude = [
            {
                model: Category,    // Include Category model
                as: 'category',     // Alias định nghĩa trong association
                attributes: ['category_id', 'category_name'] // Chỉ lấy các trường cần thiết của Category
            },
            {
                model: Size,        // Include Size model
                as: 'sizes',        // Alias định nghĩa trong association
                attributes: ['size_id', 'size_name'], // Lấy ID và tên Size
                through: { attributes: [] } // Không cần lấy dữ liệu từ bảng ProductSizes
            },
            // Có thể thêm include cho Color, Collection ở đây nếu muốn luôn lấy
            // { model: db.Color, as: 'colors', attributes: ['color_id', 'color_name', 'color_hex'], through: { attributes: [] } },
            // { model: db.Collection, as: 'collections', attributes: ['collection_id', 'collection_name'], through: { attributes: [] } },
            ...filterIncludes // Thêm các include dùng để filter (ví dụ: include Size để lọc theo sizeId)
        ];

        // Sử dụng findAndCountAll để lấy cả dữ liệu và tổng số lượng (cho phân trang)
        const { count, rows } = await Product.findAndCountAll({ //
            where: whereClause,           // Áp dụng điều kiện lọc
            include: mainInclude,         // Áp dụng eager loading và include để filter
            limit: limit,                 // Giới hạn số lượng kết quả/trang
            offset: offset,               // Bỏ qua số lượng kết quả của trang trước
            order: [['product_name', 'ASC']], // Sắp xếp theo tên A-Z (có thể thay đổi)
            distinct: true                // Quan trọng khi có include many-to-many để count đúng số lượng Product
        });

        // Trả về kết quả dưới dạng JSON
        res.json({ //
            products: rows, // Mảng các sản phẩm tìm thấy
            totalPages: Math.ceil(count / limit), // Tổng số trang
            currentPage: page, // Trang hiện tại
            totalProducts: count // Tổng số sản phẩm khớp điều kiện (trước khi phân trang)
        }); //

    } catch (error) {
        // Xử lý lỗi
        logger.error('Error fetching products:', error); //
        next(error); // Chuyển về error handler
    }
};

// @desc    Fetch single product by ID (có eager loading)
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
    try {
        // Tìm sản phẩm bằng Primary Key (ID)
        const product = await Product.findByPk(req.params.id, {
            include: [ // Eager load Category và Sizes (và các association khác nếu cần)
                {
                    model: Category,
                    as: 'category', //
                    attributes: ['category_id', 'category_name']
                },
                {
                    model: Size,
                    as: 'sizes', //
                    attributes: ['size_id', 'size_name'],
                    through: { attributes: [] } // Không lấy data bảng trung gian
                }
                // Thêm include cho Color, Collection nếu cần
                // { model: db.Color, as: 'colors', attributes: ['color_id', 'color_name', 'color_hex'], through: { attributes: [] } },
                // { model: db.Collection, as: 'collections', attributes: ['collection_id', 'collection_name'], through: { attributes: [] } },
            ]
        });

        // Nếu tìm thấy sản phẩm
        if (product) { //
            res.json(product); // Trả về sản phẩm
        } else {
            // Nếu không tìm thấy, set status 404 và ném lỗi
            res.status(404); //
            throw new Error(`Product not found with ID: ${req.params.id}`); // Tạo lỗi cụ thể hơn
        }

    } catch (error) {
        logger.error(`Error fetching product ${req.params.id}:`, error); //

        // Đảm bảo lỗi 404 nếu không tìm thấy, ngay cả khi findByPk trả về null mà không ném lỗi
        // (Ví dụ: một lỗi khác xảy ra trước khi kiểm tra product)
        if (!res.statusCode || res.statusCode < 400) { // Nếu chưa set status hoặc status là 2xx/3xx
            try { // Thử kiểm tra lại sự tồn tại của product một cách an toàn
                const exists = await Product.findByPk(req.params.id); //
                if (!exists) { //
                    res.status(404); // Set 404 nếu thực sự không tìm thấy
                }
            } catch (checkError) {
                // Bỏ qua lỗi khi kiểm tra lại, giữ lỗi gốc
            }
        }
        next(error); // Chuyển lỗi về error handler
    }
};


// --- Admin Routes (Cần middleware bảo vệ: protect + isAdmin) ---

// @desc    Create a new product (có xử lý category, sizes, image, transaction)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
    // Lấy thông tin sản phẩm mới từ request body
    const {
        product_name,
        product_description,
        product_price,
        product_stock,
        imageUrl,       // <<< Mới: URL ảnh (từ route upload)
        categoryId,     // <<< Mới: ID của Category
        sizeIds,        // <<< Mới: MẢNG các ID của Size
        isNewArrival    // <<< Mới: true/false
    } = req.body; //

    // --- Validation cơ bản ---
    // Kiểm tra các trường bắt buộc và kiểu dữ liệu cơ bản
    if (!product_name || product_price === undefined || product_stock === undefined || !categoryId || !sizeIds || !Array.isArray(sizeIds) || sizeIds.length === 0) { //
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm (tên, giá, tồn kho, loại sản phẩm, và ít nhất một size).' }); //
    }

    // Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
    const t = await sequelize.transaction(); //

    try {
        // (Tùy chọn) Kiểm tra xem Category và các Sizes có tồn tại không trước khi tạo
        const categoryExists = await Category.findByPk(categoryId, { transaction: t }); //
        if (!categoryExists) { //
            await t.rollback(); // Hủy transaction
            return res.status(400).json({ message: `Loại sản phẩm (Category) với ID ${categoryId} không tồn tại.` }); //
        }

        // Kiểm tra tất cả sizeIds có hợp lệ không
        const validSizes = await Size.findAll({ where: { size_id: { [Op.in]: sizeIds } }, transaction: t }); //
        if (validSizes.length !== sizeIds.length) { // Nếu số lượng size tìm thấy khác số lượng ID gửi lên
            await t.rollback(); //
            return res.status(400).json({ message: 'Một hoặc nhiều Size ID không hợp lệ.' }); //
        }
        // Có thể thêm kiểm tra tương tự cho colorIds, collectionIds nếu có

        // 1. Tạo sản phẩm MỚI trong transaction
        const product = await Product.create({
            product_name,
            product_description,
            product_price: parseFloat(product_price), // Chuyển giá thành số thực
            product_stock: parseInt(product_stock, 10), // Chuyển tồn kho thành số nguyên
            imageUrl: imageUrl || null, // Cho phép URL ảnh là null
            category_id: parseInt(categoryId, 10), // Đảm bảo category_id là số nguyên
            is_new_arrival: isNewArrival === true // Chuyển thành boolean
        }, { transaction: t }); // Quan trọng: truyền transaction vào

        // 2. Gán các Sizes cho sản phẩm (dùng hàm helper của Sequelize)
        // Hàm setSizes sẽ tự động quản lý bảng trung gian ProductSizes
        if (product && sizeIds && sizeIds.length > 0) {
            // Hàm này sẽ xóa các liên kết cũ (nếu có) và tạo các liên kết mới
            await product.setSizes(sizeIds, { transaction: t }); // Truyền transaction vào
        }
        // Gọi tương tự product.setColors(colorIds), product.setCollections(collectionIds) nếu có

        // 3. Commit transaction nếu mọi thứ thành công
        await t.commit(); //

        logger.info(`Product created: ${product.product_name} (ID: ${product.product_id})`); //

        // Lấy lại sản phẩm vừa tạo với thông tin đầy đủ (bao gồm category và sizes) để trả về
        const createdProductWithDetails = await Product.findByPk(product.product_id, {
            include: [
                { model: Category, as: 'category', attributes: ['category_id', 'category_name'] },
                { model: Size, as: 'sizes', attributes: ['size_id', 'size_name'], through: { attributes: [] } }
                // Thêm include Color, Collection nếu cần
            ]
        });

        res.status(201).json(createdProductWithDetails); // Trả về sản phẩm đã tạo

    } catch (error) {
        // 4. Rollback transaction nếu có lỗi xảy ra ở bất kỳ bước nào
        await t.rollback(); //
        logger.error('Error creating product:', error); //

        // Xử lý lỗi validation từ Sequelize
        if (error.name === 'SequelizeValidationError') { //
            const messages = error.errors ? error.errors.map(e => e.message).join(', ') : error.message; //
            return res.status(400).json({ message: messages || 'Lỗi dữ liệu không hợp lệ.' }); //
        }
        // Chuyển lỗi khác về error handler
        next(error); //
    }
};

// @desc    Update a product (có xử lý category, sizes, image, transaction)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
    const productId = req.params.id; // Lấy ID sản phẩm từ URL
    // Lấy các trường cần cập nhật từ body
    const {
        product_name,
        product_description,
        product_price,
        product_stock,
        imageUrl,
        categoryId,
        sizeIds, // Mảng các size ID mới (có thể rỗng để xóa hết size)
        isNewArrival
        // Thêm colorIds, collectionIds nếu cần
    } = req.body; //

    // Bắt đầu transaction
    const t = await sequelize.transaction(); //

    try {
        // 1. Tìm sản phẩm cần cập nhật bằng ID, và khóa dòng đó trong transaction
        const product = await Product.findByPk(productId, { transaction: t }); // Lock row nếu DB hỗ trợ

        // Nếu không tìm thấy sản phẩm
        if (!product) { //
            await t.rollback(); //
            res.status(404); //
            throw new Error(`Product not found with ID: ${productId}`); //
        }

        // (Tùy chọn) Kiểm tra Category và Sizes mới nếu được cung cấp trong request body
        if (categoryId !== undefined) { // Chỉ kiểm tra nếu categoryId được gửi lên
            const categoryExists = await Category.findByPk(categoryId, { transaction: t }); //
            if (!categoryExists) { //
                await t.rollback(); //
                return res.status(400).json({ message: `Loại sản phẩm (Category) với ID ${categoryId} không tồn tại.` }); //
            }
        }

        if (sizeIds !== undefined && Array.isArray(sizeIds)) { // Chỉ kiểm tra nếu sizeIds là một mảng được gửi lên
            if (sizeIds.length > 0) { // Nếu mảng không rỗng
                const validSizes = await Size.findAll({ where: { size_id: { [Op.in]: sizeIds } }, transaction: t }); //
                if (validSizes.length !== sizeIds.length) { //
                    await t.rollback(); //
                    return res.status(400).json({ message: 'Một hoặc nhiều Size ID không hợp lệ.' }); //
                }
            } else { // Nếu gửi mảng rỗng (có nghĩa là xóa hết size)
                // Không cần làm gì ở bước kiểm tra này, setSizes([]) sẽ xử lý việc xóa
                 // Hoặc báo lỗi nếu không muốn cho phép xóa hết size.
                 // Ở đây ta sẽ cho phép xóa hết size nếu gửi mảng rỗng.
            } //
        }
        // Thêm kiểm tra cho colorIds, collectionIds nếu có

        // 2. Cập nhật các trường cơ bản của sản phẩm
        // Sử dụng toán tử `??` (Nullish Coalescing) hoặc kiểm tra `undefined` để chỉ cập nhật nếu giá trị được cung cấp
        product.product_name = product_name ?? product.product_name; // Cập nhật nếu product_name không phải null/undefined
        product.product_description = product_description ?? product.product_description; //
        product.product_price = product_price !== undefined ? parseFloat(product_price) : product.product_price; //
        product.product_stock = product_stock !== undefined ? parseInt(product_stock, 10) : product.product_stock; //
        product.imageUrl = imageUrl !== undefined ? imageUrl : product.imageUrl; // Cho phép set imageUrl thành null
        product.category_id = categoryId !== undefined ? parseInt(categoryId, 10) : product.category_id; //
        product.is_new_arrival = isNewArrival !== undefined ? (isNewArrival === true) : product.is_new_arrival; //

        // 3. Lưu thay đổi các trường cơ bản vào DB (vẫn trong transaction)
        await product.save({ transaction: t }); //

        // 4. Cập nhật danh sách Sizes nếu `sizeIds` được cung cấp trong request body
        // Chỉ gọi setSizes nếu `sizeIds` thực sự được gửi lên (kể cả là mảng rỗng)
        if (sizeIds !== undefined && Array.isArray(sizeIds)) { //
             await product.setSizes(sizeIds, { transaction: t }); // Hàm này sẽ thay thế toàn bộ size cũ bằng size mới
        }
        // Gọi product.setColors(), product.setCollections() nếu có

        // 5. Commit transaction nếu mọi thứ thành công
        await t.commit(); //

        logger.info(`Product updated: ${product.product_name} (ID: ${product.product_id})`); //

        // Lấy lại sản phẩm với thông tin đầy đủ (bao gồm associations) để trả về
        const updatedProductWithDetails = await Product.findByPk(product.product_id, {
            include: [
                { model: Category, as: 'category', attributes: ['category_id', 'category_name'] },
                { model: Size, as: 'sizes', attributes: ['size_id', 'size_name'], through: { attributes: [] } }
                // Thêm include Color, Collection nếu cần
            ]
        });

        res.json(updatedProductWithDetails); // Trả về sản phẩm đã cập nhật

    } catch (error) {
        await t.rollback(); // Đảm bảo rollback khi có lỗi
        logger.error(`Error updating product ${productId}:`, error); //

        // Xử lý lỗi validation từ Sequelize
        if (error.name === 'SequelizeValidationError') { //
            const messages = error.errors ? error.errors.map(e => e.message).join(', ') : error.message; //
            return res.status(400).json({ message: messages || 'Lỗi dữ liệu không hợp lệ.' }); //
        }

        // Kiểm tra lại lỗi not found nếu chưa được set status (phòng trường hợp lỗi xảy ra trước khi kiểm tra product)
        if (!res.statusCode || res.statusCode < 400) { //
             try { // Thử kiểm tra lại
                 const exists = await Product.findByPk(productId); //
                 if (!exists) { //
                     res.status(404); // Set 404 nếu thực sự không tìm thấy
                     error.message = `Product not found with ID: ${productId}`; // Cập nhật message lỗi
                 }
             } catch (checkError) {}
        }

        next(error); // Chuyển lỗi về error handler
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
    const productId = req.params.id; // Lấy ID từ URL
    const t = await sequelize.transaction(); // Dùng transaction để đảm bảo nhất quán

    try {
        // Tìm sản phẩm cần xóa
        const product = await Product.findByPk(productId, { transaction: t }); //

        // Nếu không tìm thấy
        if (!product) { //
            await t.rollback(); //
            res.status(404); //
            throw new Error(`Product not found with ID: ${productId}`); //
        }

        // Quan trọng: Sequelize có thể cấu hình để tự động xóa các liên kết trong bảng trung gian
        // (ProductSizes, ProductColors, ProductCollections) thông qua tùy chọn `onDelete: 'CASCADE'`
        // trong định nghĩa association Many-to-Many. Nếu đã cấu hình CASCADE, không cần xóa thủ công.

        // Tuy nhiên, cần kiểm tra ràng buộc khóa ngoại từ bảng SalesItems.
        // Nếu `SalesItems.product_id` có `ON DELETE RESTRICT` (mặc định của nhiều DB) hoặc `ON DELETE NO ACTION`,
        // thì việc `product.destroy()` sẽ bị database từ chối nếu sản phẩm này đã tồn tại trong bất kỳ đơn hàng nào.

        // Cách xử lý đề xuất: Kiểm tra trước khi xóa
        const relatedSalesCount = await db.SalesItems.count({ where: { product_id: productId }, transaction: t });
        if (relatedSalesCount > 0) {
            await t.rollback();
            res.status(400); // Bad request
            throw new Error('Không thể xóa sản phẩm đã có trong đơn hàng. Cân nhắc ẩn sản phẩm thay vì xóa.');
        }

        // Nếu không có ràng buộc hoặc đã xử lý, tiến hành xóa sản phẩm
        // Lưu ý: Nếu có `onDelete: 'CASCADE'` cho M-M, các bản ghi trong ProductSize, ProductColor, ProductCollection sẽ tự động bị xóa.
        // Nếu không có CASCADE, bạn cần xóa thủ công các liên kết này trước khi xóa Product:
        // await product.setSizes([], { transaction: t });
        // await product.setColors([], { transaction: t });
        // await product.setCollections([], { transaction: t });

        await product.destroy({ transaction: t }); // Xóa sản phẩm

        await t.commit(); // Commit nếu destroy thành công

        logger.info(`Product deleted: (ID: ${productId})`); //
        res.json({ message: 'Sản phẩm đã được xóa thành công.' }); //

    } catch (error) {
        await t.rollback(); // Rollback nếu có lỗi
        logger.error(`Error deleting product ${productId}:`, error); //

        // Xử lý lỗi cụ thể từ DB (ví dụ: Foreign Key Constraint nếu check ở trên bị sót hoặc do cấu hình DB khác)
        if (error.name === 'SequelizeForeignKeyConstraintError') { //
            res.status(400); // Bad request
            // Trả về lỗi thân thiện hơn
            return next(new Error('Không thể xóa sản phẩm đã có trong đơn hàng. Cân nhắc ẩn sản phẩm thay vì xóa.')); //
        }

        // Kiểm tra lại lỗi not found
        if (!res.statusCode || res.statusCode < 400) { //
            try {
                const exists = await Product.findByPk(productId); //
                if (!exists) { //
                    res.status(404); //
                    error.message = `Product not found with ID: ${productId}`; //
                }
            } catch (checkError) {}
        }

        next(error); // Chuyển lỗi khác về error handler
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
}; //