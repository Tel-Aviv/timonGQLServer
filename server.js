import express from 'express';
import cors from 'cors';
const { ApolloServer, MockList } = require('apollo-server-express');
const typeDefs =  require('./schemas/schema.js').typeDefs;
const resolvers =  require('./src/resolvers.js').resolvers;

const app = express();
app.use('*', cors({
                    credentials: true,
                    origin: '*'
                  })
       );
//app.use(express.static('data'));

app.get('/data/:name', (req, res) => {
  //console.log(req);

  const options = {
    root: __dirname + '/data/',
    dotfiles: 'deny'
  }

  const fileName = req.params.name;
  res.sendFile(fileName, options, err => {
    if( err ) {
      next(err)
    } else {
      console.log('Sent:', fileName);
    }
  })
});

const server = new ApolloServer({
    typeDefs,
    resolvers,
    // formatError: error => {
    //   console.error(error);
    //   return new Error(error);
    // }
  });

server.applyMiddleware({ app, path: '/' });

const httpServer = app.listen({ port: 4000 }, () => {
  console.log(`🚀  Server ready at port ${httpServer.address().port}`);
})

// This `listen` method launches a web-server.  Existing apps
// can utilize middleware options, which we'll discuss later.
// server.listen().then(({ url }) => {
//   console.log(`🚀  Server ready at ${url}`);
// });
