// backend/graphql/dataloaders.js
const DataLoader = require('dataloader');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// --- Batch Functions ---

const batchById = async (Model, ids, idField = `${Model.name.toLowerCase()}_id`) => {
    const items = await Model.findAll({
        where: {
            [idField]: {
                [Op.in]: ids,
            },
        },
    });
    const itemMap = {};
    items.forEach(item => {
        itemMap[item[idField]] = item;
    });
    return ids.map(id => itemMap[id] || null);
};

const batchCategories = (ids, db) => batchById(db.Category, ids, 'category_id');
const batchCustomers = (ids, db) => batchById(db.Customer, ids, 'customer_id');
const batchColors = (ids, db) => batchById(db.Color, ids, 'color_id');
const batchSizes = (ids, db) => batchById(db.Size, ids, 'size_id');
const batchProducts = (ids, db) => batchById(db.Product, ids, 'product_id');
const batchBlogPosts = (ids, db) => batchById(db.BlogPost, ids, 'post_id');
const batchBlogTags = (ids, db) => batchById(db.BlogTag, ids, 'tag_id');
const batchSales = (ids, db) => batchById(db.Sale, ids, 'sale_id');

const batchProductImagesByProductId = async (productIds, db) => {
    const images = await db.ProductImage.findAll({
        where: { product_id: { [Op.in]: productIds } },
        order: [['display_order', 'ASC']],
        include: [{ model: db.Color, as: 'color', required: false }]
    });
    const imagesByProductId = {};
    productIds.forEach(id => imagesByProductId[id] = []);
    images.forEach(image => {
        if (imagesByProductId[image.product_id]) {
            imagesByProductId[image.product_id].push(image);
        }
    });
    return productIds.map(id => imagesByProductId[id]);
};

const batchInventoryByProductId = async (productIds, db) => {
    const inventoryItems = await db.Inventory.findAll({
        where: { product_id: { [Op.in]: productIds } },
        include: [
            { model: db.Size, as: 'size', required: false },
            // SỬA LỖI ALIAS Ở ĐÂY:
            { model: db.Color, as: 'colorDetail', required: false } // Đổi 'color' thành 'colorDetail'
        ]
    });
    const inventoryByProductId = {};
    productIds.forEach(id => inventoryByProductId[id] = []);
    inventoryItems.forEach(item => {
        if (inventoryByProductId[item.product_id]) {
            inventoryByProductId[item.product_id].push(item);
        }
    });
    return productIds.map(id => inventoryByProductId[id]);
};

const batchSalesItemsBySaleId = async (saleIds, db) => {
    const items = await db.SalesItems.findAll({
        where: { sale_id: { [Op.in]: saleIds } },
    });
    const itemsBySaleId = {};
    saleIds.forEach(id => itemsBySaleId[id] = []);
    items.forEach(item => {
        if (itemsBySaleId[item.sale_id]) {
            itemsBySaleId[item.sale_id].push(item);
        }
    });
    return saleIds.map(id => itemsBySaleId[id]);
};

const batchSalesTotalsBySaleId = async (saleIds, db) => {
    const totals = await db.SalesTotals.findAll({
        where: { sale_id: { [Op.in]: saleIds } }
    });
    const totalsMap = {};
    totals.forEach(total => totalsMap[total.sale_id] = total);
    return saleIds.map(id => totalsMap[id] || null);
};

const batchSalesHistoryBySaleId = async (saleIds, db) => {
    const histories = await db.SalesHistory.findAll({
        where: { sale_id: { [Op.in]: saleIds } },
        order: [['history_date', 'DESC']]
    });
    const historyBySaleId = {};
    saleIds.forEach(id => historyBySaleId[id] = []);
    histories.forEach(history => {
        if (historyBySaleId[history.sale_id]) {
            historyBySaleId[history.sale_id].push(history);
        }
    });
    return saleIds.map(id => historyBySaleId[id]);
};

const batchBlogTagsByPostId = async (postIds, db) => {
    const postsWithTags = await db.BlogPost.findAll({
        where: { post_id: { [Op.in]: postIds } },
        include: [{ model: db.BlogTag, as: 'tags', through: { attributes: [] } }]
    });
    const tagsByPostId = {};
    postsWithTags.forEach(post => {
        tagsByPostId[post.post_id] = post.tags || [];
    });
    return postIds.map(id => tagsByPostId[id] || []);
};

