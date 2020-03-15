import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";

/* Global state of the app
-Search object
-Current recipe object
-shopping list object
-liked recipe 
*/

const state = {};

const controlSearch = async () => {
    //get query from view
    const query = searchView.getInput();

    if(query){
        //new search object and add it to the state
        state.search = new Search(query);
        //prepare UI for result
        searchView.clearInput();
        searchView.clearResult();
        renderLoader(elements.searchRes);
        try{
            //search for the recipe
            await state.search.getResults();
            //render result on the UI
            clearLoader();
            searchView.renderResult(state.search.recipes);
        }catch(error){
            alert("Something wrong with the search...");
            clearLoader();
        }
    }
};

elements.searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener("click", e => {
    const btn = e.target.closest(".btn-inline");

    if(btn){
        const gotoPage = parseInt(btn.dataset.goto);
        searchView.clearResult(); 
        searchView.renderResult(state.search.recipes, gotoPage);
    }
});

/*
*RECIPE CONTROLLER
*/

const controlRecipe = async () => {
    //get id from url
    const id = window.location.hash.replace("#","");

    if(id){
        //prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //highlight selected
        if(state.search){
            searchView.highlightSelected(id);
        }

        //create new recipe object
        state.recipe = new Recipe(id);
        try{
            //get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            //caltime and servings
            state.recipe.calcTime();
            state.recipe.calcServings();
            //render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
        }catch(error){
            alert("Error in processing recipe.")
        }
    }
};

window.addEventListener("hashchange", controlRecipe);
window.addEventListener("load", controlRecipe);


/**
 * LIST CONTROLLER
 */

const controlList = () => {
    //create a list if there is no list
    if(!state.list){
        state.list = new List();
    }
    //add each ingredients to the list
    state.recipe.ingredients.forEach(element => {
        const item = state.list.addItem(element.count, element.unit, element.ingredient);
        listView.renderItem(item);
    });
}
//handle update and delete list item
elements.shopping.addEventListener("click", e => {
    const id = e.target.closest(".shopping__item").dataset.itemid;

    //handle the delete event
    if(e.target.matches(".shopping__delete, .shopping__delete *")){
        //delete from state as well as interface
        state.list.deleteItem(id);

        listView.deleteItem(id);
        //handle the count update
    } else if(e.target.matches(".shopping__count-value")){
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});


/**
 * LIKE CONTROLLER
 */
const controlLike = () => {

    if(!state.likes){
        state.likes = new Likes();
    }

    const currentID = state.recipe.id;
    //user not yet liked the recipe
    if(!state.likes.isLiked(currentID)){
        //add like to state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img 
        );
        //toggle the like button
        likesView.toggleLikeBtn(true);
        //add to the UI list
        likesView.renderLike(newLike);
    } else {
        //remove like from state
        state.likes.deleteLike(currentID);
        //remove the like button
        likesView.toggleLikeBtn(false);
        //remove from the UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumOfLikes());
};
//restoring liked recipe on page load
window.addEventListener("load", ()=> {
    state.likes = new Likes();
    state.likes.readStorage();
    likesView.toggleLikeMenu(state.likes.getNumOfLikes());

    state.likes.likes.forEach(like => likesView.renderLike(like));
});
//handling recipe button 
elements.recipe.addEventListener("click", e => {
    if(e.target.matches(".btn-decrease, .btn-decrease *")){
        if(state.recipe.servings > 1){
            state.recipe.updateServings("dec");
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if(e.target.matches(".btn-increase, .btn-increase *")){
        state.recipe.updateServings("inc");
        recipeView.updateServingsIngredients(state.recipe);
    } else if(e.target.matches(".recipe__btn--add, .recipe__btn--add *")){
        controlList();
    } else if(e.target.matches(".recipe__love, .recipe__love *")){
        controlLike();
    }
});