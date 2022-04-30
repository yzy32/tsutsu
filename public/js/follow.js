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
    console.log("user: ", user);
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
  } catch (error) {
    console.log(error);
  }
});
