let tagListValue = [];

$(function () {
  $("#recipe-form").on("keydown", (e) => {
    if (e.key == "Enter") {
      e.preventDefault();
    }
  });
  $("#submit").on("click", async (e) => {
    try {
      e.preventDefault();
      // const recipe = $("#recipe-form").serializeArray();
      const recipe = $("#recipe-form");
      // console.log(recipe[0]);
      const recipeForm = new FormData(recipe[0]);
      const user = JSON.parse(localStorage.getItem("user"));
      let jwtToken = null;
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
      // if (error.response.data.redirectUrl) {
      //   const redirectUrl = error.response.data.redirectUrl;
      //   document.location = redirectUrl;
      // }
    }
  });
  // $("#uploadImage").on("click", (e) => {
  //   let imgFile = $("#recipeImage").get(0).files[0];
  //   let imgSrc = URL.createObjectURL(imgFile);
  //   let img = `<img class="input-group-append" src="${imgSrc}">`;
  //   // console.log(imgFile);
  //   $("#recipeImage-group").append(img);
  //   console.log("append");
  // });
  // post image to s3 (pending)
  // $("#uploadImage").on("click", async (e) => {
  //   try {
  //     const image = $("#recipeImage").val();
  //     const formData = new FormData();
  //     formData.append("recipeImage", image);
  //     // get upload url
  //     const response = await axios.get("/s3Url");
  //     const uploadUrl = response.data.s3Url;
  //     // upload to s3
  //     const imgResponse = await axios.put(uploadUrl, formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //     });
  //     //FIXME: img is not jpg
  //     let img = document.createElement("img");
  //     imgUrl = uploadUrl.split("?")[0];
  //     img.src = imgUrl;
  //     let imgInput = `<input name="recipeImage" type="text" style="display: none;" value="${imgUrl}>`;
  //     $("#recipeImage-group").append(img);
  //     $("#recipeImage-group").append(imgInput);
  //     console.log("url", imgUrl);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // });

  //add new ingredient input, TODO: remove
  $("#addIngredient").on("click", (e) => {
    let ingredientsSection = $("#ingredients-group-section");
    let newIngredients = `                     
    <div class="input-group mb-3 ingredients-group">
      <div class="input-group-prepend">
        <button type="button" class="remove btn btn-outline-secondary">&minus;</button>
      </div>
      <input name="ingredients" type="text" class="form-control ingredients" placeholder="click - to remove new ingredient" required>
    </div>`;
    ingredientsSection.append(newIngredients);
  });
  //add new step input, TODO: remove
  $("#addStep").on("click", (e) => {
    let stepsSection = $("#recipeSteps-group-section");
    let stepNum = stepsSection.length + 1;
    let newStep = `
    <div class="input-group mb-3 recipeSteps-group">
      <div class="mb-1">
        <button type="button" class="remove btn btn-outline-secondary btn-sm pull-left mr-2">&minus;</button>
        <label>Step ${stepNum}</label>
      </div>
      <!-- image -->
      <div class="input-group mb-3">
        <div class="custom-file">
          <input name="recipeStepImage" type="file" class="custom-file-input" id="recipeImage" required>
          <label class="custom-file-label" for="recipeImage">Choose Image</label>
        </div>
      </div>
      <!-- step -->
      <div class="input-group">
        <textarea name="recipeSteps" type="text" class="form-control recipeSteps" placeholder="click - to remove new step" required></textarea>
      </div>
    </div>
    `;
    stepsSection.append(newStep);
  });
  //remove element
  $(document).on("click", ".remove", (e) => {
    $(e.target).parent().parent().remove();
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
