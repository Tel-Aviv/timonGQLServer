import express from 'express';
import cors from 'cors';
import path from 'path';
const { ApolloServer, AuthenticationError } = require('apollo-server-express');
import base64 from 'base-64';
import typeDefs from '../schemas/schema.js';
const resolvers = require('./resolvers.js').resolvers;

const app = express();
app.use('*', cors({
                    credentials: true,
                    origin: '*'
                  })
       );

app.get('/data/:name', (req, res) => {

  const options = {
    root: path.join(__dirname, '../data/'),
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
    context: ({ req }) => {
        // get the user token from the headers
        const authHeader = req.headers.authorization || '';

        if( authHeader ) {

          let tokens = authHeader.split(' ');
          if( tokens[0] !== 'Basic') {
            throw new AuthenticationError('You should provide Basic Authorization Header');
          } else {

            var encoded = base64.decode(tokens[1]);
            tokens = encoded.split(':');

            return {
              user: {
                roles: ['admin'],
                email: tokens[0]
              }
            };
          }
        } else {
          throw new AuthenticationError('You should provide Basic Authorization Header');
        }
      }
  });

server.applyMiddleware({ app, path: '/' });

const httpServer = app.listen({ port: 4000 }, () => {
  console.log(`🚀  Server ready at port ${httpServer.address().port}`);
})
