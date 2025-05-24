import { AdminStateProvider } from './providers/AdminStateProvider';
import { ApolloProvider } from '@apollo/client';
import { client } from './apollo';

function App() {
  return (
    <ApolloProvider client={client}>
      <AdminStateProvider>
        {/* Rest of your app */}
      </AdminStateProvider>
    </ApolloProvider>
  );
}