const batchBlogCommentsByPostId = async (postIds, db) => {
    const comments = await db.BlogComment.findAll({
        where: {
            post_id: { [Op.in]: postIds },
            status: 'approved',
            parent_comment_id: null
        },
        include: [{ model: db.Customer, as: 'commentAuthor', attributes: ['customer_id', 'customer_name', 'username'] }],
        order: [['created_at', 'ASC']]
    });
    const commentsByPostId = {};
    postIds.forEach(id => commentsByPostId[id] = { count: 0, comments: [] });
    comments.forEach(comment => {
        if (commentsByPostId[comment.post_id]) {
            commentsByPostId[comment.post_id].comments.push(comment);
        }
    });
    postIds.forEach(id => commentsByPostId[id].count = commentsByPostId[id].comments.length);
    return postIds.map(id => commentsByPostId[id]);
};

const batchBlogRepliesByParentId = async (parentCommentIds, db) => {
    const replies = await db.BlogComment.findAll({
        where: {
            parent_comment_id: { [Op.in]: parentCommentIds },
            status: 'approved'
        },
        include: [{ model: db.Customer, as: 'commentAuthor', attributes: ['customer_id', 'customer_name', 'username'] }],
        order: [['created_at', 'ASC']]
    });
    const repliesByParentId = {};
    parentCommentIds.forEach(id => repliesByParentId[id] = { count: 0, comments: [] });
    replies.forEach(reply => {
        if (repliesByParentId[reply.parent_comment_id]) {
            repliesByParentId[reply.parent_comment_id].comments.push(reply);
        }
    });
    parentCommentIds.forEach(id => repliesByParentId[id].count = repliesByParentId[id].comments.length);
    return parentCommentIds.map(id => repliesByParentId[id]);
};

const batchCollectionsByProductId = async (productIds, db) => {
    const productsWithCollections = await db.Product.findAll({
        where: { product_id: { [Op.in]: productIds } },
        include: [{ model: db.Collection, as: 'collections', through: { attributes: [] } }]
    });
    const collectionsByProductId = {};
    productsWithCollections.forEach(product => {
        collectionsByProductId[product.product_id] = product.collections || [];
    });
    return productIds.map(id => collectionsByProductId[id] || []);
};

const createLoaders = (db) => {
    if (!db) {
        logger.error("[createLoaders] Critical: DB object is undefined. Loaders cannot be created.");
        return {};
    }
    const loaders = {};
    if (db.Category) loaders.categoryLoader = new DataLoader(keys => batchCategories(keys, db));
    if (db.Customer) loaders.customerLoader = new DataLoader(keys => batchCustomers(keys, db));
    if (db.ProductImage) loaders.productImageLoader = new DataLoader(keys => batchProductImagesByProductId(keys, db));
    if (db.Inventory) loaders.inventoryLoader = new DataLoader(keys => batchInventoryByProductId(keys, db));
    if (db.Color) loaders.colorLoader = new DataLoader(keys => batchColors(keys, db));
    if (db.Size) loaders.sizeLoader = new DataLoader(keys => batchSizes(keys, db));
    if (db.Product) loaders.productLoader = new DataLoader(keys => batchProducts(keys, db));
    if (db.BlogPost) {
        loaders.blogPostLoader = new DataLoader(keys => batchBlogPosts(keys, db));
        loaders.blogPostTagsLoader = new DataLoader(keys => batchBlogTagsByPostId(keys, db));
        loaders.blogPostCommentsLoader = new DataLoader(keys => batchBlogCommentsByPostId(keys, db));
    }
    if (db.BlogTag) loaders.blogTagLoader = new DataLoader(keys => batchBlogTags(keys, db));
    if (db.BlogComment) loaders.blogCommentRepliesLoader = new DataLoader(keys => batchBlogRepliesByParentId(keys, db));
    if (db.Sale) {
        loaders.saleLoader = new DataLoader(keys => batchSales(keys, db));
        loaders.saleItemsLoader = new DataLoader(keys => batchSalesItemsBySaleId(keys, db));
        loaders.saleTotalsLoader = new DataLoader(keys => batchSalesTotalsBySaleId(keys, db));
        loaders.saleHistoryLoader = new DataLoader(keys => batchSalesHistoryBySaleId(keys, db));
    }
    if (db.Collection && db.Product) loaders.productCollectionsLoader = new DataLoader(keys => batchCollectionsByProductId(keys, db));
    return loaders;
};

module.exports = { createLoaders };
