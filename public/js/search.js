console.log(window.location);
// console.log(window.location.search);
let newUrl = null;
// first render (other to test: document.ready)
window.onload = search();

// rerender after filter
const searchForm = document.getElementById("searchForm");
searchForm.addEventListener("submit", async (e) => {
  // disable default submit
  e.preventDefault();
  // get new keyword

  // add new keyword to hidden input, tag and make input value = ""
  handleNewInput("showIngrIncl", "searchIngrIncl", "ingrIncl");
  handleNewInput("showIngrExcl", "searchIngrExcl", "ingrExcl");
  handleNewInput("showOtherKeyword", "searchOtherKeyword", "otherKeyword");

  // append cookTime to url
  let newCookTime = document.getElementById("cookTime").value;
  if (newCookTime !== "") {
    newUrl.searchParams.set("cookTime", newCookTime);
  } else {
    newUrl.searchParams.delete("cookTime");
  }
  newUrl.searchParams.delete("page");
  // process URL
  if (newUrl && newUrl !== null) {
    window.history.pushState({}, "", newUrl.toString());
    // console.log(newUrl);
  }
  const data = await search();
  renderFilter(data);
});

// handle input
function handleNewInput(showDivID, searchInputID, queryKey) {
  const showDiv = document.getElementById(showDivID);
  let newInput = document.getElementById(searchInputID).value;
  if (newInput !== "") {
    document.getElementById(searchInputID).value = "";
    createTag(newInput, showDiv);
    let newUrlParams;
    if (newUrl.searchParams.has(queryKey)) {
      newUrlParams = newUrl.searchParams.get(queryKey) + " " + newInput;
    } else {
      newUrlParams = newInput;
    }
    newUrl.searchParams.set(queryKey, newUrlParams);
  }
}

// sort
document.getElementById("sort").addEventListener("change", async (e) => {
  const sortType = e.target.value;
  newUrl.searchParams.delete("page");
  newUrl.searchParams.set("sort", sortType);
  window.history.pushState({}, "", newUrl.toString());
  const data = await search();
});

// pagination
document.getElementById("pageGroup").addEventListener("click", async (e) => {
  let queryPage = e.target.dataset.page;
  console.log("click on page: ", e.target.dataset.page);
  if (!queryPage) {
    return;
  }
  let currentPage = parseInt(newUrl.searchParams.get("page"));
  newUrl.searchParams.set("page", queryPage);
  window.history.pushState({}, "", newUrl.toString());
  const data = await search();
});

// delete keywords
async function onClickRemoveTag(tgt, queryKey) {
  if (tgt.tagName.toUpperCase() == "SPAN") {
    const liTag = tgt.parentNode;
    let ulDom = tgt.parentNode.parentNode;
    liTag.remove();
    let hiddenInput = ulDom.nextSibling;
    let newParams = getHiddenInput(ulDom);
    hiddenInput.value = newParams;
    if (newParams.length === 0) {
      newUrl.searchParams.delete(queryKey);
    } else {
      newUrl.searchParams.set(queryKey, newParams);
    }
    newUrl.searchParams.delete("page");
    window.history.pushState({}, "", newUrl.toString());
    const data = await search();
    renderFilter(data);
  }
}

[
  { showDiv: "showIngrIncl", queryKey: "ingrIncl" },
  { showDiv: "showIngrExcl", queryKey: "ingrExcl" },
  { showDiv: "showOtherKeyword", queryKey: "otherKeyword" },
].map((obj) => {
  document.getElementById(obj.showDiv).addEventListener("click", function (e) {
    onClickRemoveTag(e.target, obj.queryKey);
  });
});

//only search my recipe
document.getElementById("myrecipe").addEventListener("click", async (e) => {
  console.log(e.target.checked);
  if (e.target.checked) {
    newUrl.searchParams.set("myrecipe", true);
  } else {
    newUrl.searchParams.delete("myrecipe");
  }
  window.history.pushState({}, "", newUrl.toString());
  const data = await search();
});

async function search() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    let jwtToken = null;
    if (user) {
      jwtToken = user.accessToken;
    }
    const { data } = await axios.get(
      `/api/1.0/recipe/search${window.location.search}`,
      {
        headers: {
          Authorization: "Bearer " + jwtToken,
        },
      }
    );
    console.log(data);
    // render search result area
    const res = document.getElementById("res");
    res.innerText = `Showing ${data.recipeCount} results`;
    let searchResults = document.getElementById("search-results");
    searchResults.innerHTML = "";
    let recipe = "";
    for (let i = 0; i < data.recipes.length; i++) {
      let tags = "";
      if (data.recipes[i].tags) {
        tags = data.recipes[i].tags.join("&#160;&#160;&#124;&#160;&#160;");
      }
      if (!data.recipes[i].recipeImage) {
        data.recipes[i].recipeImage =
          "https://s23209.pcdn.co/wp-content/uploads/2018/06/211129_DAMN-DELICIOUS_Lemon-Herb-Roasted-Chx_068.jpg";
      }
      recipe += `
      <div class="col-11">
      <div class="callout callout-warning">
        <div class="media">
          <img class="align-self-center mr-3 col-4" src="${data.recipes[i].recipeImage}" alt="recipe image" style="object-fit:cover; height: 200px;">
          <div class="media-body col-8">
            <a href="/recipe/${data.recipes[i].recipeId}" class="text-decoration-none">
              <h3 class="mb-0 text-dark">${data.recipes[i].recipeName}</h3>
              <small class="mb-1">${data.recipes[i].author}</small>
              <p class="mt-2 text-dark">You have all ${data.recipes[i].ingrMatchedCount} ingredients</p>
              <p>${tags}</p>
              <div>
                <ul class="list-group list-group-horizontal">
                  <li class="list-group-item flex-fill border-0">
                    <span>
                      <i class="fa-regular fa-clock mr-3"></i>${data.recipes[i].cookTime} Mins
                    </span>
                  </li>
                  <li class="list-group-item flex-fill border-0">
                    <span>
                      <i class="fa-regular fa-bookmark mr-3"></i>${data.recipes[i].favoriteCount} Favorites
                    </span>
                  </li>
                </ul>
              </div>
            </a>
          </div>
        </div> 
      </div>
    </div>
      `;
    }
    searchResults.innerHTML += recipe;
    newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("q");
    if (data.filter.ingrIncl && data.filter.ingrIncl.length !== 0) {
      newUrl.searchParams.set("ingrIncl", data.filter.ingrIncl);
    }
    if (data.filter.otherKeyword && data.filter.otherKeyword.length !== 0) {
      newUrl.searchParams.set("otherKeyword", data.filter.otherKeyword);
    }
    // render filter area
    renderFilter(data);
    // remove loading icon and show search result
    document.getElementById("loading").classList.add("d-none");
    document.getElementById("search-results").classList.remove("d-none");
    document.getElementById("pageGroup").classList.remove("d-none");
    return data;
  } catch (error) {
    // if (error.response.data.redirectUrl) {
    //   const redirectUrl = error.response.data.redirectUrl;
    //   document.location = redirectUrl;
    // }
    console.log(error);
    if (error.response && error.status == 500) {
      window.location = "/html/redirect/500.html";
    }
  }
}

