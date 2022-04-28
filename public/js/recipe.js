let recipe = null;
let recipeId = null;
toastr.options = {
  closeButton: true,
  debug: false,
  newestOnTop: false,
  progressBar: false,
  positionClass: "toast-bottom-right",
  preventDuplicates: true,
  onclick: null,
  showDuration: "300",
  hideDuration: "1000",
  timeOut: "4000",
  extendedTimeOut: "1000",
  showEasing: "swing",
  hideEasing: "linear",
  showMethod: "fadeIn",
  hideMethod: "fadeOut",
};
$(async function () {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    let jwtToken = null;
    let userId = null;
    if (user) {
      jwtToken = user.accessToken;
      userId = user.user.userId;
    }
    recipeId = window.location.pathname.replace("/recipe/", "");
    // ------- render recipe page -----------

    //get recipe with jwt token
    const result = await axios.get(`/api/1.0/recipe/${recipeId}`, {
      headers: {
        Authorization: "Bearer " + jwtToken,
      },
    });
    recipe = result.data.recipe;
    console.log(recipe);
    if (!recipe.reviewCount) {
      recipe.reviewCount = 0;
    }
    if (recipe.isFollow === true) {
      $("#unfollowBtn").removeClass("d-none");
    } else if (recipe.isFollow === false) {
      $("#followBtn").removeClass("d-none");
    }
    if (recipe.isFavorite === true) {
      $("#unfavoriteBtn").removeClass("d-none");
    } else if (recipe.isFavorite === false) {
      $("#favoriteBtn").removeClass("d-none");
    }
    $("#recipeName").text(recipe.recipeName);
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
      let tag = `<li><a href="/recipe/search?q=${t}" class="text-orange">&num;&nbsp;${t}</a></li>`;
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
    recipe.reviewList.map((r) => {
      renderReview(reviewList, r);
    });

    // review pagination
    let currentPage = 1;
    let pageSize = 5;
    let totalPage =
      recipe.reviewCount == 0 ? 0 : Math.ceil(recipe.reviewCount / pageSize);
    renderReviewPagination(currentPage, pageSize, recipe.reviewCount);
    // ------- end of recipe page -----------

    //click "add to favorite"
    $("#favoriteBtn").on("click", async (e) => {
      e.preventDefault();
      let data = { recipeId: recipeId };
      console.log("favorite: ", recipeId);
      //if user not sign in, redirect to user/signin
      try {
        if (!jwtToken || !userId) {
          window.location = "/user/signin";
        } else {
          const result = await axios.post(`/api/1.0/user/favorite`, data, {
            headers: {
              Authorization: "Bearer " + jwtToken,
            },
          });
          // if success, change btn
          $("#favoriteBtn").addClass("d-none");
          $("#unfavoriteBtn").removeClass("d-none");
          recipe.favoriteCount += 1;
          // change favorite count
          $("#favoriteCount").empty();
          $("#favoriteCount").append(
            `<i class="fa-regular fa-bookmark fa-lg mr-3"></i>${recipe.favoriteCount} Favorites`
          );
          console.log(recipe.favoriteCount);
        }
      } catch (error) {
        console.log(error);
        //if fail to favorite, trigger warning
        toastr.warning("Fail to favorite.");
        // if fails, change btn back
        $("#favoriteBtn").removeClass("d-none");
        $("#unfavoriteBtn").addClass("d-none");
        recipe.favoriteCount -= 1;
      }
    });

    //click "remove from favorite"
    $("#unfavoriteBtn").on("click", async (e) => {
      e.preventDefault();
      let data = { recipeId: recipeId };
      console.log("favorite: ", recipeId);
      //if user not sign in, redirect to user/signin
      try {
        if (!jwtToken || !userId) {
          window.location = "/user/signin";
        } else {
          const result = await axios.delete(`/api/1.0/user/favorite`, {
            headers: {
              Authorization: "Bearer " + jwtToken,
            },
            data: data,
          });
          // if success, change btn
          $("#favoriteBtn").removeClass("d-none");
          $("#unfavoriteBtn").addClass("d-none");
          recipe.favoriteCount -= 1;
          // change favorite count
          $("#favoriteCount").empty();
          $("#favoriteCount").append(
            `<i class="fa-regular fa-bookmark fa-lg mr-3"></i>${recipe.favoriteCount} Favorites`
          );
          console.log(recipe.favoriteCount);
        }
      } catch (error) {
        console.log(error);
        //if fail to favorite, trigger warning
        toastr.warning("Fail to remove from favorite.");
        // if fails, change btn back
        $("#favoriteBtn").addClass("d-none");
        $("#unfavoriteBtn").removeClass("d-none");
      }
    });

    //click "follow"
    $("#followBtn").on("click", async (e) => {
      e.preventDefault();
      try {
        //if user not sign in, redirect to user/signin
        if (!jwtToken || !userId) {
          window.location = "/user/signin";
        } else {
          //post to /api/1.0/user/following
          let data = { followingId: recipe.authorId };
          const response = await axios.post("/api/1.0/user/following", data, {
            headers: {
              Authorization: "Bearer " + jwtToken,
            },
          });
          //if success, change btn
          $("#followBtn").addClass("d-none");
          $("#unfollowBtn").removeClass("d-none");
          console.log("follow result: ", response.data);
        }
      } catch (error) {
        console.log(error);
        //if no success, show alert
        if (error.response && error.response.status != 200) {
          toastr.warning("Fail to follow.");
        }
      }
    });
    //click unfollow
    $("#unfollowBtn").on("click", async (e) => {
      e.preventDefault();
      try {
        //if user not sign in, redirect to user/signin
        if (!jwtToken || !userId) {
          window.location = "/user/signin";
        } else {
          console.log("token: ", jwtToken);
          //post to /api/1.0/user/following
          let data = { unfollowingId: recipe.authorId };
          const response = await axios.delete("/api/1.0/user/following", {
            headers: {
              Authorization: "Bearer " + jwtToken,
            },
            data: data,
          });
          //if success, change btn
          $("#followBtn").removeClass("d-none");
          $("#unfollowBtn").addClass("d-none");
          console.log("unfollow result", response.data);
        }
      } catch (error) {
        console.log(error);
        //if no success, show alert
        if (error.response && error.response.status != 200) {
          toastr.warning("Fail to unfollow.");
        }
      }
    });

    // change review page
    let pageGroup = $("#pageGroup");
    pageGroup.on("click", async (e) => {
      let toPage = $(e.target).data("page");
      console.log("to page: ", toPage);
      if (!toPage) {
        return;
      }
      const result = await axios.get(
        `/api/1.0/recipe/${recipeId}/review?page=${toPage}`
      );
      currentPage = toPage;
      renderReviewPagination(currentPage, pageSize, recipe.reviewCount);
      reviewList.empty();
      result.data.review.map((r) => {
        renderReview(reviewList, r);
      });
    });
    // open review form
    $("#reviewBtn").on("click", async (e) => {
      if (userId) {
        $("#userId").attr("placeholder", userId);
        $("#message-text").val("");
      } else {
        $("#submitReview").addClass("d-none");
        $("#signin").removeClass("d-none");
      }
    });
    // post review with jwt token
    $("#submitReview").on("click", async (e) => {
      e.preventDefault();
      try {
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
        //if response success, display review on the top of the review and close the window
        //prepend review and remove last one if reviewlist > 5
        let reviewDiv = `
        <div class="callout callout-warning">
          <h5>${userId}</h5>
          <p>${review}</p>
        </div>`;
        reviewList.prepend(reviewDiv);
        if (reviewList.children().length > 5) {
          reviewList.children().last().remove();
        }
        // renderReviewPagination(currentPage, pageSize, recipe.reviewCount);
        $("#review-modal").modal("hide");
        recipe.reviewCount += 1;
        // update reviewcount
        $("#reviewCount").empty();
        $("#reviewCount").append(
          `<i class="fa-regular fa-comment fa-lg mr-3"></i>${recipe.reviewCount} Reviews`
        );
      } catch (error) {
        console.log(error);
      }
    });
    $("#signin").on("click", (e) => {
      e.preventDefault();
      window.location = "/user/signin";
    });

    //FIXME: test alert (need to delete)
    // toastr.options = {
    //   closeButton: true,
    //   debug: false,
    //   newestOnTop: false,
    //   progressBar: false,
    //   positionClass: "toast-bottom-right",
    //   preventDuplicates: true,
    //   onclick: null,
    //   showDuration: "300",
    //   hideDuration: "1000",
    //   timeOut: "2000",
    //   extendedTimeOut: "1000",
    //   showEasing: "swing",
    //   hideEasing: "linear",
    //   showMethod: "fadeIn",
    //   hideMethod: "fadeOut",
    // };
    // $("#followBtn").on("click", (e) => {
    //   e.preventDefault();
    //   toastr.warning(
    //     "Lorem ipsum dolor sit amet, consetetur sadipscing elitr."
    //   );
    // });
    // $(".toastrDefaultWarning").click(function () {
    //   toastr.warning(
    //     "Lorem ipsum dolor sit amet, consetetur sadipscing elitr."
    //   );
    // });
  } catch (error) {
    console.log(error);
  }
});

