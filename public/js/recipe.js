$(async function () {
  try {
    const recipeRoute = window.location.pathname;
    const result = await axios.get(`/api/1.0${recipeRoute}`);
    let recipe = result.data.recipe;
    console.log(recipe);
    // first part
    $("#recipeName").append(
      `${recipe.recipeName}<button type="button" class="btn btn-outline-primary float-right"><i class="fa-regular fa-bookmark mr-2"></i>Add to Favorite</button>`
    );
    $("#description").text(recipe.description);
    $("#author").text(recipe.author);
    $("#author-link").attr("href", `/user/${recipe.authorId}/recipes`);
    $("#cookTime").append(
      `<i class="fa-regular fa-clock fa-lg mr-3"></i>${recipe.cookTime} Mins`
    );
    $("#servings").append(
      `<i class="fa-regular fa-user fa-lg mr-3"></i>${recipe.servings} Servings`
    );
    $("#favoriteCount").append(
      `<i class="fa-regular fa-bookmark fa-lg mr-3"></i>${recipe.favoriteCount} Favorites`
    );
    $("#reviewCount").append(
      `<i class="fa-regular fa-comment fa-lg mr-3"></i>${recipe.recipeReviews.length} Reviews`
    );
    let tagList = $("#tagList");
    recipe.tags.map((t) => {
      let tag = `<li><a href="/recipe/search?q=${t}" class="text-dark">${t}</a></li>`;
      tagList.append(tag);
    });
    // ingredients
    let ingredientList = $("#ingredientList");
    for (let i = 0; i < recipe.ingredients.length; i++) {
      let ingredient = `<tr><th scope="row">${i + 1}</th><td>${
        recipe.ingredients[i]
      }</td></tr>`;
      ingredientList.append(ingredient);
    }
    // steps and tips
    let stepList = $("#recipeSteps");
    for (let i = 0; i < recipe.recipeSteps.length; i++) {
      let stepImg = recipe.recipeSteps[i].image
        ? recipe.recipeSteps[i].image
        : "https://tsutsu-s3.s3.ap-northeast-1.amazonaws.com/assets/default/step.png";
      let step = `
      <hr>
      <div class="media">
      <img class="align-self-center mr-3 col-3" src="${stepImg}" alt="Generic placeholder image" style="object-fit:cover; height: 150px;">
      <div class="media-body">
        <h4 class="mt-0">${i + 1}</h4>
        ${recipe.recipeSteps[i].step}
      </div>
    </div>`;
      stepList.append(step);
    }
  } catch (error) {
    console.log(error);
  }
});
