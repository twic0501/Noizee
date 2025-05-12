// controllers/saleController.js (Phiên bản hoàn chỉnh đã sửa đổi)
const { db, sequelize } = require('../config/db'); // Import sequelize for transactions
const { Op } = require("sequelize"); // Import Operators
const Sale = db.Sale; //
const SalesItems = db.SalesItems; //
const SalesTotals = db.SalesTotals; //
const SalesHistory = db.SalesHistory; //
const Product = db.Product; //
const Customer = db.Customer; // Import Customer model
const logger = require('../utils/logger'); //

// --- Helper Function ---
// Hàm lấy chi tiết đơn hàng dựa trên ID (bao gồm các thông tin liên quan)
const getSaleDetailsById = async (saleId) => {
    return await Sale.findByPk(saleId, {
        include: [
            // Lấy thông tin Customer liên quan
            { model: Customer, as: 'customer', attributes: ['customer_id', 'customer_name', 'customer_email'] }, // Chỉ lấy vài trường cần thiết
            // Lấy danh sách các SalesItems trong đơn hàng
            {
                model: SalesItems,
                as: 'items', //
                include: [{ // Lồng thêm include để lấy thông tin Product cho mỗi item
                    model: Product,
                    as: 'product', //
                    attributes: ['product_id', 'product_name', 'imageUrl'] // Lấy thêm imageUrl nếu cần
                }]
                // Bỏ product_price ở đây vì giá thực tế đã lưu trong SalesItems.price_at_sale
                // Thêm attributes: [...] của SalesItems nếu cần lấy hết cột từ bảng này
            },
            // Lấy thông tin tổng tiền từ SalesTotals
            { model: SalesTotals, as: 'totals', attributes: ['total_amount'] }, // Tổng tiền cuối cùng
            // Lấy lịch sử thay đổi trạng thái đơn hàng
            { model: SalesHistory, as: 'history', order: [['history_date', 'DESC']] } // Sắp xếp lịch sử mới nhất trước
        ]
    });
};

