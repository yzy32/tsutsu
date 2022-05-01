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
    $("#user-recipe").attr("href", `/user/${author.userId}/recipes`);
    $("#userImage").attr("src", author.userImage);
    $("#following").text(`${author.following.length} following`);
    $("#following-link").attr("href", `/user/${author.userId}/followings`);
    $("#follower").text(`${author.follower.length} follower`);
    $("#follower-link").attr("href", `/user/${author.userId}/followers`);
    $("#userId").html(`&commat;${author.userId}`);
    $("#introduction").text(author.introduction);
    $("#followType").text(profileType);
    $("#author-follow").data("userid", author.userId);
    $("#author-unfollow").data("userid", author.userId);
    if (author.isFollowing) {
      $("#author-unfollow").removeClass("d-none");
    } else if (author.isFollowing != null) {
      $("#author-follow").removeClass("d-none");
    }

    // render follower and following basedon profiletype
    let currentPage = new URLSearchParams(window.location.search).get("page");
    let pageSize = 20; //need to be the same with backend
    if (profileType == "followers") {
      await renderFollow(
        profileType,
        authorId,
        currentPage,
        jwtToken,
        pageSize,
        author.follower.length
      );
    } else if (profileType == "followings") {
      await renderFollow(
        profileType,
        authorId,
        currentPage,
        jwtToken,
        pageSize,
        author.following.length
      );
    } else {
      //TODO:
      console.log("redirect to 404");
    }

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
            profileType,
            authorId,
            currentPage,
            jwtToken,
            pageSize,
            author.follower.length
          );
        } else if (profileType == "followings") {
          await renderFollow(
            profileType,
            authorId,
            currentPage,
            jwtToken,
            pageSize,
            author.following.length
          );
        } else {
          //TODO:
          console.log("redirect to 404");
        }
      } catch (error) {
        console.log(error);
      }
    });
    // click to follow
    $(document).on("click", ".toFollow", async (e) => {
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
    // click to unfollow
    $(document).on("click", async (e) => {
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

async function renderFollow(
  profileType,
  authorId,
  page,
  jwtToken,
  pageSize,
  totalCount
) {
  try {
    if (!page) {
      page = 1;
    }
    const followResponse = await axios.get(
      `/api/1.0/user/${authorId}/${profileType}?page=${page}`,
      {
        headers: {
          Authorization: "Bearer " + jwtToken,
        },
      }
    );
    const follow = followResponse.data.follow;
    console.log("follow: ", follow);
    // render follow lsit
    let followList = $("#followList");
    followList.empty();
    for (let i = 0; i < follow.length; i++) {
      // set follow, unfollow btn basedon isFollowing = true/fasle
      let followBtnGroup = "";
      let followBtn = `<button data-userid="${follow[i].userId}" type="button" class="toFollow btn btn-outline-secondary btn-sm mr-2 toastrDefaultWarning"><i class="fa-regular fa-bell mr-1"></i> Follow</button>
  <button data-userid="${follow[i].userId}" type="button" class="toUnFollow btn btn-secondary btn-sm mr-2 toastrDefaultWarning d-none"><i class="fa-regular fa-bell mr-1"></i> Unfollow</button>`;
      let unFollowBtn = `<button data-userid="${follow[i].userId}" type="button" class="toFollow btn btn-outline-secondary btn-sm mr-2 toastrDefaultWarning d-none"><i class="fa-regular fa-bell mr-1"></i> Follow</button>
  <button data-userid="${follow[i].userId}" type="button" class="toUnFollow btn btn-secondary btn-sm mr-2 toastrDefaultWarning "><i class="fa-regular fa-bell mr-1"></i> Unfollow</button>`;
      if (follow[i].isFollowing) {
        followBtnGroup += unFollowBtn;
      } else {
        followBtnGroup += followBtn;
      }
      let followHTML = `
    <div class="col-5 ml-5 callout callout-info my-4 mx-4">
      <div class="media p-3">
        <img class="align-self-center mr-3 profile-user-img img-fluid img-circle" src="${follow[i].userImage}" alt="profile image" style="object-fit: cover; height: 100px;">
        <div class="media-body col-10">
        <a href="/user/${follow[i].userId}/recipes" class="text-decoration-none" ><h5 style="display: inline;" class="text-dark">${follow[i].userName}</h5></a>
          <div class="font-italic text-secondary">&commat;${follow[i].userId}</div>
          <div class="mt-3">
            ${followBtnGroup}
          </div>
        </div>
      </div>
    </div>
    `;
      followList.append(followHTML);
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
