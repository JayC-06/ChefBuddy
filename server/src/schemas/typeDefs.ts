import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type Profile {
    _id: ID!
    username: String!
    email: String!
    password: String!
    favorites: [Recipe]
  }

  type Recipe {
    _id: ID!
    title: String!
    ingredients: [String]!
    instructions: [String]!
    ratings: [Int]
    comments: [Comment]
    favorite: Boolean
    mealType: String
    createdAt: String
  }

  type Comment {
    username: String
    text: String
    createdAt: String
  }

  type Auth {
    token: ID!
    profile: Profile!
  }

  input ProfileInput {
    username: String!
    email: String!
    password: String!
  }

  type Ingredient {
  _id: ID!
  name: String!
}

type FridgeItem {
  _id: ID!
  userId: ID!
  ingredient: Ingredient
}

  type Query {
    profiles: [Profile]
    profile(profileId: ID!): Profile
    me: Profile
    myRecipePath: String
    myRecipeHistory: [RecipeHistory]
    myFavoriteRecipes: [RecipeHistory]
    getRecipeById(_id: ID!): Recipe
    getRecipeByIngredient(ingredient: String!): [Recipe]
    generateRecipes(ingredients: [String!]!): [Recipe!]!
    getFridge: [FridgeItem]!
  }

  type Mutation {
  login(email: String!, password: String!): Auth
  register(input: ProfileInput!): Auth
  saveRecipe(title: String, ingredients: [String], instructions: [String]): Profile
  rateRecipe(recipeId: ID!, rating: Int!): Recipe
  addComment(recipeId: ID!, text: String!): Recipe
  removeProfile: Profile
  updateFridgeItem(_id: ID!, name: String!): FridgeItem
  deleteFridgeItem(_id: ID!): FridgeItem
  addFridgeItem(name: String!): FridgeItem
  toggleFavorite(recipeId: ID!): RecipeHistory
  }
`;

export default typeDefs;

// type RecipeHistory {
//   profile: Profile
//   _id: ID!
//   title: String
//   instructions: [String]
//   ingredients: [String]
//   response: String
//   favorite: Boolean
//   mealType: String
//   createdAt: String!
// }