// @desc    Create a new sale (ĐÃ TÍCH HỢP TRỪ VIRTUAL BALANCE)
// @route   POST /api/sales
// @access  Private (requires logged-in user via 'protect' middleware)
const createSale = async (req, res, next) => {
    // Input: items: [{ product_id: X, product_qty: Y }, ...]
    const { items } = req.body; //

    // Lấy customer_id từ req.user được gắn bởi middleware 'protect'
    const customer_id = req.user?.id; // Dùng optional chaining và id (theo payload token đã sửa)

    // Kiểm tra xem đã xác thực user chưa
    if (!customer_id) { //
        return res.status(401).json({ message: 'Xác thực thất bại, không tìm thấy thông tin người dùng.' }); //
    }

    // Kiểm tra xem có items trong request không
    if (!items || !Array.isArray(items) || items.length === 0) { //
        return res.status(400).json({ message: 'Yêu cầu phải có thông tin sản phẩm trong đơn hàng.' }); //
    }

    const transaction = await sequelize.transaction(); // Bắt đầu transaction

    try {
        let grossTotalAmount = 0;     // Tổng tiền gốc trước khi giảm giá
        let totalDiscountApplied = 0; // Tổng số tiền ảo (giảm giá) đã sử dụng
        const productIds = items.map(item => item.product_id); // Lấy danh sách ID sản phẩm

        // === BƯỚC 1: Lấy thông tin khách hàng và số dư ảo (trong transaction + khóa record) ===
        const customer = await Customer.findByPk(customer_id, {
            transaction, // Thực hiện trong transaction
            lock: transaction.LOCK.UPDATE // Khóa record Customer để tránh cập nhật đồng thời số dư ảo
        }); //

        // Kiểm tra customer có tồn tại không (hiếm gặp nếu đã qua middleware protect)
        if (!customer) { //
            await transaction.rollback(); //
            return res.status(404).json({ message: 'Không tìm thấy khách hàng.'}); //
        }
        let currentVirtualBalance = customer.virtual_balance; // Số dư ảo hiện tại

        // === BƯỚC 2: Lấy thông tin sản phẩm và kiểm tra tồn kho (trong transaction + khóa record) ===
        const products = await Product.findAll({
            where: { product_id: { [Op.in]: productIds } }, // Tìm các sản phẩm có ID trong list
            lock: transaction.LOCK.UPDATE, // Khóa các sản phẩm liên quan để cập nhật stock an toàn
            transaction // Thực hiện trong transaction
        }); //

        // Tạo map để dễ truy cập sản phẩm bằng ID
        const productMap = products.reduce((map, product) => { //
            map[product.product_id] = product;
            return map;
        }, {}); //

        // === BƯỚC 3: Kiểm tra từng item, tính giảm giá, tính tổng tiền gốc, chuẩn bị data cho SalesItems ===
        const saleItemsData = []; // Mảng để chuẩn bị dữ liệu cho SalesItems bulkCreate
        const productUpdatePromises = []; // Mảng chứa các promise cập nhật tồn kho

        for (const item of items) { //
            const product = productMap[item.product_id]; // Lấy product từ map

            // Kiểm tra sản phẩm tồn tại trong DB không
            if (!product) { //
                throw new Error(`Không tìm thấy sản phẩm với ID ${item.product_id}.`); // Ném lỗi -> rollback
            }

            // Kiểm tra số lượng hợp lệ
            if (!item.product_qty || item.product_qty <= 0) { //
                throw new Error(`Số lượng không hợp lệ cho sản phẩm ${product.product_name}.`); // Ném lỗi -> rollback
            }

            // Kiểm tra tồn kho
            if (product.product_stock < item.product_qty) { //
                throw new Error(`Không đủ hàng cho sản phẩm "${product.product_name}". Tồn kho: ${product.product_stock}, Yêu cầu: ${item.product_qty}`); // Ném lỗi -> rollback
            }

            const priceAtSale = product.product_price; // Giá gốc tại thời điểm bán
            let discountForItem = 0;                   // Giảm giá cho item này (từ số dư ảo)

            // Tính giảm giá nếu còn số dư ảo
            if (currentVirtualBalance > 0) { //
                // Giảm tối đa 100k HOẶC toàn bộ số dư còn lại nếu số dư < 100k
                discountForItem = Math.min(100000, currentVirtualBalance); //
                // Trừ số dư ảo đã dùng
                currentVirtualBalance -= discountForItem; //
                // Cộng dồn tổng giảm giá đã áp dụng cho toàn đơn hàng
                totalDiscountApplied += discountForItem; //
            }

            // Thêm vào mảng dữ liệu SalesItems để bulk insert sau
            saleItemsData.push({
                // sale_id sẽ được gán sau khi tạo Sale
                product_id: item.product_id,
                product_qty: item.product_qty,
                price_at_sale: priceAtSale,       // Lưu giá gốc
                discount_amount: discountForItem  // <<< Lưu số tiền giảm giá cho item này
            }); //

            // Tính tổng tiền gốc (chưa giảm giá)
            grossTotalAmount += priceAtSale * item.product_qty; //

            // Cập nhật tồn kho (giảm đi)
            product.product_stock -= item.product_qty; //
            // Thêm promise save product vào mảng để chạy song song sau vòng lặp
            productUpdatePromises.push(product.save({ transaction })); //
        }

        // Thực thi tất cả các promise cập nhật tồn kho
        await Promise.all(productUpdatePromises); //

        // === BƯỚC 4: Tạo record Sale ===
        const newSale = await Sale.create({
            customer_id: customer_id,
            sale_date: new Date(), // Ngày hiện tại
            sale_status: 'Pending', // Trạng thái ban đầu khi mới tạo
            // Có thể thêm mã đơn hàng đặc biệt ở đây nếu cần
        }, { transaction }); //

        const saleId = newSale.sale_id; // Lấy ID của Sale vừa tạo

        // Gán sale_id cho tất cả các item trong saleItemsData
        saleItemsData.forEach(itemData => itemData.sale_id = saleId); //

        // === BƯỚC 5: Tạo các record SalesItems (dùng bulkCreate cho hiệu quả) ===
        await SalesItems.bulkCreate(saleItemsData, { transaction }); //

        // === BƯỚC 6: Tính tổng tiền cuối cùng và tạo SalesTotals ===
        const finalTotalAmount = grossTotalAmount - totalDiscountApplied; // Tổng tiền sau khi giảm giá
        await SalesTotals.create({
            sale_id: saleId,
            total_amount: finalTotalAmount, // Lưu tổng tiền cuối cùng
        }, { transaction }); //

        // === BƯỚC 7: Cập nhật lại số dư ảo cho khách hàng ===
        customer.virtual_balance = currentVirtualBalance; // Gán số dư còn lại sau khi trừ
        await customer.save({ transaction }); // Lưu thay đổi số dư

        // === BƯỚC 8: Tạo record SalesHistory ban đầu ===
        await SalesHistory.create({
            sale_id: saleId,
            history_date: new Date(), // Thời điểm tạo
            history_status: newSale.sale_status, // Trạng thái ban đầu
            history_notes: `Đơn hàng được tạo. Số dư ảo đã sử dụng: ${totalDiscountApplied.toLocaleString('vi-VN')} VND.` // Ghi chú số tiền ảo đã dùng
        }, { transaction }); //

        // === BƯỚC 9: Commit transaction nếu tất cả các bước trên thành công ===
        await transaction.commit(); //

        logger.info(`Sale created: ID ${saleId} for customer ${customer_id}. Discount applied: ${totalDiscountApplied}`); //

        // Lấy chi tiết đơn hàng vừa tạo để trả về cho client
        const createdSaleDetails = await getSaleDetailsById(saleId); //
        res.status(201).json(createdSaleDetails); // Trả về 201 Created

    } catch (error) {
        // Rollback transaction nếu có bất kỳ lỗi nào xảy ra
        await transaction.rollback(); //
        logger.error(`Error creating sale for customer ${customer_id}: ${error.message}`, error.stack); // Log cả stack trace nếu cần debug

        // Xác định status code phù hợp dựa trên loại lỗi
        let statusCode = 500; // Mặc định là lỗi server
        if (error.message.includes('Không đủ hàng') || error.message.includes('Không tìm thấy sản phẩm') || error.message.includes('Số lượng không hợp lệ')) { //
            statusCode = 400; // Bad request do dữ liệu đầu vào hoặc trạng thái DB không phù hợp
        }

        // Trả về lỗi cho client (không nên trả message lỗi trực tiếp nếu nhạy cảm)
        res.status(statusCode).json({ message: error.message || 'Không thể tạo đơn hàng vào lúc này.' }); //
        // Hoặc dùng next(error) để đưa về error handler chung
        // error.status = statusCode; // Gán status cho error object
        // next(error); //
    }
};