function renderFilter(data) {
  renderDiv(data, "showIngrIncl", "ingrIncl");
  renderDiv(data, "showIngrExcl", "ingrExcl");
  renderDiv(data, "showOtherKeyword", "otherKeyword");
  if (data.filter.cookTime && data.filter.cookTime !== null) {
    cookTime.value = data.filter.cookTime;
  }

  //show search my recipe if user login
  if (data.loginStatus) {
    document.getElementById("myrecipeGroup").style.display = "";
    //render checked box
    let myrecipe = newUrl.searchParams.get("myrecipe");
    if (myrecipe) {
      document.getElementById("myrecipe").checked = true;
    }
  }

  // render pagination
  let pageGroup = document.getElementById("pageGroup");
  pageGroup.innerHTML = "";

  let currentPage = parseInt(newUrl.searchParams.get("page")) || 1;
  if (currentPage > data.totalPage) {
    currentPage = 1;
  }

  if (data.totalPage === 0) {
    return;
  }
  let lastPage = parseInt(currentPage) + 2;
  if (currentPage == data.totalPage || currentPage == data.totalPage - 1) {
    lastPage = data.totalPage;
  } else if (currentPage < 3) {
    lastPage = currentPage + (5 - currentPage);
  }
  let firstPage = lastPage - 4;
  if (firstPage < 1) {
    firstPage = 1;
  }

  let pageItem = document.createElement("li");
  pageItem.classList.add("page-item");
  let pageTextSpan = document.createElement("a");
  pageTextSpan.classList.add("page-link");
  pageTextSpan.style = "cursor: pointer;";
  for (let i = firstPage; i <= lastPage; i++) {
    let clonePage = pageItem.cloneNode(true);
    let cloneText = pageTextSpan.cloneNode(true);
    cloneText.innerText = i;
    cloneText.dataset.page = i;
    pageGroup.appendChild(clonePage);
    clonePage.appendChild(cloneText);
    if (i == currentPage) {
      clonePage.classList.add("active");
    }
  }
  if (currentPage !== 1) {
    let prevPage = pageItem.cloneNode(true);
    let prevText = pageTextSpan.cloneNode(true);
    let prevSpan = document.createElement("span");
    prevSpan.innerHTML = `&laquo;`;
    prevSpan.dataset.page = 1;
    prevText.dataset.page = 1;
    pageGroup.prepend(prevPage);
    prevPage.appendChild(prevText);
    prevText.appendChild(prevSpan);
  }
  if (currentPage !== data.totalPage) {
    let nextPage = pageItem.cloneNode(true);
    let nextText = pageTextSpan.cloneNode(true);
    let nextSpan = document.createElement("span");
    nextSpan.innerHTML = `&raquo;`;
    nextSpan.dataset.page = data.totalPage;
    nextText.dataset.page = data.totalPage;
    pageGroup.appendChild(nextPage);
    nextPage.appendChild(nextText);
    nextText.appendChild(nextSpan);
  }
}

function renderDiv(data, showDivId, inputName) {
  const showDiv = document.getElementById(showDivId);
  if (data.filter[inputName] && data.filter[inputName].length !== 0) {
    showDiv.innerHTML = "";
    const ingrIncls = data.filter[inputName].split(" ");
    ingrIncls.map((ingrIncl) => {
      createTag(ingrIncl, showDiv);
    });
    let hiddenInput = document.createElement("input");
    hiddenInput.name = inputName;
    hiddenInput.value = getHiddenInput(showDiv);
    hiddenInput.style = "display: none;";
    showDiv.parentNode.appendChild(hiddenInput);
  }
}

function createTag(input, position) {
  let spanDom = "<li>" + input + '<span class="rmTag">&times;</span></li>';
  position.insertAdjacentHTML("beforeend", spanDom);
}

function getHiddenInput(ulDom) {
  let liTags = ulDom.childNodes;
  let liValues = [];
  for (let i = 0; i < liTags.length; i++) {
    liValues.push(liTags[i].firstChild.data);
  }
  return liValues.join(" ");
}
