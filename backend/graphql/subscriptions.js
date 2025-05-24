const { gql } = require('apollo-server-express');

module.exports = gql`
  type Subscription {
    saleUpdated: Sale
    newSale: Sale
  }
`;