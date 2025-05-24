const { pubsub, SALE_STATUS_UPDATED, NEW_SALE_CREATED } = require('../pubsub');
const logger = require('../../utils/logger');

const saleResolvers = {
    Subscription: {
        saleStatusUpdated: {
            subscribe: (_, __, { user }) => {
                if (!user?.isAdmin) {
                    throw new Error('Unauthorized');
                }
                return pubsub.asyncIterator([SALE_STATUS_UPDATED]);
            }
        },
        newSale: {
            subscribe: (_, __, { user }) => {
                if (!user?.isAdmin) {
                    throw new Error('Unauthorized');
                }
                return pubsub.asyncIterator([NEW_SALE_CREATED]);
            }
        }
    },

    Mutation: {
        // Cập nhật mutation hiện có
        adminUpdateSaleStatus: async (_, { sale_id, status }, context) => {
            checkAdmin(context);
            const { db, redis } = context;

            try {
                const sale = await db.Sale.findByPk(sale_id, {
                    include: [
                        { model: db.Customer, as: 'customer' },
                        { model: db.SalesTotals, as: 'totals' }
                    ]
                });

                if (!sale) {
                    throw new Error('Sale not found');
                }

                await sale.update({ sale_status: status });

                // Publish the update event
                pubsub.publish(SALE_STATUS_UPDATED, {
                    saleStatusUpdated: {
                        sale_id: sale.sale_id,
                        sale_status: status,
                        customer_name: sale.customer?.customer_name,
                        total_amount: sale.totals?.total_amount,
                        notification_type: 'UPDATE',
                        updated_at: new Date().toISOString()
                    }
                });

                // Clear related cache
                await clearCacheKeysByPattern(redis, 'adminSales:*');
                await clearCacheKeysByPattern(redis, `adminSaleDetail:${sale_id}`);

                return sale;
            } catch (error) {
                logger.error('Error updating sale status:', error);
                throw new Error('Failed to update sale status');
            }
        },

        // Thêm vào mutation createSale hiện có
        createSale: async (_, { input }, context) => {
            // Existing creation logic...

            // After successful creation:
            pubsub.publish(NEW_SALE_CREATED, {
                newSale: {
                    sale_id: newSale.sale_id,
                    sale_status: newSale.sale_status,
                    customer_name: customer?.customer_name,
                    total_amount: totals?.total_amount,
                    notification_type: 'NEW',
                    updated_at: new Date().toISOString()
                }
            });

            return newSale;
        }
    }
};

module.exports = saleResolvers;