import { Profile } from '../models/index.js';
import { signToken, AuthenticationError } from '../utils/auth.js';
import FridgeItem from '../models/fridgeModel.js';
import { IResolvers } from '@graphql-tools/utils';
import { AuthRequest } from '../utils/auth'
import  Recipe from '../models/RecipeModel.js';

interface Profile {
  _id: string;
  name: string;
  email: string;
  password: string;
  skills: string[];
}

const resolvers: IResolvers = {
  Query: {
    me: async (_, __, context: { req: AuthRequest }) => {
      if (!context.req.user) throw new AuthenticationError('Not authenticated');
      return await Profile.findById(context.req.user._id).populate('savedRecipes');
    },
    getFridge: async (_parent: any, _args: any, context: { user: any }) => {
      if (!context.user) throw new AuthenticationError('You must be logged in to view your fridge.');
      return await FridgeItem.find({ userId: context.user._id }).populate('ingredient');
      },
    },
    getRecipeById: async (_, { id }) => {
      return await Recipe.findById(id);
    }
  },
    
  Mutation: {

    login: async (_, { email, password }) => {
      const profile = await Profile.findOne({ email });
      if (!profile || !(await profile.isCorrectPassword(password))) {
        throw new AuthenticationError('Incorrect credentials');
      }
      const token = signToken({ _id: profile._id, email: profile.email, username: profile.name });
      return { token, profile };
    }, 

    register: async (_, { username, email, password }) => {
      const profile = await Profile.create({ username, email, password });
      const token = signToken({ _id: profile._id, email: profile.email, username: profile.name });
      return { token, profile };
    },

    saveRecipe: async (_, { recipeId }, context: { req: AuthRequest }) => {
      if (!context.req.user) throw new AuthenticationError('Not authenticated');

      return await Profile.findByIdAndUpdate(
        context.req.user._id,
        { $addToSet: { savedRecipes: recipeId } },
        { new: true }
      ).populate('savedRecipes');
    },
    
    favRecipe: async (_, { recipeId }, context: { req: AuthRequest }) => {
      if (!context.req.user) throw new AuthenticationError('Not authenticated');

      const recipe = await Recipe.findById(recipeId);
      if (!recipe) throw new Error('Recipe not found');

      recipe.favorite = !recipe.favorite;
      await recipe.save();

      return recipe;
    },
  },
};

export default resolvers;
