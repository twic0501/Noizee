// admin-frontend/src/api/apolloClient.js
import {
    ApolloClient,
    InMemoryCache,
    createHttpLink,
    ApolloLink,
    split
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
// import logger from '../utils/logger'; // Uncomment if you need logging

const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_LANGUAGE_KEY = 'admin_preferred_lang';

// HTTP connection to your GraphQL server
const httpLink = createHttpLink({
    uri: import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
    // credentials: 'include' // Only if you are using cookies for auth and backend supports it
});

// Middleware for attaching the authorization token to HTTP requests
const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        }
    };
});

// Middleware for attaching the preferred language to HTTP requests
const languageLink = setContext((_, { headers }) => {
    const preferredLang = localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';
    // logger.debug(`[Apollo languageLink] Sending lang: ${preferredLang}`); // Uncomment for debugging
    return {
        headers: {
            ...headers,
            'x-client-lang': preferredLang,
        }
    };
});

// Combine auth, language, and http links for regular GraphQL operations
const httpAuthLangLink = ApolloLink.from([authLink, languageLink, httpLink]);

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(createClient({
    url: import.meta.env.VITE_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql',
    connectionParams: () => {
        const token = localStorage.getItem(ADMIN_TOKEN_KEY); // Use the same admin token key
        return {
            authorization: token ? `Bearer ${token}` : '',
            // You can add other connection params here if needed
        };
    },
    // Optional: configure keepAlive, retryAttempts, etc.
    // shouldRetry: () => true, // Example: always retry
    // retryAttempts: 5, // Example: retry 5 times
}));

// Use splitLink to route traffic between HTTP and WebSocket links
// It sends data to wsLink if the operation is a subscription, otherwise to httpAuthLangLink
const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink,
    httpAuthLangLink
);

const client = new ApolloClient({
    link: splitLink, // Use the split link
    cache: new InMemoryCache({
        typePolicies: {
            // Your existing type policies (if any) can remain here.
            // Example:
            // Product: {
            //   fields: {
            //     name: {
            //       read(existing, { args, readField }) {
            //         const lang = args?.lang || localStorage.getItem(ADMIN_LANGUAGE_KEY) || 'vi';
            //         const fieldVi = readField(lang === 'en' ? 'product_name_en' : 'product_name_vi');
            //         const fieldEn = readField('product_name_en');
            //         return lang === 'en' && fieldEn ? fieldEn : fieldVi;
            //       }
            //     },
            //   }
            // },
        },
    }),
    connectToDevTools: import.meta.env.DEV,
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'cache-and-network',
            errorPolicy: 'all',
        },
        query: {
            fetchPolicy: 'network-only', // Consider if 'cache-and-network' is better for some queries
            errorPolicy: 'all',
        },
        mutate: {
            errorPolicy: 'all',
        },
    }
});

export default client;
