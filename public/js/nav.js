$(function () {
  let user = JSON.parse(localStorage.getItem("user"));
  let userName = null;
  let userId = null;
  if (user) {
    userName = user.user.userName;
    userId = user.user.userId;
    $("#nav-userName").text(` ${userId} `);
    $("#link-user").attr("href", `/user/${userId}/recipes`);
    $("#create").removeClass("d-none");
    $("#logout").removeClass("d-none");
  }
  $("#logout").on("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("user");
    window.location = "/";
  });
});
