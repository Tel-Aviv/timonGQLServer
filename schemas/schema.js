const { gql } = require('apollo-server-express');

export let typeDefs = gql`

  interface INode  {
    id: ID!
  }

  scalar Date

  enum SummaryKind {
    IN,
    OUT,
    CROSS,
    PEOPLE
  }

  enum Direction {
    IN
    OUT
  }

  type GeoCenter {
    lat: Float
    lon: Float
  }

  type Serie {
    labels: [String]
    values: [[Int]]
  }

  type SingleSerie {
    labels: [String]
    values: [Int]
  }

  type Camera implements INode {
    id: ID!
    cameraId: Int
    name: String!
    location: GeoCenter!
  }

  type Intersection implements INode {
    id: ID!

    cameraName: String
    Total: Int
    SouthCluster: Int
    NorthCluster: Int
    EastCluster: Int
    WestCluster: Int
  }

  type Gate implements INode {
    id: ID!

    name: String
    ins(from: Date!, till: Date!): Int
    outs(from: Date!, till: Date!): Int
  }

  type Cluster implements INode {
    id: ID!

    name: String!
    clusterId: Int!

    cameras: [Camera]

    ins(from: Date!, till: Date!): Int
    outs(from: Date!, till: Date!): Int

    gates: [Gate]
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

    name: String

    summary(from: Date!, till: Date!, kind: SummaryKind!): Summary,
    summaries(from: Date!, till: Date!): [Summary!]

    dayOfWeekDisrtibution(from: Date!, till: Date!): Serie
    hourlyDistribution(date: Date!): [Serie]
    vehicleTypeDistribution(date: Date!): SingleSerie
    commuteDistribution(from: Date!, till: Date!): Serie
    lagsDistribution(from: Date!, till: Date!): Serie
    intersectionDistribution(direction: Direction!, from: Date!, till: Date!): [Intersection]
  }

  type Query {
    region(regionId: Int!): Region,
    regions: [Region]
    clusters: [Cluster]
    cluster(clusterId: Int!): Cluster
  }

`;
