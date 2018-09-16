const { gql } = require('apollo-server');


export let typeDefs = gql`

  interface INode  {
    id: ID!
  }

  scalar Date

  enum SummaryKind {
    IN,
    OUT,
    CROSS,
    PASSENGERS
  }
  
  type Summary implements INode {
    id: ID!

    kind: SummaryKind!
    value: Int!
  }
  
  type Region implements INode{

    id: ID!

    objectId: Int,
    name: String,
    summary(from: Date!, till: Date!, kind: SummaryKind!): Summary,
    summaries(from: Date!, till: Date!): [Summary!]
  }

  type Query {
    region(objectId: Int!): Region,
  }

`;