import { gql } from '@apollo/client';

export const REGISTER = gql`
  mutation register($input: ProfileInput!) {
    register(input: $input) {
      token
      profile {
        _id
        username
        email
      }
    }
  }
`;

export const LOGIN_USER = gql`
  mutation login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      profile {
        _id
        username
      }
    }
  }
`;

export const SAVE_RECIPE = gql`
  mutation SaveRecipe($mealType: String, $title: String, $ingredients: [String], $instructions: [String]) {
    saveRecipe( mealType: $mealType, title: $title, ingredients: $ingredients, instructions: $instructions) {
      _id
      title
      ingredients
      instructions
  } 
}`

export const TOGGLE_FAVORITE = gql`
  mutation ToggleFavorite($recipeId: ID!) {
    toggleFavorite(recipeId: $recipeId) {
      _id
      favorite
    }
  }
`;

export const ADD_COMMENT = gql`
  mutation AddComment($recipeId: ID!, $text: String!) {
    addComment(recipeId: $recipeId, text: $text) {
      _id
      comments {
        username
        text
        createdAt
      }
    }
  }
`;