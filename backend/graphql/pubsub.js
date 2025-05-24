const { PubSub } = require('graphql-subscriptions');
const logger = require('../utils/logger');

const pubsub = new PubSub();

const SALE_STATUS_UPDATED = 'SALE_STATUS_UPDATED';
const NEW_SALE_CREATED = 'NEW_SALE_CREATED';

module.exports = {
    pubsub,
    SALE_STATUS_UPDATED,
    NEW_SALE_CREATED
};