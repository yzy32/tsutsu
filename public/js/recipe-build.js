let tagListValue = [];
let user = JSON.parse(localStorage.getItem("user"));
let jwtToken = null;
const type = window.location.pathname.split("/").pop();
console.log("type: ", type);
validate();
async function validate() {
  try {
    if (user) {
      jwtToken = user.accessToken;
    } else {
      window.location = "/user/signin";
      return;
    }
    await axios.get("/recipe/create", {
      headers: {
        Authorization: "Bearer " + jwtToken,
      },
    });
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status == 500) {
      window.location("/html/redirect/500.html");
      return;
    }
    if (error.response && error.response.status == 403) {
      window.location("/html/redirect/403.html");
      return;
    }
    if (error.response && error.response.status == 404) {
      window.location("/html/redirect/404.html");
      return;
    }
  }
}

$(async function () {
  //below are all for create recipe
  $("#recipe-form").on("keydown", (e) => {
    if (e.key == "Enter" && !$(e.target).is("textarea")) {
      e.preventDefault();
    }
  });
  // $("#recipe-form").validate({ debug: true });
  $("#submit").on("click", async (e) => {
    try {
      e.preventDefault();
      // const recipe = $("#recipe-form").serializeArray();
      const recipe = $("#recipe-form");
      if (!recipe[0].checkValidity()) {
        recipe[0].reportValidity();
        return;
      }
      const recipeForm = new FormData(recipe[0]);
      if (user) {
        jwtToken = user.accessToken;
      }
      const response = await axios.post("/api/1.0/recipe", recipeForm, {
        headers: {
          Authorization: "Bearer " + jwtToken,
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.status == 200) {
        window.location = `/user/${user.user.userId}/recipes`;
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status == 400) {
        $("#error").text(error.response.data.error);
      }
    }
  });
  $("#update").on("click", async (e) => {
    try {
      e.preventDefault();
      const recipe = $("#recipe-form");
      console.log(recipe);
      if (!recipe[0].checkValidity()) {
        recipe[0].reportValidity();
        return;
      }
      const recipeForm = new FormData(recipe[0]);
      console.log(recipeForm);
      if (user) {
        jwtToken = user.accessToken;
      }
      let updateUrl = window.location.pathname;
      const response = await axios.put(`/api/1.0${updateUrl}`, recipeForm, {
        headers: {
          Authorization: "Bearer " + jwtToken,
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.status == 200) {
        window.location = `/user/${user.user.userId}/recipes`;
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status == 400) {
        $("#error").text(error.response.data.error);
      }
    }
  });

  //add new ingredient input
  let ingredientsSection = $("#ingredients-group-section");
  $("#addIngredient").on("click", (e) => {
    let newIngredients = `                     
    <div class="input-group mb-3 ingredients-group">
      <div class="input-group-prepend">
        <button type="button" class="remove btn btn-outline-secondary">&minus;</button>
      </div>
      <input name="ingredients" type="text" class="form-control ingredients" placeholder="click - to remove new ingredient" required>
    </div>`;
    ingredientsSection.append(newIngredients);
  });
  //add new step input
  let stepsSection = $("#recipeSteps-group-section");
  $(document).on("click", "#addStep", (e) => {
    let stepNum = stepsSection.children().length;
    $("#removeStep").removeClass("d-none");
    stepNum += 1;
    let newStep = `
    <div class="input-group mb-3 mt-3 recipeSteps-group">
      <div style="width: 100%;">
        <!-- <button type="button" class="d-none remove btn btn-outline-secondary btn-sm pull-left">&minus;</button> -->
        <label>Step ${stepNum}</label>
      </div>
      <div class="newStepImage-group">
        <small class="text-secondary">Both Image and Text are required</small>
        <span class="error text-danger ml-5"></span>  
      </div>
      <!-- image -->
      <div style="width: 100%;"></div>
      <div class="input-group mb-3" style="width: 40%;">
        <div class="input-group-prepend">
          <span class="input-group-text"><i class="fa-regular fa-image"></i></span>
        </div>
        <div class="custom-file recipeSteps" data-step="${stepNum}">
          <input type="file" class="custom-file-input recipeStepImage" accept="image/*" style="cursor: pointer !important;" required>
          <label class="custom-file-label" for="recipeStepImage">Choose Image</label>
        </div>
      </div>
      <!-- step -->
      <div class="input-group">
        <textarea name="recipeSteps" type="text" class="form-control recipeSteps" placeholder="Show us your magic. Tell us how to make it." required></textarea>
      </div>
    </div>
    `;
    stepsSection.append(newStep);
    bsCustomFileInput.destroy();
    bsCustomFileInput.init();
  });
  //remove ingredients
  $(document).on("click", ".remove", (e) => {
    if (ingredientsSection.children().length <= 1) {
      return;
    }
    $(e.target).parent().parent().remove();
  });

  //remove steps
  $(document).on("click", "#removeStep", (e) => {
    e.preventDefault();
    let stepsSection = $("#recipeSteps-group-section");
    $(e.target).parent().prev().children().last().remove();
    if (stepsSection.children().length <= 1) {
      $("#removeStep").addClass("d-none");
      return;
    }
  });

  //create Tag
  $("#newTag").on("keydown", (e) => {
    if (e.key == "Enter") {
      let newInput = e.target.value;
      tagListValue.push(newInput);
      renderTagList();
      $("#newTag").val("");
    }
  });
  //remove tag
  $("#tagList").on("click", (e) => {
    const index = $(e.target).parent().index();
    tagListValue.splice(index, 1);
    renderTagList();
  });

  //listen to recipeImage upload event, upload to s3, get the url and put it in the input value
  $("#recipeImage").on("change", async (e) => {
    try {
      let img = $("#recipeImage")[0].files[0];
      //get signed url from s3
      let response = await axios.get("/api/1.0/recipe/imgUploadUrl", {
        headers: {
          Authorization: "Bearer " + jwtToken,
        },
      });
      let uploadURL = response.data.s3Url;
      //upload to s3
      let imgResponse = await axios.put(uploadURL, img);
      let newImage = imgResponse.request.responseURL.split("?")[0];
      //clear edit group and append new one
      $("#recipeImage-edit-group").empty();
      let newImageGroup = `
        <img id="recipeImage-display" class="mb-2 ml-1 img-thumbnail" src="${newImage}" alt="recipe image" style="object-fit: cover; height: 150px; max-width: 250px;">
        <input id="recipeImage-edit" type="text" name="recipeImage" class="d-none" value="${newImage}">
        <span id="image-error" class="error text-danger ml-5"></span>  
        `;
      $("#recipeImage-edit-group").append(newImageGroup);
    } catch (error) {
      console.log(error);
      console.log(error.response);
      if (error.response && error.response.status !== 500) {
        console.log("Upload Failed");
        $("#image-error").text("Upload Failed!");
      }
    }
  });
  //listen to recipeStep upload event, upload to s3, get the url and put it in the input value
  $(document).on("change", ".recipeStepImage", async (e) => {
    try {
      let img = $(e.target)[0].files[0];
      console.log(img);
      //get signed url from s3
      let response = await axios.get("/api/1.0/recipe/imgUploadUrl", {
        headers: {
          Authorization: "Bearer " + jwtToken,
        },
      });
      let uploadURL = response.data.s3Url;
      //upload to s3
      let imgResponse = await axios.put(uploadURL, img);
      console.log(imgResponse);
      let newImage = imgResponse.request.responseURL.split("?")[0];
      //clear edit group and append new one
      let newStepImageGroup = $(e.target).parent().parent().prev().prev();
      newStepImageGroup.empty();
      let newStepImage = `
        <img src="${newImage}" class="mb-2 ml-1 img-thumbnail" style="object-fit: cover; height: 150px; max-width: 250px;" alt="step image">
        <input type="text" name="recipeStepImage" class="d-none" value="${newImage}">
        <span class="error text-danger ml-5"></span> 
        `;
      newStepImageGroup.append(newStepImage);
    } catch (error) {
      console.log(error);
      console.log(error.response);
      if (error.response && error.response.status !== 500) {
        console.log("Upload Failed");
        $(e.target)
          .parent()
          .parent()
          .prev()
          .prev()
          .children(".error")
          .text("Upload Failed!");
      }
    }
  });
  if (type == "create") {
    $("#loading").addClass("d-none");
    $("#recipe-form-group").removeClass("d-none");
    return;
  }
  // below are all for edit recipe
  try {
    //get recipe through recipe/:id API
    let recipeURL = window.location.pathname.replace(`/${type}`, "");
    let recipe = null;
    if (type == "edit") {
      recipe = await axios.get(`/api/1.0/${recipeURL}`, {
        headers: {
          Authorization: "Bearer " + jwtToken,
        },
      });
    }
    if (!recipe) {
      return;
    }
    recipe = recipe.data.recipe;
    console.log(recipe);
    //render edit page
    $("#title").text("Edit Recipe");
    $("#submit").parent().addClass("d-none");
    $("#update").parent().removeClass("d-none");
    if (recipe.isPublic == false) {
      $("#isPublic").prop("checked", true);
    }
    $("#recipeName").val(recipe.recipeName);
    $("#description").val(recipe.description);
    $("#cookTime").val(recipe.cookTime);
    $("#servings").val(recipe.servings);
    //render cover img
    $("#recipeImage-display").attr("src", recipe.recipeImage);
    $("#recipeImage-display").removeClass("d-none");
    $("#recipeImage-edit").val(recipe.recipeImage);
    $("#recipeImage").prop("required", false);
    //render ingredients
    ingredientsSection.empty();
    for (let i = 0; i < recipe.ingredients.length; i++) {
      let newIngredients = `                     
      <div class="input-group mb-3 ingredients-group">
        <div class="input-group-prepend">
          <button type="button" class="remove btn btn-outline-secondary">&minus;</button>
        </div>
        <input value="${recipe.ingredients[i]}" name="ingredients" type="text" class="form-control ingredients" placeholder="click - to remove new ingredient" required>
      </div>`;
      ingredientsSection.append(newIngredients);
    }
    //render steps
    stepsSection.empty();
    $("#removeStep").removeClass("d-none");
    for (let i = 0; i < recipe.recipeSteps.length; i++) {
      let stepImg = recipe.recipeSteps[i].image
        ? recipe.recipeSteps[i].image
        : "https://tsutsu-s3.s3.ap-northeast-1.amazonaws.com/assets/logo/TSUTSU-19.jpeg";
      let newStep = `
      <!-- step group -->
      <div class="input-group mb-3 mt-3 recipeSteps-group">
        <div style="width: 100%;">
          <!-- <button type="button" class="d-none remove btn btn-outline-secondary btn-sm pull-left">&minus;</button> -->
          <label>Step ${i + 1}</label>
        </div>
        <div>
          <img src="${stepImg}" class="mb-2 ml-1 img-thumbnail " style="object-fit: cover; height: 150px; max-width: 250px;" alt="step image">
          <input type="text" name="recipeStepImage" class="d-none" value="${stepImg}">
          <span class="error text-danger ml-5"></span>  
        </div>
        <!-- image -->
        <div style="width: 100%;"></div>
        <div class="input-group mb-3 mt-2" style="width: 40%;">
          <div class="input-group-prepend">
            <span class="input-group-text"><i class="fa-regular fa-image"></i></span>
          </div>
          <div class="custom-file recipeSteps" data-step="${i + 1}">
            <input name="recipeStepImage" type="file" class="custom-file-input recipeStepImage" accept="image/*" style="cursor: pointer !important;">
            <label class="custom-file-label" for="recipeStepImage">Choose Image</label>
          </div>
        </div>
        <!-- step -->
        <div class="input-group">
          <textarea name="recipeSteps" type="text" class="form-control recipeSteps" placeholder="Show us your magic. Tell us how to make it." required>${
            recipe.recipeSteps[i].step
          }</textarea>
        </div>
      </div>
    `;
      stepsSection.append(newStep);
      bsCustomFileInput.destroy();
      bsCustomFileInput.init();
    }
    //render tag list
    tagListValue = recipe.tags;
    renderTagList();
    $("#loading").addClass("d-none");
    $("#recipe-form-group").removeClass("d-none");
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status == 500) {
      window.location("/html/redirect/500.html");
      return;
    }
    if (error.response && error.response.status == 403) {
      window.location("/html/redirect/403.html");
      return;
    }
    if (error.response && error.response.status == 404) {
      window.location("/html/redirect/404.html");
      return;
    }
  }
});

function renderTagList() {
  let tagList = $("#tagList");
  tagList.empty();
  tagListValue.map((v) => {
    let newTag =
      "<li>" +
      v +
      `<span class="rmTag">&times;</span><input name='tags' value="${v}" style="display: none;"></li>`;
    tagList.append(newTag);
  });
}
