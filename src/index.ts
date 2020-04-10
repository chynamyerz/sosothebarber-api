import { GraphQLServer } from 'graphql-yoga';
import resolvers from './resolvers';
import { prisma } from "./generated/prisma-client";
const server = new GraphQLServer({ 
  context: ({ request }) => ({
    prisma,
    request
  }),
  resolvers,
  typeDefs: __dirname + "/schema.graphql",
})
server.start(() => console.log('Server is running on localhost:4000'))
