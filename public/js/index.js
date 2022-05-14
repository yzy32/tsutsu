$(async function () {
  try {
    const response = await axios.get("/api/1.0/keyword/trending");
    let keywords = response.data;
    for (let i = 0; i < keywords.length; i++) {
      $(".keyword").eq(i).text(`# ${keywords[i].keyword.toUpperCase()}`);
      for (let j = 0; j < keywords[i].recipes.length; j++) {
        let card = `
      <div class="card" style="height: 350px;">
        <a href="/recipe/${keywords[i].recipes[j].recipeId}">
          <img src="${keywords[i].recipes[j].recipeImage}" class="card-img-top" alt="recipe-image" style="object-fit:cover; height: 200px">
        </a>
        <div class="card-body" style="height: 100px">
          <a href="/recipe/${keywords[i].recipes[j].recipeId}" class="text-dark">
            <h5 class="card-title h5 text-truncate">${keywords[i].recipes[j].recipeName}</h5>
            <p class="card-text h-40 text-truncate">${keywords[i].recipes[j].description}</p>
          </a>
          <p class="card-text mt-3">
            <a href="/user/${keywords[i].recipes[j].authorId}/recipes">
              <small class="text-muted font-italic">By ${keywords[i].recipes[j].authorId}</small>
            </a>
          </p>
        </div>
      </div>
      `;
        $(".keyword-recipes").eq(i).append(card);
      }
    }
    $(".keyword").on("click", (e) => {
      let keyword = $(e.target).text().split(" ")[1];
      window.location = `recipe/search?q=${keyword}`;
    });
    let user = JSON.parse(localStorage.getItem("user"));
    let jwtToken = null;
    if (user) {
      jwtToken = user.accessToken;
      $("#new-add-title").text("Checkout Your Followings' New Recipes");
    }
    const response2 = await axios.get("/api/1.0/recipe/following", {
      headers: {
        Authorization: "Bearer " + jwtToken,
      },
    });
    let following = response2.data;
    // console.log(following);
    for (let i = 0; i < following.recipes.length; i++) {
      let card = `
      <div class="card" style="height: 350px;">
        <a href="/recipe/${following.recipes[i]._id}">
          <img src="${following.recipes[i].recipeImage}" class="card-img-top" alt="recipe-image" style="object-fit:cover; height: 200px">
        </a>
        <div class="card-body" style="height: 100px">
          <a href="/recipe/${following.recipes[i]._id}" class="text-dark">
            <h5 class="card-title h5 text-truncate">${following.recipes[i].recipeName}</h5>
            <p class="card-text h-40 text-truncate">${following.recipes[i].description}</p>
          </a>
          <p class="card-text mt-3">
            <a href="/user/${following.recipes[i].authorId}/recipes">
              <small class="text-muted font-italic">By ${following.recipes[i].authorId}</small>
            </a>
          </p>
        </div>
      </div>
      `;
      $("#new-add").append(card);
    }
    const response3 = await axios.get("/api/1.0/recipe/popular");
    let popular = response3.data;
    for (let i = 0; i < popular.recipes.length; i++) {
      let card = `
      <div class="card" style="height: 350px;">
        <a href="/recipe/${popular.recipes[i]._id}">
          <img src="${popular.recipes[i].recipeImage}" class="card-img-top" alt="recipe-image" style="object-fit:cover; height: 200px">
        </a>
        <div class="card-body" style="height: 100px">
          <a href="/recipe/${popular.recipes[i]._id}" class="text-dark">
            <h5 class="card-title h5 text-truncate">${popular.recipes[i].recipeName}</h5>
            <p class="card-text h-40 text-truncate">${popular.recipes[i].description}</p>
          </a>
          <p class="card-text mt-3">
            <a href="/user/${popular.recipes[i].authorId}/recipes">
              <small class="text-muted font-italic">By ${popular.recipes[i].authorId}</small>
            </a>
          </p>
        </div>
      </div>
      `;
      $("#popular").append(card);
    }
    console.log(popular);
    $("#loading").addClass("d-none");
    $("#home").removeClass("d-none");
  } catch (error) {
    console.log(error);
  }
});