// @desc    Get sale details by ID
// @route   GET /api/sales/:id
// @access  Private (user must own sale or be admin)
const getSaleById = async (req, res, next) => {
    try {
        const saleId = req.params.id; // Lấy ID từ URL
        const sale = await getSaleDetailsById(saleId); // Gọi helper function để lấy chi tiết

        // Nếu không tìm thấy đơn hàng
        if (!sale) { //
            res.status(404); //
            throw new Error(`Không tìm thấy đơn hàng với ID: ${saleId}`); //
        }

        // Authorization check: User phải sở hữu đơn hàng HOẶC là admin
        // req.user được gắn bởi middleware 'protect'
        if (sale.customer_id !== req.user.id && !req.user.isAdmin) { // Kiểm tra cả req.user.isAdmin
            res.status(403); // Forbidden
            throw new Error('Bạn không có quyền xem đơn hàng này.'); //
        }

        // Nếu hợp lệ, trả về chi tiết đơn hàng
        res.json(sale); //

    } catch (error) {
        logger.error(`Error fetching sale ${req.params.id}:`, error); //

        // Gán status code nếu chưa có (ví dụ lỗi từ getSaleDetailsById không set status)
        if (!res.headersSent) { // Kiểm tra nếu header chưa được gửi đi
            let status = 500; //
            if (error.message.includes('Không tìm thấy đơn hàng')) status = 404; //
            else if (error.message.includes('không có quyền')) status = 403; //
            res.status(status); // Set status trước khi gọi next hoặc res.json/end
        }

        next(error); // Chuyển lỗi về error handler
    }
};

// @desc    Get sales for the logged-in customer
// @route   GET /api/sales/my
// @access  Private
const getMySales = async (req, res, next) => {
    try {
        const customer_id = req.user.id; // Lấy ID từ user đã xác thực

        // Pagination
        const page = parseInt(req.query.page, 10) || 1; //
        const limit = parseInt(req.query.limit, 10) || 10; //
        const offset = (page - 1) * limit; //

        // Tìm và đếm tất cả đơn hàng của user này
        const { count, rows } = await Sale.findAndCountAll({ //
            where: { customer_id: customer_id }, // Lọc theo customer_id
            limit: limit,                 // Phân trang
            offset: offset,               // Phân trang
            order: [['sale_id', 'DESC']], // Sắp xếp theo ID giảm dần (mới nhất trước)
            include: [ // Include những thông tin cần thiết cho list view (tránh lấy quá nhiều)
                { model: SalesTotals, as: 'totals', attributes: ['total_amount'] } // Lấy tổng tiền
                // Có thể include thêm item đầu tiên hoặc tổng số item nếu cần hiển thị ở list
            ],
            distinct: true // Cần thiết khi có include
        });

        // Trả về kết quả phân trang
        res.json({ //
            sales: rows, // Danh sách đơn hàng của trang hiện tại
            totalPages: Math.ceil(count / limit), // Tổng số trang
            currentPage: page, // Trang hiện tại
            totalSales: count // Tổng số đơn hàng của user
        }); //

    } catch (error) {
        logger.error(`Error fetching sales for customer ${req.user.id}:`, error); //
        next(error); // Chuyển lỗi về error handler
    }
};

