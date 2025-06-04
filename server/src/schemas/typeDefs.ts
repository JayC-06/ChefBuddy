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

type RecipeHistory {
  profile: Profile
  _id: ID!
  title: String
  instructions: [String]
  ingredients: [String]
  favorite: Boolean
  mealType: String
  createdAt: String!
  comments: [Comment]
  ratings: [Int]
}

  type Query {
    profiles: [Profile]
    profile(profileId: ID!): Profile
    me: Profile
    myRecipePath: String
    myRecipeHistory: [RecipeHistory]
    myFavoriteRecipes: [RecipeHistory]
    getRecipeById(_id: ID!): RecipeHistory
    getRecipeByIngredient(ingredient: String!): [RecipeHistory]
    generateRecipes(ingredients: [String!]!): [RecipeHistory!]!
    getFridge: [FridgeItem]!
  }

  type Mutation {
  login(email: String!, password: String!): Auth
  register(input: ProfileInput!): Auth
  saveRecipe(mealType: String, title: String, ingredients: [String], instructions: [String]): RecipeHistory
  rateRecipe(recipeId: ID!, rating: Int!): RecipeHistory
  addComment(recipeId: ID!, text: String!): RecipeHistory
  removeProfile: Profile
  updateFridgeItem(_id: ID!, name: String!): FridgeItem
  deleteFridgeItem(_id: ID!): FridgeItem
  addFridgeItem(name: String!): FridgeItem
  toggleFavorite(recipeId: ID!): RecipeHistory
  }
`;

export default typeDefs;
