$(async function () {
  try {
    const response = await axios.get("/api/1.0/keyword/trending");
    let keywords = response.data;
    for (let i = 0; i < keywords.length; i++) {
      $(".keyword").eq(i).text(`# ${keywords[i].keyword.toUpperCase()}`);
      for (let j = 0; j < keywords[i].recipes.length; j++) {
        let card = `
      <div class="card" style="height: 300px;">
      <img src="${keywords[i].recipes[j].recipeImage}" class="card-img-top h-50" alt="recipe-image" style="object-fit:cover;">
      <div class="card-body h-50">
        <a href="/recipe/${keywords[i].recipes[j].recipeId}" class="text-dark">
          <h5 class="card-title h5 text-truncate">${keywords[i].recipes[j].recipeName}</h5>
          <p class="card-text h-40 text-truncate">${keywords[i].recipes[j].description}</p>
        </a>
        <p class="card-text mt-3"><small class="text-muted font-italic">By ${keywords[i].recipes[j].author}</small></p>
      </div>
    </div>
      `;
        $(".keyword-recipes").eq(i).append(card);
      }
    }
    $(".keyword").on("click", (e) => {
      let keyword = $(e.target).text();
      window.location = `recipe/search?q=${keyword}`;
    });
  } catch (error) {
    console.log(error);
  }
});