// @desc    Update sale status (Admin)
// @route   PUT /api/sales/:id/status
// @access  Private/Admin (Cần middleware isAdmin cho route này)
const updateSaleStatus = async (req, res, next) => {
    // --- QUAN TRỌNG: Route gọi controller này cần có middleware protect và isAdmin ---
    const { status, notes } = req.body; // Lấy trạng thái mới và ghi chú từ body
    const saleId = req.params.id; // Lấy ID đơn hàng từ URL

    // Kiểm tra status có được cung cấp không
    if (!status) { //
        return res.status(400).json({ message: 'Trạng thái mới là bắt buộc.' }); //
    }

    // Validate status (kiểm tra xem status có nằm trong danh sách cho phép không)
    const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Completed']; //
    if (!allowedStatuses.includes(status)) { //
        return res.status(400).json({ message: `Trạng thái không hợp lệ. Trạng thái cho phép: ${allowedStatuses.join(', ')}` }); //
    }

    const transaction = await sequelize.transaction(); // Bắt đầu transaction

    try {
        // Tìm đơn hàng cần cập nhật
        const sale = await Sale.findByPk(saleId, { transaction }); //

        // Nếu không tìm thấy đơn hàng
        if (!sale) { //
            await transaction.rollback(); //
            res.status(404); //
            throw new Error(`Không tìm thấy đơn hàng với ID: ${saleId}`); //
        }

        const oldStatus = sale.sale_status; // Lấy trạng thái cũ

        // Chỉ cập nhật nếu status thực sự thay đổi
        if (oldStatus === status) { //
            await transaction.rollback(); // Không có gì thay đổi, rollback và trả về
            // Lấy lại thông tin hiện tại để trả về (đảm bảo dữ liệu mới nhất)
            const currentSaleDetails = await getSaleDetailsById(saleId); //
            return res.json(currentSaleDetails); // Trả về thông tin hiện tại
            // Hoặc: return res.status(200).json({ message: `Đơn hàng đã ở trạng thái ${status}.`})
        }

        // Cập nhật trạng thái mới cho đơn hàng
        sale.sale_status = status; //

        // Lưu thay đổi trạng thái
        await sale.save({ transaction });

        // Tạo bản ghi SalesHistory mới cho sự thay đổi này
        await SalesHistory.create({ //
            sale_id: saleId,
            history_date: new Date(), // Thời điểm cập nhật
            history_status: status,   // Trạng thái mới
            history_notes: notes || `Admin cập nhật trạng thái từ "${oldStatus}" thành "${status}".` // Ghi chú (mặc định nếu không có)
        }, { transaction }); //

        // Xử lý hoàn trả tồn kho nếu HỦY đơn hàng đã xử lý/giao hàng
        // Kiểm tra nếu trạng thái mới là 'Cancelled' VÀ trạng thái cũ là một trong các trạng thái đã trừ kho
        if (status === 'Cancelled' && ['Processing', 'Shipped', 'Delivered', 'Completed'].includes(oldStatus)) { //
            logger.warn(`Sale ${saleId} cancelled from ${oldStatus}. Adjusting stock back.`); //
            // Lấy lại các items của đơn hàng này
            const items = await SalesItems.findAll({ where: { sale_id: saleId }, transaction }); //
            // Duyệt qua từng item để cộng lại tồn kho
            const stockRestorePromises = [];
            for (const item of items) { //
                // Dùng increment để cộng lại tồn kho một cách an toàn (tránh race condition)
                stockRestorePromises.push(
                    Product.increment('product_stock', { //
                        by: item.product_qty, // Cộng lại số lượng đã mua
                        where: { product_id: item.product_id }, // Cho sản phẩm tương ứng
                        transaction // Thực hiện trong transaction
                    })
                );
                logger.info(`Stock to be restored by ${item.product_qty} for product ${item.product_id}`); //
            }
            await Promise.all(stockRestorePromises); // Chạy các promise cộng tồn kho

            // --- Cân nhắc: Có nên hoàn lại virtual_balance đã dùng khi hủy đơn? ---
            // Nếu có:
            // 1. Tính tổng discount_amount của tất cả items trong đơn hàng này.
            // const totalDiscountRestored = await SalesItems.sum('discount_amount', { where: { sale_id: saleId }, transaction });
            // 2. Lấy lại thông tin customer (có thể cần lock lại).
            // const customerToRestore = await Customer.findByPk(sale.customer_id, { transaction, lock: transaction.LOCK.UPDATE });
            // 3. Cộng lại số dư ảo.
            // if (customerToRestore && totalDiscountRestored > 0) {
            //    customerToRestore.virtual_balance += totalDiscountRestored;
            //    await customerToRestore.save({ transaction });
            //    logger.info(`Restored ${totalDiscountRestored} virtual balance to customer ${sale.customer_id}`);
            // }
            // -----------------------------------------------------------------------
        }

        await transaction.commit(); // Commit transaction nếu mọi thứ thành công

        logger.info(`Sale status updated: ID ${saleId} set to ${status} by admin ${req.user.id}`); //

        // Trả về chi tiết đơn hàng đã cập nhật
        const updatedSaleDetails = await getSaleDetailsById(saleId); //
        res.json(updatedSaleDetails); //

    } catch (error) {
        await transaction.rollback(); // Rollback nếu có lỗi
        logger.error(`Error updating status for sale ${saleId}:`, error); //

        // Xử lý lỗi và trả về response
        if (!res.headersSent) { //
            let status = 500; //
            if (error.message.includes('Không tìm thấy đơn hàng')) status = 404; //
            res.status(status); //
        }
        next(error); // Chuyển về error handler
    }
};

