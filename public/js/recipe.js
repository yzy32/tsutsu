$(async function () {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    let jwtToken = null;
    let userId = null;
    if (user) {
      jwtToken = user.accessToken;
      userId = user.user.userId;
    }
    const recipeId = window.location.pathname.replace("/recipe/", "");

    //TODO: get recipe with jwt token
    const result = await axios.get(`/api/1.0/recipe/${recipeId}`);
    let recipe = result.data.recipe;
    console.log(recipe);
    // first part
    $("#recipeName").append(
      `${recipe.recipeName}<button type="button" class="btn btn-outline-primary float-right"><i class="fa-regular fa-bookmark mr-2"></i>Add to Favorite</button>`
    );
    $("#recipeImage").attr("src", recipe.recipeImage);
    $("#description").text(recipe.description);
    $("#author").text(recipe.authorId);
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
      `<i class="fa-regular fa-comment fa-lg mr-3"></i>${recipe.reviewCount} Reviews`
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
      
      <div class="media">
      <img class="align-self-center mr-3 col-3" src="${stepImg}" alt="Generic placeholder image" style="object-fit:cover; height: 150px;">
      <div class="media-body">
        <h4 class="mt-0">${i + 1}</h4>
        ${recipe.recipeSteps[i].step}
      </div>
    </div>
    <hr>`;
      stepList.append(step);
    }
    // review section
    let reviewList = $("#reviewList");

    // submit new review
    $("#reviewBtn").on("click", async (e) => {
      console.log("click on review");
      if (userId) {
        $("#userId").attr("placeholder", userId);
      } else {
        $("#submitReview").addClass("d-none");
        $("#signin").removeClass("d-none");
      }
    });
    $("#submitReview").on("click", async (e) => {
      e.preventDefault();
      try {
        //TODO: post review with jwt token
        let review = $("#message-text").val();
        recipeReview = {
          recipeId: recipeId,
          review: review,
        };
        const response = await axios.post(
          `/api/1.0/recipe/${recipeId}/review`,
          recipeReview,
          {
            headers: {
              Authorization: "Bearer " + jwtToken,
            },
          }
        );
        //TODO: if response success, display review on the top of the review and close the window
        $("#review-modal").modal("hide");
        let reviewDiv = `
        <div class="callout callout-info">
        <h5>${userId}</h5>
        <p>${review}</p>
      </div>`;
        reviewList.prepend(reviewDiv);
      } catch (error) {
        console.log(error);
      }
    });

    $("#signin").on("click", (e) => {
      e.preventDefault();
      window.location = "/user/signin";
    });
  } catch (error) {
    console.log(error);
  }
});
