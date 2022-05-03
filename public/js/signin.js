// isSignin();
// async function isSignin() {
//   try {
//     const user = JSON.parse(localStorage.getItem("user"));
//     if (!user) {
//       return;
//     }
//     let jwtToken = user.accessToken;
//     let userId = user.user.userId;
//     const response = await axios.get(`/user/${userId}/recipes`, {
//       headers: {
//         Authorization: "Bearer " + jwtToken,
//       },
//     });
//     window.location = `/user/${userId}/recipes`;
//   } catch (error) {
//     console.log("need to signin: ", error);
//   }
// }

document.getElementById("submit").addEventListener("click", async (e) => {
  try {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    console.log(email, password);
    if (email.length == 0 || password.length == 0) {
      document.getElementById("error").innerText = "All fields cannot be empty";
      return;
    }
    const response = await axios.post("/api/1.0/user/signin", {
      type: "native",
      email: email,
      password: password,
    });
    console.log(response);
    window.location = `${window.location.origin}/user/${response.data.user.userId}/recipes`;
    localStorage.setItem("user", JSON.stringify(response.data));
  } catch (error) {
    console.log(error);
    if (error.response.status == 403) {
      document.getElementById("error").innerText =
        "Wrong sign in info. Please try again";
    } else if (error.response.status == 400) {
      document.getElementById("error").innerText = "All fields are required";
    }
  }
});
