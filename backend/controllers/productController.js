// controllers/productController.js
const { db, sequelize } = require('../config/db');
const { Op } = require("sequelize");
const Product = db.Product;
const Category = db.Category;
const Size = db.Size;
// const ProductSizes = db.ProductSizes; // Có thể không cần trực tiếp nữa
const Color = db.Color;                 // Thêm Color
const Collection = db.Collection;       // Thêm Collection
const ProductImage = db.ProductImage;   // <<< THÊM MODEL ProductImage
const Inventory = db.Inventory;         // Thêm Inventory
const logger = require('../utils/logger');

// Hàm helper cũ buildProductWhereClause có thể giữ nguyên hoặc điều chỉnh
// nếu filter liên quan đến ảnh (ví dụ: sản phẩm có ít nhất X ảnh)
// Hiện tại, chúng ta tập trung vào việc lấy và lưu ảnh.

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        // Giả sử buildProductWhereClause không thay đổi nhiều
        const { whereClause, includeClause: filterIncludes } = buildProductWhereClause(req.query); // Bạn có thể cần xem lại hàm này

        const mainInclude = [
            { model: Category, as: 'category', attributes: ['category_id', 'category_name'], required: false },
            // Không nhất thiết phải include Size, Color, Collection ở đây nữa nếu chỉ cần cho filter
            // Chúng ta sẽ lấy thông tin này qua Inventory hoặc ProductImage nếu cần hiển thị cụ thể
            {
                model: ProductImage,
                as: 'images',
                attributes: ['image_url', 'alt_text', 'display_order', 'color_id'],
                required: false, // LEFT JOIN để vẫn lấy sản phẩm dù không có ảnh
                // Chỉ lấy ảnh chính (display_order: 0) và không có màu cụ thể, hoặc ảnh đầu tiên
                // Điều này có thể làm trong subquery hoặc lọc sau, ví dụ:
                // where: { display_order: 0, color_id: null }, // Để lấy ảnh chính chung
                // Hoặc order và lấy 1
                order: [['display_order', 'ASC']], // Sắp xếp để có thể lấy ảnh đầu tiên làm đại diện
                // limit: 1, // Nếu chỉ muốn lấy ảnh chính cho danh sách
            },
            // Include Inventory để biết sản phẩm có còn hàng hay không (tổng quát)
            {
                model: Inventory,
                as: 'inventory',
                attributes: ['quantity'], // Chỉ cần biết có tồn kho hay không
                required: false,
            },
            ...filterIncludes
        ];

        const { count, rows } = await Product.findAndCountAll({
            where: { ...whereClause, is_active: true }, // Chỉ lấy sản phẩm active
            include: mainInclude,
            limit: limit,
            offset: offset,
            order: [['product_name', 'ASC']],
            distinct: true
        });

        // Xử lý để mỗi sản phẩm chỉ có 1 ảnh đại diện (nếu dùng limit:1 ở trên thì không cần)
        const productsWithMainImage = rows.map(product => {
            const plainProduct = product.get({ plain: true });
            if (plainProduct.images && plainProduct.images.length > 0) {
                // Lấy ảnh có display_order = 0 và không có color_id, hoặc ảnh đầu tiên
                let mainImage = plainProduct.images.find(img => img.display_order === 0 && !img.color_id);
                if (!mainImage) {
                    mainImage = plainProduct.images[0]; // Lấy ảnh đầu tiên nếu không có ảnh chính cụ thể
                }
                plainProduct.mainImageUrl = mainImage ? mainImage.image_url : null;
            } else {
                plainProduct.mainImageUrl = null;
            }
            // Xóa mảng images đầy đủ để giảm payload, chỉ giữ mainImageUrl
            // delete plainProduct.images; // Hoặc giữ lại nếu ProductCard cần nhiều ảnh
            return plainProduct;
        });


        res.json({
            products: productsWithMainImage,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalProducts: count
        });

    } catch (error) {
        logger.error('Error fetching products:', error);
        next(error);
    }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findOne({
            where: { product_id: req.params.id, is_active: true }, // Chỉ lấy sản phẩm active
            include: [
                { model: Category, as: 'category', attributes: ['category_id', 'category_name'] },
                // Các M-M này cho biết sản phẩm có thể có những size/color nào, không phải tồn kho
                { model: Size, as: 'sizes', attributes: ['size_id', 'size_name'], through: { attributes: [] } },
                { model: Color, as: 'colors', attributes: ['color_id', 'color_name', 'color_hex'], through: { attributes: [] } },
                { model: Collection, as: 'collections', attributes: ['collection_id', 'collection_name', 'slug'], through: { attributes: [] } },
                { // Lấy tất cả các ảnh của sản phẩm, sắp xếp theo display_order
                    model: ProductImage,
                    as: 'images',
                    attributes: ['image_id', 'image_url', 'alt_text', 'display_order', 'color_id'],
                    include: [{ model: Color, as: 'color', attributes: ['color_name', 'color_hex']}] // Lấy luôn thông tin màu của ảnh
                },
                { // Lấy tất cả các biến thể tồn kho
                    model: Inventory,
                    as: 'inventory',
                    include: [
                        { model: Size, as: 'size' },
                        { model: Color, as: 'color' }
                    ]
                }
            ],
            order: [
                [ db.Sequelize.literal('`images`.`display_order`'), 'ASC' ] // Sắp xếp ảnh
                // Thêm sắp xếp cho inventory nếu cần
            ],
        });

        if (product) {
            res.json(product);
        } else {
            res.status(404);
            throw new Error(`Product not found with ID: ${req.params.id} or it is not active.`);
        }

    } catch (error) {
        logger.error(`Error fetching product ${req.params.id}:`, error);
        if (!res.headersSent) { // Check if headers already sent
             if (error.message.includes('Product not found')) {
                 res.status(404);
             }
        }
        next(error);
    }
};


