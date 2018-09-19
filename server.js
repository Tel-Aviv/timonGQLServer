const { ApolloServer, gql, MockList } = require('apollo-server');
const typeDefs =  require('./schemas/schema.js').typeDefs;
const resolvers =  require('./src/resolvers.js').resolvers;

const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
