/*!
 * bsCustomFileInput v1.3.4 (https://github.com/Johann-S/bs-custom-file-input)
 * Copyright 2018 - 2020 Johann-S <johann.servoire@gmail.com>
 * Licensed under MIT (https://github.com/Johann-S/bs-custom-file-input/blob/master/LICENSE)
 */
$(document).ready(function () {
  bsCustomFileInput.init();
});
!(function (e, t) {
  "object" == typeof exports && "undefined" != typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
    ? define(t)
    : ((e = e || self).bsCustomFileInput = t());
})(this, function () {
  "use strict";
  var s = {
      CUSTOMFILE: '.custom-file input[type="file"]',
      CUSTOMFILELABEL: ".custom-file-label",
      FORM: "form",
      INPUT: "input",
    },
    l = function (e) {
      if (0 < e.childNodes.length)
        for (var t = [].slice.call(e.childNodes), n = 0; n < t.length; n++) {
          var l = t[n];
          if (3 !== l.nodeType) return l;
        }
      return e;
    },
    u = function (e) {
      var t = e.bsCustomFileInput.defaultText,
        n = e.parentNode.querySelector(s.CUSTOMFILELABEL);
      n && (l(n).textContent = t);
    },
    n = !!window.File,
    r = function (e) {
      if (e.hasAttribute("multiple") && n)
        return [].slice
          .call(e.files)
          .map(function (e) {
            return e.name;
          })
          .join(", ");
      if (-1 === e.value.indexOf("fakepath")) return e.value;
      var t = e.value.split("\\");
      return t[t.length - 1];
    };
  function d() {
    var e = this.parentNode.querySelector(s.CUSTOMFILELABEL);
    if (e) {
      var t = l(e),
        n = r(this);
      n.length ? (t.textContent = n) : u(this);
    }
  }
  function v() {
    for (
      var e = [].slice
          .call(this.querySelectorAll(s.INPUT))
          .filter(function (e) {
            return !!e.bsCustomFileInput;
          }),
        t = 0,
        n = e.length;
      t < n;
      t++
    )
      u(e[t]);
  }
  var p = "bsCustomFileInput",
    m = "reset",
    h = "change";
  return {
    init: function (e, t) {
      void 0 === e && (e = s.CUSTOMFILE), void 0 === t && (t = s.FORM);
      for (
        var n,
          l,
          r = [].slice.call(document.querySelectorAll(e)),
          i = [].slice.call(document.querySelectorAll(t)),
          o = 0,
          u = r.length;
        o < u;
        o++
      ) {
        var c = r[o];
        Object.defineProperty(c, p, {
          value: {
            defaultText:
              ((n = void 0),
              (n = ""),
              (l = c.parentNode.querySelector(s.CUSTOMFILELABEL)) &&
                (n = l.textContent),
              n),
          },
          writable: !0,
        }),
          d.call(c),
          c.addEventListener(h, d);
      }
      for (var f = 0, a = i.length; f < a; f++)
        i[f].addEventListener(m, v),
          Object.defineProperty(i[f], p, { value: !0, writable: !0 });
    },
    destroy: function () {
      for (
        var e = [].slice
            .call(document.querySelectorAll(s.FORM))
            .filter(function (e) {
              return !!e.bsCustomFileInput;
            }),
          t = [].slice
            .call(document.querySelectorAll(s.INPUT))
            .filter(function (e) {
              return !!e.bsCustomFileInput;
            }),
          n = 0,
          l = t.length;
        n < l;
        n++
      ) {
        var r = t[n];
        u(r), (r[p] = void 0), r.removeEventListener(h, d);
      }
      for (var i = 0, o = e.length; i < o; i++)
        e[i].removeEventListener(m, v), (e[i][p] = void 0);
    },
  };
});
//# sourceMappingURL=bs-custom-file-input.min.js.map
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
// below is to render webpage
$(async function () {
  try {
    let authorId = window.location.pathname.split("/")[2];
    let profileType = window.location.pathname.split("/").pop();
    console.log("profile type: ", profileType);
    let user = JSON.parse(localStorage.getItem("user"));
    let jwtToken = null;
    let userId = null;
    if (user) {
      jwtToken = user.accessToken;
      userId = user.user.userId;
    }
    const authorResponse = await axios.get(
      `/api/1.0/user/${authorId}/profile`,
      {
        headers: {
          Authorization: "Bearer " + jwtToken,
        },
      }
    );
    let author = authorResponse.data.user;
    console.log("author: ", author);
    //author info
    if (!jwtToken || authorId != userId) {
      $("#createRecipe").addClass("d-none");
      $("#settings").addClass("d-none");
    }
    $("#userName").text(author.userName);
    $("#userImage").attr("src", author.userImage);
    $("#following").text(`${author.following.length} following`);
    $("#following-link").attr("href", `/user/${author.userId}/followings`);
    $("#follower").text(`${author.follower.length} follower`);
    $("#follower-link").attr("href", `/user/${author.userId}/followers`);
    $("#userId").html(`&commat;${author.userId}`);
    $("#introduction").html(author.introduction);
    $("#author-follow").data("userid", author.userId);
    $("#author-unfollow").data("userid", author.userId);
    if (author.isFollowing) {
      $("#author-unfollow").removeClass("d-none");
    } else if (author.isFollowing != null) {
      $("#author-follow").removeClass("d-none");
    }
    // tab active status
    if (profileType == "recipes") {
      $("#myrecipes").addClass("active");
      $("#recipe-section").addClass("active");
      $("#myfavorites").removeClass("active");
      $("#favorite-section").removeClass("active");
      $("#settings").removeClass("active");
      $("#setting-section").removeClass("active");
      $("#createRecipe").removeClass("active");
      $("#createRecipe-section").removeClass("active");
    } else if (profileType == "favorites") {
      $("#myrecipes").removeClass("active");
      $("#recipe-section").removeClass("active");
      $("#myfavorites").addClass("active");
      $("#favorite-section").addClass("active");
      $("#settings").removeClass("active");
      $("#setting-section").removeClass("active");
      $("#createRecipe").removeClass("active");
      $("#createRecipe-section").removeClass("active");
    } else if (profileType == "settings") {
      $("#myrecipes").removeClass("active");
      $("#recipe-section").removeClass("active");
      $("#myfavorites").removeClass("active");
      $("#favorite-section").removeClass("active");
      $("#settings").addClass("active");
      $("#setting-section").addClass("active");
      $("#createRecipe").removeClass("active");
      $("#createRecipe-section").removeClass("active");
    } else if (profileType == "create") {
      $("#myrecipes").removeClass("active");
      $("#recipe-section").removeClass("active");
      $("#myfavorites").removeClass("active");
      $("#favorite-section").removeClass("active");
      $("#settings").removeClass("active");
      $("#setting-section").removeClass("active");
      $("#createRecipe").addClass("active");
      $("#createRecipe-section").addClass("active");
    }
    // render setting form
    $("#form-email").val(author.email);
    $("#form-userId").val(author.userId);
    $("#form-userName").val(author.userName);

    // render recipe and favorites
    let currentPage = new URLSearchParams(window.location.search).get("page");
    let pageSize = 10;
    await renderRecipe(authorId, currentPage, jwtToken, pageSize);
    await renderFavorite(authorId, currentPage, pageSize);

    //tab url
    $("#myrecipes").on("click", async (e) => {
      console.log("click on myrecipes");
      window.history.pushState({}, "", `/user/${authorId}/recipes`);
      profileType = window.location.pathname.split("/").pop();
      // render recipe
      let currentPage = new URLSearchParams(window.location.search).get("page");
      await renderRecipe(authorId, currentPage, jwtToken, pageSize);
    });
    $("#myfavorites").on("click", async (e) => {
      console.log("click on myfavorites");
      window.history.pushState({}, "", `/user/${authorId}/favorites`);
      profileType = window.location.pathname.split("/").pop();
      // render favorite
      let currentPage = new URLSearchParams(window.location.search).get("page");
      await renderFavorite(authorId, currentPage, pageSize);
    });
    $("#createRecipe").on("click", (e) => {
      console.log("click on create recipe");
      window.history.pushState({}, "", `/user/${authorId}/recipe/create`);
      profileType = window.location.pathname.split("/").pop();
    });
    $("#settings").on("click", (e) => {
      console.log("click on settings");
      window.history.pushState({}, "", `/user/${authorId}/settings`);
      profileType = window.location.pathname.split("/").pop();
    });

    // click on pagination to new page
    $(".pagination").on("click", async (e) => {
      e.preventDefault();
      let newUrl = new URL(
        `${window.location.origin}${window.location.pathname}`
      );
      try {
        let toPage = $(e.target).data("page");
        if (!toPage) {
          return;
        }
        //change URL based on set searchParams based on page number that user click
        newUrl.searchParams.set("page", toPage);
        window.history.pushState({}, "", newUrl);
        // identify current profile type, then render
        if (profileType == "recipes") {
          await renderRecipe(authorId, toPage, jwtToken, pageSize);
        } else if (profileType == "favorites") {
          await renderFavorite(authorId, toPage, pageSize);
        }
      } catch (error) {
        console.log(error);
      }
    });

    //FIXME: set private (when change to next page, cannot set)
    $(".setPublic").on("click", async (e) => {
      let toPublic = true;
      let recipeId = $(e.target).data("recipeid");
      let data = { recipeId, toPublic };
      const response = await axios.post("/api/1.0/recipe/setPublic", data, {
        headers: {
          Authorization: "Bearer " + jwtToken,
        },
      });
      console.log(data);
      console.log(response.data);
      let publicDiv = $(e.target).parent().parent();
      let privateDiv = publicDiv.prev();
      publicDiv.addClass("d-none");
      privateDiv.removeClass("d-none");
    });
    $(".setPrivate").on("click", async (e) => {
      let toPublic = false;
      let recipeId = $(e.target).data("recipeid");
      let data = { recipeId, toPublic };
      const response = await axios.post("/api/1.0/recipe/setPublic", data, {
        headers: {
          Authorization: "Bearer " + jwtToken,
        },
      });
      console.log(data);
      console.log(response.data);
      let privateDiv = $(e.target).parent().parent();
      let publicDiv = privateDiv.next();
      privateDiv.addClass("d-none");
      publicDiv.removeClass("d-none");
    });
    // listen to follow
    $(".toFollow").on("click", async (e) => {
      e.preventDefault();
      try {
        console.log($(e.target).data("userid"));
        console.log($(e.target));
        let followingId = $(e.target).data("userid");
        if (!jwtToken) {
          window.location = "/user/signin";
        } else {
          let data = { followingId };
          const response = await axios.post("/api/1.0/user/following", data, {
            headers: {
              Authorization: "Bearer " + jwtToken,
            },
          });
          $(e.target).addClass("d-none");
          $(e.target).next().removeClass("d-none");
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
    // list to unfollow
    $(".toUnFollow").on("click", async (e) => {
      e.preventDefault();
      try {
        console.log($(e.target).data("userid"));
        console.log($(e.target));
        let unfollowingId = $(e.target).data("userid");
        if (!jwtToken) {
          window.location = "/user/signin";
        } else {
          let data = { unfollowingId };
          const response = await axios.delete("/api/1.0/user/following", {
            headers: {
              Authorization: "Bearer " + jwtToken,
            },
            data: data,
          });
          $(e.target).addClass("d-none");
          $(e.target).prev().removeClass("d-none");
          console.log("unfollow result: ", response.data);
        }
      } catch (error) {
        console.log(error);
        //if no success, show alert
        if (error.response && error.response.status != 200) {
          toastr.warning("Fail to follow.");
        }
      }
    });
    $("#update").on("click", async (e) => {
      e.preventDefault();
      try {
        const profile = $("#profileForm");
        const profileForm = new FormData(profile[0]);
        if (
          profileForm.get("introduction") == null &&
          profileForm.get("userImage".name) == ""
        ) {
          toastr.warning("Either intro or image has to have input");
          return;
        }
        const response = await axios.put("/api/1.0/user/profile", profileForm, {
          headers: {
            Authorization: "Bearer " + jwtToken,
            "Content-Type": "multipart/form-data",
          },
        });
        let update = response.data.update;
        if (update.userId) {
          window.location = `/user/${update.userId}/settings`;
        }
      } catch (error) {
        console.log(error);
        if (error.response && error.response.status == 400) {
          toastr.warning("Either intro or image has to have input");
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
});

// -----------------function-----------------
async function renderRecipe(authorId, page, jwtToken, pageSize) {
  try {
    if (!page) {
      page = 1;
    }
    //recipe
    const recipeResponse = await axios.get(
      `/api/1.0/user/${authorId}/recipes?page=${page}`,
      {
        headers: {
          Authorization: "Bearer " + jwtToken,
        },
      }
    );
    const recipe = recipeResponse.data.recipe;
    console.log(recipe);
    // myrecipe btn
    $("#myrecipes").text(`${recipe.total} Recipes`);
    let recipeList = $("#recipeList");
    recipeList.empty();
    for (let i = 0; i < recipe.result.length; i++) {
      //ingredients list
      let ingredients = "";
      for (let j = 0; j < recipe.result[i].ingredients.length; j++) {
        let ingredient = `<tr><th scope="row">${j + 1}</th><td>${
          recipe.result[i].ingredients[j]
        }</td></tr>`;
        ingredients += ingredient;
      }
      //public setting
      let publicBtn = "";
      let public = `
      <div class="card-tools">
        <button type="button" class="btn btn-tool">
          <i data-recipeId="${recipe.result[i]._id}" class="fa-regular fa-eye setPrivate"></i>
        </button>
      </div>
      <div class="card-tools d-none ">
        <button type="button" class="btn btn-tool">
          <i data-recipeid="${recipe.result[i]._id}" class="fa-regular fa-eye-slash setPublic"></i>
        </button>
      </div>
      `;
      let private = `
      <div class="card-tools d-none">
        <button type="button" class="btn btn-tool">
          <i data-recipeId="${recipe.result[i]._id}" class="fa-regular fa-eye setPrivate"></i>
        </button>
      </div>
      <div class="card-tools ">
        <button type="button" class="btn btn-tool">
          <i data-recipeid="${recipe.result[i]._id}" class="fa-regular fa-eye-slash setPublic"></i>
        </button>
      </div>
      `;
      //if recipe.setPublic = true, check recipe.result[i].isPublic (true, false)
      //if recipe.setPublic = false, don't show any public setting
      if (recipe.setPublic && recipe.result[i].isPublic == true) {
        publicBtn += public;
      } else if (recipe.setPublic && recipe.result[i].isPublic == false) {
        publicBtn += private;
      }
      let recipeHTML = `
      <div class="card card-outline card-primary">
        <div class="card-header">
          <h3 class="card-title">${recipe.result[i].recipeName}</h3>
          ${publicBtn}
        </div>
        <div class="card-body">
          <a href="/recipe/${recipe.result[i]._id}" class="text-dark">
            <div class="media">
              <img class="align-self-center mr-4 col-4" src="${recipe.result[i].recipeImage}" alt="recipe image" style="max-height: 300px; object-fit: cover;">
              <div class="media-body table-responsive p-0 col-7" style="height: 300px;">
                <table class="table table-head-fixed text-nowrap">
                  <thead class="h5">
                    <tr>
                      <th scope="col" style="width: 80px;">#</th>
                      <th scope="col">Ingredient</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ingredients}
                  </tbody>
                </table>
              </div>
            </div>
          </a>
        </div>
    `;
      recipeList.append(recipeHTML);
    }
    let pageGroup = $("#recipePage");
    let toFirstPage = $("#to-recipe-first");
    renderPagination(pageGroup, toFirstPage, page, pageSize, recipe.total);
  } catch (error) {
    return error;
  }
}

async function renderFavorite(authorId, page, pageSize) {
  try {
    if (!page) {
      page = 1;
    }
    const favoriteResponse = await axios.get(
      `/api/1.0/user/${authorId}/favorites?page=${page}`
    );
    let favorite = favoriteResponse.data.favorite;
    console.log(favorite);
    $("#myfavorites").text(`${favorite.total} Favorites`);
    //favorite-section
    let favoriteList = $("#favoriteList");
    favoriteList.empty();
    for (let i = 0; i < favorite.result.length; i++) {
      //ingredients list
      let ingredients = "";
      for (let j = 0; j < favorite.result[i].ingredients.length; j++) {
        let ingredient = `<tr><th scope="row">${j + 1}</th><td>${
          favorite.result[i].ingredients[j]
        }</td></tr>`;
        ingredients += ingredient;
      }
      //recipe
      let recipeUrl = `/recipe/${favorite.result[i]._id}`;
      let blur = 0;
      if (!favorite.result[i].isPublic) {
        recipeUrl = "#";
        blur = 2;
      }
      let favoriteHTML = `
      <div class="card card-outline card-primary">
        <div class="card-header">
          <h3 class="card-title">${favorite.result[i].recipeName}</h3>
        </div>
        <div class="card-body">
          <a href="${recipeUrl}" class="text-dark">
            <div class="media">
              <img class="align-self-center mr-4 col-4" src="${favorite.result[i].recipeImage}" alt="recipe image" style="max-height: 300px; object-fit: cover;">
              <div class="media-body table-responsive p-0 col-7" style="height: 300px; filter: blur(${blur}px);">
                <table class="table table-head-fixed text-nowrap">
                  <thead class="h5">
                    <tr>
                      <th scope="col" style="width: 80px;">#</th>
                      <th scope="col">Ingredient</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ingredients}
                  </tbody>
                </table>
              </div>
            </div>
          </a>
        </div>
    `;
      favoriteList.append(favoriteHTML);
    }
    //render pagination
    let pageGroup = $("#favoritePage");
    let toFirstPage = $("#to-favorite-first");
    renderPagination(pageGroup, toFirstPage, page, pageSize, favorite.total);
  } catch (error) {
    return error;
  }
}

function renderPagination(
  pageGroup,
  toFirstPage,
  currentPage,
  pageSize,
  totalCount
) {
  currentPage = parseInt(currentPage);
  let totalPage = totalCount == 0 ? 0 : Math.ceil(totalCount / pageSize);
  pageGroup.children().slice(1).remove(); //empty all pagination except to first page
  let toLastPage = `
  <li class="page-item">
    <a id="to-last" data-page="${totalPage}" class="page-link" aria-label="Next"  style="cursor: pointer;">
      &raquo;
    </a>
  </li>
  `;
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
  let lastNum = currentPage + 2 >= totalPage ? totalPage : firstNum + 4;
  for (let i = firstNum; i <= lastNum; i++) {
    let page = `<li class="page-item"><a data-page="${i}" class="page-link" style="cursor: pointer;">${i}</a></li>`;
    if (i == currentPage) {
      page = `<li class="page-item active"><a data-page="${i}" class="page-link" style="cursor: pointer;">${i}</a></li>`;
    }
    pageGroup.append(page);
  }
  if (currentPage != totalPage && totalPage != 1) {
    pageGroup.append(toLastPage);
  }
}
