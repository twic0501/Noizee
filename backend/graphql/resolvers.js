// backend/graphql/resolvers.js
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');
const crypto = require('crypto');
const { GraphQLError, GraphQLScalarType, Kind } = require('graphql');
const { Op, where, sequelize: SequelizeInstance } = require('sequelize'); // Import sequelize instance
const logger = require('../utils/logger');
// Assuming date-fns is installed: npm install date-fns
const { parseISO, isValid, format: formatDateFns } = require('date-fns');

// Helper function to create a stable cache key from a filter object
const generateCacheKeyFromObject = (obj) => {
    if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) {
        return '';
    }
    const sortedKeys = Object.keys(obj).sort();
    // Replace colons in values to prevent issues with Redis key structure if : is a delimiter
    const parts = sortedKeys.map(key => `${key}_${String(obj[key]).replace(/\s+/g, '_').replace(/:/g, '')}`);
    return parts.join('!'); // Use a different delimiter like '!'
};

// Helper function to clear cache keys by pattern (Using SCAN)
const clearCacheKeysByPattern = async (redis, pattern) => {
    if (!redis || typeof redis.scan !== 'function' || typeof redis.del !== 'function') {
        logger.warn('[Cache DEL Pattern] Redis client not available or "scan"/"del" not functions.');
        return 0;
    }
    let cursor = '0';
    let keysFoundCount = 0;
    const BATCH_SIZE = 250; // Number of keys to fetch and delete per SCAN iteration

    try {
        do {
            const reply = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', BATCH_SIZE);
            cursor = reply[0];
            const keysInBatch = reply[1];

            if (keysInBatch.length > 0) {
                await redis.del(keysInBatch);
                keysFoundCount += keysInBatch.length;
                // logger.debug(`[Cache DEL Pattern] Cleared batch of ${keysInBatch.length} keys for pattern "${pattern}".`);
            }
        } while (cursor !== '0');

        if (keysFoundCount > 0) {
            logger.info(`[Cache DEL Pattern] Cleared total of ${keysFoundCount} keys for pattern "${pattern}".`);
        } else {
            // logger.debug(`[Cache DEL Pattern] No keys found for pattern "${pattern}".`);
        }
        return keysFoundCount;
    } catch (error) {
        logger.error(`[Cache DEL Pattern Error] Failed to clear keys for pattern "${pattern}":`, error);
        return 0;
    }
};

// Helper function to clear specific cache keys
const clearSpecificCacheKeys = async (redis, keys) => {
    if (!redis || typeof redis.del !== 'function' || !keys || keys.length === 0) {
        // logger.warn('[Cache DEL Specific] Redis client not available, "del" is not a function, or no keys provided.');
        return 0;
    }
    const validKeys = keys.filter(key => typeof key === 'string' && key.length > 0);
    if (validKeys.length === 0) {
        // logger.debug('[Cache DEL Specific] No valid keys to delete.');
        return 0;
    }
    try {
        const result = await redis.del(validKeys);
        // logger.info(`[Cache DEL Specific] Attempted to clear ${validKeys.length} keys. Result: ${result}. Keys: ${validKeys.join(', ')}`);
        return result;
    } catch (error) {
        logger.error('[Cache DEL Specific Error] Failed to clear specific keys:', { keys: validKeys, error });
        return 0;
    }
};

const TEMP_JWT_SECRET_FOR_SIGNING = process.env.JWT_SECRET || 'your_super_secret_jwt_key_that_is_at_least_32_characters_long';