// --- Admin Routes ---

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
    const {
        product_name,
        product_description,
        product_price,
        // product_stock, // <<<< XÓA product_stock ở đây
        categoryId,
        isNewArrival,
        is_active = true, // Mặc định là true nếu không gửi
        collectionIds = [], // Mặc định mảng rỗng
        // Thông tin ảnh sẽ là một mảng các object
        // ví dụ: images: [{ imageUrl: '/uploads/products/abc.jpg', displayOrder: 0, colorId: null, altText: '...' }, ...]
        images = [], // Mảng thông tin ảnh từ client (client đã upload và có URLs)
        // Thông tin tồn kho cũng sẽ là một mảng các object
        // ví dụ: inventoryItems: [{ sizeId: 1, colorId: 1, quantity: 10, sku: 'SKU001'}, ...]
        inventoryItems = []
    } = req.body;

    if (!product_name || product_price === undefined || !categoryId) {
        return res.status(400).json({ message: 'Vui lòng cung cấp tên, giá và loại sản phẩm.' });
    }
    if (!inventoryItems || !Array.isArray(inventoryItems) || inventoryItems.length === 0) {
        return res.status(400).json({ message: 'Sản phẩm phải có ít nhất một biến thể tồn kho (inventory item).' });
    }
    if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ message: 'Sản phẩm phải có ít nhất một hình ảnh.' });
    }


    const t = await sequelize.transaction();
    try {
        const categoryExists = await Category.findByPk(categoryId, { transaction: t });
        if (!categoryExists) {
            await t.rollback();
            return res.status(400).json({ message: `Loại sản phẩm (Category) với ID ${categoryId} không tồn tại.` });
        }
        // Kiểm tra collections nếu có
        if (collectionIds.length > 0) {
            const validCollections = await Collection.findAll({ where: { collection_id: { [Op.in]: collectionIds } }, transaction: t });
            if (validCollections.length !== collectionIds.length) {
                await t.rollback();
                return res.status(400).json({ message: 'Một hoặc nhiều Collection ID không hợp lệ.' });
            }
        }

        // 1. Tạo sản phẩm chính
        const product = await Product.create({
            product_name,
            product_description,
            product_price: parseFloat(product_price),
            category_id: parseInt(categoryId, 10),
            is_new_arrival: isNewArrival === true,
            is_active: is_active === true, // Đảm bảo là boolean
        }, { transaction: t });

        // 2. Tạo các bản ghi ProductImage liên quan
        if (images && images.length > 0) {
            const productImagesData = images.map(img => ({
                ...img, // imageUrl, altText, displayOrder, colorId (nếu có)
                product_id: product.product_id // Gán product_id
            }));
            await ProductImage.bulkCreate(productImagesData, { transaction: t });
        }

        // 3. Tạo các bản ghi Inventory liên quan
        const uniqueSizeIds = new Set();
        const uniqueColorIds = new Set();

        if (inventoryItems && inventoryItems.length > 0) {
            const inventoryDataToCreate = inventoryItems.map(item => {
                if (item.sizeId) uniqueSizeIds.add(item.sizeId);
                if (item.colorId) uniqueColorIds.add(item.colorId);
                return {
                    product_id: product.product_id,
                    size_id: item.sizeId || null,
                    color_id: item.colorId || null,
                    quantity: parseInt(item.quantity, 10) || 0,
                    sku: item.sku || null
                };
            });
            await Inventory.bulkCreate(inventoryDataToCreate, { transaction: t });
        }

        // 4. Liên kết sản phẩm với Sizes và Colors (dựa trên inventory)
        if (uniqueSizeIds.size > 0) {
            await product.setSizes(Array.from(uniqueSizeIds), { transaction: t });
        }
        if (uniqueColorIds.size > 0) {
            await product.setColors(Array.from(uniqueColorIds), { transaction: t });
        }


        // 5. Liên kết sản phẩm với Collections
        if (collectionIds.length > 0) {
            await product.setCollections(collectionIds, { transaction: t });
        }

        await t.commit();
        logger.info(`Product created: ${product.product_name} (ID: ${product.product_id}) with images and inventory.`);

        const createdProductWithDetails = await Product.findByPk(product.product_id, {
            include: [
                { model: Category, as: 'category' },
                { model: ProductImage, as: 'images', order: [['display_order', 'ASC']] },
                { model: Inventory, as: 'inventory', include: [{model: Size, as: 'size'}, {model: Color, as: 'color'}] },
                { model: Size, as: 'sizes', through: { attributes: [] } },
                { model: Color, as: 'colors', through: { attributes: [] } },
                { model: Collection, as: 'collections', through: { attributes: [] } }
            ]
        });
        res.status(201).json(createdProductWithDetails);

    } catch (error) {
        await t.rollback();
        logger.error('Error creating product:', error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors ? error.errors.map(e => e.message).join(', ') : error.message;
            return res.status(400).json({ message: messages || 'Lỗi dữ liệu không hợp lệ.' });
        }
        next(error);
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
    const productId = req.params.id;
    const {
        product_name,
        product_description,
        product_price,
        // product_stock, // <<<< XÓA product_stock
        categoryId,
        isNewArrival,
        is_active,
        collectionIds,
        images, // Mảng đầy đủ các ảnh mong muốn cho sản phẩm
        inventoryItems // Mảng đầy đủ các inventory item mong muốn
    } = req.body;

    const t = await sequelize.transaction();
    try {
        const product = await Product.findByPk(productId, {
            include: [
                { model: ProductImage, as: 'images' },
                { model: Inventory, as: 'inventory'}
            ],
            transaction: t
        });

        if (!product) {
            await t.rollback();
            res.status(404);
            throw new Error(`Product not found with ID: ${productId}`);
        }

        // Cập nhật các trường cơ bản
        const productUpdateData = {};
        if (product_name !== undefined) productUpdateData.product_name = product_name;
        if (product_description !== undefined) productUpdateData.product_description = product_description;
        if (product_price !== undefined) productUpdateData.product_price = parseFloat(product_price);
        if (categoryId !== undefined) {
            if (categoryId === null) {
                productUpdateData.category_id = null;
            } else {
                const categoryExists = await Category.findByPk(categoryId, { transaction: t });
                if (!categoryExists) {
                    await t.rollback();
                    return res.status(400).json({ message: `Category ID ${categoryId} not found.` });
                }
                productUpdateData.category_id = parseInt(categoryId, 10);
            }
        }
        if (isNewArrival !== undefined) productUpdateData.is_new_arrival = isNewArrival === true;
        if (is_active !== undefined) productUpdateData.is_active = is_active === true;

        await product.update(productUpdateData, { transaction: t });

        // Cập nhật ProductImages
        if (images && Array.isArray(images)) {
            // Xóa tất cả ảnh cũ
            await ProductImage.destroy({ where: { product_id: productId }, transaction: t });
            // Thêm ảnh mới
            if (images.length > 0) {
                const productImagesData = images.map(img => ({
                    ...img, // imageUrl, altText, displayOrder, colorId
                    product_id: productId
                }));
                await ProductImage.bulkCreate(productImagesData, { transaction: t });
            }
        }

        // Cập nhật Inventory (logic tương tự ProductImages: xóa cũ, thêm mới)
        const uniqueSizeIds = new Set();
        const uniqueColorIds = new Set();
        if (inventoryItems && Array.isArray(inventoryItems)) {
            await Inventory.destroy({ where: { product_id: productId }, transaction: t }); // Xóa inventory cũ
            if (inventoryItems.length > 0) {
                const inventoryDataToCreate = inventoryItems.map(item => {
                    if (item.sizeId) uniqueSizeIds.add(item.sizeId);
                    if (item.colorId) uniqueColorIds.add(item.colorId);
                    return {
                        product_id: productId,
                        size_id: item.sizeId || null,
                        color_id: item.colorId || null,
                        quantity: parseInt(item.quantity, 10) || 0,
                        sku: item.sku || null
                    };
                });
                await Inventory.bulkCreate(inventoryDataToCreate, { transaction: t });
            }
        }
         // Cập nhật liên kết M-M cho Sizes và Colors dựa trên inventory mới
        await product.setSizes(Array.from(uniqueSizeIds), { transaction: t });
        await product.setColors(Array.from(uniqueColorIds), { transaction: t });


        // Cập nhật Collections
        if (collectionIds && Array.isArray(collectionIds)) {
            if (collectionIds.length > 0) {
                const validCollections = await Collection.findAll({ where: { collection_id: { [Op.in]: collectionIds } }, transaction: t });
                if (validCollections.length !== collectionIds.length) {
                     await t.rollback();
                     return res.status(400).json({ message: 'Một hoặc nhiều Collection ID không hợp lệ.' });
                }
            }
            await product.setCollections(collectionIds, { transaction: t }); // setCollections sẽ thay thế hoàn toàn
        }


        await t.commit();
        logger.info(`Product updated: ${product.product_name} (ID: ${productId})`);

        const updatedProductWithDetails = await Product.findByPk(productId, {
            include: [
                { model: Category, as: 'category' },
                { model: ProductImage, as: 'images', order: [['display_order', 'ASC']], include: [{model: Color, as: 'color'}] },
                { model: Inventory, as: 'inventory', include: [{model: Size, as: 'size'}, {model: Color, as: 'color'}] },
                { model: Size, as: 'sizes', through: { attributes: [] } },
                { model: Color, as: 'colors', through: { attributes: [] } },
                { model: Collection, as: 'collections', through: { attributes: [] } }
            ]
        });
        res.json(updatedProductWithDetails);

    } catch (error) {
        await t.rollback();
        logger.error(`Error updating product ${productId}:`, error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors ? error.errors.map(e => e.message).join(', ') : error.message;
            return res.status(400).json({ message: messages || 'Lỗi dữ liệu không hợp lệ.' });
        }
        if (!res.headersSent && error.message.includes('Product not found')) {
            res.status(404);
        }
        next(error);
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
    const productId = req.params.id;
    const t = await sequelize.transaction();
    try {
        const product = await Product.findByPk(productId, { transaction: t });
        if (!product) {
            await t.rollback();
            res.status(404);
            throw new Error(`Product not found with ID: ${productId}`);
        }

        const relatedSalesCount = await db.SalesItems.count({ where: { product_id: productId }, transaction: t });
        if (relatedSalesCount > 0) {
            await t.rollback();
            // Thay vì xóa, có thể chỉ set is_active = false
            // product.is_active = false;
            // await product.save({ transaction: t });
            // await t.commit();
            // return res.json({ message: 'Sản phẩm đã được ẩn do có trong đơn hàng.' });
            // HOẶC báo lỗi nếu chính sách là không cho xóa cứng
            res.status(400);
            throw new Error('Không thể xóa sản phẩm đã có trong đơn hàng. Cân nhắc ẩn sản phẩm (set is_active=false) thay vì xóa.');
        }

        // ProductImage, Inventory, ProductSize, ProductColor, ProductCollection sẽ tự động bị xóa
        // nếu `onDelete: 'CASCADE'` được thiết lập đúng trong association của Product với chúng.
        // Hoặc bạn có thể xóa thủ công ở đây trước khi xóa product.
        // await ProductImage.destroy({ where: { product_id: productId }, transaction: t });
        // await Inventory.destroy({ where: { product_id: productId }, transaction: t });
        // await product.setSizes([], {transaction: t});
        // await product.setColors([], {transaction: t});
        // await product.setCollections([], {transaction: t});

        await product.destroy({ transaction: t });
        await t.commit();

        logger.info(`Product deleted: (ID: ${productId})`);
        res.json({ message: 'Sản phẩm đã được xóa thành công.' });

    } catch (error) {
        await t.rollback();
        logger.error(`Error deleting product ${productId}:`, error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            res.status(400);
            return next(new Error('Không thể xóa sản phẩm do có ràng buộc dữ liệu. Cân nhắc ẩn sản phẩm.'));
        }
        if (!res.headersSent && error.message.includes('Product not found')) {
            res.status(404);
        }
        next(error);
    }
};


module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};

