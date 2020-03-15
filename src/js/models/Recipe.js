import axios from "axios";


export default class Recipe {
    constructor(id){
        this.id = id;
    }

    async getRecipe() {
        try{
            const res = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`);
            this.title = res.data.recipe.title;
            this.author = res.data.recipe.publisher;
            this.img = res.data.recipe.image_url;
            this.url = res.data.recipe.source_url;
            this.ingredients = res.data.recipe.ingredients;
        } catch(error){
            alert("Something went wrong :(")
        }
    }

    calcTime(){
        const numIng = this.ingredients.length;
        const periods = Math.ceil(numIng / 3);
        this.time = periods * 15;
    }

    calcServings(){
        this.servings = 4;
    }

    parseIngredients(){
        const unitsLong = ["tablespoons", "tablespoon", "ounces", "ounce", "teaspoons", "teaspoon", "cups", "pounds"];
        const unitsShort = ["tbsp", "tbsp", "oz", "oz", "tsp", "tsp", "cup", "pound"];
        const units = [...unitsShort, "kg", "gm"];

        //uniform unit or shorting the unit
        const newIngredients = this.ingredients.map(el => {
            let ingredient = el.toLowerCase();
            unitsLong.forEach((unit, i) => {
                ingredient = ingredient.replace(unit, unitsShort[i]);
            });

            //remove parentheses
            ingredient = ingredient.replace(/ *\([^)]*\) */g, " ");
            //parse ingredient
            const arrIng = ingredient.split(" ");
            const unitIndex = arrIng.findIndex(el2 => units.includes(el2));

            let objIng;

            if(unitIndex > -1){
                //Ex. 4 1/2 cups arrcount [4,1/2] and eval("4+1/2") ---> 4.5
                //Ex. 4 cups arrcount[4]
                const arrCount = arrIng.slice(0, unitIndex);
                let count;

                if(arrCount === 1){
                    count = eval(arrIng[0].replace("-","+"));
                } else {
                    count = eval(arrIng.slice(0, unitIndex).join("+"));
                }

                objIng = {
                    count: count,
                    unit: arrIng[unitIndex],
                    ingredient: arrIng.slice(unitIndex + 1).join(" ")
                };

            } else if(parseInt(arrIng[0], 10)){

                objIng = {
                    count: parseInt(arrIng[0], 10),
                    unit: "",
                    ingredient: arrIng.slice(1).join(" ")
                };

            } else if(unitIndex === -1){
                //no unit and no number
                objIng = {
                    count: 1,
                    unit: "",
                    ingredient: ingredient                    
                };
            }

            return objIng;
        });

        this.ingredients =  newIngredients;
    }
    updateServings(type){
        //Servings ---> type decrease or increase
        const newServing = type === "dec" ? this.servings -1 : this.servings + 1;
        //ingredient increase or decrease
        this.ingredients.forEach(ing => {
            ing.count *= (newServing/this.servings);
        });
        
        this.servings = newServing;
    }
}