function renderReviewPagination(currentPage, pageSize, reviewCount) {
  // let currentPage = currentPage;
  // let pageSize = 5;
  // let totalPage = Math.ceil(recipe.reviewCount / pageSize);
  let totalPage = reviewCount == 0 ? 0 : Math.ceil(reviewCount / pageSize);
  let pageGroup = $("#pageGroup");
  let toFirstPage = $("#to-first");
  pageGroup.children().slice(1).remove();
  let toLastPage = `
  <li class="page-item">
    <a id="to-last" data-page="${totalPage}" class="page-link" aria-label="Next">
      &raquo;
    </a>
  </li>
  `;
  console.log("total page: ", totalPage);
  if (totalPage == 0 || isNaN(totalPage)) {
    $(toFirstPage).addClass("d-none");
    return;
  }
  if (currentPage == 1) {
    $(toFirstPage).addClass("d-none");
  }
  if (currentPage != 1) {
    $(toFirstPage).removeClass("d-none");
  }
  let firstNum = currentPage - 2 < 1 ? 1 : currentPage - 2;
  let lastNum = currentPage + 2 >= totalPage ? totalPage : totalPage - 2;
  for (let i = firstNum; i <= lastNum; i++) {
    let page = `<li class="page-item"><a data-page="${i}" class="page-link">${i}</a></li>`;
    if (i == currentPage) {
      page = `<li class="page-item active"><a data-page="${i}" class="page-link">${i}</a></li>`;
    }
    pageGroup.append(page);
  }
  if (currentPage != totalPage && totalPage != 1) {
    pageGroup.append(toLastPage);
  }
}

function renderReview(reviewList, r) {
  let reviewDiv = `
  <div class="callout callout-warning">
  <h5>${r.userId}</h5>
  <p>${r.review}</p>
</div>`;
  reviewList.append(reviewDiv);
}
