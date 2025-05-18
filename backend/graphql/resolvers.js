// backend/graphql/resolvers.js
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const crypto = require('crypto');
    const { GraphQLError, GraphQLScalarType, Kind } = require('graphql');
    const { Op } = require('sequelize'); // Ensure Op is imported from sequelize
    const logger = require('../utils/logger'); // Assuming logger is set up
    
    const TEMP_JWT_SECRET_FOR_SIGNING = '45d0ee56f5479bd4fea5e333b7231ef6a9344cf3506c72390f99f39ecaadf1ef'; // << TEMPORARY HARDCODE (MUST MATCH APP.JS)
    
    const generateToken = (customer) => {
        const secret = TEMP_JWT_SECRET_FOR_SIGNING; 
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
        if (!secret) {
            logger.error("FATAL ERROR: Hardcoded JWT_SECRET (TEMP_JWT_SECRET_FOR_SIGNING) is not defined for token generation.");
            throw new GraphQLError("Hardcoded JWT Secret is missing.", { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
        if (!customer || customer.customer_id === undefined) {
            logger.error("Error generating token: Invalid customer object provided (customer_id is undefined).", customer);
            throw new GraphQLError("Cannot generate token for invalid user data.", { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
        const payload = {
            user: {
                id: customer.customer_id,
                username: customer.username,
                isAdmin: customer.isAdmin
            }
        };
        try {
            return jwt.sign(payload, secret, { expiresIn });
        } catch (err) {
            logger.error("Error signing JWT (Hardcoded Secret):", err);
            throw new GraphQLError('Could not generate authentication token (Hardcoded Secret).', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' }
            });
        }
    };
    
    // --- HELPER FUNCTIONS ---
    const checkAdmin = (context) => {
        if (!context.user || context.user.isAdmin !== true) {
            logger.warn('[Resolver checkAdmin] Access DENIED. User details (or lack thereof):', context.user);
            throw new GraphQLError('Forbidden: Administrator privileges required.', {
                extensions: { code: 'FORBIDDEN', http: { status: 403 } },
            });
        }
    };
    
    const checkAuth = (context) => {
        if (!context.user || context.user.id === undefined) {
            logger.warn('[Resolver checkAuth] Authentication failed: User or user.id missing from context.', context.user);
            throw new GraphQLError('Authentication required. Please log in.', {
                extensions: { code: 'UNAUTHENTICATED' }
            });
        }
    };
    
    const generateSlug = async (text, model, existingSlug = null, pkField = 'id', pkValue = null, context) => {
        let slugToUse = existingSlug;
        if (!slugToUse && text) {
            slugToUse = text.toString().toLowerCase()
                .normalize('NFD') 
                .replace(/[\u0300-\u036f]/g, '') 
                .replace(/đ/g, 'd').replace(/Đ/g, 'D') 
                .replace(/\s+/g, '-') 
                .replace(/[^\w-]+/g, '') 
                .replace(/--+/g, '-') 
                .replace(/^-+/, '') 
                .replace(/-+$/, ''); 
            if (!slugToUse) { 
                slugToUse = `item-${Date.now().toString().slice(-5)}`;
            }
        } else if (!slugToUse && !text) {
            return `item-no-text-${Date.now().toString().slice(-5)}`;
        }
    
        if (!model || !context || !context.db || !context.db[model.name]) {
            logger.warn(`[generateSlug] Model ${model ? model.name : 'unknown'} not found in context.db. Returning potentially non-unique slug: ${slugToUse}`);
            return slugToUse;
        }
        
        let uniqueSlug = slugToUse;
        let counter = 1;
        const whereClause = { slug: uniqueSlug };
        if (pkValue) {
            whereClause[pkField] = { [Op.ne]: pkValue };
        }
    
        // eslint-disable-next-line no-await-in-loop
        while (await context.db[model.name].findOne({ where: whereClause })) {
            uniqueSlug = `${slugToUse}-${counter}`;
            whereClause.slug = uniqueSlug;
            counter++;
        }
        return uniqueSlug;
    };
    
    
    // --- RESOLVERS ---
    const resolvers = {
        Date: new GraphQLScalarType({
            name: 'Date',
            description: 'Date custom scalar type (YYYY-MM-DD)',
            serialize(value) { 
                if (value instanceof Date) {
                    return value.toISOString().split('T')[0]; 
                }
                if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    return value; 
                }
                logger.warn(`[Scalar Date Serialize] Unexpected value type: ${typeof value}, value: ${value}`);
                throw new GraphQLError('Date cannot represent non-date value.');
            },
            parseValue(value) { 
                if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                    const date = new Date(value);
                    if (isNaN(date.getTime())) {
                        logger.warn(`[Scalar Date ParseValue] Invalid date string: ${value}`);
                        throw new GraphQLError('Provided date string is invalid.');
                    }
                    return date.toISOString().split('T')[0]; 
                }
                logger.warn(`[Scalar Date ParseValue] Unexpected value type: ${typeof value}, value: ${value}`);
                throw new GraphQLError('Date must be a string in YYYY-MM-DD format.');
            },
            parseLiteral(ast) { 
                if (ast.kind === Kind.STRING && /^\d{4}-\d{2}-\d{2}$/.test(ast.value)) {
                     const date = new Date(ast.value);
                    if (isNaN(date.getTime())) {
                        logger.warn(`[Scalar Date ParseLiteral] Invalid date string in AST: ${ast.value}`);
                        throw new GraphQLError('Provided date string is invalid.');
                    }
                    return date.toISOString().split('T')[0]; 
                }
                logger.warn(`[Scalar Date ParseLiteral] Unexpected AST kind: ${ast.kind}, value: ${ast.value}`);
                throw new GraphQLError('Date must be a string in YYYY-MM-DD format.');
            },
        }),
        DateTime: new GraphQLScalarType({
            name: 'DateTime',
            description: 'DateTime custom scalar type (ISO-8601)',
            serialize(value) { 
                if (value instanceof Date) {
                    return value.toISOString(); 
                }
                if (typeof value === 'string') { 
                     try {
                        return new Date(value).toISOString();
                     } catch (e) {
                        logger.warn(`[Scalar DateTime Serialize] Could not parse string to Date: ${value}`);
                        throw new GraphQLError('DateTime cannot represent invalid date-time string.');
                     }
                }
                if (typeof value === 'number') { 
                     try {
                        return new Date(value).toISOString();
                     } catch(e) {
                        logger.warn(`[Scalar DateTime Serialize] Could not parse number to Date: ${value}`);
                        throw new GraphQLError('DateTime cannot represent invalid date-time number.');
                     }
                }
                logger.warn(`[Scalar DateTime Serialize] Unexpected value type: ${typeof value}, value: ${value}`);
                throw new GraphQLError('DateTime cannot represent non-date value.');
            },
            parseValue(value) { 
                try {
                    const date = new Date(value); 
                    if (isNaN(date.getTime())) {
                        logger.warn(`[Scalar DateTime ParseValue] Invalid date-time value: ${value}`);
                        throw new GraphQLError('Provided date-time value is invalid.');
                    }
                    return date; 
                } catch (e) {
                    logger.warn(`[Scalar DateTime ParseValue] Error parsing date-time value: ${value}`, e);
                    throw new GraphQLError('Invalid DateTime format.');
                }
            },
            parseLiteral(ast) { 
                if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
                    try {
                        const dateValue = ast.kind === Kind.INT ? parseInt(ast.value, 10) : ast.value;
                        const date = new Date(dateValue);
                        if (isNaN(date.getTime())) {
                            logger.warn(`[Scalar DateTime ParseLiteral] Invalid date-time value in AST: ${ast.value}`);
                            throw new GraphQLError('Provided date-time value is invalid.');
                        }
                        return date; 
                    } catch (e) {
                         logger.warn(`[Scalar DateTime ParseLiteral] Error parsing date-time value from AST: ${ast.value}`, e);
                        throw new GraphQLError('Invalid DateTime format.');
                    }
                }
                logger.warn(`[Scalar DateTime ParseLiteral] Unexpected AST kind: ${ast.kind}, value: ${ast.value}`);
                throw new GraphQLError('DateTime must be a valid ISO-8601 string or a timestamp integer.');
            },
        }),
    
        Inventory: {
            size: async (parent, _, { db }) => {
                if (parent.size) return parent.size; 
                return parent.getSize ? await parent.getSize() : null;
            },
            color: async (parent, _, { db }) => {
                if (parent.colorDetail) return parent.colorDetail; 
                if (parent.color) return parent.color; 
                return parent.getColorDetail ? await parent.getColorDetail() : (parent.color_id ? db.Color.findByPk(parent.color_id) : null);
            }
        },
    
        Product: {
            name: (parent, args, context) => {
                const lang = args.lang || context.lang || 'vi';
                return lang === 'en' && parent.product_name_en ? parent.product_name_en : parent.product_name_vi;
            },
            description: (parent, args, context) => {
                const lang = args.lang || context.lang || 'vi';
                return lang === 'en' && parent.product_description_en ? parent.product_description_en : parent.product_description_vi;
            },
            category: async (parent, _, { db }) => {
                if (parent.category) return parent.category;
                return parent.getCategory ? await parent.getCategory() : null;
            },
            collections: async (parent, _, { db }) => {
                if (parent.collections) return parent.collections;
                return parent.getCollections ? await parent.getCollections({ through: { attributes: [] } }) : [];
            },
            images: async (parent, _, { db }) => {
                if (parent.images) return parent.images;
                return parent.getImages ? await parent.getImages({
                    order: [['display_order', 'ASC']],
                    include: [{ model: db.Color, as: 'color', required: false }] 
                }) : [];
            },
            inventory: async (parent, _, { db }) => {
                if (parent.inventoryItems) return parent.inventoryItems; 
                
                if (parent.getInventoryItems) {
                    return parent.getInventoryItems({
                        include: [
                            { model: db.Size, as: 'size', required: false },  
                            { model: db.Color, as: 'colorDetail', required: false } 
                        ]
                    });
                }
                logger.warn(`[Resolver Product.inventory] Getter getInventoryItems not found for product ID ${parent.product_id}. Check 'as' alias in Product model for Inventory association (expected 'inventoryItems').`);
                return [];
            },
        },
        Category: {
            name: (parent, args, context) => {
                const lang = args.lang || context.lang || 'vi';
                return lang === 'en' && parent.category_name_en ? parent.category_name_en : parent.category_name_vi;
            }
        },
        Color: {
            name: (parent, args, context) => {
                const lang = args.lang || context.lang || 'vi';
                // If you add 'color_name_en' to your Color model, you can use it here
                if (lang === 'en' && parent.color_name_en) {
                    return parent.color_name_en;
                }
                return parent.color_name; // Defaults to Vietnamese or the primary name
            }
        },
        Collection: {
            name: (parent, args, context) => {
                const lang = args.lang || context.lang || 'vi';
                return lang === 'en' && parent.collection_name_en ? parent.collection_name_en : parent.collection_name_vi;
            },
            description: (parent, args, context) => {
                const lang = args.lang || context.lang || 'vi';
                return lang === 'en' && parent.collection_description_en ? parent.collection_description_en : parent.collection_description_vi;
            }
        },
        ProductImage: {
            alt_text: (parent, args, context) => {
                const lang = args.lang || context.lang || 'vi';
                return lang === 'en' && parent.alt_text_en ? parent.alt_text_en : parent.alt_text_vi;
            },
            color: async (parent, _, { db }) => { 
                if (parent.color_id) { 
                    if (parent.color && parent.color.color_id === parent.color_id) return parent.color; 
                    return db.Color.findByPk(parent.color_id);
                }
                return null;
            }
        },
        BlogPost: {
            title: (parent, args, context) => {
                const lang = args.lang || context.lang || 'vi';
                return lang === 'en' && parent.title_en ? parent.title_en : parent.title_vi;
            },
            excerpt: (parent, args, context) => {
                const lang = args.lang || context.lang || 'vi';
                return lang === 'en' && parent.excerpt_en ? parent.excerpt_en : parent.excerpt_vi;
            },
            content_html: (parent, args, context) => {
                const lang = args.lang || context.lang || 'vi';
                return lang === 'en' && parent.content_html_en ? parent.content_html_en : parent.content_html_vi;
            },
            meta_title: (parent, args, context) => {
                const lang = args.lang || context.lang || 'vi';
                return lang === 'en' && parent.meta_title_en ? parent.meta_title_en : parent.meta_title_vi;
            },
            meta_description: (parent, args, context) => {
                const lang = args.lang || context.lang || 'vi';
                return lang === 'en' && parent.meta_description_en ? parent.meta_description_en : parent.meta_description_vi;
            },
            author: async (parent, _, { db }) => {
                if (parent.author) return parent.author; 
                return parent.getAuthor ? await parent.getAuthor({ attributes: ['customer_id', 'customer_name', 'username'] }) : null;
            },
            tags: async (parent, _, { db }) => {
                if (parent.tags) return parent.tags; 
                return parent.getTags ? await parent.getTags({ through: { attributes: [] } }) : [];
            },
            comments: async (parent, { limit = 10, offset = 0 }, { db }) => {
                const { count, rows } = await db.BlogComment.findAndCountAll({
                    where: { post_id: parent.post_id, status: 'approved', parent_comment_id: null },
                    include: [{ model: db.Customer, as: 'author', attributes: ['customer_id', 'customer_name', 'username'] }],
                    order: [['created_at', 'ASC']], 
                    limit,
                    offset,
                });
                return { count, comments: rows };
            }
        },
        BlogTag: {
            name: (parent, args, context) => {
                const lang = args.lang || context.lang || 'vi';
                return lang === 'en' && parent.name_en ? parent.name_en : parent.name_vi;
            }
        },
        BlogComment: {
            author: async (parent, _, { db }) => {
                if (parent.author) return parent.author; 
                if (parent.user_id) { 
                     return parent.getAuthor ? await parent.getAuthor({ attributes: ['customer_id', 'customer_name', 'username'] }) : null;
                }
                return null; 
            },
            replies: async (parent, { limit = 5, offset = 0 }, { db }) => {
                 const { count, rows } = await db.BlogComment.findAndCountAll({
                    where: { parent_comment_id: parent.comment_id, status: 'approved' },
                    include: [{ model: db.Customer, as: 'author', attributes: ['customer_id', 'customer_name', 'username'] }],
                    order: [['created_at', 'ASC']],
                    limit,
                    offset,
                });
                return { count, comments: rows };
            }
        },
        Sale: {
            customer: async (parentSale, _, {db}) => {
                if (parentSale.customer) return parentSale.customer;
                return parentSale.getCustomer ? await parentSale.getCustomer({ attributes: { exclude: ['customer_password', 'password_reset_token', 'password_reset_expires'] } }) : null;
            },
            items: async (parentSale, _, { db }) => {
                if (parentSale.items) return parentSale.items;
                return parentSale.getItems ? await parentSale.getItems({
                    include: [
                        { model: db.Product, as: 'product' }, 
                        { model: db.Size, as: 'size' },   
                        { model: db.Color, as: 'color' }  
                    ]
                }) : [];
            },
            history: async (parentSale, _, {db}) => {
                if (parentSale.history) return parentSale.history;
                return parentSale.getHistory ? await parentSale.getHistory({ order: [['history_date', 'DESC']] }) : [];
            },
            totals: async (parentSale, _, {db}) => {
                if (parentSale.totals) return parentSale.totals;
                return parentSale.getTotals ? await parentSale.getTotals() : null;
            },
        },
        SalesItem: {
            product: async (parentSalesItem, _, {db}) => {
                if (parentSalesItem.product) return parentSalesItem.product;
                return parentSalesItem.getProduct ? await parentSalesItem.getProduct() : null;
            },
            size: async (parentSalesItem, _, {db}) => {
                if (parentSalesItem.size) return parentSalesItem.size;
                return parentSalesItem.getSize ? await parentSalesItem.getSize() : null;
            },
            color: async (parentSalesItem, _, {db}) => {
                if (parentSalesItem.color) return parentSalesItem.color;
                return parentSalesItem.getColor ? await parentSalesItem.getColor() : null;
            }
        },
    
        Query: {
            products: async (_, { filter = {}, limit = 10, offset = 0, lang = "vi" }, context) => {
                const { db, sequelize } = context; 
                try {
                    const whereClause = { is_active: true };
                    const includeClauseForFiltering = [];
    
                    if (filter.category_id) whereClause.category_id = filter.category_id;
                    if (typeof filter.is_new_arrival === 'boolean') whereClause.is_new_arrival = filter.is_new_arrival;
                    
                    if (filter.search_term) {
                        const searchTermLike = `%${filter.search_term}%`;
                        const nameField = lang === 'en' ? 'product_name_en' : 'product_name_vi';
                        const descField = lang === 'en' ? 'product_description_en' : 'product_description_vi';
                        whereClause[Op.or] = [
                            { [nameField]: { [Op.like]: searchTermLike } },
                            ...(lang === 'en' && db.Product.rawAttributes.product_name_vi ? [{ product_name_vi: { [Op.like]: searchTermLike } }] : []), 
                            { [descField]: { [Op.like]: searchTermLike } },
                            ...(lang === 'en' && db.Product.rawAttributes.product_description_vi ? [{ product_description_vi: { [Op.like]: searchTermLike } }] : []), 
                        ];
                    }
                    if (filter.min_price !== undefined || filter.max_price !== undefined) {
                        whereClause.product_price = {};
                        if (filter.min_price !== undefined) whereClause.product_price[Op.gte] = filter.min_price;
                        if (filter.max_price !== undefined) whereClause.product_price[Op.lte] = filter.max_price;
                    }
                    
                    if (filter.size_id || filter.color_id) {
                        const inventoryWhere = {};
                        if (filter.size_id) inventoryWhere.size_id = filter.size_id;
                        if (filter.color_id) inventoryWhere.color_id = filter.color_id;
                        includeClauseForFiltering.push({
                            model: db.Inventory,
                            as: 'inventoryItems', 
                            where: inventoryWhere,
                            required: true, 
                            attributes: [], 
                            duplicating: false 
                        });
                    }
    
                    if (filter.collection_id) {
                        includeClauseForFiltering.push({ 
                            model: db.Collection, 
                            as: 'collections', 
                            where: {collection_id: filter.collection_id}, 
                            required: true, 
                            through: { model: db.ProductCollection, attributes: [] },
                            attributes: [],
                            duplicating: false
                        });
                    }
    
                    if (typeof filter.in_stock === 'boolean') {
                        const stockCondition = filter.in_stock
                            ? sequelize.literal(`EXISTS (SELECT 1 FROM "Inventory" WHERE "Inventory"."product_id" = "Product"."product_id" AND "Inventory"."quantity" > 0)`)
                            : sequelize.literal(`NOT EXISTS (SELECT 1 FROM "Inventory" WHERE "Inventory"."product_id" = "Product"."product_id" AND "Inventory"."quantity" > 0)`);
                        
                        if (whereClause[Op.and]) {
                            whereClause[Op.and].push(stockCondition);
                        } else {
                            whereClause[Op.and] = [stockCondition];
                        }
                    }
                    
                    const { count, rows: productIdsRows } = await db.Product.findAndCountAll({
                        where: whereClause,
                        include: includeClauseForFiltering,
                        attributes: ['product_id'], 
                        limit,
                        offset,
                        order: [[ (lang === 'en' && db.Product.rawAttributes.product_name_en) ? sequelize.col('product_name_en') : sequelize.col('product_name_vi'), 'ASC']],
                        group: ['Product.product_id'], 
                        distinct: true, 
                        subQuery: includeClauseForFiltering.length > 0, 
                    });
                    
                    const totalCount = Array.isArray(count) ? count.length : count;
    
    
                    if (productIdsRows.length === 0) {
                        return { count: totalCount, products: [] };
                    }
                    const productIds = productIdsRows.map(p => p.product_id);
    
                    const productsWithFullDetails = await db.Product.findAll({
                        where: { product_id: { [Op.in]: productIds } },
                        include: [ 
                            { model: db.Category, as: 'category', required: false },
                            { model: db.ProductImage, as: 'images', required: false, order: [['display_order', 'ASC']], include: [{ model: db.Color, as: 'color', required: false }] },
                            { model: db.Inventory, as: 'inventoryItems', required: false, include: [{ model: db.Size, as: 'size', required: false }, { model: db.Color, as: 'colorDetail', required: false }] },
                            { model: db.Collection, as: 'collections', required: false, through: { attributes: [] } }
                        ],
                        order: sequelize.literal(`FIELD("Product"."product_id", ${productIds.map(id => sequelize.escape(id)).join(',')})`) 
                    });
    
                    return { count: totalCount, products: productsWithFullDetails };
                } catch (error) {
                    logger.error("Error fetching products (GraphQL):", error);
                    throw new GraphQLError('Could not fetch products.');
                }
            },
            product: async (_, { id, lang = "vi" }, context) => {
                const { db } = context;
                try {
                    const product = await db.Product.findOne({
                        where: { product_id: id, is_active: true },
                        include: [ 
                            { model: db.Category, as: 'category', required: false },
                            { model: db.Collection, as: 'collections', required: false, through: { attributes: [] } },
                            { model: db.ProductImage, as: 'images', required: false, order: [['display_order', 'ASC']], include: [{model: db.Color, as: 'color', required: false}] },
                            { model: db.Inventory, as: 'inventoryItems', required: false, include: [ { model: db.Size, as: 'size', required: false }, { model: db.Color, as: 'colorDetail', required: false } ] }
                        ]
                    });
                    if (!product) {
                        throw new GraphQLError('Product not found or inactive.', { extensions: { code: 'NOT_FOUND' } });
                    }
                    return product;
                } catch (error) {
                    logger.error(`Error fetching product ID ${id} (GraphQL):`, error);
                    if (error instanceof GraphQLError) throw error;
                    throw new GraphQLError('Could not fetch product details.');
                }
            },
            categories: async (_, { lang = "vi" }, context) => {
                const { db, sequelize } = context;
                try {
                    return await db.Category.findAll({ order: [[ (lang === 'en' && db.Category.rawAttributes.category_name_en) ? sequelize.col('category_name_en') : sequelize.col('category_name_vi'), 'ASC']] });
                } catch (e) {
                    logger.error("Error fetching categories:", e);
                    throw new GraphQLError('Could not fetch categories.');
                }
            },
            collections: async (_, { lang = "vi" }, context) => {
                const { db, sequelize } = context;
                try {
                    return await db.Collection.findAll({ order: [[ (lang === 'en' && db.Collection.rawAttributes.collection_name_en) ? sequelize.col('collection_name_en') : sequelize.col('collection_name_vi'), 'ASC']] });
                } catch (e) {
                    logger.error("Error fetching collections:", e);
                    throw new GraphQLError('Could not fetch collections.');
                }
            },
            sizes: async (_, __, context) => {
                const { db } = context;
                try {
                    return await db.Size.findAll({ order: [['size_name', 'ASC']] });
                } catch (e) {
                    logger.error("Error fetching sizes:", e);
                    throw new GraphQLError('Could not fetch sizes.');
                }
            },
            publicGetAllColors: async (_, { lang }, context) => { // Added lang
                const { db } = context;
                try {
                    // lang argument can be used here if you want to sort by a specific language name,
                    // or if your Color model has language-specific fields.
                    // For now, it sorts by the primary color_name.
                    // If you add color_name_en, color_name_vi to your model, you can sort like:
                    // const orderField = lang === 'en' && db.Color.rawAttributes.color_name_en ? 'color_name_en' : 'color_name';
                    return await db.Color.findAll({ order: [['color_name', 'ASC']] }); 
                } catch (e) {
                    logger.error("Error fetching public colors:", e);
                    throw new GraphQLError('Could not fetch colors.');
                }
            },
            blogPosts: async (_, { filter = {}, limit = 10, offset = 0, lang = "vi" }, context) => {
                const { db, sequelize } = context;
                try {
                    const whereClause = { status: 'published', visibility: 'public' };
                    const includeClause = [
                        { model: db.Customer, as: 'author', attributes: ['customer_id', 'customer_name', 'username'] },
                    ];
                    const tagIncludeForData = { model: db.BlogTag, as: 'tags', through: { attributes: [] }, required: false };
    
                    if (filter.tag_slug) {
                        includeClause.push({
                            model: db.BlogTag,
                            as: 'tags', 
                            where: { slug: filter.tag_slug },
                            required: true, 
                            through: { attributes: [] }
                        });
                    } else {
                         includeClause.push(tagIncludeForData); 
                    }
    
    
                    if (filter.author_id) {
                        whereClause.user_id = filter.author_id;
                    }
                    if (filter.search_term) {
                        const searchTermLike = `%${filter.search_term}%`;
                        const titleField = lang === 'en' ? 'title_en' : 'title_vi';
                        const contentField = lang === 'en' ? 'content_html_en' : 'content_html_vi';
                        whereClause[Op.or] = [
                            { [titleField]: { [Op.like]: searchTermLike } },
                            ...(lang === 'en' && db.BlogPost.rawAttributes.title_vi ? [{ title_vi: { [Op.like]: searchTermLike } }] : []),
                            { [contentField]: { [Op.like]: searchTermLike } },
                            ...(lang === 'en' && db.BlogPost.rawAttributes.content_html_vi ? [{ content_html_vi: { [Op.like]: searchTermLike } }] : []),
                        ];
                    }
    
                    const { count, rows } = await db.BlogPost.findAndCountAll({
                        where: whereClause,
                        include: includeClause,
                        limit,
                        offset,
                        order: [['published_at', 'DESC']],
                        distinct: true, 
                    });
                    const totalCount = Array.isArray(count) ? count.length : count;
                    return { count: totalCount, posts: rows };
                } catch (error) {
                    logger.error("Error fetching blog posts:", error);
                    throw new GraphQLError("Could not fetch blog posts.");
                }
            },
            blogPostBySlug: async (_, { slug, lang = "vi" }, context) => {
                const { db } = context;
                try {
                    const post = await db.BlogPost.findOne({
                        where: { slug, status: 'published', visibility: 'public' },
                        include: [
                            { model: db.Customer, as: 'author', attributes: ['customer_id', 'customer_name', 'username'] },
                            { model: db.BlogTag, as: 'tags', through: { attributes: [] } }
                        ]
                    });
                    if (!post) {
                        throw new GraphQLError("Blog post not found or not public.", { extensions: { code: 'NOT_FOUND' } });
                    }
                    return post;
                } catch (error) {
                    logger.error(`Error fetching blog post by slug ${slug}:`, error);
                    if (error instanceof GraphQLError) throw error;
                    throw new GraphQLError("Could not fetch blog post.");
                }
            },
            blogTags: async (_, { lang = "vi" }, context) => {
                const { db, sequelize } = context;
                try {
                    return await db.BlogTag.findAll({
                        order: [[ (lang === 'en' && db.BlogTag.rawAttributes.name_en) ? sequelize.col('name_en') : sequelize.col('name_vi'), 'ASC']]
                    });
                } catch (error) {
                    logger.error("Error fetching blog tags:", error);
                    throw new GraphQLError("Could not fetch blog tags.");
                }
            },
            blogCommentsByPost: async (_, { post_id, limit = 10, offset = 0 }, context) => {
                const { db } = context;
                try {
                    const { count, rows } = await db.BlogComment.findAndCountAll({
                        where: { post_id, status: 'approved', parent_comment_id: null },
                        include: [ { model: db.Customer, as: 'author', attributes: ['customer_id', 'customer_name', 'username'] } ],
                        order: [['created_at', 'DESC']], 
                        limit,
                        offset
                    });
                    return { count, comments: rows };
                } catch (error) {
                    logger.error(`Error fetching comments for post ${post_id}:`, error);
                    throw new GraphQLError("Could not fetch comments.");
                }
            },
            myProfile: async (_, __, context) => {
                checkAuth(context);
                const { db } = context;
                try {
                    const customer = await db.Customer.findByPk(context.user.id, {
                        attributes: { exclude: ['customer_password', 'password_reset_token', 'password_reset_expires'] }
                    });
                    if (!customer) throw new GraphQLError('Profile not found.', { extensions: { code: 'NOT_FOUND' } });
                    return customer;
                } catch (e) {
                    logger.error("Error fetching myProfile:", e);
                    if (e instanceof GraphQLError) throw e;
                    throw new GraphQLError('Could not fetch profile.');
                }
            },
            mySales: async (_, { limit = 10, offset = 0 }, context) => {
                checkAuth(context);
                const {db} = context;
                try {
                    const {count, rows} = await db.Sale.findAndCountAll({
                        where: {customer_id: context.user.id},
                        limit,
                        offset,
                        order: [['sale_id', 'DESC']], 
                        include: [{model: db.SalesTotals, as: 'totals'}] 
                    });
                    return {count, sales: rows};
                } catch (e) {
                    logger.error("Error fetching mySales:", e);
                    throw new GraphQLError('Could not fetch sales history.');
                }
            },
            mySaleDetail: async (_, { id }, context) => {
                checkAuth(context);
                const {db} = context;
                try {
                    const sale = await db.Sale.findByPk(id, {
                        include: [
                            {model: db.Customer, as: 'customer', attributes: { exclude: ['customer_password', 'password_reset_token', 'password_reset_expires'] }},
                            {model: db.SalesItems, as: 'items', include: [
                                {model: db.Product, as: 'product'},
                                {model: db.Size, as: 'size'},
                                {model: db.Color, as: 'color'}
                            ]},
                            {model: db.SalesTotals, as: 'totals'},
                            {model: db.SalesHistory, as: 'history', order: [['history_date', 'DESC']]}
                        ]
                    });
                    if(!sale || sale.customer_id !== context.user.id) {
                        throw new GraphQLError('Order not found or access denied.', {extensions: {code: 'NOT_FOUND'}});
                    }
                    return sale;
                } catch (e) {
                    logger.error(`Error fetching mySaleDetail for ID ${id}:`, e);
                    if (e instanceof GraphQLError) throw e;
                    throw new GraphQLError('Could not fetch order details.');
                }
            },
            adminDashboardStats: async (_, __, context) => {
                checkAdmin(context);
                const {db, sequelize} = context; 
                try {
                    const totalUsers = await db.Customer.count({where: {isAdmin: false}}); 
                    const salesAgg = await db.SalesTotals.findOne({
                        attributes: [
                            [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalSalesAmount'],
                            [sequelize.fn('COUNT', sequelize.col('sale_id')), 'totalOrders']
                        ],
                        raw: true
                    });
                    return {
                        totalUsers: totalUsers || 0,
                        totalSalesAmount: parseFloat(salesAgg?.totalSalesAmount || 0),
                        totalOrders: parseInt(salesAgg?.totalOrders || 0, 10)
                    };
                } catch (e) {
                    logger.error("Error fetching adminDashboardStats:", e);
                    throw new GraphQLError('Could not fetch dashboard statistics.');
                }
            },
            adminGetAllSales: async (_, { limit = 15, offset = 0, filter = {} }, context) => {
                checkAdmin(context);
                const {db} = context;
                const whereClause = {};
                if(filter.status) whereClause.sale_status = filter.status;
                if(filter.customer_id) whereClause.customer_id = filter.customer_id;
                try {
                    const {count, rows} = await db.Sale.findAndCountAll({
                        where: whereClause,
                        limit,
                        offset,
                        order: [['sale_id', 'DESC']],
                        include: [
                            {model: db.Customer, as: 'customer', attributes: ['customer_id', 'customer_name', 'customer_email']},
                            {model: db.SalesTotals, as: 'totals'}
                        ]
                    });
                    return {count, sales: rows};
                } catch (e) {
                    logger.error("Error in adminGetAllSales:", e);
                    throw new GraphQLError('Could not fetch sales for admin.');
                }
            },
            adminGetSaleDetails: async (_, { id }, context) => {
                checkAdmin(context);
                const {db} = context;
                try {
                    const sale = await db.Sale.findByPk(id, {
                        include: [
                            {model: db.Customer, as: 'customer'},
                            {model: db.SalesItems, as: 'items', include: [
                                {model: db.Product, as: 'product'},
                                {model: db.Size, as: 'size'},
                                {model: db.Color, as: 'color'}
                            ]},
                            {model: db.SalesTotals, as: 'totals'},
                            {model: db.SalesHistory, as: 'history', order: [['history_date', 'DESC']]}
                        ]
                    });
                    if(!sale) throw new GraphQLError('Sale not found.', {extensions: {code: 'NOT_FOUND'}});
                    return sale;
                } catch (e) {
                    logger.error(`Error fetching adminGetSaleDetails for ID ${id}:`, e);
                    if (e instanceof GraphQLError) throw e;
                    throw new GraphQLError('Could not fetch sale details for admin.');
                }
            },
            adminGetAllUsers: async (_, { limit = 20, offset = 0 }, context) => {
                checkAdmin(context);
                const {db} = context;
                try {
                    const {count, rows} = await db.Customer.findAndCountAll({
                        limit,
                        offset,
                        attributes: {exclude: ['customer_password', 'password_reset_token', 'password_reset_expires']},
                        order: [['customer_name', 'ASC']]
                    });
                    return {count, users: rows};
                } catch (e) {
                    logger.error("Error in adminGetAllUsers:", e);
                    throw new GraphQLError('Could not fetch users for admin.');
                }
            },
            adminGetAllProducts: async (_, { filter = {}, limit = 20, offset = 0, lang = "vi" }, context) => {
                checkAdmin(context);
                const { db, sequelize } = context;
                logger.info(`[adminGetAllProducts] Called with filter: ${JSON.stringify(filter)}, limit: ${limit}, offset: ${offset}, lang: ${lang}`);

                try {
                    const whereClause = {};
                    const includeForFiltering = []; 

                    if (typeof filter.is_active === 'boolean') whereClause.is_active = filter.is_active;
                    if (filter.category_id) whereClause.category_id = filter.category_id;
                    if (typeof filter.is_new_arrival === 'boolean') whereClause.is_new_arrival = filter.is_new_arrival;

                    if (filter.search_term) {
                        const searchTermLike = `%${filter.search_term}%`;
                        const nameOrConditions = [
                            { product_name_vi: { [Op.like]: searchTermLike } },
                            { product_name_en: { [Op.like]: searchTermLike } },
                        ];
                        whereClause[Op.or] = nameOrConditions;
                    }

                    if (filter.size_id || filter.color_id) {
                        const inventoryFilterWhere = {};
                        if (filter.size_id) inventoryFilterWhere.size_id = filter.size_id;
                        if (filter.color_id) inventoryFilterWhere.color_id = filter.color_id;
                        includeForFiltering.push({
                            model: db.Inventory,
                            as: 'inventoryItems',
                            where: inventoryFilterWhere,
                            attributes: [], 
                            required: true, 
                        });
                    }

                    if (filter.collection_id) {
                        includeForFiltering.push({
                            model: db.Collection,
                            as: 'collections',
                            where: { collection_id: filter.collection_id },
                            required: true, 
                            through: { attributes: [] }, 
                            attributes: [], 
                        });
                    }

                    // SỬA LỖI: Sử dụng backticks (`) cho định danh trong sequelize.literal cho MySQL
                    if (typeof filter.in_stock === 'boolean') {
                        const stockCondition = filter.in_stock
                            ? sequelize.literal('EXISTS (SELECT 1 FROM `Inventory` WHERE `Inventory`.`product_id` = `Product`.`product_id` AND `Inventory`.`quantity` > 0)')
                            : sequelize.literal('NOT EXISTS (SELECT 1 FROM `Inventory` WHERE `Inventory`.`product_id` = `Product`.`product_id` AND `Inventory`.`quantity` > 0)');
                        
                        if (whereClause[Op.and]) {
                            whereClause[Op.and].push(stockCondition);
                        } else {
                            whereClause[Op.and] = [stockCondition];
                        }
                    }

                    const distinctProductIdsForCount = await db.Product.findAll({
                        where: whereClause,
                        include: includeForFiltering,
                        attributes: [
                            [sequelize.fn('DISTINCT', sequelize.col('Product.product_id')), 'product_id']
                        ],
                        raw: true, 
                    });
                    const totalCount = distinctProductIdsForCount.length;
                    logger.info(`[adminGetAllProducts] Total distinct products found for count: ${totalCount}`);

                    if (totalCount === 0) {
                        return { count: 0, products: [] };
                    }

                    const productIdsResult = await db.Product.findAll({
                        where: whereClause,
                        include: includeForFiltering,
                        attributes: ['product_id'],
                        limit: parseInt(limit, 10),
                        offset: parseInt(offset, 10),
                        order: [['product_id', 'DESC']], 
                        group: ['Product.product_id'],   
                        subQuery: includeForFiltering.length > 0, 
                        raw: true, 
                    });

                    const productIds = productIdsResult.map(p => p.product_id);
                    logger.info(`[adminGetAllProducts] Product IDs for current page: ${JSON.stringify(productIds)}`);

                    if (productIds.length === 0) {
                        return { count: totalCount, products: [] }; 
                    }

                    const productsWithFullDetails = await db.Product.findAll({
                        where: { product_id: { [Op.in]: productIds } },
                        include: [ 
                            { model: db.Category, as: 'category', required: false },
                            {
                                model: db.ProductImage, as: 'images', required: false, order: [['display_order', 'ASC']],
                                include: [{ model: db.Color, as: 'color', required: false }]
                            },
                            {
                                model: db.Inventory, as: 'inventoryItems', required: false,
                                include: [
                                    { model: db.Size, as: 'size', required: false },
                                    { model: db.Color, as: 'colorDetail', required: false }
                                ]
                            },
                            { model: db.Collection, as: 'collections', required: false, through: { attributes: [] } }
                        ],
                        order: sequelize.literal(`FIELD(\`Product\`.\`product_id\`, ${productIds.map(id => sequelize.escape(id)).join(',')})`)
                    });
                    logger.info(`[adminGetAllProducts] Fetched full details for ${productsWithFullDetails.length} products.`);

                    return { count: totalCount, products: productsWithFullDetails };

                } catch (error) {
                    logger.error("[adminGetAllProducts resolver] Error:", error);
                    if (error.parent && error.parent.sql) {
                        logger.error("[adminGetAllProducts resolver] SQL Error:", error.parent.sql);
                        logger.error("[adminGetAllProducts resolver] SQL Message:", error.parent.sqlMessage);
                    }
                    throw new GraphQLError('Could not fetch products for admin.');
                }
            },
            adminGetProductDetails: async (_, { id, lang = "vi" }, context) => {
                checkAdmin(context);
                const { db } = context;
                const product = await db.Product.findByPk(id, {
                    include: [
                        { model: db.Category, as: 'category', required: false },
                        { model: db.Collection, as: 'collections', required: false, through: { attributes: [] } },
                        {
                            model: db.ProductImage, as: 'images', required: false, order: [['display_order', 'ASC']],
                            include: [{ model: db.Color, as: 'color', required: false }] 
                        },
                        {
                            model: db.Inventory, as: 'inventoryItems', required: false, 
                            include: [
                                { model: db.Size, as: 'size', required: false }, 
                                { model: db.Color, as: 'colorDetail', required: false } 
                            ]
                        }
                    ]
                });
                if (!product) throw new GraphQLError('Product not found.', { extensions: { code: 'NOT_FOUND' } });
                return product;
            },
            // MODIFIED: Added lang argument and basic usage example
            adminGetAllColors: async (_, { lang }, context) => { 
                checkAdmin(context);
                const { db } = context;
                try {
                    // Example: If you want to sort by a language-specific name field if it exists
                    // const orderField = lang === 'en' && db.Color.rawAttributes.color_name_en ? 'color_name_en' : 'color_name';
                    // For now, just using the primary name for ordering.
                    // The `lang` variable is now available if you want to use it for filtering or specific logic.
                    return await db.Color.findAll({order: [['color_name', 'ASC']]}); 
                } catch (e) {
                    logger.error("Error fetching admin colors:", e);
                    if (e.name === 'SequelizeDatabaseError' && e.original && e.original.sqlMessage) {
                         logger.error(`SQL Error: ${e.original.sqlMessage}, SQL: ${e.original.sql}`);
                    }
                    throw new GraphQLError('Could not fetch colors for admin.');
                }
            },
            adminGetAllCollections: async (_, { lang = "vi" }, context) => { 
                checkAdmin(context);
                const { db, sequelize } = context;
                try {
                    const orderField = (lang === 'en' && db.Collection.rawAttributes.collection_name_en)
                                        ? sequelize.col('collection_name_en')
                                        : sequelize.col('collection_name_vi');
                    const collections = await db.Collection.findAll({
                        order: [[orderField, 'ASC']]
                    });
                    return collections;
                } catch (e) {
                    logger.error("Error fetching admin collections:", e); 
                    throw new GraphQLError('Could not fetch collections for admin.');
                }
            },
            adminGetAllSizes: async (_, __, context) => { 
                checkAdmin(context);
                const { db } = context;
                try {
                    return await db.Size.findAll({order: [['size_name', 'ASC']]}); 
                } catch (e) {
                    logger.error("Error fetching admin sizes:", e);
                    throw new GraphQLError('Could not fetch sizes for admin.');
                }
            },
            adminGetAllCategories: async (_, { lang = "vi" }, context) => { 
                checkAdmin(context); 
                const { db, sequelize } = context; 
                try { 
                    return await db.Category.findAll({ order: [[ (lang === 'en' && db.Category.rawAttributes.category_name_en) ? sequelize.col('category_name_en') : sequelize.col('category_name_vi'), 'ASC']] }); 
                } catch (e) { 
                    logger.error("Error fetching admin categories:", e); 
                    throw new GraphQLError('Could not fetch categories for admin.'); 
                } 
            },
            adminGetAllBlogPosts: async (_, { filter = {}, limit = 10, offset = 0, lang = "vi" }, context) => {
                checkAdmin(context); 
                const { db, sequelize } = context;
                try {
                    const whereClause = {}; 
                    const includeClause = [ 
                        { model: db.Customer, as: 'author', attributes: ['customer_id', 'customer_name', 'username'] },
                    ];
                    const tagIncludeForData = { model: db.BlogTag, as: 'tags', through: { attributes: [] }, required: false };
    
                    if (filter.status) whereClause.status = filter.status;
                    if (filter.tag_slug) { 
                        const tag = await db.BlogTag.findOne({where: {slug: filter.tag_slug}});
                        if(tag){ 
                            includeClause.push({ model: db.BlogTag, as: 'tags', where: { tag_id: tag.tag_id }, required: true, through: {attributes: []} }); 
                        } else { 
                            return { count: 0, posts: [] }; 
                        }
                    } else { 
                        includeClause.push(tagIncludeForData); 
                    }
                    if (filter.author_id) whereClause.user_id = filter.author_id;
                    if (filter.search_term) { 
                        const searchTermLike = `%${filter.search_term}%`; 
                        whereClause[Op.or] = [ 
                            { title_vi: { [Op.like]: searchTermLike } }, 
                            { title_en: { [Op.like]: searchTermLike } },
                        ]; 
                    }
                    const { count, rows } = await db.BlogPost.findAndCountAll({ 
                        where: whereClause, 
                        include: includeClause, 
                        limit, 
                        offset, 
                        order: [['created_at', 'DESC']], 
                        distinct: true 
                    });
                    const totalCount = Array.isArray(count) ? count.length : count;
                    return { count: totalCount, posts: rows };
                } catch (error) { 
                    logger.error("Error fetching all blog posts for admin:", error); 
                    throw new GraphQLError("Could not fetch blog posts for admin."); 
                }
            },
            adminGetBlogPostById: async (_, { id, lang = "vi" }, context) => {
                checkAdmin(context); 
                const { db } = context;
                try {
                    const post = await db.BlogPost.findByPk(id, { 
                        include: [ 
                            { model: db.Customer, as: 'author', attributes: ['customer_id', 'customer_name', 'username'] }, 
                            { model: db.BlogTag, as: 'tags', through: { attributes: [] } } 
                        ] 
                    });
                    if (!post) throw new GraphQLError("Blog post not found.", { extensions: { code: 'NOT_FOUND' } });
                    return post;
                } catch (error) { 
                    logger.error(`Error fetching blog post by ID ${id} for admin:`, error); 
                    if (error instanceof GraphQLError) throw error; 
                    throw new GraphQLError("Could not fetch blog post for admin."); 
                }
            },
            adminGetAllBlogTags: async (_, { lang = "vi" }, context) => {
                checkAdmin(context); 
                const { db, sequelize } = context;
                try { 
                    return await db.BlogTag.findAll({ order: [[ (lang === 'en' && db.BlogTag.rawAttributes.name_en) ? sequelize.col('name_en') : sequelize.col('name_vi'), 'ASC']] }); 
                } catch (error) { 
                    logger.error("Error fetching blog tags for admin:", error); 
                    throw new GraphQLError("Could not fetch blog tags for admin."); 
                }
            },
            adminGetAllBlogComments: async (_, { post_id, filter_status, limit = 10, offset = 0 }, context) => {
                checkAdmin(context); 
                const { db } = context;
                try {
                    const whereClause = {}; 
                    if (post_id) whereClause.post_id = post_id; 
                    if (filter_status) whereClause.status = filter_status;
                    
                    const { count, rows } = await db.BlogComment.findAndCountAll({ 
                        where: whereClause, 
                        include: [ 
                            { model: db.Customer, as: 'author', attributes: ['customer_id', 'customer_name', 'username'] }, 
                            { model: db.BlogPost, as: 'post', attributes: ['post_id', 'title_vi', 'title_en'] } 
                        ], 
                        order: [['created_at', 'DESC']], 
                        limit, 
                        offset 
                    });
                    return { count, comments: rows };
                } catch (error) { 
                    logger.error("Error fetching all blog comments for admin:", error); 
                    throw new GraphQLError("Could not fetch blog comments for admin."); 
                }
            },
        },
    
        Mutation: {
            register: async (_, { input }, context) => {
                const { db } = context;
                const {username, customer_name, customer_email, customer_password, customer_tel, customer_address} = input;
    
                if(!customer_name || !customer_email || !customer_password || !customer_tel) {
                    throw new GraphQLError('Name, email, password, and phone are required.', {extensions: {code: 'BAD_USER_INPUT'}});
                }
    
                try {
                    const existingEmail = await db.Customer.findOne({where: {customer_email}});
                    if(existingEmail) throw new GraphQLError('Email already exists.', {extensions: {code: 'BAD_USER_INPUT', field: 'customer_email'}});
                    
                    const existingTel = await db.Customer.findOne({where: {customer_tel}});
                    if(existingTel) throw new GraphQLError('Phone number already exists.', {extensions: {code: 'BAD_USER_INPUT', field: 'customer_tel'}});
    
                    if(username){ 
                        const existingUsername = await db.Customer.findOne({where: {username}});
                        if(existingUsername) throw new GraphQLError('Username already exists.', {extensions: {code: 'BAD_USER_INPUT', field: 'username'}});
                    }
    
                    const newCustomer = await db.Customer.create({
                        ...input, 
                        virtual_balance: 2000000, 
                        isAdmin: false
                    });
                    const token = generateToken(newCustomer);
                    const customerData = newCustomer.toJSON();
                    delete customerData.customer_password;
                    delete customerData.password_reset_token;
                    delete customerData.password_reset_expires;
    
                    return {token, ...customerData};
                } catch (error) {
                    logger.error("Registration error:", error);
                    if (error instanceof GraphQLError) throw error;
                    throw new GraphQLError('Registration failed.');
                }
            },
            login: async (_, { identifier, customer_password }, context) => {
                const { db } = context;
                if (!identifier || !customer_password) {
                    throw new GraphQLError('Identifier and password are required.', {extensions: {code: 'BAD_USER_INPUT'}});
                }
                try {
                    const customer = await db.Customer.findOne({
                        where: {[Op.or]: [{customer_email: identifier}, {username: identifier}]}
                    });
                    if(!customer || !(await customer.comparePassword(customer_password))) {
                        throw new GraphQLError('Invalid identifier or password.', {extensions: {code: 'UNAUTHENTICATED'}});
                    }
                    const token = generateToken(customer);
                    const customerData = customer.toJSON();
                    delete customerData.customer_password;
                    delete customerData.password_reset_token;
                    delete customerData.password_reset_expires;
                    return {token, ...customerData};
                } catch (error) {
                    logger.error("Login error:", error);
                    if (error instanceof GraphQLError) throw error;
                    throw new GraphQLError('Login failed.');
                }
            },
            forgotPassword: async (_, { email }, context) => {
                const { db } = context;
                try {
                    const customer = await db.Customer.findOne({where: {customer_email: email}});
                    if(customer){
                        const resetToken = crypto.randomBytes(32).toString('hex');
                        customer.password_reset_token = crypto.createHash('sha256').update(resetToken).digest('hex');
                        customer.password_reset_expires = Date.now() + 10 * 60 * 1000; // 10 minutes
                        await customer.save();
                        logger.info(`Password reset token for ${email}: ${resetToken} (Simulating email send)`);
                        // TODO: Send email with resetToken (actual token, not hashed)
                    }
                    return {success: true, message: 'If your email is registered, you will receive password reset instructions.'};
                } catch (error) {
                    logger.error("Forgot password error:", error);
                    throw new GraphQLError('Error processing forgot password request.');
                }
            },
            resetPassword: async (_, { token, newPassword }, context) => {
                const { db } = context;
                if (!token || !newPassword) {
                    throw new GraphQLError('Token and new password are required.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                try {
                    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
                    const customer = await db.Customer.findOne({
                        where: {
                            password_reset_token: hashedToken,
                            password_reset_expires: {[Op.gt]: Date.now()}
                        }
                    });
                    if(!customer) throw new GraphQLError('Invalid or expired password reset token.', {extensions: {code: 'BAD_USER_INPUT'}});
    
                    customer.customer_password = newPassword; // Hook will hash this
                    customer.password_reset_token = null;
                    customer.password_reset_expires = null;
                    await customer.save();
    
                    const loginToken = generateToken(customer); 
                    const customerData = customer.toJSON();
                    delete customerData.customer_password; 
                    delete customerData.password_reset_token;
                    delete customerData.password_reset_expires;
    
                    return {success: true, message: 'Password has been reset successfully.', token: loginToken, customer: customerData};
                } catch (error) {
                    logger.error("Reset password error:", error);
                    if (error instanceof GraphQLError) throw error;
                    throw new GraphQLError('Failed to reset password.');
                }
            },
            createSale: async (_, { items, shippingInfo = {} }, context) => {
                checkAuth(context);
                const {db, sequelize} = context;
                const customer_id = context.user.id;
    
                if (!items || items.length === 0) {
                    throw new GraphQLError('At least one item is required to create a sale.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
    
                const transaction = await sequelize.transaction();
                try {
                    const customer = await db.Customer.findByPk(customer_id, {transaction, lock: transaction.LOCK.UPDATE});
                    if (!customer) {
                        await transaction.rollback(); 
                        throw new GraphQLError('Customer not found.', { extensions: { code: 'NOT_FOUND' } });
                    }
    
                    let currentVirtualBalance = customer.virtual_balance;
                    let grossTotalAmount = 0;
                    let totalDiscountApplied = 0;
                    const saleItemsData = [];
                    const inventoryUpdates = [];
    
                    for(const itemInput of items){
                        if (!itemInput.product_id || !itemInput.product_qty || itemInput.product_qty <= 0) {
                            throw new Error('Invalid product ID or quantity in sale items.'); 
                        }
                        const product = await db.Product.findByPk(itemInput.product_id, {transaction});
                        if(!product || !product.is_active) throw new Error(`Product with ID ${itemInput.product_id} not found or inactive.`);
    
                        const inventoryRecord = await db.Inventory.findOne({
                            where: {
                                product_id: itemInput.product_id,
                                size_id: itemInput.size_id || null,
                                color_id: itemInput.color_id || null
                            },
                            transaction,
                            lock: transaction.LOCK.UPDATE
                        });
    
                        if(!inventoryRecord || inventoryRecord.quantity < itemInput.product_qty) {
                            throw new Error(`Insufficient stock for product: ${product.product_name_vi} (Variant ID: ${inventoryRecord ? inventoryRecord.inventory_id : 'N/A'}). Requested: ${itemInput.product_qty}, Available: ${inventoryRecord ? inventoryRecord.quantity : 0}.`);
                        }
    
                        inventoryUpdates.push(db.Inventory.decrement('quantity', {
                            by: itemInput.product_qty,
                            where: {inventory_id: inventoryRecord.inventory_id},
                            transaction
                        }));
    
                        let discountForItem = 0;
                        if(currentVirtualBalance > 0){
                            discountForItem = Math.min(100000, currentVirtualBalance); 
                            currentVirtualBalance -= discountForItem;
                            totalDiscountApplied += discountForItem;
                        }
                        saleItemsData.push({
                            product_id: itemInput.product_id,
                            product_qty: itemInput.product_qty,
                            size_id: itemInput.size_id || null,
                            color_id: itemInput.color_id || null,
                            price_at_sale: product.product_price,
                            discount_amount: discountForItem,
                            product_name_at_sale: product.product_name_vi 
                        });
                        grossTotalAmount += product.product_price * itemInput.product_qty;
                    }
    
                    await Promise.all(inventoryUpdates);
    
                    const newSale = await db.Sale.create({
                        customer_id,
                        sale_date: new Date(),
                        sale_status: 'Pending', 
                        shipping_name: shippingInfo.name || customer.customer_name,
                        shipping_phone: shippingInfo.phone || customer.customer_tel,
                        shipping_address: shippingInfo.address || customer.customer_address,
                        shipping_notes: shippingInfo.notes,
                        payment_method: shippingInfo.paymentMethod || 'COD', 
                    }, {transaction});
    
                    saleItemsData.forEach(item => item.sale_id = newSale.sale_id);
                    await db.SalesItems.bulkCreate(saleItemsData, {transaction});
    
                    const finalTotalAmount = grossTotalAmount - totalDiscountApplied;
                    const shippingFee = shippingInfo.fee || 0; 
    
                    await db.SalesTotals.create({
                        sale_id: newSale.sale_id,
                        subtotal_amount: grossTotalAmount,
                        discount_total: totalDiscountApplied,
                        shipping_fee: shippingFee,
                        total_amount: finalTotalAmount + shippingFee
                    }, {transaction});
    
                    customer.virtual_balance = currentVirtualBalance;
                    await customer.save({transaction});
    
                    await db.SalesHistory.create({
                        sale_id: newSale.sale_id,
                        history_date: new Date(),
                        history_status: 'Pending',
                        history_notes: `Sale created. Virtual balance discount: ${totalDiscountApplied.toLocaleString('vi-VN')} VND.`
                    }, {transaction});
    
                    await transaction.commit();
                    return db.Sale.findByPk(newSale.sale_id, {
                        include: [
                            {model:db.Customer, as: 'customer', attributes: { exclude: ['customer_password', 'password_reset_token', 'password_reset_expires'] }},
                            {model:db.SalesItems, as: 'items', include: [
                                {model:db.Product, as: 'product'},
                                {model:db.Size, as: 'size'},
                                {model:db.Color, as: 'color'}
                            ]},
                            {model:db.SalesTotals, as: 'totals'},
                            {model:db.SalesHistory, as: 'history', order: [['history_date', 'DESC']]} 
                        ]
                    });
                } catch(e) {
                    await transaction.rollback();
                    logger.error('Create Sale Error:', e);
                    throw new GraphQLError(e.message || 'Failed to create sale.');
                }
            },
            adminCreateProduct: async (_, { input }, context) => {
                checkAdmin(context);
                const { db, sequelize } = context;
                const transaction = await sequelize.transaction();
                try {
                    const {
                        product_name_vi, product_name_en, product_description_vi, product_description_en,
                        product_price, category_id, collection_ids = [], is_new_arrival = false, is_active = true,
                        color_variants_data = [], general_gallery_images = []
                    } = input;
    
                    if (!product_name_vi || product_name_vi.trim() === '') {
                        await transaction.rollback();
                        throw new GraphQLError('Vietnamese product name is required.', { extensions: { code: 'BAD_USER_INPUT' } });
                    }
                     if (typeof product_price !== 'number' || product_price < 0) {
                        await transaction.rollback();
                        throw new GraphQLError('Product price must be a non-negative number.', { extensions: { code: 'BAD_USER_INPUT' } });
                    }
                    if (!color_variants_data || color_variants_data.length === 0) {
                        await transaction.rollback();
                        throw new GraphQLError('At least one color variant (color_variants_data) is required.', { extensions: { code: 'BAD_USER_INPUT' } });
                    }
                    for (const variant of color_variants_data) {
                        if (!variant.color_id) {
                            await transaction.rollback();
                            throw new GraphQLError(`Color ID is missing for a color variant.`, { extensions: { code: 'BAD_USER_INPUT' } });
                        }
                        if (!variant.inventory_entries || variant.inventory_entries.length === 0) {
                            await transaction.rollback();
                            throw new GraphQLError(`Color variant (Color ID: ${variant.color_id}) must have at least one inventory entry.`, { extensions: { code: 'BAD_USER_INPUT' } });
                        }
                        for (const invEntry of variant.inventory_entries) {
                            if (typeof invEntry.quantity !== 'number' || invEntry.quantity < 0) {
                                await transaction.rollback();
                                throw new GraphQLError(`Invalid quantity for inventory in color variant (Color ID: ${variant.color_id}). Must be a non-negative number.`, { extensions: { code: 'BAD_USER_INPUT' } });
                            }
                        }
                    }
                    for (const img of [...(general_gallery_images || []), ...color_variants_data.flatMap(v => v.variant_specific_images || [])]) {
                        if (!img.image_url || img.image_url.trim() === '') {
                            await transaction.rollback();
                            throw new GraphQLError('Image URL is required for all gallery and variant images.', { extensions: { code: 'BAD_USER_INPUT' } });
                        }
                    }
    
                    const newProduct = await db.Product.create({
                        product_name_vi, product_name_en, product_description_vi, product_description_en,
                        product_price, category_id: category_id || null, is_new_arrival, is_active,
                    }, { transaction });
    
                    for (const variantInput of color_variants_data) {
                        const { color_id: variantColorId, variant_specific_images = [], inventory_entries = [] } = variantInput;
                        if (!variantColorId) continue; 
                        for (const imgInput of variant_specific_images) {
                            await db.ProductImage.create({
                                product_id: newProduct.product_id, color_id: variantColorId, 
                                image_url: imgInput.image_url, alt_text_vi: imgInput.alt_text_vi, 
                                alt_text_en: imgInput.alt_text_en, display_order: imgInput.display_order || 0,
                            }, { transaction });
                        }
                        for (const invInput of inventory_entries) { 
                            await db.Inventory.create({
                                product_id: newProduct.product_id, color_id: variantColorId, 
                                size_id: invInput.size_id || null, quantity: invInput.quantity, sku: invInput.sku,
                            }, { transaction });
                        }
                    }
                    for (const imgInput of general_gallery_images) {
                         await db.ProductImage.create({
                            product_id: newProduct.product_id, color_id: null, 
                            image_url: imgInput.image_url, alt_text_vi: imgInput.alt_text_vi, 
                            alt_text_en: imgInput.alt_text_en, display_order: imgInput.display_order || 0,
                        }, { transaction });
                    }
    
                    if (collection_ids && collection_ids.length > 0) {
                        await newProduct.setCollections(collection_ids, { transaction });
                    }
                    await transaction.commit();
                    
                    return db.Product.findByPk(newProduct.product_id, {
                         include: [ 
                            { model: db.Category, as: 'category', required: false },
                            { model: db.Collection, as: 'collections', required: false, through: { attributes: [] } },
                            { 
                                model: db.ProductImage, as: 'images', required: false, order: [['display_order', 'ASC']],
                                include: [{model: db.Color, as: 'color', required: false}] 
                            },
                            { 
                                model: db.Inventory, as: 'inventoryItems', required: false, 
                                include: [ 
                                    { model: db.Size, as: 'size', required: false }, 
                                    { model: db.Color, as: 'colorDetail', required: false }  
                                ] 
                            }
                        ]
                    });
                } catch (error) {
                    if (transaction.finished !== 'commit' && transaction.finished !== 'rollback') { 
                        await transaction.rollback();
                    }
                    logger.error("[adminCreateProduct resolver] Error:", error);
                    if (error instanceof GraphQLError) throw error;
                    throw new GraphQLError(`Failed to create product. ${error.message || ''}`);
                }
            },
            adminUpdateProduct: async (_, { input }, context) => {
                checkAdmin(context);
                const { db, sequelize } = context;
                const {
                    id: productId, product_name_vi, product_name_en, product_description_vi, product_description_en,
                    product_price, category_id, collection_ids, is_new_arrival, is_active,
                    color_variants_data, general_gallery_images
                } = input;
    
                if (!productId) throw new GraphQLError('Product ID is required for update.', { extensions: { code: 'BAD_USER_INPUT' } });
                
                if (product_price !== undefined && (typeof product_price !== 'number' || product_price < 0)) {
                     throw new GraphQLError('If provided, product price must be a valid non-negative number.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                if (color_variants_data !== undefined) { 
                    if (!color_variants_data || color_variants_data.length === 0) {
                         throw new GraphQLError('If color_variants_data is provided for update, it cannot be empty. To remove all variants, specific logic for deletion or clearing should be used.', { extensions: { code: 'BAD_USER_INPUT' } });
                    }
                    for(const variant of color_variants_data){
                        if(!variant.color_id){
                             throw new GraphQLError(`Color ID is missing for a color variant during update.`, { extensions: { code: 'BAD_USER_INPUT' } });
                        }
                        if(!variant.inventory_entries || variant.inventory_entries.length === 0){
                            throw new GraphQLError(`Color variant (Color ID: ${variant.color_id}) must have at least one inventory entry when updating.`, { extensions: { code: 'BAD_USER_INPUT' } });
                        }
                         for(const invEntry of variant.inventory_entries){
                             if(invEntry.quantity !== undefined && (typeof invEntry.quantity !== 'number' || invEntry.quantity < 0)){
                                 throw new GraphQLError(`Invalid quantity for inventory in color variant (Color ID: ${variant.color_id}) during update. Must be a non-negative number.`, { extensions: { code: 'BAD_USER_INPUT' } });
                             }
                         }
                    }
                }
                if (general_gallery_images !== undefined) {
                    for (const img of general_gallery_images) {
                        if (!img.image_url || img.image_url.trim() === '') {
                            throw new GraphQLError('Image URL is required for all general gallery images during update.', { extensions: { code: 'BAD_USER_INPUT' } });
                        }
                    }
                }
                if (color_variants_data !== undefined) {
                     for (const variant of color_variants_data) {
                        if (variant.variant_specific_images) {
                            for (const img of variant.variant_specific_images) {
                                 if (!img.image_url || img.image_url.trim() === '') {
                                     throw new GraphQLError('Image URL is required for all variant specific images during update.', { extensions: { code: 'BAD_USER_INPUT' } });
                                }
                            }
                        }
                     }
                }
    
                const transaction = await sequelize.transaction();
                try {
                    const product = await db.Product.findByPk(productId, { transaction });
                    if (!product) {
                        await transaction.rollback();
                        throw new GraphQLError('Product not found.', { extensions: { code: 'NOT_FOUND' } });
                    }
    
                    const updateData = {};
                    if (product_name_vi !== undefined) updateData.product_name_vi = product_name_vi;
                    if (product_name_en !== undefined) updateData.product_name_en = product_name_en;
                    if (product_description_vi !== undefined) updateData.product_description_vi = product_description_vi;
                    if (product_description_en !== undefined) updateData.product_description_en = product_description_en;
                    if (product_price !== undefined) updateData.product_price = product_price;
                    if (category_id !== undefined) updateData.category_id = category_id; 
                    if (is_new_arrival !== undefined) updateData.is_new_arrival = is_new_arrival;
                    if (is_active !== undefined) updateData.is_active = is_active;
    
                    if (Object.keys(updateData).length > 0) {
                        await product.update(updateData, { transaction });
                    }
    
                    if (color_variants_data !== undefined || general_gallery_images !== undefined) {
                        await db.ProductImage.destroy({ where: { product_id: productId }, transaction });
                        await db.Inventory.destroy({ where: { product_id: productId }, transaction });
    
                        if (color_variants_data) {
                            for (const variantInput of color_variants_data) {
                                const { color_id, variant_specific_images = [], inventory_entries = [] } = variantInput;
                                if (!color_id) continue; 
    
                                for (const imgInput of variant_specific_images) { 
                                    if (!imgInput.image_url) continue; 
                                    await db.ProductImage.create({ product_id: productId, color_id: color_id, image_url: imgInput.image_url, alt_text_vi: imgInput.alt_text_vi, alt_text_en: imgInput.alt_text_en, display_order: imgInput.display_order || 0, }, { transaction }); 
                                }
                                for (const invInput of inventory_entries) { 
                                    if (invInput.quantity === undefined) continue; 
                                    await db.Inventory.create({ product_id: productId, color_id: color_id, size_id: invInput.size_id || null, quantity: invInput.quantity, sku: invInput.sku, }, { transaction }); 
                                }
                            }
                        }
                        if (general_gallery_images) {
                            for (const imgInput of general_gallery_images) { 
                                if (!imgInput.image_url) continue; 
                                await db.ProductImage.create({ product_id: productId, color_id: null, image_url: imgInput.image_url, alt_text_vi: imgInput.alt_text_vi, alt_text_en: imgInput.alt_text_en, display_order: imgInput.display_order || 0, }, { transaction }); 
                            }
                        }
                    }
    
                    if (collection_ids !== undefined) { 
                        await product.setCollections(collection_ids, { transaction });
                    }
    
                    await transaction.commit();
                    return db.Product.findByPk(productId, { 
                         include: [
                            {model: db.Category, as: 'category', required: false}, 
                            {model: db.ProductImage, as: 'images', required: false, include: [{model: db.Color, as: 'color', required: false}]}, 
                            {model: db.Inventory, as: 'inventoryItems', required: false, include: [{model: db.Size, as: 'size', required: false},{model: db.Color, as: 'colorDetail', required: false}]}, 
                            {model: db.Collection, as: 'collections', required: false, through: {attributes:[]}}
                        ]  
                    });
                } catch (error) {
                    await transaction.rollback();
                    logger.error(`[adminUpdateProduct GraphQL Error ID: ${productId}]:`, error);
                    if (error instanceof GraphQLError) throw error;
                    throw new GraphQLError(`Failed to update product. ${error.message}`, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
                }
            },
            adminDeleteProduct: async (_, { id }, context) => {
                checkAdmin(context);
                const {db, sequelize} = context;
                const transaction = await sequelize.transaction();
                try {
                    const product = await db.Product.findByPk(id, {transaction});
                    if(!product) {
                        await transaction.rollback();
                        throw new GraphQLError('Product not found.', { extensions: { code: 'NOT_FOUND' }});
                    }
                    await db.SalesItems.update({product_id: null}, {where: {product_id: id}, transaction});
                    await product.destroy({transaction}); 
                    await transaction.commit();
                    return true;
                } catch(e){
                    await transaction.rollback();
                    logger.error(`Error deleting product ID ${id}:`, e);
                    throw new GraphQLError('Failed to delete product. It might be referenced elsewhere or an internal error occurred.');
                }
            },
            adminUpdateSaleStatus: async (_, { saleId, status, notes }, context) => {
                checkAdmin(context);
                const {db, sequelize} = context;
                const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Completed', 'Cancelled']; 
                if (!allowedStatuses.includes(status)) {
                    throw new GraphQLError('Invalid sale status provided.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
    
                const transaction = await sequelize.transaction();
                try {
                    const sale = await db.Sale.findByPk(saleId, {
                        include:[{model: db.SalesItems, as: 'items'}], 
                        transaction
                    });
                    if(!sale) {
                        await transaction.rollback();
                        throw new GraphQLError('Sale not found.', { extensions: { code: 'NOT_FOUND' }});
                    }
                    const oldStatus = sale.sale_status;
                    if(oldStatus === status) { 
                        await transaction.rollback();
                        return db.Sale.findByPk(saleId, {
                            include: [
                                {model: db.Customer, as: 'customer'},
                                {model: db.SalesItems, as: 'items', include:[{model: db.Product, as: 'product'}, {model: db.Size, as: 'size'}, {model: db.Color, as: 'color'}]},
                                {model: db.SalesTotals, as: 'totals'},
                                {model: db.SalesHistory, as: 'history', order: [['history_date', 'DESC']]}
                            ]
                        });
                    }
                    sale.sale_status = status;
                    await sale.save({transaction});
    
                    await db.SalesHistory.create({
                        sale_id:saleId,
                        history_date: new Date(),
                        history_status: status,
                        history_notes: notes || `Status changed from ${oldStatus} to ${status} by admin.`
                    }, {transaction});
    
                    if(status === 'Cancelled' && ['Pending', 'Processing', 'Shipped', 'Delivered', 'Completed'].includes(oldStatus)){
                        if(sale.items && sale.items.length > 0){
                            for(const item of sale.items){
                                if (item.product_id) { 
                                    await db.Inventory.increment('quantity', {
                                        by: item.product_qty,
                                        where: {
                                            product_id: item.product_id,
                                            size_id: item.size_id || null,
                                            color_id: item.color_id || null
                                        },
                                        transaction
                                    });
                                }
                            }
                            logger.info(`Stock restored for cancelled sale ID: ${saleId}`);
                        }
                    }
                    await transaction.commit();
                    return db.Sale.findByPk(saleId, {
                        include: [
                            {model: db.Customer, as: 'customer'},
                            {model: db.SalesItems, as: 'items', include:[{model: db.Product, as: 'product'}, {model: db.Size, as: 'size'}, {model: db.Color, as: 'color'}]},
                            {model: db.SalesTotals, as: 'totals'},
                            {model: db.SalesHistory, as: 'history', order: [['history_date', 'DESC']]}
                        ]
                    });
                } catch(e) {
                    await transaction.rollback();
                    logger.error(`Error updating sale status for ID ${saleId}:`, e);
                    throw new GraphQLError('Failed to update sale status.');
                }
            },
            adminCreateCategory: async (_, { input }, context) => {
                checkAdmin(context);
                const { db } = context;
                const { category_name_vi, category_name_en } = input;
                if (!category_name_vi || category_name_vi.trim() === '') {
                    throw new GraphQLError('Vietnamese category name is required.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                try {
                    return await db.Category.create({ category_name_vi: category_name_vi.trim(), category_name_en: category_name_en ? category_name_en.trim() : null });
                } catch (e) {
                    if(e.name === 'SequelizeUniqueConstraintError') {
                        const field = e.fields && Object.keys(e.fields)[0]; 
                        throw new GraphQLError(`A category with this name (${field || 'VI or EN'}) already exists.`);
                    }
                    logger.error("Admin Create Category Error:", e);
                    throw new GraphQLError('Failed to create category.');
                }
            },
            adminUpdateCategory: async (_, { id, input }, context) => {
                checkAdmin(context);
                const { db } = context;
                const { category_name_vi, category_name_en } = input;
                if (Object.keys(input).length === 0) {
                     throw new GraphQLError('No update data provided for category.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                if (category_name_vi !== undefined && category_name_vi.trim() === '') {
                     throw new GraphQLError('Vietnamese category name cannot be empty if provided.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
    
                try {
                    const category = await db.Category.findByPk(id);
                    if (!category) throw new GraphQLError('Category not found.', { extensions: { code: 'NOT_FOUND' } });
    
                    if (category_name_vi !== undefined) category.category_name_vi = category_name_vi.trim();
                    if (category_name_en !== undefined) category.category_name_en = category_name_en ? category_name_en.trim() : null;
                    
                    await category.save();
                    return category;
                } catch (e) {
                    if(e.name === 'SequelizeUniqueConstraintError') {
                        const field = e.fields && Object.keys(e.fields)[0];
                        throw new GraphQLError(`Another category with this name (${field || 'VI or EN'}) already exists.`);
                    }
                    logger.error(`Error updating category ID ${id}:`, e);
                    throw new GraphQLError('Failed to update category.');
                }
            },
            adminDeleteCategory: async (_, { id }, context) => {
                checkAdmin(context);
                const {db, sequelize} = context;
                const transaction = await sequelize.transaction();
                try{
                    const category = await db.Category.findByPk(id, {transaction});
                    if(!category) {
                        await transaction.rollback();
                        throw new GraphQLError('Category not found.', { extensions: { code: 'NOT_FOUND' }});
                    }
                    await db.Product.update({category_id: null}, {where: {category_id: id}, transaction});
                    await category.destroy({transaction});
                    await transaction.commit();
                    return true;
                } catch(e){
                    await transaction.rollback();
                    logger.error(`Error deleting category ID ${id}:`, e);
                    throw new GraphQLError('Failed to delete category. It might be in use or another error occurred.');
                }
            },
            adminCreateSize: async (_, { name }, context) => {
                checkAdmin(context);
                const {db} = context;
                if(!name || name.trim() === '') throw new GraphQLError('Size name is required.', { extensions: { code: 'BAD_USER_INPUT' }});
                try {
                    return await db.Size.create({size_name: name.trim()});
                } catch(e){
                    if(e.name === 'SequelizeUniqueConstraintError') throw new GraphQLError('Size name already exists.');
                    logger.error("Admin Create Size Error:", e);
                    throw new GraphQLError('Failed to create size.');
                }
            },
            adminUpdateSize: async (_, { id, name }, context) => {
                checkAdmin(context);
                const {db} = context;
                if(!name || name.trim() === '') throw new GraphQLError('Size name is required for update.', { extensions: { code: 'BAD_USER_INPUT' }});
                try {
                    const size = await db.Size.findByPk(id);
                    if(!size) throw new GraphQLError('Size not found.', { extensions: { code: 'NOT_FOUND' }});
                    size.size_name = name.trim();
                    await size.save();
                    return size;
                } catch(e){
                    if(e.name === 'SequelizeUniqueConstraintError') throw new GraphQLError('Another size with this name already exists.');
                    logger.error(`Error updating size ID ${id}:`, e);
                    throw new GraphQLError('Failed to update size.');
                }
            },
            adminDeleteSize: async (_, { id }, context) => {
                checkAdmin(context);
                const {db, sequelize} = context;
                const transaction = await sequelize.transaction();
                try{
                    const size = await db.Size.findByPk(id, {transaction});
                    if(!size) {
                        await transaction.rollback();
                        throw new GraphQLError('Size not found.', { extensions: { code: 'NOT_FOUND' }});
                    }
                    await db.Inventory.update({size_id: null}, {where: {size_id: id}, transaction});
                    await db.SalesItems.update({size_id: null}, {where: {size_id: id}, transaction});
                    await size.destroy({transaction});
                    await transaction.commit();
                    return true;
                } catch(e){
                    await transaction.rollback();
                    logger.error(`Error deleting size ID ${id}:`, e);
                    throw new GraphQLError('Failed to delete size. It might be in use or another error occurred.');
                }
            },
            adminCreateColor: async (_, { input }, context) => {
                checkAdmin(context);
                const { db } = context;
                const { color_name, color_name_en, color_hex } = input; 
    
                if (!color_name || color_name.trim() === '') {
                    throw new GraphQLError('Color name (Vietnamese) is required.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                if (color_hex && !/^#([0-9A-F]{3}){1,2}$/i.test(color_hex.trim())) {
                     throw new GraphQLError('Invalid hex color format. Use #RRGGBB or #RGB.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                try {
                    return await db.Color.create({
                        color_name: color_name.trim(), 
                        color_name_en: color_name_en ? color_name_en.trim() : null,
                        color_hex: color_hex ? color_hex.trim().toUpperCase() : null
                    });
                } catch (e) {
                    if (e.name === 'SequelizeUniqueConstraintError') {
                        const field = e.fields && Object.keys(e.fields)[0];
                        let userFriendlyField = field === 'color_hex' ? 'HEX code' : (field === 'color_name_en' ? 'English color name' : 'color name');
                        throw new GraphQLError(`Color with this ${userFriendlyField} already exists.`);
                    }
                    logger.error("Admin Create Color Error:", e);
                    throw new GraphQLError('Failed to create color.');
                }
            },
            adminUpdateColor: async (_, { id, input }, context) => {
                checkAdmin(context);
                const { db } = context;
                const { color_name, color_name_en, color_hex } = input;
    
                if (Object.keys(input).length === 0) {
                     throw new GraphQLError('No update data provided for color.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                if (color_name !== undefined && color_name.trim() === '') {
                     throw new GraphQLError('Color name (Vietnamese) cannot be empty if provided.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                if (color_hex && color_hex !== null && !/^#([0-9A-F]{3}){1,2}$/i.test(color_hex.trim())) {
                     throw new GraphQLError('Invalid hex color format. Use #RRGGBB or #RGB.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
    
                try {
                    const color = await db.Color.findByPk(id);
                    if (!color) throw new GraphQLError('Color not found.', { extensions: { code: 'NOT_FOUND' } });
    
                    if (color_name !== undefined) color.color_name = color_name.trim();
                    if (color_name_en !== undefined) color.color_name_en = color_name_en ? color_name_en.trim() : null;
                    if (color_hex !== undefined) color.color_hex = color_hex ? color_hex.trim().toUpperCase() : null;
                    
                    await color.save();
                    return color;
                } catch (e) {
                    if (e.name === 'SequelizeUniqueConstraintError') {
                        const field = e.fields && Object.keys(e.fields)[0];
                        let userFriendlyField = field === 'color_hex' ? 'HEX code' : (field === 'color_name_en' ? 'English color name' : 'color name');
                        throw new GraphQLError(`Another color with this ${userFriendlyField} already exists.`);
                    }
                    logger.error(`Error updating color ID ${id}:`, e);
                    throw new GraphQLError('Failed to update color.');
                }
            },
            adminDeleteColor: async (_, { id }, context) => {
                checkAdmin(context);
                const {db, sequelize} = context;
                const transaction = await sequelize.transaction();
                try{
                    const color = await db.Color.findByPk(id, {transaction});
                    if(!color) {
                        await transaction.rollback();
                        throw new GraphQLError('Color not found.', { extensions: { code: 'NOT_FOUND' }});
                    }
                    await db.Inventory.update({color_id: null}, {where: {color_id: id}, transaction});
                    await db.ProductImage.update({color_id: null}, {where: {color_id: id}, transaction});
                    await db.SalesItems.update({color_id: null}, {where: {color_id: id}, transaction});
                    await color.destroy({transaction});
                    await transaction.commit();
                    return true;
                } catch(e){
                    await transaction.rollback();
                    logger.error(`Error deleting color ID ${id}:`, e);
                    throw new GraphQLError('Failed to delete color. It might be in use or another error occurred.');
                }
            },
            adminCreateCollection: async (_, { input }, context) => {
                checkAdmin(context);
                const { db } = context;
                const { collection_name_vi, collection_name_en, collection_description_vi, collection_description_en, slug } = input;
                if (!collection_name_vi || collection_name_vi.trim() === '') {
                    throw new GraphQLError('Vietnamese collection name is required.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                try {
                    const finalSlug = await generateSlug(slug || collection_name_vi, db.Collection, slug, 'collection_id', null, context);
                    return await db.Collection.create({ 
                        collection_name_vi: collection_name_vi.trim(), 
                        collection_name_en: collection_name_en ? collection_name_en.trim() : null, 
                        collection_description_vi: collection_description_vi, 
                        collection_description_en: collection_description_en, 
                        slug: finalSlug 
                    });
                } catch (e) {
                    if(e.name === 'SequelizeUniqueConstraintError') { 
                        const field = e.fields && Object.keys(e.fields)[0];
                        throw new GraphQLError(`Collection ${field || 'name or slug'} already exists.`);
                    }
                    logger.error("Admin Create Collection Error:", e);
                    throw new GraphQLError('Failed to create collection.');
                }
            },
            adminUpdateCollection: async (_, { id, input }, context) => {
                checkAdmin(context);
                const { db } = context;
                const { collection_name_vi, collection_name_en, collection_description_vi, collection_description_en, slug: inputSlug } = input;
                if (Object.keys(input).length === 0) {
                     throw new GraphQLError('No update data provided for collection.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                if (collection_name_vi !== undefined && collection_name_vi.trim() === '') {
                     throw new GraphQLError('Vietnamese collection name cannot be empty if provided.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                try {
                    const collection = await db.Collection.findByPk(id);
                    if (!collection) throw new GraphQLError('Collection not found.', { extensions: { code: 'NOT_FOUND' } });
    
                    const updateData = {};
                    if(collection_name_vi !== undefined) updateData.collection_name_vi = collection_name_vi.trim();
                    if(collection_name_en !== undefined) updateData.collection_name_en = collection_name_en ? collection_name_en.trim() : null;
                    if(collection_description_vi !== undefined) updateData.collection_description_vi = collection_description_vi;
                    if(collection_description_en !== undefined) updateData.collection_description_en = collection_description_en;
                    
                    if(inputSlug && inputSlug.trim() !== collection.slug) {
                        updateData.slug = await generateSlug(inputSlug.trim(), db.Collection, inputSlug.trim(), 'collection_id', id, context);
                    } else if (!inputSlug && collection_name_vi && collection_name_vi.trim() !== collection.collection_name_vi) {
                        updateData.slug = await generateSlug(collection_name_vi.trim(), db.Collection, null, 'collection_id', id, context);
                    }
                    
                    if (Object.keys(updateData).length > 0) {
                        await collection.update(updateData);
                    }
                    return collection;
                } catch (e) {
                    if(e.name === 'SequelizeUniqueConstraintError') {
                        const field = e.fields && Object.keys(e.fields)[0];
                        throw new GraphQLError(`Another collection with this ${field || 'name or slug'} already exists.`);
                    }
                    logger.error(`Error updating collection ID ${id}:`, e);
                    throw new GraphQLError('Failed to update collection.');
                }
            },
            adminDeleteCollection: async (_, { id }, context) => {
                checkAdmin(context);
                const {db, sequelize} = context;
                const transaction = await sequelize.transaction();
                try{
                    const collection = await db.Collection.findByPk(id, {transaction});
                    if(!collection) {
                        await transaction.rollback();
                        throw new GraphQLError('Collection not found.', { extensions: { code: 'NOT_FOUND' }});
                    }
                    await db.ProductCollection.destroy({where: {collection_id: id}, transaction});
                    await collection.destroy({transaction});
                    await transaction.commit();
                    return true;
                } catch(e){
                    await transaction.rollback();
                    logger.error(`Error deleting collection ID ${id}:`, e);
                    throw new GraphQLError('Failed to delete collection.');
                }
            },
            adminCreateBlogPost: async (_, { input }, context) => {
                checkAdmin(context);
                const { db, sequelize } = context;
                const author_id = context.user.id; 
                const {
                    title_vi, title_en, excerpt_vi, excerpt_en, content_html_vi, content_html_en,
                    meta_title_vi, meta_title_en, meta_description_vi, meta_description_en,
                    slug: inputSlug, featured_image_url, status = 'draft', visibility = 'public',
                    allow_comments = true, template_key, tag_ids = []
                } = input;
    
                if (!title_vi || title_vi.trim() === '' || !content_html_vi || content_html_vi.trim() === '') {
                    throw new GraphQLError("Vietnamese title and content are required for a blog post.", { extensions: { code: 'BAD_USER_INPUT' } });
                }
    
                const transaction = await sequelize.transaction();
                try {
                    const finalSlug = await generateSlug(inputSlug || title_vi, db.BlogPost, inputSlug, 'post_id', null, context);
    
                    const newPost = await db.BlogPost.create({
                        user_id: author_id, title_vi, title_en, excerpt_vi, excerpt_en, content_html_vi, content_html_en,
                        meta_title_vi, meta_title_en, meta_description_vi, meta_description_en,
                        slug: finalSlug, featured_image_url, status, visibility, allow_comments, template_key,
                        published_at: status === 'published' ? new Date() : null
                    }, { transaction });
    
                    if (tag_ids && tag_ids.length > 0) {
                        await newPost.setTags(tag_ids, { transaction });
                    }
    
                    await transaction.commit();
                    return db.BlogPost.findByPk(newPost.post_id, { 
                        include: [
                            {model: db.Customer, as: 'author', attributes: ['customer_id', 'customer_name', 'username']}, 
                            {model: db.BlogTag, as: 'tags', through: {attributes: []} }
                        ]
                    });
                } catch (error) {
                    await transaction.rollback();
                    logger.error("Error creating blog post:", error);
                    if (error.name === 'SequelizeUniqueConstraintError' && error.fields && (error.fields.slug || (error.fields.PRIMARY && error.original?.constraint === 'BlogPost_slug_key'))) { 
                        throw new GraphQLError("Slug already exists. Please provide a unique slug or leave it blank to auto-generate.", { extensions: { code: 'BAD_USER_INPUT' } });
                    }
                    throw new GraphQLError("Failed to create blog post.");
                }
            },
            adminUpdateBlogPost: async (_, { id, input }, context) => {
                checkAdmin(context);
                const { db, sequelize } = context;
                const {
                    title_vi, title_en, excerpt_vi, excerpt_en, content_html_vi, content_html_en,
                    meta_title_vi, meta_title_en, meta_description_vi, meta_description_en,
                    slug: inputSlug, featured_image_url, status, visibility,
                    allow_comments, template_key, tag_ids
                } = input;
                if (Object.keys(input).length === 0) {
                     throw new GraphQLError('No update data provided for blog post.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                if ((title_vi !== undefined && title_vi.trim() === '') || (content_html_vi !== undefined && content_html_vi.trim() === '')) {
                     throw new GraphQLError('Vietnamese title and content cannot be empty if provided.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
    
                const transaction = await sequelize.transaction();
                try {
                    const post = await db.BlogPost.findByPk(id, { transaction });
                    if (!post) {
                        await transaction.rollback();
                        throw new GraphQLError("Blog post not found.", { extensions: { code: 'NOT_FOUND' } });
                    }
    
                    const updateData = {};
                    if (title_vi !== undefined) updateData.title_vi = title_vi;
                    if (title_en !== undefined) updateData.title_en = title_en;
                    if (excerpt_vi !== undefined) updateData.excerpt_vi = excerpt_vi;
                    if (excerpt_en !== undefined) updateData.excerpt_en = excerpt_en;
                    if (content_html_vi !== undefined) updateData.content_html_vi = content_html_vi;
                    if (content_html_en !== undefined) updateData.content_html_en = content_html_en;
                    if (meta_title_vi !== undefined) updateData.meta_title_vi = meta_title_vi;
                    if (meta_title_en !== undefined) updateData.meta_title_en = meta_title_en;
                    if (meta_description_vi !== undefined) updateData.meta_description_vi = meta_description_vi;
                    if (meta_description_en !== undefined) updateData.meta_description_en = meta_description_en;
                    if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url;
                    if (status !== undefined) {
                        updateData.status = status;
                        if (status === 'published' && post.status !== 'published') {
                            updateData.published_at = new Date();
                        } 
                    }
                    if (visibility !== undefined) updateData.visibility = visibility;
                    if (allow_comments !== undefined) updateData.allow_comments = allow_comments;
                    if (template_key !== undefined) updateData.template_key = template_key;
    
                    if (inputSlug && inputSlug.trim() !== post.slug) {
                        updateData.slug = await generateSlug(inputSlug, db.BlogPost, inputSlug, 'post_id', id, context);
                    } else if (!inputSlug && title_vi && title_vi.trim() !== post.title_vi) { 
                        updateData.slug = await generateSlug(title_vi, db.BlogPost, null, 'post_id', id, context);
                    }
                    
                    if (Object.keys(updateData).length > 0) {
                        await post.update(updateData, { transaction });
                    }
    
                    if (tag_ids !== undefined) { 
                        await post.setTags(tag_ids, { transaction });
                    }
    
                    await transaction.commit();
                    return db.BlogPost.findByPk(id, { include: [{model: db.Customer, as: 'author'}, {model: db.BlogTag, as: 'tags', through: {attributes:[]}}]});
                } catch (error) {
                    await transaction.rollback();
                    logger.error(`Error updating blog post ${id}:`, error);
                     if (error.name === 'SequelizeUniqueConstraintError' && error.fields && (error.fields.slug || (error.fields.PRIMARY && error.original?.constraint === 'BlogPost_slug_key'))) {
                        throw new GraphQLError("Slug already exists. Please provide a unique slug or leave it blank to auto-generate.", { extensions: { code: 'BAD_USER_INPUT' } });
                    }
                    throw new GraphQLError("Failed to update blog post.");
                }
            },
            adminDeleteBlogPost: async (_, { id }, context) => {
                checkAdmin(context);
                const { db, sequelize } = context;
                const transaction = await sequelize.transaction();
                try {
                    const post = await db.BlogPost.findByPk(id, {transaction});
                    if (!post) { await transaction.rollback(); throw new GraphQLError("Blog post not found.", { extensions: { code: 'NOT_FOUND' } });}
                    await post.destroy({transaction});
                    await transaction.commit();
                    return true;
                } catch (error) {
                    await transaction.rollback();
                    logger.error(`Error deleting blog post ${id}:`, error);
                    throw new GraphQLError("Failed to delete blog post.");
                }
            },
            adminCreateBlogTag: async (_, { input }, context) => {
                checkAdmin(context);
                const { db } = context;
                const { name_vi, name_en, slug: inputSlug } = input;
                if (!name_vi || name_vi.trim() === '') throw new GraphQLError("Vietnamese tag name is required.", { extensions: { code: 'BAD_USER_INPUT' } });
                try {
                    const finalSlug = await generateSlug(inputSlug || name_vi, db.BlogTag, inputSlug, 'tag_id', null, context);
                    return await db.BlogTag.create({ name_vi: name_vi.trim(), name_en: name_en ? name_en.trim() : null, slug: finalSlug });
                } catch (error) { 
                    if (error.name === 'SequelizeUniqueConstraintError') {
                        const field = error.fields && Object.keys(error.fields)[0];
                        throw new GraphQLError(`Blog tag ${field || 'name or slug'} already exists.`, { extensions: { code: 'BAD_USER_INPUT' } });
                    }
                    logger.error("Admin Create Blog Tag Error:", error);
                    throw new GraphQLError("Failed to create blog tag."); 
                }
            },
            adminUpdateBlogTag: async (_, { id, input }, context) => {
                checkAdmin(context);
                const { db } = context;
                const { name_vi, name_en, slug: inputSlug } = input;
                if (Object.keys(input).length === 0) {
                     throw new GraphQLError('No update data provided for blog tag.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                if (name_vi !== undefined && name_vi.trim() === '') {
                     throw new GraphQLError('Vietnamese tag name cannot be empty if provided.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                try {
                    const tag = await db.BlogTag.findByPk(id);
                    if (!tag) throw new GraphQLError("Blog tag not found.", { extensions: { code: 'NOT_FOUND' } });
                    
                    const updateData = {};
                    if(name_vi !== undefined) updateData.name_vi = name_vi.trim();
                    if(name_en !== undefined) updateData.name_en = name_en ? name_en.trim() : null;
                    if (inputSlug && inputSlug.trim() !== tag.slug) {
                        updateData.slug = await generateSlug(inputSlug, db.BlogTag, inputSlug, 'tag_id', id, context);
                    } else if (!inputSlug && name_vi && name_vi.trim() !== tag.name_vi) {
                        updateData.slug = await generateSlug(name_vi, db.BlogTag, null, 'tag_id', id, context);
                    }
    
                    if (Object.keys(updateData).length > 0) {
                        await tag.update(updateData);
                    }
                    return tag;
                } catch (error) { 
                     if (error.name === 'SequelizeUniqueConstraintError') {
                        const field = error.fields && Object.keys(error.fields)[0];
                        throw new GraphQLError(`Another blog tag with this ${field || 'name or slug'} already exists.`, { extensions: { code: 'BAD_USER_INPUT' } });
                    }
                    logger.error(`Error updating blog tag ID ${id}:`, error);
                    throw new GraphQLError("Failed to update blog tag."); 
                }
            },
            adminDeleteBlogTag: async (_, { id }, context) => {
                checkAdmin(context);
                const { db, sequelize } = context;
                const transaction = await sequelize.transaction();
                try {
                    const tag = await db.BlogTag.findByPk(id, {transaction});
                    if (!tag) { await transaction.rollback(); throw new GraphQLError("Blog tag not found.", { extensions: { code: 'NOT_FOUND' } });}
                    await tag.destroy({transaction});
                    await transaction.commit();
                    return true;
                } catch (error) {
                    await transaction.rollback();
                    logger.error(`Error deleting blog tag ${id}:`, error);
                    throw new GraphQLError("Failed to delete blog tag.");
                }
            },
            adminApproveBlogComment: async (_, { comment_id }, context) => {
                checkAdmin(context);
                const { db } = context;
                try {
                    const comment = await db.BlogComment.findByPk(comment_id);
                    if (!comment) throw new GraphQLError("Comment not found.", { extensions: { code: 'NOT_FOUND' } });
                    comment.status = 'approved';
                    await comment.save();
                    return db.BlogComment.findByPk(comment_id, {include: [{model: db.Customer, as: 'author', attributes: ['customer_id', 'customer_name', 'username']}]});
                } catch (error) { 
                    logger.error(`Error approving comment ID ${comment_id}:`, error);
                    throw new GraphQLError("Failed to approve comment."); 
                }
            },
            adminRejectBlogComment: async (_, { comment_id }, context) => {
                checkAdmin(context);
                const { db } = context;
                try {
                    const comment = await db.BlogComment.findByPk(comment_id);
                    if (!comment) throw new GraphQLError("Comment not found.", { extensions: { code: 'NOT_FOUND' } });
                    comment.status = 'rejected';
                    await comment.save();
                    return db.BlogComment.findByPk(comment_id, {include: [{model: db.Customer, as: 'author', attributes: ['customer_id', 'customer_name', 'username']}]});
                } catch (error) { 
                    logger.error(`Error rejecting comment ID ${comment_id}:`, error);
                    throw new GraphQLError("Failed to reject comment."); 
                }
            },
            adminDeleteBlogComment: async (_, { comment_id }, context) => {
                checkAdmin(context);
                const { db } = context;
                try {
                    const comment = await db.BlogComment.findByPk(comment_id);
                    if (!comment) throw new GraphQLError("Comment not found.", { extensions: { code: 'NOT_FOUND' } });
                    await db.BlogComment.destroy({ where: { parent_comment_id: comment_id } }); 
                    await comment.destroy();
                    return true;
                } catch (error) { 
                    logger.error(`Error deleting comment ID ${comment_id}:`, error);
                    throw new GraphQLError("Failed to delete comment."); 
                }
            },
            createBlogComment: async (_, { input }, context) => {
                checkAuth(context); 
                const { db } = context;
                const user_id = context.user.id;
                const { post_id, parent_comment_id, content } = input;
    
                if (!content || content.trim() === "") {
                    throw new GraphQLError("Comment content cannot be empty.", { extensions: { code: 'BAD_USER_INPUT' } });
                }
                if (!post_id) {
                     throw new GraphQLError("Post ID is required to comment.", { extensions: { code: 'BAD_USER_INPUT' } });
                }
                try {
                    const postExists = await db.BlogPost.findOne({
                        where: {post_id: post_id, status: 'published', visibility: 'public', allow_comments: true }
                    });
                    if (!postExists) {
                        throw new GraphQLError("Cannot comment on this post (it may not exist, not be published, or not allow comments).", { extensions: { code: 'BAD_REQUEST' } });
                    }
                    if (parent_comment_id) { 
                        const parentCommentExists = await db.BlogComment.findOne({
                            where: {comment_id: parent_comment_id, post_id: post_id, status: 'approved'}
                        });
                        if(!parentCommentExists) throw new GraphQLError("Parent comment not found, not approved, or does not belong to this post.", { extensions: { code: 'BAD_REQUEST' } });
                    }
    
                    const newComment = await db.BlogComment.create({
                        post_id, user_id, 
                        parent_comment_id: parent_comment_id || null, 
                        content: content.trim(),
                        status: 'approved' 
                    });
                    return db.BlogComment.findByPk(newComment.comment_id, {
                        include: [{model: db.Customer, as: 'author', attributes: ['customer_id', 'customer_name', 'username']}]
                    });
                } catch (error) {
                    logger.error("Error creating blog comment:", error);
                    if(error instanceof GraphQLError) throw error;
                    throw new GraphQLError("Failed to create comment.");
                }
            },
        },
    };
    
    module.exports = resolvers;