const generateToken = (customer) => {
    const secret = TEMP_JWT_SECRET_FOR_SIGNING;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!secret || secret.length < 32) { // Added length check for basic security
        logger.error("FATAL ERROR: JWT_SECRET is not defined or is too short for token generation.");
        throw new GraphQLError("JWT Secret is missing or insecure.", { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
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
        logger.error("Error signing JWT:", err);
        throw new GraphQLError('Could not generate authentication token.', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
    }
};

const checkAdmin = (context) => {
    if (!context.user || context.user.isAdmin !== true) {
        // logger.warn('[Resolver checkAdmin] Access DENIED. User details (or lack thereof):', context.user);
        throw new GraphQLError('Forbidden: Administrator privileges required.', {
            extensions: { code: 'FORBIDDEN', http: { status: 403 } },
        });
    }
};

const checkAuth = (context) => {
    if (!context.user || context.user.id === undefined) {
        // logger.warn('[Resolver checkAuth] Authentication failed: User or user.id missing from context.', context.user);
        throw new GraphQLError('Authentication required. Please log in.', {
            extensions: { code: 'UNAUTHENTICATED' }
        });
    }
};

const generateSlug = async (text, ModelClass, existingSlug = null, pkField = `${ModelClass.name.toLowerCase()}_id`, pkValue = null, context) => {
    let slugToUse = existingSlug;
    if (!slugToUse && text) {
        slugToUse = text.toString().toLowerCase()
            .normalize('NFD') // Decompose accented characters
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/đ/g, 'd').replace(/Đ/g, 'D') // Handle Vietnamese 'đ'
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(/[^\w-]+/g, '') // Remove all non-word chars except -
            .replace(/--+/g, '-') // Replace multiple - with single -
            .replace(/^-+/, '') // Trim - from start of text
            .replace(/-+$/, ''); // Trim - from end of text
        if (!slugToUse) {
            slugToUse = `item-${Date.now().toString().slice(-5)}`; // Fallback if slug becomes empty
        }
    } else if (!slugToUse && !text) {
        return `item-no-text-${Date.now().toString().slice(-5)}`; // Fallback if no text and no existing slug
    }


    if (!ModelClass || !context || !context.db || !context.db[ModelClass.name] || typeof context.db[ModelClass.name].findOne !== 'function') {
        logger.warn(`[generateSlug] Model ${ModelClass ? ModelClass.name : 'unknown'} not found or invalid in context.db. Returning potentially non-unique slug: ${slugToUse}`);
        return slugToUse;
    }

    let uniqueSlug = slugToUse;
    let counter = 1;
    const whereClauseBase = { slug: uniqueSlug };
    if (pkValue !== null && pkValue !== undefined) { // More robust check for pkValue
        whereClauseBase[pkField] = { [Op.ne]: pkValue };
    }

    while (await context.db[ModelClass.name].findOne({ where: whereClauseBase })) {
        uniqueSlug = `${slugToUse}-${counter}`;
        whereClauseBase.slug = uniqueSlug;
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
                return formatDateFns(value, 'yyyy-MM-dd');
            }
            if (typeof value === 'string') {
                const date = parseISO(value);
                if (isValid(date)) {
                    return formatDateFns(date, 'yyyy-MM-dd'); // Ensure consistent format
                }
            }
            // logger.warn(`[Scalar Date Serialize] Unexpected value type: ${typeof value}, value: ${value}`);
            return null;
        },
        parseValue(value) {
            if (typeof value === 'string') {
                const date = parseISO(value); // parseISO handles YYYY-MM-DD
                if (isValid(date)) {
                    return date; // Return Date object for Sequelize
                }
            }
            // logger.warn(`[Scalar Date ParseValue] Unexpected value type: ${typeof value}, value: ${value}`);
            throw new GraphQLError('Date must be a string in YYYY-MM-DD format.');
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.STRING) {
                const date = parseISO(ast.value);
                if (isValid(date)) {
                    return date; // Return Date object
                }
            }
            // logger.warn(`[Scalar Date ParseLiteral] Unexpected AST kind: ${ast.kind}, value: ${ast.value}`);
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
                const date = parseISO(value);
                if (isValid(date)) return date.toISOString();
            }
            if (typeof value === 'number') { // Timestamp
                const date = new Date(value);
                if (isValid(date)) return date.toISOString();
            }
            // logger.warn(`[Scalar DateTime Serialize] Unexpected value type for DateTime: ${typeof value}, value: ${value}`);
            return null;
        },
        parseValue(value) {
            const date = new Date(value); // new Date() is quite flexible
            if (isValid(date)) {
                return date; // Return Date object
            }
            // logger.warn(`[Scalar DateTime ParseValue] Invalid date-time value: ${value}`);
            throw new GraphQLError('Invalid DateTime format. Expected ISO-8601 string or timestamp.');
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
                const dateValue = ast.kind === Kind.INT ? parseInt(ast.value, 10) : ast.value;
                const date = new Date(dateValue);
                if (isValid(date)) {
                    return date; // Return Date object
                }
            }
            // logger.warn(`[Scalar DateTime ParseLiteral] Unexpected AST kind for DateTime: ${ast.kind}, value: ${ast.value}`);
            throw new GraphQLError('DateTime must be a valid ISO-8601 string or a timestamp integer.');
        },
    }),

    Inventory: {
        size: async (parent, _, { loaders }) => {
            if (parent.size_id && loaders.sizeLoader) {
                return loaders.sizeLoader.load(parent.size_id);
            }
            return null;
        },
        color: async (parent, _, { loaders }) => { // This refers to the 'color' field in Inventory type
            if (parent.color_id && loaders.colorLoader) {
                return loaders.colorLoader.load(parent.color_id);
            }
            return null;
        }
    },

    Product: {
        name: (parent, args, context) => {
            const langToUse = args.lang || context.lang || 'vi';
            return langToUse === 'en' && parent.product_name_en ? parent.product_name_en : parent.product_name_vi;
        },
        description: (parent, args, context) => {
            const langToUse = args.lang || context.lang || 'vi';
            return langToUse === 'en' && parent.product_description_en ? parent.product_description_en : parent.product_description_vi;
        },
        category: async (parent, _, { loaders }) => {
            if (parent.category_id && loaders.categoryLoader) {
                return loaders.categoryLoader.load(parent.category_id);
            }
            return null;
        },
        collections: async (parent, _, { loaders }) => {
            if (loaders.productCollectionsLoader) {
                return loaders.productCollectionsLoader.load(parent.product_id);
            }
            return parent.getCollections ? await parent.getCollections({ through: { attributes: [] } }) : [];
        },
        images: async (parent, _, { loaders }) => {
            if (loaders.productImageLoader) {
                return loaders.productImageLoader.load(parent.product_id);
            }
            return parent.getImages ? await parent.getImages({ order: [['display_order', 'ASC']] }) : [];
        },
        inventory: async (parent, _, { loaders }) => { // Field in GQL Product type is 'inventory'
            if (loaders.inventoryLoader) {
                return loaders.inventoryLoader.load(parent.product_id);
            }
            // Sequelize alias is 'inventoryItems'
            return parent.getInventoryItems ? await parent.getInventoryItems() : [];
        },
    },
    Category: {
        name: (parent, args, context) => {
            const langToUse = args.lang || context.lang || 'vi';
            return langToUse === 'en' && parent.category_name_en ? parent.category_name_en : parent.category_name_vi;
        }
    },
    Color: {
        name: (parent, args, context) => {
            const lang = args.lang || context.lang || 'vi';
            // Assuming 'color_name' is Vietnamese and 'color_name_en' is English in your DB schema for Colors
            if (lang === 'en' && parent.color_name_en) {
                return parent.color_name_en;
            }
            return parent.color_name; // Default to Vietnamese name (or the primary name field)
        }
    },
    Collection: {
        name: (parent, args, context) => {
            const langToUse = args.lang || context.lang || 'vi';
            return langToUse === 'en' && parent.collection_name_en ? parent.collection_name_en : parent.collection_name_vi;
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
        color: async (parent, _, { loaders }) => {
            if (parent.color_id && loaders.colorLoader) {
                return loaders.colorLoader.load(parent.color_id);
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
        author: async (parent, _, { loaders }) => {
            if (parent.user_id && loaders.customerLoader) {
                return loaders.customerLoader.load(parent.user_id);
            }
            return null;
        },
        tags: async (parent, _, { loaders }) => {
            if (loaders.blogPostTagsLoader) {
                return loaders.blogPostTagsLoader.load(parent.post_id);
            }
            return parent.getTags ? await parent.getTags({ through: { attributes: [] } }) : [];
        },
        comments: async (parent, { limit = 10, offset = 0 }, { loaders }) => {
            if (loaders.blogPostCommentsLoader) {
                const result = await loaders.blogPostCommentsLoader.load(parent.post_id);
                if (result && Array.isArray(result.comments)) { // Ensure comments is an array
                    const paginatedComments = result.comments.slice(offset, offset + limit);
                    return { count: result.comments.length, comments: paginatedComments };
                }
            }
            return { count: 0, comments: [] };
        }
    },
    BlogTag: {
        name: (parent, args, context) => {
            const langToUse = args.lang || context.lang || 'vi';
            return langToUse === 'en' && parent.name_en ? parent.name_en : parent.name_vi;
        },
    },
    BlogComment: {
        author: async (parent, _, { loaders }) => {
            if (parent.user_id && loaders.customerLoader) {
                return loaders.customerLoader.load(parent.user_id);
            }
            return null;
        },
        replies: async (parent, { limit = 5, offset = 0 }, { loaders }) => {
            if (loaders.blogCommentRepliesLoader) {
                const result = await loaders.blogCommentRepliesLoader.load(parent.comment_id);
                if (result && Array.isArray(result.comments)) { // Ensure comments is an array
                    const paginatedReplies = result.comments.slice(offset, offset + limit);
                    return { count: result.comments.length, comments: paginatedReplies };
                }
            }
            return { count: 0, comments: [] };
        }
    },
    Sale: {
        customer: async (parentSale, _, { loaders }) => {
            if (parentSale.customer_id && loaders.customerLoader) {
                return loaders.customerLoader.load(parentSale.customer_id);
            }
            return null;
        },
        items: async (parentSale, _, { loaders }) => {
            if (loaders.saleItemsLoader) {
                return loaders.saleItemsLoader.load(parentSale.sale_id);
            }
            return parentSale.getItems ? await parentSale.getItems() : [];
        },
        history: async (parentSale, _, { loaders }) => {
            if (loaders.saleHistoryLoader) {
                return loaders.saleHistoryLoader.load(parentSale.sale_id);
            }
            return parentSale.getHistory ? await parentSale.getHistory({ order: [['history_date', 'DESC']] }) : [];
        },
        totals: async (parentSale, _, { loaders }) => {
            if (loaders.saleTotalsLoader) {
                return loaders.saleTotalsLoader.load(parentSale.sale_id);
            }
            return parentSale.getTotals ? await parentSale.getTotals() : null;
        },
    },
    SalesItem: {
        product: async (parentSalesItem, _, { loaders }) => {
            if (parentSalesItem.product_id && loaders.productLoader) {
                return loaders.productLoader.load(parentSalesItem.product_id);
            }
            return null;
        },
        size: async (parentSalesItem, _, { loaders }) => {
            if (parentSalesItem.size_id && loaders.sizeLoader) {
                return loaders.sizeLoader.load(parentSalesItem.size_id);
            }
            return null;
        },
        color: async (parentSalesItem, _, { loaders }) => {
            if (parentSalesItem.color_id && loaders.colorLoader) {
                return loaders.colorLoader.load(parentSalesItem.color_id);
            }
            return null;
        }
    },

    Query: {
        products: async (_, { filter = {}, limit = 10, offset = 0, lang = "vi" }, context) => {
            const { db, sequelize, redis, lang: contextLang } = context;
            const currentLang = lang || contextLang || 'vi';
            const filterKey = generateCacheKeyFromObject(filter);
            const cacheKey = `products:filter!${filterKey}:limit${limit}:offset${offset}:lang${currentLang}`;

            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] Products List from Redis for key: ${cacheKey}`);
                        return JSON.parse(cachedData);
                    }
                }
            } catch (cacheError) {
                logger.error(`[Cache GET Error] Products List for key ${cacheKey}:`, cacheError);
            }
            // logger.debug(`[Cache MISS] Products List for key ${cacheKey}. Fetching from DB.`);

            try {
                const whereClause = { is_active: true };
                const includeClauseForFiltering = [];

                if (filter.category_id) whereClause.category_id = filter.category_id;
                if (typeof filter.is_new_arrival === 'boolean') whereClause.is_new_arrival = filter.is_new_arrival;

                if (filter.search_term) {
                    const searchTermLike = `%${filter.search_term}%`;
                    const nameField = currentLang === 'en' && db.Product.rawAttributes.product_name_en ? 'product_name_en' : 'product_name_vi';
                    const descField = currentLang === 'en' && db.Product.rawAttributes.product_description_en ? 'product_description_en' : 'product_description_vi';
                    const orConditions = [
                        { [nameField]: { [Op.like]: searchTermLike } },
                        { [descField]: { [Op.like]: searchTermLike } },
                    ];
                    if (currentLang === 'en' && db.Product.rawAttributes.product_name_vi) {
                        orConditions.push({ product_name_vi: { [Op.like]: searchTermLike } });
                        if(db.Product.rawAttributes.product_description_vi) orConditions.push({ product_description_vi: { [Op.like]: searchTermLike } });
                    } else if (currentLang === 'vi' && db.Product.rawAttributes.product_name_en) {
                        orConditions.push({ product_name_en: { [Op.like]: searchTermLike } });
                         if(db.Product.rawAttributes.product_description_en) orConditions.push({ product_description_en: { [Op.like]: searchTermLike } });
                    }
                    whereClause[Op.or] = orConditions;
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
                        through: { attributes: [] },
                        attributes: [],
                        duplicating: false
                    });
                }

                if (typeof filter.in_stock === 'boolean') {
                    const stockCondition = filter.in_stock
                        ? sequelize.literal('EXISTS (SELECT 1 FROM `Inventory` inv_check WHERE inv_check.`product_id` = `Product`.`product_id` AND inv_check.`quantity` > 0)')
                        : sequelize.literal('NOT EXISTS (SELECT 1 FROM `Inventory` inv_check WHERE inv_check.`product_id` = `Product`.`product_id` AND inv_check.`quantity` > 0)');

                    if (whereClause[Op.and]) {
                        whereClause[Op.and].push(stockCondition);
                    } else {
                        whereClause[Op.and] = [stockCondition];
                    }
                }
                const orderByNameField = (currentLang === 'en' && db.Product.rawAttributes.product_name_en) ? 'product_name_en' : 'product_name_vi';
                const { count: countResult, rows: productIdsRows } = await db.Product.findAndCountAll({
                    where: whereClause,
                    include: includeClauseForFiltering,
                    attributes: ['product_id'], 
                    limit: parseInt(limit, 10),
                    offset: parseInt(offset, 10),
                    order: [[orderByNameField, 'ASC']],
                    group: ['Product.product_id'], // Group by product_id to avoid duplicates
                    distinct: true, // Ensure distinct count                  
                    subQuery: includeClauseForFiltering.length > 0, // subQuery should be true when using includes with group
                });

                // Proposed Fix: Check if countResult is an array (grouped result)
                const totalCount = Array.isArray(countResult)
                    ? countResult.length // If grouped, length is the count of distinct products found
                    : (typeof countResult === 'object' && countResult !== null && countResult.count !== undefined ? countResult.count : 0); // Fallback for non-grouped or different structures

                if (productIdsRows.length === 0) {                 return { count: totalCount, products: [] };
                }
                const productIds = productIdsRows.map(p => p.product_id);

                const productsWithFullDetails = await db.Product.findAll({
                    where: { product_id: { [Op.in]: productIds } },
                    order: sequelize.literal(`FIELD(\`Product\`.\`product_id\`, ${productIds.map(id => sequelize.escape(id)).join(',')})`)
                });

                const resultData = { count: totalCount, products: productsWithFullDetails.map(p => p.get({ plain: true })) };
                if (redis && typeof redis.set === 'function' && resultData.products.length > 0) { // Only cache if there are results
                    try {
                        await redis.set(cacheKey, JSON.stringify(resultData), 'EX', 3600);
                        // logger.debug(`[Cache SET] Products List cached for key ${cacheKey}.`);
                    } catch (cacheSetError) {
                        logger.error(`[Cache SET Error] Products List for key ${cacheKey}:`, cacheSetError);
                    }
                }
                return { count: totalCount, products: productsWithFullDetails };
            } catch (error) {
                // Log the specific error and the filter used for debugging
                logger.error("Error fetching products (GraphQL Query):", {
                    filter,
                    limit,
                    offset,
                    lang,
                    errorMessage: error.message,
                    errorStack: error.stack,
                    originalError: error.original // Sequelize specific error
                });
                // Provide a slightly more informative error, but avoid exposing too much detail
                const displayError = error.original ? error.original.message : error.message; // Use Sequelize message if available
                throw new GraphQLError(`Could not fetch products. Server Error: ${displayError}`, {
                     extensions: { code: 'INTERNAL_SERVER_ERROR' }
                });
            }
        },
        product: async (_, { id, lang = "vi" }, { db, loaders, redis, lang: contextLang }) => {
            // const currentLang = lang || contextLang || 'vi'; // lang for field resolvers
            const cacheKey = `product:${id}`;

            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedProduct = await redis.get(cacheKey);
                    if (cachedProduct) {
                        // logger.debug(`[Cache HIT] Product ${id} from Redis.`);
                        const plainProduct = JSON.parse(cachedProduct);
                        // Re-instantiate if needed for field resolvers, or ensure field resolvers handle plain objects
                        // For now, returning plain object and letting field resolvers use context.lang
                        return plainProduct;
                    }
                }
            } catch (cacheError) {
                logger.error(`[Cache GET Error] Product ${id}:`, cacheError);
            }

            // logger.debug(`[Cache MISS] Product ${id}. Fetching from DB.`);
            try {
                const product = await db.Product.findOne({
                    where: { product_id: id, is_active: true },
                });

                if (!product) {
                    throw new GraphQLError('Product not found or inactive.', { extensions: { code: 'NOT_FOUND' } });
                }

                const plainProduct = product.get({ plain: true });
                if (redis && typeof redis.set === 'function' && plainProduct) {
                    try {
                        await redis.set(cacheKey, JSON.stringify(plainProduct), 'EX', 3600);
                        // logger.debug(`[Cache SET] Product ${id} cached in Redis.`);
                    } catch (cacheSetError) {
                        logger.error(`[Cache SET Error] Product ${id}:`, cacheSetError);
                    }
                }
                return product; // Return Sequelize instance for field resolvers
            } catch (error) {
                logger.error(`Error fetching product ID ${id} (GraphQL):`, error);
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError('Could not fetch product details.');
            }
        },
        categories: async (_, { lang = "vi" }, { db, sequelize, redis, lang: contextLang }) => {
            const currentLang = lang || contextLang || 'vi';
            const cacheKey = `categories:lang${currentLang}`;

            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedCategories = await redis.get(cacheKey);
                    if (cachedCategories) {
                        // logger.debug(`[Cache HIT] Categories (Lang: ${currentLang}) from Redis.`);
                        return JSON.parse(cachedCategories); // Return plain objects
                    }
                }
            } catch (cacheError) {
                logger.error(`[Cache GET Error] Categories (Lang: ${currentLang}):`, cacheError);
            }

            // logger.debug(`[Cache MISS] Categories (Lang: ${currentLang}). Fetching from DB.`);
            try {
                const orderByNameField = (currentLang === 'en' && db.Category.rawAttributes.category_name_en) ? 'category_name_en' : 'category_name_vi';
                const categories = await db.Category.findAll({
                    order: [[orderByNameField, 'ASC']]
                });
                const plainCategories = categories.map(cat => cat.get({ plain: true }));

                if (redis && typeof redis.set === 'function' && plainCategories.length > 0) { // Only cache if there are results
                    try {
                        await redis.set(cacheKey, JSON.stringify(plainCategories), 'EX', 3600);
                        // logger.debug(`[Cache SET] Categories (Lang: ${currentLang}) cached in Redis.`);
                    } catch (cacheSetError) {
                        logger.error(`[Cache SET Error] Categories (Lang: ${currentLang}):`, cacheSetError);
                    }
                }
                return categories; // Return Sequelize instances for field resolvers
            } catch (e) {
                logger.error("Error fetching categories:", e);
                throw new GraphQLError('Could not fetch categories.');
            }
        },
        collections: async (_, { lang = "vi" }, context) => {
            const { db, sequelize, redis, lang: contextLang } = context;
            const currentLang = lang || contextLang || 'vi';
            const cacheKey = `collections:lang${currentLang}`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        //  logger.debug(`[Cache HIT] Collections (Lang: ${currentLang}) from Redis.`);
                         return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] Collections (Lang: ${currentLang}). Fetching from DB.`);
                const orderByNameField = (currentLang === 'en' && db.Collection.rawAttributes.collection_name_en) ? 'collection_name_en' : 'collection_name_vi';
                const collections = await db.Collection.findAll({ order: [[orderByNameField, 'ASC']] });
                const plainCollections = collections.map(c => c.get({ plain: true }));
                if (redis && typeof redis.set === 'function' && plainCollections.length > 0) { // Only cache if there are results
                    await redis.set(cacheKey, JSON.stringify(plainCollections), 'EX', 3600);
                    // logger.debug(`[Cache SET] Collections (Lang: ${currentLang}) cached.`);
                }
                return collections;
            } catch (e) {
                logger.error("Error fetching collections:", e);
                throw new GraphQLError('Could not fetch collections.');
            }
        },
        sizes: async (_, __, context) => {
            const { db, redis } = context;
            const cacheKey = `sizes`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] Sizes from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] Sizes. Fetching from DB.`);
                const sizes = await db.Size.findAll({ order: [['size_name', 'ASC']] });
                const plainSizes = sizes.map(s => s.get({ plain: true }));
                if (redis && typeof redis.set === 'function' && plainSizes.length > 0) { // Only cache if there are results
                     await redis.set(cacheKey, JSON.stringify(plainSizes), 'EX', 3600 * 24);
                    //  logger.debug(`[Cache SET] Sizes cached.`);
                }
                return sizes;
            } catch (e) {
                logger.error("Error fetching sizes:", e);
                throw new GraphQLError('Could not fetch sizes.');
            }
        },
        publicGetAllColors: async (_, { lang = "vi" }, context) => {
            const { db, redis, lang: contextLang } = context;
            const currentLang = lang || contextLang || 'vi';
            const cacheKey = `publicColors:lang${currentLang}`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] Public Colors (Lang: ${currentLang}) from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] Public Colors (Lang: ${currentLang}). Fetching from DB.`);
                const colors = await db.Color.findAll({ order: [['color_name', 'ASC']] }); // Use 'color_name' as it's the base
                const plainColors = colors.map(c => c.get({ plain: true }));
                if (redis && typeof redis.set === 'function' && plainColors.length > 0) { // Only cache if there are results
                    await redis.set(cacheKey, JSON.stringify(plainColors), 'EX', 3600 * 24);
                    // logger.debug(`[Cache SET] Public Colors (Lang: ${currentLang}) cached.`);
                }
                return colors;
            } catch (e) {
                logger.error("Error fetching public colors:", e);
                throw new GraphQLError('Could not fetch colors.');
            }
        },
        blogPosts: async (_, { filter = {}, limit = 10, offset = 0, lang = "vi" }, context) => {
            const { db, sequelize, redis, lang: contextLang } = context;
            const currentLang = lang || contextLang || 'vi';
            const filterKey = generateCacheKeyFromObject(filter);
            const cacheKey = `blogPosts:${filterKey}:limit${limit}:offset${offset}:lang${currentLang}`;

            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] BlogPosts List from Redis for key: ${cacheKey}`);
                        return JSON.parse(cachedData);
                    }
                }
            } catch (cacheError) { logger.error(`[Cache GET Error] BlogPosts List for key ${cacheKey}:`, cacheError); }
            // logger.debug(`[Cache MISS] BlogPosts List for key ${cacheKey}. Fetching from DB.`);

            try {
                const whereClause = { status: 'published', visibility: 'public' };
                const includeClause = [];

                if (filter.tag_slug) {
                    includeClause.push({
                        model: db.BlogTag,
                        as: 'tags',
                        where: { slug: filter.tag_slug },
                        required: true,
                        attributes: [],
                        through: { attributes: [] }
                    });
                }
                if (filter.author_id) whereClause.user_id = filter.author_id;
                if (filter.search_term) {
                    const searchTermLike = `%${filter.search_term}%`;
                    const titleField = currentLang === 'en' && db.BlogPost.rawAttributes.title_en ? 'title_en' : 'title_vi';
                    const contentField = currentLang === 'en' && db.BlogPost.rawAttributes.content_html_en ? 'content_html_en' : 'content_html_vi';
                    const orConditions = [
                        { [titleField]: { [Op.like]: searchTermLike } },
                        { [contentField]: { [Op.like]: searchTermLike } },
                    ];
                     if (currentLang === 'en' && db.BlogPost.rawAttributes.title_vi) {
                        orConditions.push({ title_vi: { [Op.like]: searchTermLike } });
                        if(db.BlogPost.rawAttributes.content_html_vi) orConditions.push({ content_html_vi: { [Op.like]: searchTermLike } });
                    } else if (currentLang === 'vi' && db.BlogPost.rawAttributes.title_en) {
                        orConditions.push({ title_en: { [Op.like]: searchTermLike } });
                         if(db.BlogPost.rawAttributes.content_html_en) orConditions.push({ content_html_en: { [Op.like]: searchTermLike } });
                    }
                    whereClause[Op.or] = orConditions;
                }

                const { count: countResult, rows: postIdsRows } = await db.BlogPost.findAndCountAll({
                    where: whereClause,
                    include: includeClause,
                    attributes: ['post_id'],
                    limit: parseInt(limit, 10),
                    offset: parseInt(offset, 10),
                    order: [['published_at', 'DESC']],
                    group: ['BlogPost.post_id'],
                    distinct: true,
                    subQuery: includeClause.length > 0,
                });
                const totalCount = Array.isArray(countResult) ? countResult.length : (countResult?.count || 0);
                if (postIdsRows.length === 0) return { count: totalCount, posts: [] };

                const postIds = postIdsRows.map(p => p.post_id);
                const postsWithFullDetails = await db.BlogPost.findAll({
                    where: { post_id: { [Op.in]: postIds } },
                    order: sequelize.literal(`FIELD(\`BlogPost\`.\`post_id\`, ${postIds.map(id => sequelize.escape(id)).join(',')})`)
                });

                const resultData = { count: totalCount, posts: postsWithFullDetails.map(p => p.get({plain:true})) };
                if (redis && typeof redis.set === 'function' && resultData.posts.length > 0) { // Only cache if there are results
                    await redis.set(cacheKey, JSON.stringify(resultData), 'EX', 3600);
                    // logger.debug(`[Cache SET] BlogPosts List cached for key ${cacheKey}.`);
                }
                return { count: totalCount, posts: postsWithFullDetails };
            } catch (error) {
                logger.error("Error fetching blog posts:", error);
                throw new GraphQLError("Could not fetch blog posts.");
            }
        },
        blogPostBySlug: async (_, { slug, lang = "vi" }, context) => {
            const { db, redis, lang: contextLang } = context;
            // const currentLang = lang || contextLang || 'vi';
            const cacheKey = `blogPost:slug_${slug}`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] BlogPost by slug ${slug} from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
            } catch (cacheError) { logger.error(`[Cache GET Error] BlogPost by slug ${slug}:`, cacheError); }
            // logger.debug(`[Cache MISS] BlogPost by slug ${slug}. Fetching from DB.`);

            try {
                const post = await db.BlogPost.findOne({
                    where: { slug, status: 'published', visibility: 'public' },
                });
                if (!post) throw new GraphQLError("Blog post not found or not public.", { extensions: { code: 'NOT_FOUND' } });

                const plainPost = post.get({ plain: true });
                if (redis && typeof redis.set === 'function' && plainPost) {
                    await redis.set(cacheKey, JSON.stringify(plainPost), 'EX', 3600);
                    // logger.debug(`[Cache SET] BlogPost by slug ${slug} cached.`);
                }
                return post;
            } catch (error) {
                logger.error(`Error fetching blog post by slug ${slug}:`, error);
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError("Could not fetch blog post.");
            }
        },
        blogTags: async (_, { lang = "vi" }, context) => {
            const { db, sequelize, redis, lang: contextLang } = context;
            const currentLang = lang || contextLang || 'vi';
            const cacheKey = `blogTags:lang${currentLang}`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] BlogTags (Lang: ${currentLang}) from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] BlogTags (Lang: ${currentLang}). Fetching from DB.`);
                const orderByNameField = (currentLang === 'en' && db.BlogTag.rawAttributes.name_en) ? 'name_en' : 'name_vi';
                const tags = await db.BlogTag.findAll({
                    order: [[orderByNameField, 'ASC']]
                });
                const plainTags = tags.map(t => t.get({ plain: true }));
                if (redis && typeof redis.set === 'function' && plainTags.length > 0) { // Only cache if there are results
                    await redis.set(cacheKey, JSON.stringify(plainTags), 'EX', 3600 * 6);
                    // logger.debug(`[Cache SET] BlogTags (Lang: ${currentLang}) cached.`);
                }
                return tags;
            } catch (error) {
                logger.error("Error fetching blog tags:", error);
                throw new GraphQLError("Could not fetch blog tags.");
            }
        },
        blogCommentsByPost: async (_, { post_id, limit = 10, offset = 0 }, context) => {
            const { db, loaders } = context;
            if (loaders.blogPostCommentsLoader) {
                const result = await loaders.blogPostCommentsLoader.load(post_id);
                if (result && Array.isArray(result.comments)) {
                    const paginatedComments = result.comments.slice(offset, offset + limit);
                    return { count: result.comments.length, comments: paginatedComments };
                }
                 return { count: 0, comments: [] };
            }
            try {
                const { count, rows } = await db.BlogComment.findAndCountAll({
                    where: { post_id, status: 'approved', parent_comment_id: null },
                    include: [ { model: db.Customer, as: 'commentAuthor', attributes: ['customer_id', 'customer_name', 'username'] } ],
                    order: [['created_at', 'DESC']],
                    limit: parseInt(limit, 10),
                    offset: parseInt(offset, 10)
                });
                return { count, comments: rows };
            } catch (error) {
                logger.error(`Error fetching comments for post ${post_id}:`, error);
                throw new GraphQLError("Could not fetch comments.");
            }
        },
        myProfile: async (_, __, context) => {
            checkAuth(context);
            const { db, redis } = context;
            const userId = context.user.id;
            const cacheKey = `profile:${userId}`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] Profile for user ${userId} from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] Profile for user ${userId}. Fetching from DB.`);
                const customer = await db.Customer.findByPk(userId, {
                    attributes: { exclude: ['customer_password', 'password_reset_token', 'password_reset_expires'] }
                });
                if (!customer) throw new GraphQLError('Profile not found.', { extensions: { code: 'NOT_FOUND' } });
                const plainCustomer = customer.get({plain: true});
                if (redis && typeof redis.set === 'function' && plainCustomer) {
                    await redis.set(cacheKey, JSON.stringify(plainCustomer), 'EX', 3600);
                    // logger.debug(`[Cache SET] Profile for user ${userId} cached.`);
                }
                return customer;
            } catch (e) {
                logger.error("Error fetching myProfile:", e);
                if (e instanceof GraphQLError) throw e;
                throw new GraphQLError('Could not fetch profile.');
            }
        },
        mySales: async (_, { limit = 10, offset = 0 }, context) => {
            checkAuth(context);
            const {db, redis} = context;
            const userId = context.user.id;
            const cacheKey = `mySales:${userId}:limit${limit}:offset${offset}`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] MySales for user ${userId} (Page) from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] MySales for user ${userId} (Page). Fetching from DB.`);
                const {count, rows} = await db.Sale.findAndCountAll({
                    where: {customer_id: userId},
                    limit: parseInt(limit, 10),
                    offset: parseInt(offset, 10),
                    order: [['sale_id', 'DESC']],
                });
                const resultData = {count, sales: rows.map(r => r.get({plain: true}))};
                if (redis && typeof redis.set === 'function' && resultData.sales.length > 0) { // Only cache if there are results
                    await redis.set(cacheKey, JSON.stringify(resultData), 'EX', 600);
                    // logger.debug(`[Cache SET] MySales for user ${userId} (Page) cached.`);
                }
                return {count, sales: rows};
            } catch (e) {
                logger.error("Error fetching mySales:", e);
                throw new GraphQLError('Could not fetch sales history.');
            }
        },
        mySaleDetail: async (_, { id }, context) => {
            checkAuth(context);
            const {db, redis} = context;
            const userId = context.user.id;
            const cacheKey = `mySaleDetail:${id}:user${userId}`;

            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] MySaleDetail ${id} for user ${userId} from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] MySaleDetail ${id} for user ${userId}. Fetching from DB.`);
                const sale = await db.Sale.findByPk(id);
                if(!sale || sale.customer_id !== userId) {
                    throw new GraphQLError('Order not found or access denied.', {extensions: {code: 'NOT_FOUND'}});
                }
                const plainSale = sale.get({plain: true});
                if (redis && typeof redis.set === 'function' && plainSale) {
                    await redis.set(cacheKey, JSON.stringify(plainSale), 'EX', 1800);
                    // logger.debug(`[Cache SET] MySaleDetail ${id} for user ${userId} cached.`);
                }
                return sale;
            } catch (e) {
                logger.error(`Error fetching mySaleDetail for ID ${id}:`, e);
                if (e instanceof GraphQLError) throw e;
                throw new GraphQLError('Could not fetch order details.');
            }
        },

        // --- ADMIN QUERIES ---
        adminDashboardStats: async (_, __, context) => {
            checkAdmin(context);
            const { db, sequelize, redis: safeRedis } = context;
            const cacheKey = 'adminDashboardStats';
            if (safeRedis) { try { const d = await safeRedis.get(cacheKey); if (d) return JSON.parse(d); } catch (e) { logger.error('Redis get err', e);}}
            try {
                const totalUsers = await db.Customer.count({ where: { isAdmin: false } });
                const salesAgg = await db.SalesTotals.findOne({ attributes: [[sequelize.fn('SUM', sequelize.col('total_amount')), 'totalSalesAmount'], [sequelize.fn('COUNT', sequelize.col('sale_id')), 'totalOrders']], raw: true });
                const totalBlogPosts = await db.BlogPost.count({ where: { status: 'published' } });
                const totalProducts = await db.Product.count({ where: { is_active: true } });
                const stats = { totalUsers: totalUsers || 0, totalSalesAmount: parseFloat(salesAgg?.totalSalesAmount || 0), totalOrders: parseInt(salesAgg?.totalOrders || 0, 10), totalBlogPosts: totalBlogPosts || 0, totalProducts: totalProducts || 0 };
                if (safeRedis && stats) { try { await safeRedis.set(cacheKey, JSON.stringify(stats), 'EX', 300); } catch (e) { logger.error('Redis set err', e);}}
                return stats;
            } catch (e) { logger.error("Error fetching adminDashboardStats from DB:", e); throw new GraphQLError('Could not fetch dashboard statistics.'); }
        },
        adminGetAllSales: async (_, { limit = 15, offset = 0, filter = {} }, context) => {
            checkAdmin(context);
            const {db, redis, sequelize} = context;
            const filterKey = generateCacheKeyFromObject(filter);
            const cacheKey = `adminSales:${filterKey}:limit${limit}:offset${offset}`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] AdminSales (Filter, Page) from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] AdminSales (Filter, Page). Fetching from DB.`);
                const whereClause = {};
                const customerInclude = { model: db.Customer, as: 'customer', attributes: ['customer_id', 'customer_name', 'customer_email'] };
                const includeClauses = [customerInclude];

                if(filter.status) whereClause.sale_status = filter.status;
                if(filter.customer_id) whereClause.customer_id = filter.customer_id;
                if(filter.date_from) whereClause.sale_date = { ...whereClause.sale_date, [Op.gte]: filter.date_from };
                if(filter.date_to) whereClause.sale_date = { ...whereClause.sale_date, [Op.lte]: filter.date_to };

                if(filter.search_term) {
                    const term = `%${filter.search_term}%`;
                    const orConditions = [
                        { '$customer.customer_name$': { [Op.like]: term } },
                        { '$customer.customer_email$': { [Op.like]: term } },
                        { shipping_name: { [Op.like]: term } },
                        { shipping_phone: { [Op.like]: term } }
                    ];
                    if(!isNaN(parseInt(filter.search_term))) {
                        orConditions.push({ sale_id: parseInt(filter.search_term) });
                    }
                    whereClause[Op.or] = orConditions;
                }

                const {count, rows} = await db.Sale.findAndCountAll({
                    where: whereClause,
                    include: includeClauses,
                    limit: parseInt(limit, 10),
                    offset: parseInt(offset, 10),
                    order: [['sale_id', 'DESC']],
                    distinct: true, // Important with includes for correct count
                });
                const resultData = {count, sales: rows.map(r => r.get({plain: true}))};
                if (redis && typeof redis.set === 'function' && resultData.sales.length > 0) { // Only cache if there are results
                    await redis.set(cacheKey, JSON.stringify(resultData), 'EX', 600);
                    // logger.debug(`[Cache SET] AdminSales (Filter, Page) cached.`);
                }
                return {count, sales: rows};
            } catch (e) {
                logger.error("Error in adminGetAllSales:", e);
                throw new GraphQLError('Could not fetch sales for admin.');
            }
        },
        adminGetSaleDetails: async (_, { id }, context) => {
            checkAdmin(context);
            const {db, redis} = context;
            const cacheKey = `adminSaleDetail:${id}`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] AdminSaleDetail ${id} from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] AdminSaleDetail ${id}. Fetching from DB.`);
                const sale = await db.Sale.findByPk(id);
                if(!sale) throw new GraphQLError('Sale not found.', {extensions: {code: 'NOT_FOUND'}});
                const plainSale = sale.get({plain: true});
                if (redis && typeof redis.set === 'function' && plainSale) {
                    await redis.set(cacheKey, JSON.stringify(plainSale), 'EX', 1800);
                    // logger.debug(`[Cache SET] AdminSaleDetail ${id} cached.`);
                }
                return sale;
            } catch (e) {
                logger.error(`Error fetching adminGetSaleDetails for ID ${id}:`, e);
                if (e instanceof GraphQLError) throw e;
                throw new GraphQLError('Could not fetch sale details for admin.');
            }
        },
        adminGetAllUsers: async (_, { limit = 20, offset = 0, filter = {} }, context) => {
            checkAdmin(context);
            const {db, redis} = context;
            const filterKey = generateCacheKeyFromObject(filter);
            const cacheKey = `adminUsers:${filterKey}:limit${limit}:offset${offset}`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] AdminUsers (Filter, Page) from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] AdminUsers (Filter, Page). Fetching from DB.`);
                const whereClause = {};
                if (filter.searchTerm) {
                    const term = `%${filter.searchTerm}%`;
                    whereClause[Op.or] = [
                        { customer_name: { [Op.like]: term } },
                        { customer_email: { [Op.like]: term } },
                        { username: { [Op.like]: term } },
                        { customer_tel: { [Op.like]: term } },
                    ];
                }
                 if (filter.isAdmin !== undefined && filter.isAdmin !== null && filter.isAdmin !== '') {
                    whereClause.isAdmin = filter.isAdmin === 'true' || filter.isAdmin === true;
                }

                const {count, rows} = await db.Customer.findAndCountAll({
                    where: whereClause,
                    limit: parseInt(limit, 10),
                    offset: parseInt(offset, 10),
                    attributes: {exclude: ['customer_password', 'password_reset_token', 'password_reset_expires']},
                    order: [['customer_name', 'ASC']]
                });
                const resultData = {count, users: rows.map(r => r.get({plain: true}))};
                if (redis && typeof redis.set === 'function' && resultData.users.length > 0) { // Only cache if there are results
                    await redis.set(cacheKey, JSON.stringify(resultData), 'EX', 600);
                    // logger.debug(`[Cache SET] AdminUsers (Filter, Page) cached.`);
                }
                return {count, users: rows};
            } catch (e) {
                logger.error("Error in adminGetAllUsers:", e);
                throw new GraphQLError('Could not fetch users for admin.');
            }
        },
        adminGetProductDetails: async (_, { id, lang = "vi" }, context) => {
            checkAdmin(context);
            const { db, redis, lang: contextLang } = context;
            // const currentLang = lang || contextLang || 'vi';
            const cacheKey = `adminProduct:${id}`;

            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedProduct = await redis.get(cacheKey);
                    if (cachedProduct) {
                        // logger.debug(`[Cache HIT] Admin Product ${id} from Redis.`);
                        return JSON.parse(cachedProduct);
                    }
                }
            } catch (cacheError) { logger.error(`[Cache GET Error] Admin Product ${id}:`, cacheError); }
            // logger.debug(`[Cache MISS] Admin Product ${id}. Fetching from DB.`);

            try {
                const product = await db.Product.findByPk(id);
                if (!product) throw new GraphQLError('Product not found.', { extensions: { code: 'NOT_FOUND' } });
                const plainProduct = product.get({plain: true});
                if (redis && typeof redis.set === 'function' && plainProduct) {
                    await redis.set(cacheKey, JSON.stringify(plainProduct), 'EX', 3600);
                    // logger.debug(`[Cache SET] Admin Product ${id} cached.`);
                }
                return product;
            } catch (error) {
                logger.error(`Error fetching admin product ID ${id}:`, error);
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError('Could not fetch product details for admin.');
            }
        },
        adminGetAllProducts: async (_, { filter = {}, limit = 20, offset = 0, lang = "vi" }, context) => {
    checkAdmin(context);
    const { db, sequelize, redis: safeRedis, lang: contextLang } = context;
    const currentLang = lang || contextLang || 'vi';
    const filterKey = generateCacheKeyFromObject(filter);
    const cacheKey = `adminProducts:${filterKey}:limit${limit}:offset${offset}:lang${currentLang}`;

    try {
        if (safeRedis && typeof safeRedis.get === 'function') {
            const cachedData = await safeRedis.get(cacheKey);
            if (cachedData) {
                return JSON.parse(cachedData);
            }
        }
    } catch (cacheError) { 
        logger.error(`[Cache GET Error] AdminProducts List for key ${cacheKey}:`, cacheError); 
    }

    try {
        const whereClause = {};
        const includeClauseForFiltering = [];

        // Basic filters
        if (typeof filter.is_active === 'boolean') whereClause.is_active = filter.is_active;
        if (filter.category_id) whereClause.category_id = filter.category_id;
        if (typeof filter.is_new_arrival === 'boolean') whereClause.is_new_arrival = filter.is_new_arrival;

        // Search filter
        if (filter.search_term) {
            const searchTermLike = `%${filter.search_term}%`;
            const orConditions = [
                { product_name_vi: { [Op.like]: searchTermLike } },
            ];
            if (db.Product.rawAttributes.product_name_en) {
                orConditions.push({ product_name_en: { [Op.like]: searchTermLike } });
            }
            whereClause[Op.or] = orConditions;
        }

        // Inventory filters (size & color)
        if (filter.size_id || filter.color_id) {
                const inventoryWhere = {};
                if (filter.size_id) inventoryWhere.size_id = String(filter.size_id);
                if (filter.color_id) inventoryWhere.color_id = String(filter.color_id);
                
                includeClauseForFiltering.push({
                    model: db.Inventory,
                    as: 'inventoryItems',
                    where: inventoryWhere,
                    attributes: [],
                    required: true
                });
            }

        // Collection filter
        if (filter.collection_id) {
            includeClauseForFiltering.push({
                model: db.Collection,
                as: 'collections',
                where: { collection_id: String(filter.collection_id) },
                required: true,
                through: { attributes: [] },
                attributes: [],
                duplicating: false
            });
        }

        // Stock filter
        if (typeof filter.in_stock === 'boolean') {
            const stockCondition = filter.in_stock
                ? sequelize.literal('EXISTS (SELECT 1 FROM `Inventory` inv_check WHERE inv_check.`product_id` = `Product`.`product_id` AND inv_check.`quantity` > 0)')
                : sequelize.literal('NOT EXISTS (SELECT 1 FROM `Inventory` inv_check WHERE inv_check.`product_id` = `Product`.`product_id` AND inv_check.`quantity` > 0)');
            whereClause[Op.and] = whereClause[Op.and] ? [...whereClause[Op.and], stockCondition] : [stockCondition];
        }

        // Step 1: Get distinct product IDs with count
        const distinctQuery = await db.Product.findAll({
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('Product.product_id')), 'product_id']],
                where: whereClause,
                include: includeClauseForFiltering,
                raw: true
            });

            const totalCount = distinctQuery.length;

        if (totalCount === 0) {
            return { count: 0, products: [] };
        }

        // Step 2: Get paginated product IDs
        const productIds = distinctQuery.map(result => result.product_id);
        const paginatedIds = productIds.slice(offset, offset + limit);

        // Step 3: Get full product details
        const productsWithFullDetails = await db.Product.findAll({
                where: { 
                    product_id: { [Op.in]: paginatedIds } 
                },
                order: [['product_name_vi', 'ASC']],
                include: [
                    { 
                        model: db.Category, 
                        as: 'category', 
                        required: false 
                    },
                    { 
                        model: db.Collection, 
                        as: 'collections', 
                        required: false, 
                        through: { attributes: [] } 
                    },
                    { 
                        model: db.ProductImage, 
                        as: 'images', 
                        required: false,
                        include: [{ 
                            model: db.Color, 
                            as: 'color', 
                            required: false 
                        }],
                        order: [['display_order', 'ASC']]
                    },
                    {
                        model: db.Inventory,
                        as: 'inventoryItems',
                        required: false,
                        include: [
                            { 
                                model: db.Size, 
                                as: 'size', 
                                required: false 
                            },
                            { 
                                model: db.Color, 
                                as: 'colorDetail', 
                                required: false 
                            }
                        ]
                    }
                ]
            });

            const resultData = {
                count: totalCount,
                products: productsWithFullDetails.map(p => p.get({ plain: true }))
            };

            if (safeRedis && typeof safeRedis.set === 'function' && resultData.products.length > 0) {
                try {
                    await safeRedis.set(cacheKey, JSON.stringify(resultData), 'EX', 3600);
                } catch (cacheSetError) {
                    logger.error(`[Cache SET Error] AdminProducts List for key ${cacheKey}:`, cacheSetError);
                }
            }

            return resultData;

        } catch (error) {
            logger.error("[adminGetAllProducts resolver] Error:", error);
            throw new GraphQLError('Could not fetch products for admin.');
        }
    },
        adminGetAllColors: async (_, { lang = "vi" }, context) => {
            checkAdmin(context);
            const { db, redis, lang: contextLang } = context;
            const currentLang = lang || contextLang || 'vi';
            const cacheKey = `adminColors:lang${currentLang}`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] Admin Colors (Lang: ${currentLang}) from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] Admin Colors (Lang: ${currentLang}). Fetching from DB.`);
                const colors = await db.Color.findAll({order: [['color_name', 'ASC']]});
                const plainColors = colors.map(c => c.get({plain: true}));
                if (redis && typeof redis.set === 'function' && plainColors.length > 0) { // Only cache if there are results
                    await redis.set(cacheKey, JSON.stringify(plainColors), 'EX', 3600 * 24);
                    // logger.debug(`[Cache SET] Admin Colors (Lang: ${currentLang}) cached.`);
                }
                return colors;
            } catch (e) {
                logger.error("Error fetching admin colors:", e);
                throw new GraphQLError('Could not fetch colors for admin.');
            }
        },
        adminGetAllCollections: async (_, { lang = "vi" }, context) => {
            checkAdmin(context);
            const { db, sequelize, redis, lang: contextLang } = context;
            const currentLang = lang || contextLang || 'vi';
            const cacheKey = `adminCollections:lang${currentLang}`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] Admin Collections (Lang: ${currentLang}) from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] Admin Collections (Lang: ${currentLang}). Fetching from DB.`);
                const orderByNameField = (currentLang === 'en' && db.Collection.rawAttributes.collection_name_en)
                    ? 'collection_name_en'
                    : 'collection_name_vi';
                const collections = await db.Collection.findAll({ order: [[orderByNameField, 'ASC']] });
                const plainCollections = collections.map(c => c.get({plain: true}));
                if (redis && typeof redis.set === 'function' && plainCollections.length > 0) { // Only cache if there are results
                    await redis.set(cacheKey, JSON.stringify(plainCollections), 'EX', 3600 * 6);
                    // logger.debug(`[Cache SET] Admin Collections (Lang: ${currentLang}) cached.`);
                }
                return collections;
            } catch (e) {
                logger.error("Error fetching admin collections:", e);
                throw new GraphQLError('Could not fetch collections for admin.');
            }
        },
        adminGetAllSizes: async (_, __, context) => {
            checkAdmin(context);
            const { db, redis } = context;
            const cacheKey = `adminSizes`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] Admin Sizes from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] Admin Sizes. Fetching from DB.`);
                const sizes = await db.Size.findAll({order: [['size_name', 'ASC']]});
                const plainSizes = sizes.map(s => s.get({plain: true}));
                if (redis && typeof redis.set === 'function' && plainSizes.length > 0) { // Only cache if there are results
                    await redis.set(cacheKey, JSON.stringify(plainSizes), 'EX', 3600 * 24);
                    // logger.debug(`[Cache SET] Admin Sizes cached.`);
                }
                return sizes;
            } catch (e) {
                logger.error("Error fetching admin sizes:", e);
                throw new GraphQLError('Could not fetch sizes for admin.');
            }
        },
        adminGetAllCategories: async (_, { lang = "vi" }, context) => {
            checkAdmin(context);
            const { db, sequelize, redis, lang: contextLang } = context;
            const currentLang = lang || contextLang || 'vi';
            const cacheKey = `adminCategories:lang${currentLang}`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] Admin Categories (Lang: ${currentLang}) from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] Admin Categories (Lang: ${currentLang}). Fetching from DB.`);
                const orderByNameField = (currentLang === 'en' && db.Category.rawAttributes.category_name_en) ? 'category_name_en' : 'category_name_vi';
                const categories = await db.Category.findAll({ order: [[orderByNameField, 'ASC']] });
                const plainCategories = categories.map(c => c.get({plain: true}));
                if (redis && typeof redis.set === 'function' && plainCategories.length > 0) { // Only cache if there are results
                    await redis.set(cacheKey, JSON.stringify(plainCategories), 'EX', 3600 * 6);
                    // logger.debug(`[Cache SET] Admin Categories (Lang: ${currentLang}) cached.`);
                }
                return categories;
            } catch (e) {
                logger.error("Error fetching admin categories:", e);
                throw new GraphQLError('Could not fetch categories for admin.');
            }
        },
        adminGetAllBlogPosts: async (_, { filter = {}, limit = 10, offset = 0, lang = "vi" }, context) => {
            checkAdmin(context);
            const { db, sequelize, redis, lang: contextLang } = context;
            const currentLang = lang || contextLang || 'vi';
            const filterKey = generateCacheKeyFromObject(filter);
            const cacheKey = `adminBlogPosts:${filterKey}:limit${limit}:offset${offset}:lang${currentLang}`;

            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] AdminBlogPosts List from Redis for key: ${cacheKey}`);
                        return JSON.parse(cachedData);
                    }
                }
            } catch (cacheError) { logger.error(`[Cache GET Error] AdminBlogPosts List for key ${cacheKey}:`, cacheError); }
            // logger.debug(`[Cache MISS] AdminBlogPosts List for key ${cacheKey}. Fetching from DB.`);

            try {
                const whereClause = {};
                const includeClause = [];

                if (filter.status) whereClause.status = filter.status;
                if (filter.tag_slug) {
                    const tag = await db.BlogTag.findOne({where: {slug: filter.tag_slug}});
                    if(tag){
                        includeClause.push({ model: db.BlogTag, as: 'tags', where: { tag_id: tag.tag_id }, required: true, through: {attributes: []}, attributes: [] });
                    } else {
                        return { count: 0, posts: [] };
                    }
                }
                if (filter.author_id) whereClause.user_id = filter.author_id;
                if (filter.search_term) {
                    const searchTermLike = `%${filter.search_term}%`;
                    const orConditions = [ { title_vi: { [Op.like]: searchTermLike } } ];
                     if (db.BlogPost.rawAttributes.title_en) {
                        orConditions.push({ title_en: { [Op.like]: searchTermLike } });
                    }
                    whereClause[Op.or] = orConditions;
                }
                const { count: countResult, rows: postIdsRows } = await db.BlogPost.findAndCountAll({
                    where: whereClause,
                    include: includeClause,
                    attributes: ['post_id'],
                    limit: parseInt(limit, 10),
                    offset: parseInt(offset, 10),
                    order: [['created_at', 'DESC']],
                    group: ['BlogPost.post_id'],
                    distinct: true,
                    subQuery: includeClause.length > 0
                });
                const totalCount = Array.isArray(countResult) ? countResult.length : (countResult?.count || 0);
                if (postIdsRows.length === 0) return { count: totalCount, posts: [] };

                const postIds = postIdsRows.map(p => p.post_id);
                const postsWithFullDetails = await db.BlogPost.findAll({
                    where: { post_id: { [Op.in]: postIds } },
                    order: sequelize.literal(`FIELD(\`BlogPost\`.\`post_id\`, ${postIds.map(id => sequelize.escape(id)).join(',')})`)
                });

                const resultData = { count: totalCount, posts: postsWithFullDetails.map(p => p.get({plain: true})) };
                if (redis && typeof redis.set === 'function' && resultData.posts.length > 0) { // Only cache if there are results
                    await redis.set(cacheKey, JSON.stringify(resultData), 'EX', 3600);
                    // logger.debug(`[Cache SET] AdminBlogPosts List cached for key ${cacheKey}.`);
                }
                return { count: totalCount, posts: postsWithFullDetails };
            } catch (error) {
                logger.error("Error fetching all blog posts for admin:", error);
                throw new GraphQLError("Could not fetch blog posts for admin.");
            }
        },
        adminGetBlogPostById: async (_, { id, lang = "vi" }, context) => {
            checkAdmin(context);
            const { db, redis, lang: contextLang } = context;
            // const currentLang = lang || contextLang || 'vi';
            const cacheKey = `adminBlogPost:${id}`; // Lang independent for the object itself
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] Admin BlogPost by ID ${id} from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
            } catch (cacheError) { logger.error(`[Cache GET Error] Admin BlogPost by ID ${id}:`, cacheError); }
            // logger.debug(`[Cache MISS] Admin BlogPost by ID ${id}. Fetching from DB.`);

            try {
                const post = await db.BlogPost.findByPk(id);
                if (!post) throw new GraphQLError("Blog post not found.", { extensions: { code: 'NOT_FOUND' } });
                const plainPost = post.get({plain: true});
                if (redis && typeof redis.set === 'function' && plainPost) {
                    await redis.set(cacheKey, JSON.stringify(plainPost), 'EX', 3600);
                    // logger.debug(`[Cache SET] Admin BlogPost by ID ${id} cached.`);
                }
                return post;
            } catch (error) {
                logger.error(`Error fetching blog post by ID ${id} for admin:`, error);
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError("Could not fetch blog post for admin.");
            }
        },
        adminGetAllBlogTags: async (_, { lang = "vi" }, context) => {
            checkAdmin(context);
            const { db, sequelize, redis, lang: contextLang } = context;
            const currentLang = lang || contextLang || 'vi';
            const cacheKey = `adminBlogTags:lang${currentLang}`;
            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] Admin BlogTags (Lang: ${currentLang}) from Redis.`);
                        return JSON.parse(cachedData);
                    }
                }
                // logger.debug(`[Cache MISS] Admin BlogTags (Lang: ${currentLang}). Fetching from DB.`);
                const orderByNameField = (currentLang === 'en' && db.BlogTag.rawAttributes.name_en) ? 'name_en' : 'name_vi';
                const tags = await db.BlogTag.findAll({ order: [[orderByNameField, 'ASC']] });
                const plainTags = tags.map(t => t.get({plain: true}));
                if (redis && typeof redis.set === 'function' && plainTags.length > 0) { // Only cache if there are results
                    await redis.set(cacheKey, JSON.stringify(plainTags), 'EX', 3600 * 6);
                    // logger.debug(`[Cache SET] Admin BlogTags (Lang: ${currentLang}) cached.`);
                }
                return tags;
            } catch (error) {
                logger.error("Error fetching blog tags for admin:", error);
                throw new GraphQLError("Could not fetch blog tags for admin.");
            }
        },
        adminGetAllBlogComments: async (_, { post_id, filter_status, limit = 10, offset = 0 }, context) => {
            checkAdmin(context);
            const { db, redis } = context;
            const filterKey = `post${post_id || 'all'}!status${filter_status || 'all'}`;
            const cacheKey = `adminBlogComments:${filterKey}:limit${limit}:offset${offset}`;

            try {
                if (redis && typeof redis.get === 'function') {
                    const cachedData = await redis.get(cacheKey);
                    if (cachedData) {
                        // logger.debug(`[Cache HIT] AdminBlogComments from Redis for key: ${cacheKey}`);
                        return JSON.parse(cachedData);
                    }
                }
            } catch (cacheError) { logger.error(`[Cache GET Error] AdminBlogComments for key ${cacheKey}:`, cacheError); }
            // logger.debug(`[Cache MISS] AdminBlogComments for key ${cacheKey}. Fetching from DB.`);

            try {
                const whereClause = {};
                if (post_id) whereClause.post_id = post_id;
                if (filter_status) whereClause.status = filter_status;

                const { count, rows } = await db.BlogComment.findAndCountAll({
                    where: whereClause,
                    include: [
                        { model: db.Customer, as: 'commentAuthor', attributes: ['customer_id', 'customer_name', 'username'] },
                        { model: db.BlogPost, as: 'post', attributes: ['post_id', 'title_vi', 'title_en'] }
                    ],
                    order: [['created_at', 'DESC']],
                    limit: parseInt(limit, 10),
                    offset: parseInt(offset, 10)
                });
                const resultData = { count, comments: rows.map(r => r.get({plain: true})) };
                if (redis && typeof redis.set === 'function' && resultData.comments.length > 0) { // Only cache if there are results
                    await redis.set(cacheKey, JSON.stringify(resultData), 'EX', 600);
                    // logger.debug(`[Cache SET] AdminBlogComments cached for key ${cacheKey}.`);
                }
                return { count, comments: rows };
            } catch (error) {
                logger.error("Error fetching all blog comments for admin:", error);
                throw new GraphQLError("Could not fetch blog comments for admin.");
            }
        },
    },

    Mutation: {
        register: async (_, { input }, context) => {
            const { db, redis } = context;
            const {username, customer_name, customer_email, customer_password, customer_tel, customer_address} = input;

            if(!customer_name || !customer_email || !customer_password || !customer_tel) {
                throw new GraphQLError('Name, email, password, and phone are required.', {extensions: {code: 'BAD_USER_INPUT'}});
            }
            try {
                const existingEmail = await db.Customer.findOne({ where: { customer_email } });
                if (existingEmail) throw new GraphQLError('Email already exists.', { extensions: { code: 'BAD_USER_INPUT', field: 'customer_email' } });

                const existingTel = await db.Customer.findOne({ where: { customer_tel } });
                if (existingTel) throw new GraphQLError('Phone number already exists.', { extensions: { code: 'BAD_USER_INPUT', field: 'customer_tel' } });

                if (username) {
                    const existingUsername = await db.Customer.findOne({ where: { username } });
                    if (existingUsername) throw new GraphQLError('Username already exists.', { extensions: { code: 'BAD_USER_INPUT', field: 'username' } });
                }

                const newCustomer = await db.Customer.create({
                    ...input,
                    username: username || null,
                    customer_address: customer_address || null,
                    virtual_balance: 2000000,
                    isAdmin: false
                });

                await clearCacheKeysByPattern(redis, 'adminUsers:*');
                await clearCacheKeysByPattern(redis, 'adminDashboardStats');

                const token = generateToken(newCustomer);
                const customerData = newCustomer.toJSON();
                delete customerData.customer_password;
                delete customerData.password_reset_token;
                delete customerData.password_reset_expires;

                return {token, ...customerData};
            } catch (error) {
                 logger.error("Registration error:", error);
                if (error instanceof GraphQLError) throw error;
                if (error.name === 'SequelizeUniqueConstraintError') {
                    const field = error.fields && Object.keys(error.fields)[0];
                    throw new GraphQLError(`The ${field || 'provided value'} is already in use.`, { extensions: { code: 'BAD_USER_INPUT' } });
                }
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
                    // TODO: Implement actual email sending logic here
                }
                return {success: true, message: 'If your email is registered, you will receive password reset instructions.'};
            } catch (error) {
                logger.error("Forgot password error:", error);
                throw new GraphQLError('Error processing forgot password request.');
            }
        },
        resetPassword: async (_, { token, newPassword }, context) => {
            const { db, redis } = context;
            if (!token || !newPassword) {
                throw new GraphQLError('Token and new password are required.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
             if(newPassword.length < 6) {
                throw new GraphQLError('Password must be at least 6 characters long.', { extensions: { code: 'BAD_USER_INPUT' } });
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

                customer.customer_password = newPassword;
                customer.password_reset_token = null;
                customer.password_reset_expires = null;
                await customer.save();

                await clearSpecificCacheKeys(redis, [`profile:${customer.customer_id}`]);

                const loginToken = generateToken(customer);
                const customerData = customer.toJSON();
                delete customerData.customer_password; // Ensure password is not returned
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
            const { db, sequelize, redis, lang } = context;
            const customer_id = context.user.id;

            if (!items || items.length === 0) {
                throw new GraphQLError('Đơn hàng phải có ít nhất một sản phẩm.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            const transaction = await sequelize.transaction();
            try {
                const customer = await db.Customer.findByPk(customer_id, {
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });
                if (!customer) {
                    throw new GraphQLError('Không tìm thấy thông tin khách hàng.', { extensions: { code: 'NOT_FOUND' } });
                }
                let currentVirtualBalance = parseFloat(customer.virtual_balance) || 0;
                let grossTotalAmount = 0;
                let totalDiscountApplied = 0;
                const saleItemsData = [];
                const inventoryUpdatePromises = [];
                const productCacheKeysToClear = new Set();


                for (const itemInput of items) {
                    if (!itemInput.product_id || !itemInput.product_qty || itemInput.product_qty <= 0) {
                        throw new Error(`Sản phẩm ID ${itemInput.product_id} có thông tin không hợp lệ.`);
                    }
                    const product = await db.Product.findByPk(itemInput.product_id, { transaction });
                    if (!product || !product.is_active) {
                        throw new Error(`Sản phẩm với ID ${itemInput.product_id} không tồn tại hoặc không hoạt động.`);
                    }
                    productCacheKeysToClear.add(`product:${itemInput.product_id}`);
                    productCacheKeysToClear.add(`adminProduct:${itemInput.product_id}`);


                    const inventoryWhere = {
                        product_id: itemInput.product_id,
                        size_id: itemInput.size_id || null,
                        color_id: itemInput.color_id || null
                    };
                    const inventoryRecord = await db.Inventory.findOne({
                        where: inventoryWhere,
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    });
                    const productNameForDisplay = lang === 'en' && product.product_name_en ? product.product_name_en : product.product_name_vi;
                    if (!inventoryRecord) {
                        throw new Error(`Không tìm thấy biến thể tồn kho cho sản phẩm: ${productNameForDisplay} (SizeID: ${itemInput.size_id || 'N/A'}, ColorID: ${itemInput.color_id || 'N/A'}).`);
                    }
                    if (inventoryRecord.quantity < itemInput.product_qty) {
                        throw new Error(`Không đủ hàng cho sản phẩm: ${productNameForDisplay} (Biến thể SKU: ${inventoryRecord.sku || 'N/A'}). Yêu cầu: ${itemInput.product_qty}, Hiện có: ${inventoryRecord.quantity}.`);
                    }
                    inventoryUpdatePromises.push(
                        db.Inventory.decrement('quantity', {
                            by: itemInput.product_qty,
                            where: { inventory_id: inventoryRecord.inventory_id },
                            transaction
                        })
                    );
                    const priceAtSale = parseFloat(product.product_price);
                    let discountForItem = 0;
                    if (currentVirtualBalance > 0) {
                        const maxDiscountPerItem = 100000;
                        const itemTotalValue = priceAtSale * itemInput.product_qty;
                        discountForItem = Math.min(maxDiscountPerItem, currentVirtualBalance, itemTotalValue);
                        currentVirtualBalance -= discountForItem;
                        totalDiscountApplied += discountForItem;
                    }
                    saleItemsData.push({
                        product_id: itemInput.product_id,
                        size_id: itemInput.size_id || null,
                        color_id: itemInput.color_id || null,
                        product_qty: itemInput.product_qty,
                        price_at_sale: priceAtSale,
                        discount_amount: discountForItem,
                        product_name_at_sale: productNameForDisplay,
                        product_sku_at_sale: inventoryRecord.sku || null
                    });
                    grossTotalAmount += priceAtSale * itemInput.product_qty;
                }
                await Promise.all(inventoryUpdatePromises);
                const newSale = await db.Sale.create({
                    customer_id,
                    sale_date: new Date(),
                    sale_status: 'Pending',
                    shipping_name: shippingInfo.name || customer.customer_name,
                    shipping_phone: shippingInfo.phone || customer.customer_tel,
                    shipping_address: shippingInfo.address || customer.customer_address,
                    shipping_notes: shippingInfo.notes,
                    payment_method: shippingInfo.payment_method || 'COD',
                }, { transaction });
                saleItemsData.forEach(item => item.sale_id = newSale.sale_id);
                await db.SalesItems.bulkCreate(saleItemsData, { transaction });
                const finalSubtotal = grossTotalAmount;
                const finalDiscount = totalDiscountApplied;
                const shippingFee = parseFloat(shippingInfo.fee) || 0;
                const finalTotalAmount = finalSubtotal - finalDiscount + shippingFee;
                await db.SalesTotals.create({
                    sale_id: newSale.sale_id,
                    subtotal_amount: finalSubtotal,
                    discount_total: finalDiscount,
                    shipping_fee: shippingFee,
                    total_amount: finalTotalAmount
                }, { transaction });
                if (totalDiscountApplied > 0) {
                    customer.virtual_balance = currentVirtualBalance;
                    await customer.save({ transaction });
                }
                await db.SalesHistory.create({
                    sale_id: newSale.sale_id,
                    history_date: new Date(),
                    history_status: 'Pending',
                    history_notes: `Đơn hàng được tạo. Số dư ảo đã sử dụng: ${totalDiscountApplied.toLocaleString('vi-VN')} VND. Tổng tiền: ${finalTotalAmount.toLocaleString('vi-VN')} VND.`
                }, { transaction });
                await transaction.commit();

                await clearCacheKeysByPattern(redis, `mySales:${customer_id}:*`);
                await clearCacheKeysByPattern(redis, 'adminSales:*');
                await clearCacheKeysByPattern(redis, 'adminDashboardStats');
                await clearSpecificCacheKeys(redis, Array.from(productCacheKeysToClear));
                await clearCacheKeysByPattern(redis, 'products:*');
                await clearCacheKeysByPattern(redis, 'adminProducts:*');
                await clearSpecificCacheKeys(redis, [`profile:${customer_id}`]);

                logger.info(`Sale created successfully: ID ${newSale.sale_id} for customer ${customer_id}.`);
                return db.Sale.findByPk(newSale.sale_id, {
                    include: [
                        { model: db.Customer, as: 'customer', attributes: { exclude: ['customer_password', 'password_reset_token', 'password_reset_expires'] } },
                        {
                            model: db.SalesItems, as: 'items',
                            include: [
                                { model: db.Product, as: 'product' },
                                { model: db.Size, as: 'size' },
                                { model: db.Color, as: 'color' }
                            ]
                        },
                        { model: db.SalesTotals, as: 'totals' },
                        { model: db.SalesHistory, as: 'history', order: [['history_date', 'DESC']] }
                    ]
                });
            } catch (error) {
                if (transaction && !transaction.finished) {
                    await transaction.rollback();
                }
                logger.error('Error creating sale:', { message: error.message, stack: error.stack, extensions: error.extensions });
                throw new GraphQLError(error.message || 'Không thể tạo đơn hàng vào lúc này.', {
                    extensions: { code: error.extensions?.code || 'INTERNAL_SERVER_ERROR' }
                });
            }
        },
        adminCreateProduct: async (_, { input }, context) => {
            checkAdmin(context);
            const { db, sequelize, redis } = context;
            const transaction = await sequelize.transaction();
            try {
                const {
                    product_name_vi, product_name_en, product_description_vi, product_description_en,
                    product_price, category_id, collection_ids = [], is_new_arrival = false, is_active = true,
                    color_variants_data = [], general_gallery_images = []
                } = input;

                if (!product_name_vi || product_name_vi.trim() === '') {
                    throw new GraphQLError('Vietnamese product name is required.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                if (typeof product_price !== 'number' || product_price < 0) {
                    throw new GraphQLError('Product price must be a non-negative number.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                 if (color_variants_data.length === 0 && general_gallery_images.length === 0) {
                    throw new GraphQLError('Product must have at least one color variant or one general gallery image.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                for (const variant of color_variants_data) {
                    if (!variant.color_id) throw new GraphQLError('Each color variant must have a color_id.', { extensions: { code: 'BAD_USER_INPUT' } });
                    if (!variant.inventory_entries || variant.inventory_entries.length === 0) {
                        throw new GraphQLError(`Color variant for color ID ${variant.color_id} must have at least one inventory entry.`, { extensions: { code: 'BAD_USER_INPUT' } });
                    }
                    for (const inv of variant.inventory_entries) {
                        if (inv.quantity === undefined || inv.quantity === null || parseInt(inv.quantity) < 0) {
                            throw new GraphQLError(`Inventory quantity for color ID ${variant.color_id} must be a non-negative integer.`, { extensions: { code: 'BAD_USER_INPUT' } });
                        }
                    }
                }


                const newProduct = await db.Product.create({
                    product_name_vi: product_name_vi.trim(),
                    product_name_en: product_name_en ? product_name_en.trim() : null,
                    product_description_vi: product_description_vi ? product_description_vi.trim() : null,
                    product_description_en: product_description_en ? product_description_en.trim() : null,
                    product_price, category_id: category_id || null, is_new_arrival, is_active,
                }, { transaction });

                for (const variantInput of color_variants_data) {
                    const { color_id: variantColorId, variant_specific_images = [], inventory_entries = [] } = variantInput;
                    if (!variantColorId) continue;
                    for (const imgInput of variant_specific_images) {
                         if (!imgInput.image_url) continue;
                        await db.ProductImage.create({
                            product_id: newProduct.product_id, color_id: variantColorId, // Assign variant's color_id
                            image_url: imgInput.image_url, alt_text_vi: imgInput.alt_text_vi || null,
                            alt_text_en: imgInput.alt_text_en || null, display_order: imgInput.display_order === undefined ? 0 : parseInt(imgInput.display_order, 10),
                        }, { transaction });
                    }
                    for (const invInput of inventory_entries) {
                        await db.Inventory.create({
                            product_id: newProduct.product_id, color_id: variantColorId, // Assign variant's color_id
                            size_id: invInput.size_id || null, quantity: parseInt(invInput.quantity, 10) || 0,
                            sku: invInput.sku || null,
                        }, { transaction });
                    }
                }
                for (const imgInput of general_gallery_images) {
                     if (!imgInput.image_url) continue;
                    await db.ProductImage.create({
                        product_id: newProduct.product_id, color_id: null, // General images have null color_id
                        image_url: imgInput.image_url, alt_text_vi: imgInput.alt_text_vi || null,
                        alt_text_en: imgInput.alt_text_en || null, display_order: imgInput.display_order === undefined ? 0 : parseInt(imgInput.display_order, 10),
                    }, { transaction });
                }

                if (collection_ids && collection_ids.length > 0) {
                    await newProduct.setCollections(collection_ids, { transaction });
                }
                await transaction.commit();

                await clearCacheKeysByPattern(redis, 'products:*');
                await clearCacheKeysByPattern(redis, 'adminProducts:*');
                await clearCacheKeysByPattern(redis, 'adminDashboardStats');
                if (category_id) await clearSpecificCacheKeys(redis, [`category:${category_id}:products`]);
                if (collection_ids && collection_ids.length > 0) {
                    collection_ids.forEach(async colId => await clearSpecificCacheKeys(redis, [`collection:${colId}:products`]));
                }

                return db.Product.findByPk(newProduct.product_id, {
                    include: [
                        { model: db.Category, as: 'category', required: false },
                        { model: db.Collection, as: 'collections', required: false, through: { attributes: [] } },
                        { model: db.ProductImage, as: 'images', required: false, order: [['display_order', 'ASC']], include: [{ model: db.Color, as: 'color', required: false }] },
                        {
                            model: db.Inventory,
                            as: 'inventoryItems', // Alias for Product -> Inventory
                            required: false,
                            include: [
                                { model: db.Size, as: 'size', required: false },
                                { model: db.Color, as: 'colorDetail', required: false } // CORRECT ALIAS for Inventory -> Color
                            ]
                        }
                    ]
                });
            } catch (error) {
                if (transaction && !transaction.finished) await transaction.rollback();
                logger.error("[adminCreateProduct resolver] Error:", error);
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError(`Failed to create product. ${error.message || ''}`);
            }
        },
        adminUpdateProduct: async (_, { input }, { db, sequelize, redis, user }) => {
            checkAdmin({ user });
            const {
                id: productId, product_name_vi, product_name_en, product_description_vi, product_description_en,
                product_price, category_id, collection_ids, is_new_arrival, is_active,
                color_variants_data, general_gallery_images
            } = input;

            if (!productId) {
                throw new GraphQLError('Product ID is required for update.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            if (product_name_vi !== undefined && product_name_vi.trim() === '') {
                throw new GraphQLError('Vietnamese product name cannot be empty if provided.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            if (product_price !== undefined && (typeof product_price !== 'number' || product_price < 0)) {
                throw new GraphQLError('Product price must be a non-negative number if provided.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            if (color_variants_data !== undefined && color_variants_data !== null) {
                 if (color_variants_data.length === 0 && (general_gallery_images === undefined || general_gallery_images === null || general_gallery_images.length === 0)) {
                    throw new GraphQLError('Product must have at least one color variant or one general gallery image if variants are being updated.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                for (const variant of color_variants_data) {
                    if (!variant.color_id) throw new GraphQLError('Each color variant must have a color_id.', { extensions: { code: 'BAD_USER_INPUT' } });
                    if (!variant.inventory_entries || variant.inventory_entries.length === 0) {
                         throw new GraphQLError(`Color variant for color ID ${variant.color_id} must have at least one inventory entry.`, { extensions: { code: 'BAD_USER_INPUT' } });
                    }
                    for (const inv of variant.inventory_entries) {
                        if (inv.quantity === undefined || inv.quantity === null || parseInt(inv.quantity) < 0) {
                            throw new GraphQLError(`Inventory quantity for color ID ${variant.color_id} must be a non-negative integer.`, { extensions: { code: 'BAD_USER_INPUT' } });
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
                const oldCategoryId = product.category_id;
                const oldCollectionIds = (await product.getCollections({ attributes: ['collection_id'], transaction })).map(c => c.collection_id);

                const updateData = {};
                if (product_name_vi !== undefined) updateData.product_name_vi = product_name_vi.trim();
                if (product_name_en !== undefined) updateData.product_name_en = product_name_en ? product_name_en.trim() : null;
                if (product_description_vi !== undefined) updateData.product_description_vi = product_description_vi ? product_description_vi.trim() : null;
                if (product_description_en !== undefined) updateData.product_description_en = product_description_en ? product_description_en.trim() : null;
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
                             const { color_id: variantColorId, variant_specific_images = [], inventory_entries = [] } = variantInput;
                            if (!variantColorId) continue;
                            for (const imgInput of variant_specific_images) {
                                if (!imgInput.image_url) continue;
                                await db.ProductImage.create({
                                    product_id: productId, color_id: variantColorId,
                                    image_url: imgInput.image_url, alt_text_vi: imgInput.alt_text_vi || null,
                                    alt_text_en: imgInput.alt_text_en || null, display_order: imgInput.display_order === undefined ? 0 : parseInt(imgInput.display_order, 10),
                                }, { transaction });
                            }
                            for (const invInput of inventory_entries) {
                                 if (invInput.quantity === undefined) continue;
                                await db.Inventory.create({
                                    product_id: productId, color_id: variantColorId,
                                    size_id: invInput.size_id || null, quantity: parseInt(invInput.quantity, 10) || 0, sku: invInput.sku || null,
                                }, { transaction });
                            }
                        }
                    }
                    if (general_gallery_images) {
                        for (const imgInput of general_gallery_images) {
                             if (!imgInput.image_url) continue;
                            await db.ProductImage.create({
                                product_id: productId, color_id: null,
                                image_url: imgInput.image_url, alt_text_vi: imgInput.alt_text_vi || null,
                                alt_text_en: imgInput.alt_text_en || null, display_order: imgInput.display_order === undefined ? 0 : parseInt(imgInput.display_order, 10),
                            }, { transaction });
                        }
                    }
                }


                if (collection_ids !== undefined) {
                    await product.setCollections(collection_ids, { transaction });
                }

                await transaction.commit();

                const keysToClear = [
                    `product:${productId}`,
                    `adminProduct:${productId}`
                ];
                await clearSpecificCacheKeys(redis, keysToClear);
                await clearCacheKeysByPattern(redis, 'products:*');
                await clearCacheKeysByPattern(redis, 'adminProducts:*');
                await clearCacheKeysByPattern(redis, 'adminDashboardStats');

                if (category_id !== undefined && category_id !== oldCategoryId) {
                    if (oldCategoryId) await clearSpecificCacheKeys(redis, [`category:${oldCategoryId}:products`]);
                    if (category_id) await clearSpecificCacheKeys(redis, [`category:${category_id}:products`]);
                }
                if (collection_ids !== undefined) {
                    const newCollectionIds = collection_ids || [];
                    const changedCollections = [...new Set([...oldCollectionIds, ...newCollectionIds])];
                    changedCollections.forEach(async colId => await clearSpecificCacheKeys(redis, [`collection:${colId}:products`]));
                }

                return db.Product.findByPk(productId, {
                    include: [
                        { model: db.Category, as: 'category', required: false },
                        { model: db.Collection, as: 'collections', required: false, through: { attributes: [] } },
                        { model: db.ProductImage, as: 'images', required: false, order: [['display_order', 'ASC']], include: [{ model: db.Color, as: 'color', required: false }] },
                        {
                            model: db.Inventory,
                            as: 'inventoryItems',
                            required: false,
                            include: [
                                { model: db.Size, as: 'size', required: false },
                                { model: db.Color, as: 'colorDetail', required: false } // CORRECT ALIAS
                            ]
                        }
                    ]
                });
            } catch (error) {
                if (transaction && !transaction.finished) await transaction.rollback();
                logger.error(`[adminUpdateProduct resolver] Error for ID ${productId}:`, error);
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError(`Failed to update product. ${error.message || ''}`);
            }
        },
        adminDeleteProduct: async (_, { id }, { db, sequelize, redis, user }) => {
            checkAdmin({ user });
            const transaction = await sequelize.transaction();
            try {
                const product = await db.Product.findByPk(id, { transaction, include: ['category', 'collections'] });
                if (!product) {
                    await transaction.rollback();
                    throw new GraphQLError('Product not found.', { extensions: { code: 'NOT_FOUND' } });
                }

                const salesItemExists = await db.SalesItems.findOne({ where: { product_id: id }, transaction });
                if (salesItemExists) {
                    await transaction.rollback();
                    throw new GraphQLError('Cannot delete product that has been sold. Consider deactivating it.', { extensions: { code: 'BAD_REQUEST' } });
                }
                const categoryId = product.category_id;
                const collectionIds = product.collections ? product.collections.map(c => c.collection_id) : [];

                await product.destroy({ transaction });
                await transaction.commit();

                const keysToClear = [
                    `product:${id}`,
                    `adminProduct:${id}`
                ];
                await clearSpecificCacheKeys(redis, keysToClear);
                await clearCacheKeysByPattern(redis, 'products:*');
                await clearCacheKeysByPattern(redis, 'adminProducts:*');
                await clearCacheKeysByPattern(redis, 'adminDashboardStats');
                if (categoryId) await clearSpecificCacheKeys(redis, [`category:${categoryId}:products`]);
                collectionIds.forEach(async colId => await clearSpecificCacheKeys(redis, [`collection:${colId}:products`]));

                return true;
            } catch (e) {
                if (transaction && !transaction.finished) {
                    await transaction.rollback();
                }
                logger.error(`Error deleting product ID ${id}:`, e);
                if (e instanceof GraphQLError) throw e;
                throw new GraphQLError('Failed to delete product.');
            }
        },
        adminUpdateSaleStatus: async (_, { saleId, status, notes }, { db, sequelize, redis, user }) => {
            checkAdmin({ user });
            const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Completed', 'Cancelled'];
            if (!allowedStatuses.includes(status)) {
                throw new GraphQLError('Invalid sale status provided.', { extensions: { code: 'BAD_USER_INPUT' } });
            }

            const transaction = await sequelize.transaction();
            try {
                const sale = await db.Sale.findByPk(saleId, {
                    include: [{ model: db.SalesItems, as: 'items' }],
                    transaction
                });
                if (!sale) {
                    await transaction.rollback();
                    throw new GraphQLError('Sale not found.', { extensions: { code: 'NOT_FOUND' } });
                }

                const oldStatus = sale.sale_status;
                if (oldStatus === status && (!notes || notes.trim() === '')) {
                    await transaction.rollback();
                    logger.info(`Sale ${saleId} status is already ${status} and no new notes. No update performed.`);
                    return db.Sale.findByPk(saleId, { include: [ /* relevant includes */ ] });
                }


                sale.sale_status = status;
                await sale.save({ transaction });

                await db.SalesHistory.create({
                    sale_id: saleId,
                    history_date: new Date(),
                    history_status: status,
                    history_notes: notes ? notes.trim() : `Admin changed status from "${oldStatus}" to "${status}".`
                }, { transaction });

                if (status === 'Cancelled' && ['Pending', 'Processing', 'Shipped', 'Delivered', 'Completed'].includes(oldStatus)) {
                    if (sale.items && sale.items.length > 0) {
                        for (const item of sale.items) {
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

                    const saleTotals = await db.SalesTotals.findOne({ where: { sale_id: saleId }, transaction });
                    if (saleTotals && saleTotals.discount_total > 0 && sale.customer_id) {
                        const customerToRestore = await db.Customer.findByPk(sale.customer_id, { transaction, lock: transaction.LOCK.UPDATE });
                        if (customerToRestore) {
                            customerToRestore.virtual_balance = (parseFloat(customerToRestore.virtual_balance) || 0) + parseFloat(saleTotals.discount_total);
                            await customerToRestore.save({ transaction });
                            logger.info(`Restored ${saleTotals.discount_total} virtual balance to customer ${sale.customer_id} for cancelled sale ${saleId}`);
                        }
                    }
                }

                await transaction.commit();

                const customerId = sale.customer_id;
                const keysToInvalidate = [
                    `adminSaleDetail:${saleId}`,
                    `mySaleDetail:${saleId}:user${customerId}`,
                    `sale:${saleId}`
                ];
                await clearSpecificCacheKeys(redis, keysToInvalidate);
                await clearCacheKeysByPattern(redis, 'adminSales:*');
                if (customerId) {
                    await clearCacheKeysByPattern(redis, `mySales:${customerId}:*`);
                    await clearSpecificCacheKeys(redis, [`profile:${customerId}`]);
                }
                await clearCacheKeysByPattern(redis, 'adminDashboardStats');

                if (status === 'Cancelled' && sale.items && sale.items.length > 0) {
                    const productKeysToClear = new Set();
                    for (const item of sale.items) {
                        if (item.product_id) {
                            productKeysToClear.add(`product:${item.product_id}`);
                            productKeysToClear.add(`adminProduct:${item.product_id}`);
                        }
                    }
                    await clearSpecificCacheKeys(redis, Array.from(productKeysToClear));
                    await clearCacheKeysByPattern(redis, 'products:*');
                    await clearCacheKeysByPattern(redis, 'adminProducts:*');
                }

                return db.Sale.findByPk(saleId, {
                     include: [
                        { model: db.Customer, as: 'customer', attributes: {exclude: ['customer_password', 'password_reset_token', 'password_reset_expires']} },
                        { model: db.SalesItems, as: 'items', include: [{ model: db.Product, as: 'product' }, { model: db.Size, as: 'size' }, { model: db.Color, as: 'color' }] },
                        { model: db.SalesTotals, as: 'totals' },
                        { model: db.SalesHistory, as: 'history', order: [['history_date', 'DESC']] }
                    ]
                });
            } catch (e) {
                if (transaction && !transaction.finished) {
                    await transaction.rollback();
                }
                logger.error(`Error updating sale status for ID ${saleId}:`, e);
                if (e instanceof GraphQLError) throw e;
                throw new GraphQLError('Failed to update sale status.');
            }
        },
        adminCreateCategory: async (_, { input }, context) => {
            checkAdmin(context);
            const { db, redis } = context;
            const { category_name_vi, category_name_en } = input;
            if (!category_name_vi || category_name_vi.trim() === '') {
                throw new GraphQLError('Vietnamese category name is required.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            try {
                const newCategory = await db.Category.create({ category_name_vi: category_name_vi.trim(), category_name_en: category_name_en ? category_name_en.trim() : null });
                await clearCacheKeysByPattern(redis, 'categories:*');
                await clearCacheKeysByPattern(redis, 'adminCategories:*');
                await clearCacheKeysByPattern(redis, 'adminProductOptions');
                return newCategory;
            } catch (e) {
                if (e.name === 'SequelizeUniqueConstraintError') {
                    const field = e.fields && Object.keys(e.fields)[0];
                    throw new GraphQLError(`A category with this name (${field === 'category_name_en' ? 'English name' : 'Vietnamese name'}) already exists.`, { extensions: { code: 'BAD_USER_INPUT' } });
                }
                logger.error("Admin Create Category Error:", e);
                throw new GraphQLError('Failed to create category.');
            }
        },
        adminUpdateCategory: async (_, { id, input }, context) => {
            checkAdmin(context);
            const { db, redis } = context;
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
                await clearSpecificCacheKeys(redis, [`category:${id}`]);
                await clearCacheKeysByPattern(redis, 'categories:*');
                await clearCacheKeysByPattern(redis, 'adminCategories:*');
                await clearCacheKeysByPattern(redis, 'adminProductOptions');
                return category;
            } catch (e) {
                if (e.name === 'SequelizeUniqueConstraintError') {
                    const field = e.fields && Object.keys(e.fields)[0];
                    throw new GraphQLError(`Another category with this name (${field === 'category_name_en' ? 'English name' : 'Vietnamese name'}) already exists.`, { extensions: { code: 'BAD_USER_INPUT' } });
                }
                logger.error(`Error updating category ID ${id}:`, e);
                throw new GraphQLError('Failed to update category.');
            }
        },
        adminDeleteCategory: async (_, { id }, context) => {
            checkAdmin(context);
            const { db, sequelize, redis } = context;
            const transaction = await sequelize.transaction();
            try {
                const category = await db.Category.findByPk(id, { transaction });
                if (!category) {
                    await transaction.rollback();
                    throw new GraphQLError('Category not found.', { extensions: { code: 'NOT_FOUND' } });
                }
                await db.Product.update({ category_id: null }, { where: { category_id: id }, transaction });
                await category.destroy({ transaction });
                await transaction.commit();

                await clearSpecificCacheKeys(redis, [`category:${id}`]);
                await clearCacheKeysByPattern(redis, 'categories:*');
                await clearCacheKeysByPattern(redis, 'adminCategories:*');
                await clearCacheKeysByPattern(redis, 'adminProductOptions');
                await clearCacheKeysByPattern(redis, `products:filter!category_id_${id}*`);
                await clearCacheKeysByPattern(redis, `adminProducts:filter!category_id_${id}*`);
                return true;
            } catch (e) {
                if (transaction && !transaction.finished) {
                    await transaction.rollback();
                }
                logger.error(`Error deleting category ID ${id}:`, e);
                throw new GraphQLError('Failed to delete category. It might be in use or another error occurred.');
            }
        },
        adminCreateSize: async (_, { name }, context) => {
            checkAdmin(context); const {db, redis} = context;
            if (!name || name.trim() === '') throw new GraphQLError('Size name is required.', { extensions: { code: 'BAD_USER_INPUT' } });
            try {
                const newSize = await db.Size.create({size_name: name.trim()});
                await clearCacheKeysByPattern(redis, 'sizes');
                await clearCacheKeysByPattern(redis, 'adminSizes');
                await clearCacheKeysByPattern(redis, 'adminProductOptions');
                return newSize;
            } catch(e){
                if (e.name === 'SequelizeUniqueConstraintError') throw new GraphQLError('Size name already exists.');
                logger.error("Admin Create Size Error:", e);
                throw new GraphQLError('Failed to create size.');
            }
        },
        adminUpdateSize: async (_, { id, name }, context) => {
            checkAdmin(context); const {db, redis} = context;
            if (!name || name.trim() === '') throw new GraphQLError('Size name is required for update.', { extensions: { code: 'BAD_USER_INPUT' } });
            try {
                const size = await db.Size.findByPk(id);
                if(!size) throw new GraphQLError('Size not found.', {extensions: {code: 'NOT_FOUND'}});
                size.size_name = name.trim();
                await size.save();
                await clearSpecificCacheKeys(redis, [`size:${id}`]);
                await clearCacheKeysByPattern(redis, 'sizes');
                await clearCacheKeysByPattern(redis, 'adminSizes');
                await clearCacheKeysByPattern(redis, 'adminProductOptions');
                return size;
            } catch(e){
                if (e.name === 'SequelizeUniqueConstraintError') throw new GraphQLError('Another size with this name already exists.');
                logger.error(`Error updating size ID ${id}:`, e);
                throw new GraphQLError('Failed to update size.');
            }
        },
        adminDeleteSize: async (_, { id }, context) => {
            checkAdmin(context); const {db, sequelize, redis} = context;
            const transaction = await sequelize.transaction();
            try{
                const size = await db.Size.findByPk(id, { transaction });
                if (!size) {
                    await transaction.rollback();
                    throw new GraphQLError('Size not found.', { extensions: { code: 'NOT_FOUND' } });
                }
                await db.Inventory.update({ size_id: null }, { where: { size_id: id }, transaction });
                await db.SalesItems.update({ size_id: null }, { where: { size_id: id }, transaction });
                await size.destroy({ transaction });
                await transaction.commit();
                await clearSpecificCacheKeys(redis, [`size:${id}`]);
                await clearCacheKeysByPattern(redis, 'sizes');
                await clearCacheKeysByPattern(redis, 'adminSizes');
                await clearCacheKeysByPattern(redis, 'adminProductOptions');
                return true;
            } catch(e){
                 if (transaction && !transaction.finished) {
                    await transaction.rollback();
                }
                logger.error(`Error deleting size ID ${id}:`, e);
                throw new GraphQLError('Failed to delete size. It might be in use or another error occurred.');
            }
        },
        adminCreateColor: async (_, { input }, context) => {
            checkAdmin(context); const { db, redis } = context;
            const { color_name, color_name_en, color_hex } = input;
            if (!color_name || color_name.trim() === '') {
                throw new GraphQLError('Color name (Vietnamese) is required.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            if (color_hex && !/^#([0-9A-F]{3}){1,2}$/i.test(color_hex.trim())) {
                throw new GraphQLError('Invalid hex color format. Use #RRGGBB or #RGB.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            try {
                const newColor = await db.Color.create({
                    color_name: color_name.trim(),
                    color_name_en: color_name_en ? color_name_en.trim() : null,
                    color_hex: color_hex ? color_hex.trim().toUpperCase() : null
                });
                await clearCacheKeysByPattern(redis, 'publicColors:*');
                await clearCacheKeysByPattern(redis, 'adminColors:*');
                await clearCacheKeysByPattern(redis, 'adminProductOptions');
                return newColor;
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
            checkAdmin(context); const { db, redis } = context;
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
                await clearSpecificCacheKeys(redis, [`color:${id}`]);
                await clearCacheKeysByPattern(redis, 'publicColors:*');
                await clearCacheKeysByPattern(redis, 'adminColors:*');
                await clearCacheKeysByPattern(redis, 'adminProductOptions');
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
            checkAdmin(context); const {db, sequelize, redis} = context;
            const transaction = await sequelize.transaction();
            try{
                const color = await db.Color.findByPk(id, { transaction });
                if (!color) {
                    await transaction.rollback();
                    throw new GraphQLError('Color not found.', { extensions: { code: 'NOT_FOUND' } });
                }
                await db.Inventory.update({ color_id: null }, { where: { color_id: id }, transaction });
                await db.ProductImage.update({ color_id: null }, { where: { color_id: id }, transaction });
                await db.SalesItems.update({ color_id: null }, { where: { color_id: id }, transaction });
                await color.destroy({ transaction });
                await transaction.commit();
                await clearSpecificCacheKeys(redis, [`color:${id}`]);
                await clearCacheKeysByPattern(redis, 'publicColors:*');
                await clearCacheKeysByPattern(redis, 'adminColors:*');
                await clearCacheKeysByPattern(redis, 'adminProductOptions');
                return true;
            } catch(e){
                if (transaction && !transaction.finished) {
                    await transaction.rollback();
                }
                logger.error(`Error deleting color ID ${id}:`, e);
                throw new GraphQLError('Failed to delete color. It might be in use or another error occurred.');
            }
        },
        adminCreateCollection: async (_, { input }, context) => {
            checkAdmin(context); const { db, redis } = context;
            const { collection_name_vi, collection_name_en, collection_description_vi, collection_description_en, slug } = input;
            if (!collection_name_vi || collection_name_vi.trim() === '') {
                throw new GraphQLError('Vietnamese collection name is required.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            try {
                const finalSlug = await generateSlug(slug || collection_name_vi, db.Collection, slug, 'collection_id', null, context);
                const newCollection = await db.Collection.create({
                    collection_name_vi: collection_name_vi.trim(),
                    collection_name_en: collection_name_en ? collection_name_en.trim() : null,
                    collection_description_vi: collection_description_vi || null,
                    collection_description_en: collection_description_en || null,
                    slug: finalSlug
                });
                await clearCacheKeysByPattern(redis, 'collections:*');
                await clearCacheKeysByPattern(redis, 'adminCollections:*');
                await clearCacheKeysByPattern(redis, 'adminProductOptions');
                return newCollection;
            } catch (e) {
                if (e.name === 'SequelizeUniqueConstraintError') {
                    const field = e.fields && Object.keys(e.fields)[0];
                    throw new GraphQLError(`Collection ${field === 'slug' ? 'slug' : (field === 'unique_collection_name_en' ? 'English name' : 'Vietnamese name')} already exists.`, { extensions: { code: 'BAD_USER_INPUT' } });
                }
                logger.error("Admin Create Collection Error:", e);
                throw new GraphQLError('Failed to create collection.');
            }
        },
        adminUpdateCollection: async (_, { id, input }, context) => {
            checkAdmin(context); const { db, redis } = context;
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
                const oldSlug = collection.slug;

                const updateData = {};
                if (collection_name_vi !== undefined) updateData.collection_name_vi = collection_name_vi.trim();
                if (collection_name_en !== undefined) updateData.collection_name_en = collection_name_en ? collection_name_en.trim() : null;
                if (collection_description_vi !== undefined) updateData.collection_description_vi = collection_description_vi || null;
                if (collection_description_en !== undefined) updateData.collection_description_en = collection_description_en || null;

                if (inputSlug && inputSlug.trim() !== collection.slug) {
                    updateData.slug = await generateSlug(inputSlug.trim(), db.Collection, inputSlug.trim(), 'collection_id', id, context);
                } else if (!inputSlug && collection_name_vi && collection_name_vi.trim() !== collection.collection_name_vi) {
                     updateData.slug = await generateSlug(collection_name_vi.trim(), db.Collection, null, 'collection_id', id, context);
                }


                if (Object.keys(updateData).length > 0) {
                    await collection.update(updateData);
                }
                const newSlug = updateData.slug || oldSlug;
                await clearSpecificCacheKeys(redis, [`collection:${id}`, `collection:slug_${oldSlug}`, `collection:slug_${newSlug}`]);
                await clearCacheKeysByPattern(redis, 'collections:*');
                await clearCacheKeysByPattern(redis, 'adminCollections:*');
                await clearCacheKeysByPattern(redis, 'adminProductOptions');
                await clearCacheKeysByPattern(redis, `products:filter!collection_id_${id}*`);
                await clearCacheKeysByPattern(redis, `adminProducts:filter!collection_id_${id}*`);
                return collection;
            } catch (e) {
                if (e.name === 'SequelizeUniqueConstraintError') {
                    const field = e.fields && Object.keys(e.fields)[0];
                    throw new GraphQLError(`Another collection with this ${field === 'slug' ? 'slug' : (field === 'unique_collection_name_en' ? 'English name' : 'Vietnamese name')} already exists.`, { extensions: { code: 'BAD_USER_INPUT' } });
                }
                logger.error(`Error updating collection ID ${id}:`, e);
                throw new GraphQLError('Failed to update collection.');
            }
        },
        adminDeleteCollection: async (_, { id }, context) => {
            checkAdmin(context); const {db, sequelize, redis} = context;
            const transaction = await sequelize.transaction();
            try{
                const collection = await db.Collection.findByPk(id, { transaction });
                if (!collection) {
                    await transaction.rollback();
                    throw new GraphQLError('Collection not found.', { extensions: { code: 'NOT_FOUND' } });
                }
                const collectionSlug = collection.slug;
                await db.ProductCollection.destroy({ where: { collection_id: id }, transaction });
                await collection.destroy({ transaction });
                await transaction.commit();
                await clearSpecificCacheKeys(redis, [`collection:${id}`, `collection:slug_${collectionSlug}`]);
                await clearCacheKeysByPattern(redis, 'collections:*');
                await clearCacheKeysByPattern(redis, 'adminCollections:*');
                await clearCacheKeysByPattern(redis, 'adminProductOptions');
                await clearCacheKeysByPattern(redis, `products:filter!collection_id_${id}*`);
                await clearCacheKeysByPattern(redis, `adminProducts:filter!collection_id_${id}*`);
                return true;
            } catch(e){
                if (transaction && !transaction.finished) {
                    await transaction.rollback();
                }
                logger.error(`Error deleting collection ID ${id}:`, e);
                throw new GraphQLError('Failed to delete collection.');
            }
        },

        // Blog Mutations
        adminCreateBlogPost: async (_, { input }, context) => {
            checkAdmin(context); const { db, sequelize, redis } = context;
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
                    user_id: author_id, title_vi: title_vi.trim(), title_en: title_en ? title_en.trim() : null,
                    excerpt_vi: excerpt_vi || null, excerpt_en: excerpt_en || null,
                    content_html_vi: content_html_vi.trim(), content_html_en: content_html_en || null,
                    meta_title_vi, meta_title_en, meta_description_vi, meta_description_en,
                    slug: finalSlug, featured_image_url, status, visibility, allow_comments, template_key,
                    published_at: status === 'published' ? new Date() : null
                }, { transaction });

                if (tag_ids && tag_ids.length > 0) {
                    await newPost.setTags(tag_ids, { transaction });
                }

                await transaction.commit();
                await clearCacheKeysByPattern(redis, 'blogPosts:*');
                await clearCacheKeysByPattern(redis, 'adminBlogPosts:*');
                await clearCacheKeysByPattern(redis, 'adminDashboardStats');
                if (tag_ids && tag_ids.length > 0) {
                    for (const tagId of tag_ids) {
                        const tag = await db.BlogTag.findByPk(tagId);
                        if (tag) {
                            await clearSpecificCacheKeys(redis, [`blogTag:${tagId}:posts`, `blogTag:slug_${tag.slug}`]);
                            await clearCacheKeysByPattern(redis, `blogPosts:tag_slug${tag.slug}*`);
                            await clearCacheKeysByPattern(redis, `adminBlogPosts:tag_slug${tag.slug}*`);
                        }
                    }
                }
                return db.BlogPost.findByPk(newPost.post_id, {
                    include: [
                        { model: db.Customer, as: 'author', attributes: ['customer_id', 'customer_name', 'username'] },
                        { model: db.BlogTag, as: 'tags', through: { attributes: [] } }
                    ]
                });
            } catch (error) {
                if (transaction && !transaction.finished) {
                    await transaction.rollback();
                }
                logger.error("Error creating blog post:", error);
                if (error.name === 'SequelizeUniqueConstraintError' && error.fields && (error.fields.slug || (error.fields.PRIMARY && error.original?.constraint === 'BlogPost_slug_key'))) {
                    throw new GraphQLError("Slug already exists. Please provide a unique slug or leave it blank to auto-generate.", { extensions: { code: 'BAD_USER_INPUT' } });
                }
                throw new GraphQLError("Failed to create blog post.");
            }
        },
        adminUpdateBlogPost: async (_, { id, input }, context) => {
            checkAdmin(context); const { db, sequelize, redis } = context;
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
                const post = await db.BlogPost.findByPk(id, { transaction, include: ['tags'] });
                if (!post) {
                    await transaction.rollback();
                    throw new GraphQLError("Blog post not found.", { extensions: { code: 'NOT_FOUND' } });
                }
                const oldTagIds = post.tags.map(t => t.tag_id);
                const oldSlug = post.slug;

                const updateData = {};
                if (title_vi !== undefined) updateData.title_vi = title_vi.trim();
                if (title_en !== undefined) updateData.title_en = title_en ? title_en.trim() : null;
                if (excerpt_vi !== undefined) updateData.excerpt_vi = excerpt_vi || null;
                if (excerpt_en !== undefined) updateData.excerpt_en = excerpt_en || null;
                if (content_html_vi !== undefined) updateData.content_html_vi = content_html_vi.trim();
                if (content_html_en !== undefined) updateData.content_html_en = content_html_en || null;
                if (meta_title_vi !== undefined) updateData.meta_title_vi = meta_title_vi;
                if (meta_title_en !== undefined) updateData.meta_title_en = meta_title_en;
                if (meta_description_vi !== undefined) updateData.meta_description_vi = meta_description_vi;
                if (meta_description_en !== undefined) updateData.meta_description_en = meta_description_en;
                if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url;
                if (status !== undefined) {
                    updateData.status = status;
                    if (status === 'published' && post.status !== 'published') {
                        updateData.published_at = new Date();
                    } else if (status !== 'published' && post.status === 'published') {
                        updateData.published_at = null;
                    }
                }
                if (visibility !== undefined) updateData.visibility = visibility;
                if (allow_comments !== undefined) updateData.allow_comments = allow_comments;
                if (template_key !== undefined) updateData.template_key = template_key;


                if (inputSlug && inputSlug.trim() !== post.slug) {
                    updateData.slug = await generateSlug(inputSlug.trim(), db.BlogPost, inputSlug.trim(), 'post_id', id, context);
                } else if (!inputSlug && title_vi && title_vi.trim() !== post.title_vi) {
                    updateData.slug = await generateSlug(title_vi.trim(), db.BlogPost, null, 'post_id', id, context);
                }

                if (Object.keys(updateData).length > 0) {
                    await post.update(updateData, { transaction });
                }

                if (tag_ids !== undefined) {
                    await post.setTags(tag_ids, { transaction });
                }

                await transaction.commit();
                const newSlug = updateData.slug || oldSlug;
                await clearSpecificCacheKeys(redis, [`blogPost:${id}`, `adminBlogPost:${id}`, `blogPost:slug_${oldSlug}`, `blogPost:slug_${newSlug}`]);
                await clearCacheKeysByPattern(redis, 'blogPosts:*');
                await clearCacheKeysByPattern(redis, 'adminBlogPosts:*');
                await clearCacheKeysByPattern(redis, 'adminDashboardStats');
                const newTagIdsToInvalidate = tag_ids === undefined ? oldTagIds : tag_ids;
                const changedTagsToInvalidate = [...new Set([...oldTagIds, ...newTagIdsToInvalidate])];
                 for (const tagId of changedTagsToInvalidate) {
                    const tag = await db.BlogTag.findByPk(tagId);
                    if (tag) {
                        await clearSpecificCacheKeys(redis, [`blogTag:${tagId}:posts`, `blogTag:slug_${tag.slug}`]);
                        await clearCacheKeysByPattern(redis, `blogPosts:tag_slug${tag.slug}*`);
                        await clearCacheKeysByPattern(redis, `adminBlogPosts:tag_slug${tag.slug}*`);
                    }
                }


                return db.BlogPost.findByPk(id, { include: [{ model: db.Customer, as: 'author' }, { model: db.BlogTag, as: 'tags', through: { attributes: [] } }] });
            } catch (error) {
                if (transaction && !transaction.finished) {
                    await transaction.rollback();
                }
                logger.error(`Error updating blog post ${id}:`, error);
                if (error.name === 'SequelizeUniqueConstraintError' && error.fields && (error.fields.slug || (error.fields.PRIMARY && error.original?.constraint === 'BlogPost_slug_key'))) {
                    throw new GraphQLError("Slug already exists. Please provide a unique slug or leave it blank to auto-generate.", { extensions: { code: 'BAD_USER_INPUT' } });
                }
                throw new GraphQLError("Failed to update blog post.");
            }
        },
        adminDeleteBlogPost: async (_, { id }, context) => {
            checkAdmin(context); const { db, sequelize, redis } = context;
            const transaction = await sequelize.transaction();
            try {
                const post = await db.BlogPost.findByPk(id, {transaction, include: ['tags']});
                if (!post) { await transaction.rollback(); throw new GraphQLError("Blog post not found.", { extensions: { code: 'NOT_FOUND' } }); }
                const tagIds = post.tags.map(t => t.tag_id);
                const postSlug = post.slug;

                await post.destroy({transaction});
                await transaction.commit();
                await clearSpecificCacheKeys(redis, [`blogPost:${id}`, `adminBlogPost:${id}`, `blogPost:slug_${postSlug}`]);
                await clearCacheKeysByPattern(redis, 'blogPosts:*');
                await clearCacheKeysByPattern(redis, 'adminBlogPosts:*');
                await clearCacheKeysByPattern(redis, 'adminDashboardStats');
                for (const tagId of tagIds) {
                    const tag = await db.BlogTag.findByPk(tagId);
                    if (tag) {
                        await clearSpecificCacheKeys(redis, [`blogTag:${tagId}:posts`, `blogTag:slug_${tag.slug}`]);
                        await clearCacheKeysByPattern(redis, `blogPosts:tag_slug${tag.slug}*`);
                        await clearCacheKeysByPattern(redis, `adminBlogPosts:tag_slug${tag.slug}*`);
                    }
                }
                await clearCacheKeysByPattern(redis, `blogCommentsByPost:${id}:*`);
                await clearCacheKeysByPattern(redis, `adminBlogComments:post${id}*`);

                return true;
            } catch (error) {
                if (transaction && !transaction.finished) {
                    await transaction.rollback();
                }
                logger.error(`Error deleting blog post ${id}:`, error);
                throw new GraphQLError("Failed to delete blog post.");
            }
        },
        adminCreateBlogTag: async (_, { input }, context) => {
            checkAdmin(context); const { db, redis } = context;
            const { name_vi, name_en, slug: inputSlug } = input;
            if (!name_vi || name_vi.trim() === '') throw new GraphQLError("Vietnamese tag name is required.", { extensions: { code: 'BAD_USER_INPUT' } });
            try {
                const finalSlug = await generateSlug(inputSlug || name_vi, db.BlogTag, inputSlug, 'tag_id', null, context);
                const newTag = await db.BlogTag.create({ name_vi: name_vi.trim(), name_en: name_en ? name_en.trim() : null, slug: finalSlug });
                await clearCacheKeysByPattern(redis, 'blogTags:*');
                await clearCacheKeysByPattern(redis, 'adminBlogTags:*');
                return newTag;
            } catch (error) {
                if (error.name === 'SequelizeUniqueConstraintError') {
                    const field = error.fields && Object.keys(error.fields)[0];
                    throw new GraphQLError(`Blog tag ${field === 'slug' ? 'slug' : (field === 'unique_blogtag_name_en' ? 'English name' : 'Vietnamese name')} already exists.`, { extensions: { code: 'BAD_USER_INPUT' } });
                }
                logger.error("Admin Create Blog Tag Error:", error);
                throw new GraphQLError("Failed to create blog tag.");
            }
        },
        adminUpdateBlogTag: async (_, { id, input }, context) => {
            checkAdmin(context); const { db, redis } = context;
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
                const oldSlug = tag.slug;

                const updateData = {};
                if (name_vi !== undefined) updateData.name_vi = name_vi.trim();
                if (name_en !== undefined) updateData.name_en = name_en ? name_en.trim() : null;
                if (inputSlug && inputSlug.trim() !== tag.slug) {
                    updateData.slug = await generateSlug(inputSlug.trim(), db.BlogTag, inputSlug.trim(), 'tag_id', id, context);
                } else if (!inputSlug && name_vi && name_vi.trim() !== tag.name_vi) {
                     updateData.slug = await generateSlug(name_vi.trim(), db.BlogTag, null, 'tag_id', id, context);
                }


                if (Object.keys(updateData).length > 0) {
                    await tag.update(updateData);
                }
                const newSlug = updateData.slug || oldSlug;
                await clearSpecificCacheKeys(redis, [`blogTag:${id}`, `blogTag:slug_${oldSlug}`, `blogTag:slug_${newSlug}`]);
                await clearCacheKeysByPattern(redis, 'blogTags:*');
                await clearCacheKeysByPattern(redis, 'adminBlogTags:*');
                await clearCacheKeysByPattern(redis, `blogPosts:tag_slug${oldSlug}*`);
                await clearCacheKeysByPattern(redis, `adminBlogPosts:tag_slug${oldSlug}*`);
                if (newSlug !== oldSlug) {
                    await clearCacheKeysByPattern(redis, `blogPosts:tag_slug${newSlug}*`);
                    await clearCacheKeysByPattern(redis, `adminBlogPosts:tag_slug${newSlug}*`);
                }
                return tag;
            } catch (error) {
                 if (error.name === 'SequelizeUniqueConstraintError') {
                    const field = error.fields && Object.keys(error.fields)[0];
                    throw new GraphQLError(`Another blog tag with this ${field === 'slug' ? 'slug' : (field === 'unique_blogtag_name_en' ? 'English name' : 'Vietnamese name')} already exists.`, { extensions: { code: 'BAD_USER_INPUT' } });
                }
                logger.error(`Error updating blog tag ID ${id}:`, error);
                throw new GraphQLError("Failed to update blog tag.");
            }
        },
        adminDeleteBlogTag: async (_, { id }, context) => {
            checkAdmin(context); const { db, sequelize, redis } = context;
            const transaction = await sequelize.transaction();
            try {
                const tag = await db.BlogTag.findByPk(id, { transaction });
                if (!tag) { await transaction.rollback(); throw new GraphQLError("Blog tag not found.", { extensions: { code: 'NOT_FOUND' } }); }
                const tagSlug = tag.slug;
                await tag.destroy({ transaction });
                await transaction.commit();
                await clearSpecificCacheKeys(redis, [`blogTag:${id}`, `blogTag:slug_${tagSlug}`]);
                await clearCacheKeysByPattern(redis, 'blogTags:*');
                await clearCacheKeysByPattern(redis, 'adminBlogTags:*');
                await clearCacheKeysByPattern(redis, `blogPosts:tag_slug${tagSlug}*`);
                await clearCacheKeysByPattern(redis, `adminBlogPosts:tag_slug${tagSlug}*`);
                return true;
            } catch (error) {
                if (transaction && !transaction.finished) {
                    await transaction.rollback();
                }
                logger.error(`Error deleting blog tag ${id}:`, error);
                throw new GraphQLError("Failed to delete blog tag.");
            }
        },
        adminApproveBlogComment: async (_, { comment_id }, context) => {
            checkAdmin(context); const { db, redis } = context;
            try {
                const comment = await db.BlogComment.findByPk(comment_id);
                if (!comment) throw new GraphQLError("Comment not found.", { extensions: { code: 'NOT_FOUND' } });
                comment.status = 'approved';
                await comment.save();
                await clearCacheKeysByPattern(redis, `blogCommentsByPost:${comment.post_id}:*`);
                await clearCacheKeysByPattern(redis, `adminBlogComments:*`);
                return db.BlogComment.findByPk(comment_id, {include: [{model: db.Customer, as: 'commentAuthor', attributes: ['customer_id', 'customer_name', 'username']}]});
            } catch (error) {
                logger.error(`Error approving comment ID ${comment_id}:`, error);
                throw new GraphQLError("Failed to approve comment.");
            }
        },
        adminRejectBlogComment: async (_, { comment_id }, context) => {
            checkAdmin(context); const { db, redis } = context;
            try {
                const comment = await db.BlogComment.findByPk(comment_id);
                if (!comment) throw new GraphQLError("Comment not found.", { extensions: { code: 'NOT_FOUND' } });
                comment.status = 'rejected';
                await comment.save();
                await clearCacheKeysByPattern(redis, `blogCommentsByPost:${comment.post_id}:*`);
                await clearCacheKeysByPattern(redis, `adminBlogComments:*`);
                return db.BlogComment.findByPk(comment_id, {include: [{model: db.Customer, as: 'commentAuthor', attributes: ['customer_id', 'customer_name', 'username']}]});
            } catch (error) {
                logger.error(`Error rejecting comment ID ${comment_id}:`, error);
                throw new GraphQLError("Failed to reject comment.");
            }
        },
        adminDeleteBlogComment: async (_, { comment_id }, context) => {
            checkAdmin(context); const { db, redis } = context;
            try {
                const comment = await db.BlogComment.findByPk(comment_id);
                if (!comment) throw new GraphQLError("Comment not found.", { extensions: { code: 'NOT_FOUND' } });
                const postId = comment.post_id;
                await db.BlogComment.destroy({ where: { parent_comment_id: comment_id } });
                await comment.destroy();
                await clearCacheKeysByPattern(redis, `blogCommentsByPost:${postId}:*`);
                await clearCacheKeysByPattern(redis, `adminBlogComments:*`);
                return true;
            } catch (error) {
                logger.error(`Error deleting comment ID ${comment_id}:`, error);
                throw new GraphQLError("Failed to delete comment.");
            }
        },
        createBlogComment: async (_, { input }, context) => {
            checkAuth(context); const { db, redis } = context;
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
                    where: { post_id: post_id, status: 'published', visibility: 'public', allow_comments: true }
                });
                if (!postExists) {
                    throw new GraphQLError("Cannot comment on this post (it may not exist, not be published, or not allow comments).", { extensions: { code: 'BAD_REQUEST' } });
                }
                if (parent_comment_id) {
                    const parentCommentExists = await db.BlogComment.findOne({
                        where: { comment_id: parent_comment_id, post_id: post_id, status: 'approved' }
                    });
                    if (!parentCommentExists) throw new GraphQLError("Parent comment not found, not approved, or does not belong to this post.", { extensions: { code: 'BAD_REQUEST' } });
                }

                const newComment = await db.BlogComment.create({
                    post_id, user_id,
                    parent_comment_id: parent_comment_id || null,
                    content: content.trim(),
                    status: 'approved' // Assuming comments are auto-approved for simplicity, adjust as needed
                });
                await clearCacheKeysByPattern(redis, `blogCommentsByPost:${post_id}:*`);
                await clearCacheKeysByPattern(redis, `adminBlogComments:post${post_id}*`); // Clear admin cache if they view all comments
                await clearCacheKeysByPattern(redis, `adminBlogComments:*`); // Broad clear for admin comments

                return db.BlogComment.findByPk(newComment.comment_id, {
                    include: [{ model: db.Customer, as: 'commentAuthor', attributes: ['customer_id', 'customer_name', 'username'] }]
                });
            } catch (error) {
                logger.error("Error creating blog comment:", error);
                if (error instanceof GraphQLError) throw error;
                throw new GraphQLError("Failed to create comment.");
            }
        },
    },
};

module.exports = resolvers;
