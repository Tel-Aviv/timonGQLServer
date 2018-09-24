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

  type GeoCenter {
    lat: Float
    lon: Float
  }

  type Serie {
    labels: [String]
    values: [[Int]]
  }

  type Camera implements INode {
    id: ID!
    cameraId: Int
    name: String!
    location: GeoCenter!
  }

  type Summary implements INode {
    id: ID!

    kind: SummaryKind!
    value: Int!
  }

  type Region implements INode{

    id: ID!

    regionId: Int
    center: GeoCenter
    cameras: [Camera]

    name: String,
    summary(from: Date!, till: Date!, kind: SummaryKind!): Summary,
    summaries(from: Date!, till: Date!): [Summary!]

    disrtibution(from: Date!, till: Date!): Serie
    frequencyDistribution(from: Date!, till: Date!): Serie
  }

  type Query {
    region(regionId: Int!): Region,
    regions: [Region]
  }

`;
