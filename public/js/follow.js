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
    const userResponse = await axios.get(`/api/1.0/user/${authorId}/profile`, {
      headers: {
        Authorization: "Bearer " + jwtToken,
      },
    });
    user = userResponse.data.user;
    console.log("author: ", user);
    //user info
    if (!jwtToken || authorId != userId) {
      $("#createRecipe").addClass("d-none");
      $("#settings").addClass("d-none");
    }
    $("#userName").text(user.userName);
    $("#userImage").attr("src", user.userImage);
    $("#following").text(`${user.following.length} following`);
    $("#following-link").attr("href", `/user/${user.userId}/followings`);
    $("#follower").text(`${user.follower.length} follower`);
    $("#follower-link").attr("href", `/user/${user.userId}/followers`);
    $("#userId").html(`&commat;${user.userId}`);
    $("#introduction").text(user.introduction);

    // render follower and following basedon profiletype
    let currentPage = new URLSearchParams(window.location.search).get("page");
    let pageSize = 20; //need to be the same with backend
    if (profileType == "followers") {
      await renderFollow(
        authorId,
        currentPage,
        jwtToken,
        pageSize,
        user.follower.length
      );
    } else if (profileType == "followings") {
      //TODO:
      console.log("under construnction");
    } else {
      //TODO:
      console.log("redirect to 404");
    }

    // render follower
    // const followerResponse = await axios.get(
    //   `/api/1.0/user/${authorId}/followers`,
    //   {
    //     headers: {
    //       Authorization: "Bearer " + jwtToken,
    //     },
    //   }
    // );
    // const follower = followerResponse.data.follower;
    // console.log("follower: ", follower);
    // // render follower lsit
    // let followerList = $("#followerList");
    // for (let i = 0; i < follower.length; i++) {
    //   // set follow, unfollow btn basedon isFollowing = true/fasle
    //   let followBtn = "";
    //   let follow = `<button data-userid="${follower[i].userId}" type="button" class="toFollow btn btn-outline-secondary btn-sm mr-2 toastrDefaultWarning"><i class="fa-regular fa-bell mr-1"></i> Follow</button>
    // <button data-userid="${follower[i].userId}" type="button" class="toUnFollow btn btn-secondary btn-sm mr-2 toastrDefaultWarning d-none"><i class="fa-regular fa-bell mr-1"></i> Unfollow</button>`;
    //   let unFollow = `<button data-userid="${follower[i].userId}" type="button" class="toFollow btn btn-outline-secondary btn-sm mr-2 toastrDefaultWarning d-none"><i class="fa-regular fa-bell mr-1"></i> Follow</button>
    // <button data-userid="${follower[i].userId}" type="button" class="toUnFollow btn btn-secondary btn-sm mr-2 toastrDefaultWarning "><i class="fa-regular fa-bell mr-1"></i> Unfollow</button>`;
    //   if (follower[i].isFollowing) {
    //     followBtn += unFollow;
    //   } else {
    //     followBtn += follow;
    //   }
    //   let followerHTML = `
    //   <div class="col-5 ml-5 callout callout-info my-4">
    //     <div class="media p-3">
    //       <img class="align-self-center mr-4 profile-user-img img-fluid img-circle" src="${follower[i].userImage}" alt="profile image">
    //       <div class="media-body col-10">
    //         <h5 style="display: inline;">${follower[i].userName}</h5>
    //         <div class="font-italic text-secondary">&commat;${follower[i].userId}</div>
    //         <div class="mt-3">
    //           ${followBtn}
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    //   `;
    //   followerList.append(followerHTML);
    // }

    // click on pagination to new page
    $(".pagination").on("click", async (e) => {
      e.preventDefault();
      let newUrl = new URL(
        `${window.location.origin}${window.location.pathname}`
      );
      try {
        let toPage = $(e.target).data("page");
        console.log("to page: ", toPage);
        if (!toPage) {
          return;
        }
        //change URL based on set searchParams based on page number that user click
        newUrl.searchParams.set("page", toPage);
        window.history.pushState({}, "", newUrl);
        // identify current profile type, then render
        if (profileType == "followers") {
          await renderFollow(
            authorId,
            toPage,
            jwtToken,
            pageSize,
            user.follower.length
          );
        } else if (profileType == "followings") {
          //TODO:
          console.log("under construction");
        }
      } catch (error) {
        console.log(error);
      }
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
  } catch (error) {
    console.log(error);
  }
});

async function renderFollow(authorId, page, jwtToken, pageSize, totalCount) {
  try {
    if (!page) {
      page = 1;
    }
    const followerResponse = await axios.get(
      `/api/1.0/user/${authorId}/followers?page=${page}`,
      {
        headers: {
          Authorization: "Bearer " + jwtToken,
        },
      }
    );
    const follower = followerResponse.data.follower;
    console.log("follower: ", follower);
    // render follower lsit
    let followerList = $("#followerList");
    followerList.empty();
    for (let i = 0; i < follower.length; i++) {
      // set follow, unfollow btn basedon isFollowing = true/fasle
      let followBtn = "";
      let follow = `<button data-userid="${follower[i].userId}" type="button" class="toFollow btn btn-outline-secondary btn-sm mr-2 toastrDefaultWarning"><i class="fa-regular fa-bell mr-1"></i> Follow</button>
  <button data-userid="${follower[i].userId}" type="button" class="toUnFollow btn btn-secondary btn-sm mr-2 toastrDefaultWarning d-none"><i class="fa-regular fa-bell mr-1"></i> Unfollow</button>`;
      let unFollow = `<button data-userid="${follower[i].userId}" type="button" class="toFollow btn btn-outline-secondary btn-sm mr-2 toastrDefaultWarning d-none"><i class="fa-regular fa-bell mr-1"></i> Follow</button>
  <button data-userid="${follower[i].userId}" type="button" class="toUnFollow btn btn-secondary btn-sm mr-2 toastrDefaultWarning "><i class="fa-regular fa-bell mr-1"></i> Unfollow</button>`;
      if (follower[i].isFollowing) {
        followBtn += unFollow;
      } else {
        followBtn += follow;
      }
      let followerHTML = `
    <div class="col-5 ml-5 callout callout-info my-4 mx-4">
      <div class="media p-3">
        <img class="align-self-center mr-3 profile-user-img img-fluid img-circle" src="${follower[i].userImage}" alt="profile image">
        <div class="media-body col-10">
        <a href="/user/${follower[i].userId}/recipes" class="text-decoration-none" ><h5 style="display: inline;" class="text-dark">${follower[i].userName}</h5></a>
          <div class="font-italic text-secondary">&commat;${follower[i].userId}</div>
          <div class="mt-3">
            ${followBtn}
          </div>
        </div>
      </div>
    </div>
    `;
      followerList.append(followerHTML);
    }
    let pageGroup = $(".pageGroup");
    let toFirstPage = $("#to-first");
    renderPagination(pageGroup, toFirstPage, page, pageSize, totalCount);
  } catch (error) {
    console.log(error);
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