// --- (TÙY CHỌN) Controller lấy danh sách đơn hàng cho Admin ---
// @desc    Get all sales (for Admin)
// @route   GET /api/sales (Hoặc /api/admin/sales - tùy vào cách đặt route)
// @access  Private/Admin (Cần middleware isAdmin cho route này)
const getAllSales = async (req, res, next) => {
    // --- QUAN TRỌNG: Route gọi controller này cần có middleware protect và isAdmin ---
    try {
        // Pagination
        const page = parseInt(req.query.page, 10) || 1; //
        const limit = parseInt(req.query.limit, 10) || 20; // Admin có thể xem nhiều hơn user thường
        const offset = (page - 1) * limit; //

        // Filtering (ví dụ: lọc theo status, customerId, date range)
        const whereClause = {}; //
        if (req.query.status) { // Lọc theo trạng thái
            whereClause.sale_status = req.query.status; //
        }
        if (req.query.customerId) { // Lọc theo khách hàng
            whereClause.customer_id = parseInt(req.query.customerId, 10); //
        }
        // Thêm filter theo ngày nếu cần (ví dụ: req.query.dateFrom, req.query.dateTo)
        // if (req.query.dateFrom && req.query.dateTo) {
        //     whereClause.sale_date = {
        //         [Op.between]: [new Date(req.query.dateFrom), new Date(req.query.dateTo)]
        //     };
        // }

        // Tìm và đếm tất cả đơn hàng khớp điều kiện
        const { count, rows } = await Sale.findAndCountAll({ //
            where: whereClause, // Áp dụng filter
            limit: limit,       // Phân trang
            offset: offset,     // Phân trang
            order: [['sale_id', 'DESC']], // Mới nhất trước
            include: [ // Include thông tin cần thiết cho admin list view
                { model: Customer, as: 'customer', attributes: ['customer_id', 'customer_name', 'customer_email'] }, // Thông tin KH
                { model: SalesTotals, as: 'totals', attributes: ['total_amount'] } // Tổng tiền
            ],
            distinct: true // Cần khi có include
        });

        // Trả về kết quả phân trang
        res.json({ //
            sales: rows, // Danh sách đơn hàng
            totalPages: Math.ceil(count / limit), // Tổng số trang
            currentPage: page, // Trang hiện tại
            totalSales: count // Tổng số đơn hàng khớp điều kiện
        }); //

    } catch (error) {
        logger.error('Error fetching all sales for admin:', error); //
        next(error); // Chuyển lỗi về error handler
    }
};


module.exports = {
    createSale,
    getSaleById,
    getMySales,
    updateSaleStatus,
    getAllSales // <<< Thêm export cho hàm lấy tất cả sales (Admin)
}; //