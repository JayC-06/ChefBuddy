import mongoose from "mongoose";
import { Profile } from "../models/index.js";
import {
  signToken,
  AuthenticationError,
  UserExistsError,
} from "../utils/auth.js";
import FridgeItem from "../models/fridgeModel.js";
import { IResolvers } from "@graphql-tools/utils";
import { AuthRequest } from "../utils/auth";
import Recipe from "../models/recipeModel.js";
import { OpenAI } from "openai";
import RecipeHistory from "../models/RecipeHistory.js";
import {
  getUserRecipeHistory,
  getUserRecipePath,
} from "../utils/profilePath.js";

interface Profile {
  _id: string;
  username: string;
  email: string;
  password: string;
  skills: string[];
}

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is missing from environment variables.");
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

const resolvers: IResolvers = {
  Query: {
    me: async (_, __, context: { req: AuthRequest }) => {
      if (!context.req.user) throw new AuthenticationError("Not authenticated");
      return await Profile.findById(context.req.user._id).populate(
        "savedRecipes"
      );
    },
    myRecipePath: async (_parent: any, _args: any, context: any) => {
      if (!context.user)
        throw new AuthenticationError("You must be logged in.");
      return await getUserRecipePath(context.user._id);
    },
    myRecipeHistory: async (
      _parent: any,
      _args: any,
      context: { user: any }
    ) => {
      if (!context.user)
        throw new AuthenticationError(
          "You must be logged in to view your recipe history."
        );
      return await getUserRecipeHistory(context.user._id);
    },
    myFavoriteRecipes: async (
      _parent: any,
      _args: any,
      context: { user: any }
    ) => {
      if (!context.user)
        throw new AuthenticationError(
          "You must be logged in to view your favorite recipes."
        );
      return await RecipeHistory.find({
        profile: context.user._id,
        favorite: true,
      })
        .sort({ createdAt: -1 })
        .populate("profile");
    },
    getFridge: async (_parent: any, _args: any, context: { user: any }) => {
      if (!context.user)
        throw new AuthenticationError(
          "You must be logged in to view your fridge."
        );
      return await FridgeItem.find({ userId: context.user._id }).populate(
        "ingredient"
      );
    },
    getRecipeById: async (_, { id }) => {
      return await Recipe.findById(id);
    },
    generateRecipes: async (
      _: any,
      { ingredients }: { ingredients: string[] },
      context: { user: any } // include context if saving to user profile or history
    ) => {
      console.log(
        "generateRecipes resolver called with ingredients:",
        ingredients
      );
      if (!ingredients || ingredients.length === 0) {
        throw new Error("Please provide a list of ingredients.");
      }

      const prompt = `
        Suggest a list of recipes based on the following ingredients: ${ingredients.join(
          ", "
        )}.
        Please provide the recipes in JSON format, including the recipe name, ingredients, measurements, instructions, calories, and macros.
        Format like this: [{"title": "Pasta", "ingredients": ["Pasta", "Tomato"], "instructions": ["Boil pasta", "Add sauce"], "ratings": [], "comments": []}]
        Please provide a unique _id for each recipe, and ensure the response is valid JSON.
      `;

      const openai = getOpenAIClient();

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      });

      // console.log("OpenAI Raw Response:", JSON.stringify(response, null, 2));

      const result = response.choices[0].message?.content;

      if (!result) {
        throw new Error("No response from OpenAI");
      }

      let parsed;
      try {
        parsed = JSON.parse(result);
      } catch (error) {
        console.error("Failed to parse OpenAI response:", result);
        throw new Error("OpenAI response was not valid JSON.");
      }

      // Map each recipe with a valid ObjectId
      const recipesWithIds = parsed.map((r: any) => {
        const _id = new mongoose.Types.ObjectId();
        return {
        _id,
        title: r.title,
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
        ratings: r.ratings || [],
        comments: r.comments || [],
        favorite: false,
        profile: context.user?._id || null,
        createdAt: new Date(),
        response: JSON.stringify(r),
        }
      });

      await RecipeHistory.insertMany(recipesWithIds);

      // // Optionally save to DB
      // await recipeHistory.create({
      //   ingredients,
      //   response: result,
      // });

      return recipesWithIds;
    },
  },

  Mutation: {
    login: async (_, { email, password }) => {
      const profile = await Profile.findOne({ email });
      if (!profile || !(await profile.isCorrectPassword(password))) {
        throw new AuthenticationError("Incorrect credentials");
      }
      const token = signToken({
        _id: profile._id,
        email: profile.email,
        username: profile.username,
      });
      return { token, profile };
    },

    register: async (_, { input }) => {
      const { username, email, password } = input;

      // check if a profile with the same email already exists
      const existingProfile = await Profile.findOne({ email });
      if (existingProfile) {
        throw new UserExistsError("A profile with this email already exists.");
      }
      // if not, create a new profile
      const profile = await Profile.create({ username, email, password });
      const token = signToken({
        _id: profile._id,
        email: profile.email,
        username: profile.username,
      });
      return { token, profile };
    },

    saveRecipe: async (_, { recipeId }, context: { req: AuthRequest }) => {
      if (!context.req.user) throw new AuthenticationError("Not authenticated");

      return await Profile.findByIdAndUpdate(
        context.req.user._id,
        { $addToSet: { savedRecipes: recipeId } },
        { new: true }
      ).populate("savedRecipes");
    },

    addComment: async (
      _,
      { recipeId, text },
      context: { req: AuthRequest }
    ) => {
      if (!context.req.user) throw new AuthenticationError("Not authenticated");

      const updatedRecipe = await Recipe.findByIdAndUpdate(
        recipeId,
        {
          $push: {
            comments: {
              user: context.req.user.username,
              text: text,
              createdAt: new Date().toISOString(),
            },
          },
        },
        { new: true }
      );
      if (!updatedRecipe) throw new Error("Recipe not found");
      return updatedRecipe;
    },

    addFridgeItem: async (_, { name }, context: { user: any }) => {
      if (!context.user)
        throw new AuthenticationError(
          "You must be logged in to add items to your fridge."
        );
      const newItem = await FridgeItem.create({
        name,
        userId: context.user._id,
      });
      return newItem;
    },

    updateFridgeItem: async (_, { id, name }, context: { user: any }) => {
      if (!context.user)
        throw new AuthenticationError(
          "You must be logged in to update items in your fridge."
        );
      const updatedItem = await FridgeItem.findOneAndUpdate(
        { _id: id, userId: context.user._id },
        { name },
        { new: true }
      );
      if (!updatedItem) throw new Error("Fridge item not found");
      return updatedItem;
    },

    deleteFridgeItem: async (_, { id }, context: { user: any }) => {
      if (!context.user)
        throw new AuthenticationError(
          "You must be logged in to delete items from your fridge."
        );
      const deletedItem = await FridgeItem.findOneAndDelete({
        _id: id,
        userId: context.user._id,
      });
      if (!deletedItem) throw new Error("Fridge item not found");
      return deletedItem;
    },

    toggleFavorite: async (_: any, { recipeId }: { recipeId: string }) => {
      console.log("Toggling favorite for recipeId:", recipeId);
      const recipe = await RecipeHistory.findById(recipeId);
      if (!recipe) {
        console.log("Recipe not found for ID:", recipeId);
        throw new Error("Recipe not found");
      }
      recipe.favorite = !recipe.favorite;
      await recipe.save();
      return recipe;
    },
  },
};

export default resolvers;
