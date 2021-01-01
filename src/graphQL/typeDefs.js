"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const typeDefs = apollo_server_express_1.gql `
  enum ListingFilter{
    PRICE_HIGH_TO_LOW
    PRICE_LOW_TO_HIGH
  }
  enum ListingType{
    APARTMENT
    HOUSE
  }

  type Viewer{
    id:ID
    token:String
    name:String
    avatar:String
    hasWallet:Boolean
    didRequest:Boolean!
  }

  type Booking{
    id: ID!
    listings: Listing!
    tenant: User!
    checkIn: String
    checkOut: String
  }

  type Bookings{
    total:Int!
    result:[Booking!]!
  }

 
  type Listing{
    id: ID!
    title: String!
    description: String!
    image: String!
    host: User!
    type: ListingType!
    address: String!
    country: String!
    admin:String!
    city: String
    bookings(limit:Int!,page:Int!):Bookings
    bookingsIndex: String
    price: Int!
    numOfGuests: Int!
  }

  type Listings{
    region:String
    total:Int
    result:[Listing!]!
  }


  type User{
    id:ID!
    name:String!
    avatar:String!
    hasWallet:Boolean!
    contact:String!
    income:Int
    bookings(limit:Int!,page:Int!):Bookings
    listings(limit:Int!,page:Int!):Listings
  }

  input LogInInput{
    code:String
  } 
  input ConnectStripeInput{
    code:String
  }
  input HostListingInput{
    title:String!
    description:String!
    image:String!
    type:ListingType!
    address:String!
    price:Int!
    numOfGuests:Int!

  }
  input CreateBookingInput{
    id:ID!
    source:String!
    checkIn:String!
    checkOut:String!
  }

  type Query{
    authUrl:String!
    user(id:ID!):User!
    listing(id:ID!):Listing
    listings(location:String,filter:ListingFilter!,limit:Int!,page:Int!):Listings!
  }
  type Mutation {
    logIn(input:LogInInput):Viewer!
    logOut:Viewer!
    connectStripe(input:ConnectStripeInput!):Viewer!
    disconnectStripe:Viewer!
    hostListing(input:HostListingInput!):Listing!
    createBooking(input:CreateBookingInput!):Booking!
  }
`;
exports.typeDefs = typeDefs;
