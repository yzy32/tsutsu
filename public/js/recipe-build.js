let tagListValue = [];
validate();
async function validate() {
  try {
    let user = JSON.parse(localStorage.getItem("user"));
    let jwtToken = null;
    if (user) {
      jwtToken = user.accessToken;
    } else {
      window.location = "/user/signin";
    }
    await axios.get("/user/recipe/edit", {
      headers: {
        Authorization: "Bearer " + jwtToken,
      },
    });
  } catch (error) {
    console.log(error);
    if (error.response && error.response.status !== 500) {
      document.location = error.response.data.redirectUrl;
    }
  }
}

$(function () {
  $("#recipe-form").on("keydown", (e) => {
    if (e.key == "Enter") {
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
      console.log(error.response);
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

  //add new ingredient input
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
  //add new step input
  $(document).on("click", "#addStep", (e) => {
    let stepsSection = $("#recipeSteps-group-section");
    let stepNum = stepsSection.children().length;
    $("#removeStep").removeClass("d-none");
    stepNum += 1;
    let newStep = `
    <div class="input-group mb-3 recipeSteps-group">
      <div class="mb-1">
        <label>Step ${stepNum}</label>
      </div>
      <!-- image -->
      <div class="input-group mb-3">
        <div class="custom-file">
          <input name="recipeStepImage" type="file" accept="image/*" class="custom-file-input" id="recipeImage" style="cursor: pointer !important;" required>
          <label class="custom-file-label" for="recipeImage">Choose Image</label>
        </div>
      </div>
      <!-- step -->
      <div class="input-group">
        <textarea name="recipeSteps" type="text" class="form-control recipeSteps" placeholder="click -Step to remove new step" required></textarea>
      </div>
    </div>
    `;
    stepsSection.append(newStep);
    bsCustomFileInput.destroy();
    bsCustomFileInput.init();
  });
  //remove ingredients
  $(document).on("click", ".remove", (e) => {
    $(e.target).parent().parent().remove();
  });

  //remove steps
  $(document).on("click", "#removeStep", (e) => {
    e.preventDefault();
    let stepsSection = $("#recipeSteps-group-section");
    $(e.target).parent().prev().children().last().remove();
    if (stepsSection.children().length <= 2) {
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
