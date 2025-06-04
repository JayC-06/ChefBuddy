import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_FAVORITE_RECIPES } from "../utils/queries";
import { TOGGLE_FAVORITE, ADD_COMMENT } from "../utils/mutations";

// type definition for Comment to ensure type safety
interface Comment {
  username: string;
  text: string;
  createdAt: string;
}

// type definition for Recipe to ensure type safety
interface Recipe {
  _id: string;
  mealType: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  response: string;
  favorite: boolean;
  createdAt: string;
  comments: Comment[];
}
// function to fetch favorite recipes and toggle their favorite status
const SaveFavorites: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [filter] = React.useState<string>("All");
  const [commentText, setCommentText] = React.useState<string>("");
  const [activeRecipeId, setActiveRecipeId] = React.useState<string | null>(
    null
  );

  // useQuery to fetch favorite recipes from the server
  const { loading, error, data, refetch } = useQuery(GET_FAVORITE_RECIPES);

  // useMutation to toggle favorite status of a recipe
  const [toggleFavorite] = useMutation(TOGGLE_FAVORITE, {
    onCompleted: () => refetch(),
  });

  // useMutation to add a comment to a recipe
  const [addComment] = useMutation(ADD_COMMENT, {
    update(cache, { data: { addComment } }) {
      // Get the recipe ID and new comment
      const recipeId = addComment._id;
      const newComment = addComment.comments[addComment.comments.length - 1];

      // Read the current cache data for this specific recipe
      const cacheId = cache.identify({
        __typename: "RecipeHistory",
        _id: recipeId,
      });

      // Update only this specific recipe's comments
      cache.modify({
        id: cacheId,
        fields: {
          comments(existingComments = []) {
            // Simply add the new comment to existing comments
            return [...existingComments, newComment];
          },
        },
      });
    },
    onCompleted: () => {
      refetch();
      setCommentText("");
      setActiveRecipeId(null);
    },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const favoriteRecipes = (data?.myRecipeHistory || [])
    .filter((recipe: Recipe) => recipe.favorite)
    .filter((recipe: Recipe) =>
      filter === "All"
        ? true
        : recipe.mealType?.toLowerCase() === filter.toLowerCase()
    )
    .filter((recipe: Recipe) => {
      const term = searchTerm.toLowerCase();
      return (
        recipe.title?.toLowerCase().includes(term) ||
        recipe.ingredients?.some((ing) => ing.toLowerCase().includes(term)) ||
        recipe.response?.toLowerCase().includes(term) ||
        recipe.instructions?.some((inst) =>
          inst.toLowerCase().includes(term)
        ) ||
        recipe.mealType?.toLowerCase().includes(term)
      );
    });

  // return the list of favorite recipes with filtering options
  return (
    <div className="p-4">
      <h2 className="text-3xl font-extrabold text-center mb-4">
        Your ❤️ Recipes
      </h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by keyword or ingredient..."
          className="px-4 py-2 border rounded w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {favoriteRecipes.length === 0 ? (
        <p>No favorites yet!</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteRecipes.map((recipe: Recipe) => (
            <li key={recipe._id} className="border p-4 rounded shadow bg-white">
              <h3 className="text-xl font-extrabold mb-2">
                <span className="bg-red-100 border border-red-400 text-red-800 py-1 rounded">
                  {recipe.title}
                </span>
              </h3>
              <p>
                <strong>{recipe.mealType}</strong>
              </p>
              <p>
                <strong>Ingredients:</strong> {recipe.ingredients.join(", ")}
              </p>
              <p className="mt-2">
                <strong>Directions:</strong> {recipe.response}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {recipe.instructions.join(" ")}
              </p>

              {recipe.comments && recipe.comments.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-bold">Comments:</h4>
                  <ul className="mt-2">
                    {recipe.comments.map((comment, index) => {
                      const createdAt =
                        comment.createdAt &&
                        !isNaN(new Date(comment.createdAt).getTime())
                          ? new Date(comment.createdAt).toLocaleDateString()
                          : "Unknown Date";
                      return (
                        <li key={index} className="border-b pb-2 mb-2">
                          <p className="text-sm">{comment.text}</p>
                          <p className="text-xs text-gray-500">
                            By {comment.username} on {createdAt}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {activeRecipeId === recipe._id ? (
                <div className="mt-4">
                  <textarea
                    className="w-full p-2 border rounded"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (commentText.trim()) {
                          addComment({
                            variables: {
                              recipeId: recipe._id,
                              text: commentText.trim(),
                            },
                          });
                        }
                      }
                    }}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded mr-2"
                      onClick={() => {
                        setActiveRecipeId(null);
                        setCommentText("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-3 py-1 !bg-green-400 text-blue rounded mr-2 hover:!bg-gray-500 transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
                      onClick={() => {
                        console.log("Adding comment:", recipe._id);
                        if (commentText.trim()) {
                          addComment({
                            variables: {
                              recipeId: recipe._id,
                              text: commentText.trim(),
                            },
                          });
                        }
                      }}
                      disabled={!commentText.trim()}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="mt-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
                  onClick={() => setActiveRecipeId(recipe._id)}
                >
                  Add Comment
                </button>
              )}

              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() =>
                  toggleFavorite({ variables: { recipeId: recipe._id } })
                }
              >
                {recipe.favorite ? "❤️" : "🤍"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SaveFavorites;
