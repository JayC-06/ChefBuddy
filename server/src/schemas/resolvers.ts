
import { Profile } from "../models/index.js";
import { signToken, AuthenticationError, UserExistsError } from "../utils/auth.js";
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
      { ingredients }: { ingredients: string[] }
    ) => {
      // console.log(
      //   "generateRecipes resolver called with ingredients:",
      //   ingredients
      // );
      if (!ingredients || ingredients.length === 0) {
        throw new Error("Please provide a list of ingredients.");
      }

      const prompt = `
        Suggest a list of recipes based on the following ingredients: ${ingredients.join(
          ", "
        )}.
        Please provide the recipes in JSON format, including the recipe name, ingredients, measurements, instructions, category, calories, and macros.
        Please provide detailed instructions for each recipe, including preparation and cooking times.
        The recipes can include more ingredients than those provided, but should primarily use the given ingredients.
        Each recipe should include the following fields:
        - title: The name of the recipe
        - ingredients: An array of ingredient names including measurements
        - instructions: An array of step-by-step instructions with proper punctuation, capitalization, and time requirements 
        - category: The meal type (breakfast, lunch, dinner, or dessert)
        - nutritionalInfo: An object containing calories, protein, carbs, and fat
        Format like this: [{"title": "Pasta", "ingredients": ["Pasta", "Tomato"], "instructions": ["Boil pasta", "Add sauce"], "category": ""}]
        Each recipe should be catorgized as breakfast, lunch, dinner or dessert, ensure the category is included in the response as what would be the most likely value.
        Please provide a unique _id for each recipe, and ensure the response is valid JSON that does not include markdown, explainations, or extra formatting.
      `;

      const openai = getOpenAIClient();

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Respond only with raw JSON. Do not include markdown formatting or explanation.",
          },
          { role: "user", content: prompt },
        ],
      });

      // console.log("OpenAI Raw Response:", JSON.stringify(response, null, 2));

      const result = response.choices[0].message?.content;

      if (!result) {
        throw new Error("No response from OpenAI");
      }

      // clean markdown formatting if present
      const cleaned = result.replace(/```json|```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(cleaned); // parse the cleaned JSON string
      } catch (error) {
        console.error("Failed to parse OpenAI response:", cleaned);
        throw new Error("OpenAI response was not valid JSON.");
      }

      // post-process the parsed recipes to ensure they have the correct structure
      const fixed = parsed.map((recipe: any) => {
        const nutrition = recipe.nutritionalInfo || {};

        const normalize = (value: any) =>
          typeof value === "string" ? value : `${value}`;

        return {
          ...recipe,
          nutritionalInfo: {
            calories: Number(nutrition.calories) || 0,
            protein: normalize(nutrition.protein),
            carbs: normalize(nutrition.carbs),
            fat: normalize(nutrition.fat),
          },
        };
      });

      return fixed;
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

    saveRecipe: async (
      _,
      { mealType, title, ingredients, instructions },
      context: AuthRequest
    ) => {
      console.log("context", context);
      if (!context.user) throw new AuthenticationError("Not authenticated");
      const newRecipe = await RecipeHistory.create({
        mealType,
        title,
        ingredients,
        instructions,
        createdAt: new Date().toISOString(),
      });
      return newRecipe;
    },

    addComment: async ( _, { recipeId, text }, context) => {
      if (!context.user) throw new AuthenticationError("Not authenticated");

      const comment = {
        username: context.user.username,
        text,
        createdAt: new Date().toISOString(),
      };

      const updatedRecipe = await RecipeHistory.findByIdAndUpdate(
        recipeId,
        { $push: { comments: comment } },
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

    toggleFavorite: async (
      _: any,
      { recipeId }: { recipeId: string },
      context: AuthRequest
    ) => {
      if (!context.user) throw new AuthenticationError("Not authenticated");

      const recipe = await RecipeHistory.findById(recipeId);
      if (!recipe) throw new Error("Recipe not found");

      // Check if the user profile exists and if the recipe is already a favorite
      const userId = context.user?._id;
      if (!userId) throw new AuthenticationError("User ID missing in context");

      const userProfile = await Profile.findById(userId);
      if (!userProfile) throw new Error("User profile not found");

      const isFavorite = userProfile.favorites.includes(recipeId);

      const update = isFavorite
        ? { $pull: { favorites: recipeId } }
        : { $addToSet: { favorites: recipeId } };

      await Profile.findByIdAndUpdate(userId, update, { new: true });

      // Update the recipe's favorite status
      // return await RecipeHistory.findByIdAndUpdate(
      //   recipeId,
      //   { favorite: !recipe.favorite },
      //   { new: true }
      // );
      
      const updatedRecipe = await RecipeHistory.findByIdAndUpdate(
        recipeId,
        { favorite: !recipe.favorite },
        { new: true }
      ).select(
        "_id title ingredients instructions comments favorite createdAt mealType"
      );

      if (!updatedRecipe) {
        throw new Error("Failed to update recipe");
      }

      return updatedRecipe;
    },
  },
};

export default resolvers;
