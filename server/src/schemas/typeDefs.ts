import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type User {
    _id: ID!
    username: String!
    email: String!
    savedRecipes: [Recipe]
  }

  type Recipe {
    _id: ID!
    title: String!
    ingredients: [String]!
    instructions: [String]!
    ratings: [Int]
    comments: [String]
  }

  type Comment {
    user: String
    text: String
    createdAt: String
  }

  type Auth {
    token: ID!
    user: User
  }

  input ProfileInput {
    name: String!
    email: String!
    password: String!
  }

  type Query {
    profiles: [User]
    profile(profileId: ID!): User
    me: User
    getRecipeById(id: ID!): Recipe
    getRecipeByIngredient(ingredient: String!): [Recipe]
  }

  type Mutation {
  login(email: String!, password: String!): Auth
  register(username: String!, email: String!, password: String!): Auth
  saveRecipe(recipeId: ID!): User
  rateRecipe(recipeId: ID!, rating: Int!): Recipe
  addProfile(input: ProfileInput!): Auth
  removeProfile: User
  }
`;

export default typeDefs;