// Hàm buildProductWhereClause (bạn có thể giữ nguyên hoặc tùy chỉnh thêm)
const buildProductWhereClause = (query) => {
    const whereClause = {};
    const includeClause = [];

    if (query.search) {
        whereClause[Op.or] = [
            { product_name: { [Op.like]: `%${query.search}%` } },
            { product_description: { [Op.like]: `%${query.search}%` } }
        ];
    }
    const priceConditions = {};
    if (query.minPrice) priceConditions[Op.gte] = parseFloat(query.minPrice);
    if (query.maxPrice) priceConditions[Op.lte] = parseFloat(query.maxPrice);
    if (Object.keys(priceConditions).length > 0) whereClause.product_price = priceConditions;

    if (query.categoryId) whereClause.category_id = parseInt(query.categoryId, 10);
    if (query.isNewArrival !== undefined) whereClause.is_new_arrival = query.isNewArrival === 'true';

    // Filter theo sizeId, colorId, collectionId giờ đây sẽ phức tạp hơn
    // vì chúng liên quan đến bảng Inventory hoặc ProductImages
    // Ví dụ, nếu muốn lọc sản phẩm CÓ MỘT BIẾN THỂ tồn kho với sizeId cụ thể:
    if (query.sizeId) {
        includeClause.push({
            model: Inventory,
            as: 'inventory',
            where: { size_id: parseInt(query.sizeId, 10) },
            required: true // INNER JOIN để chỉ lấy sản phẩm có inventory khớp
        });
    }
    // Tương tự cho colorId
    if (query.colorId) {
         const inventoryColorFilter = includeClause.find(inc => inc.as === 'inventory');
         if (inventoryColorFilter) { // Nếu đã có include inventory (ví dụ từ sizeId)
            inventoryColorFilter.where = { ...inventoryColorFilter.where, color_id: parseInt(query.colorId, 10) };
         } else {
            includeClause.push({
                model: Inventory,
                as: 'inventory',
                where: { color_id: parseInt(query.colorId, 10) },
                required: true
            });
         }
    }
     // Filter theo collectionId vẫn dùng bảng trung gian ProductCollections
    if (query.collectionId) {
        includeClause.push({
            model: Collection,
            as: 'collections',
            where: { collection_id: parseInt(query.collectionId, 10) },
            required: true, // INNER JOIN
            through: { attributes: [] }
        });
    }

    return { whereClause, includeClause };
};