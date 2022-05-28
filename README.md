# <img width="35" alt="image" src="https://user-images.githubusercontent.com/90205595/170696813-30073298-d9ed-4390-a2e6-b342dc1882ec.png" style="margin-bottom: -10px"> **TSUTSU**

A recipe website that inspires your cooking ideas, you can expect:

- Search by ingredients
- Recipe access management
- Inspiration everywhere

If you are bothered by below problems:

- Don't know what to cook?
- Want to digitalize your recipe but still make it secret?

Click [here](https://yzyang.site/) to check it out!

<br>

# **README**

- **[Test Account](#Test-Account)**
- **[Architecture](#Architecture)**
- **[Features](#Features)**
- **[DB Schema](#DB-Schema)**
- **[Future Features](#Future-Features)**
- **[Contact Me](#Don't-Miss-Out)**

<br>

# Test Account

Interested? Explore TsuTsu with below test account:

```
Account: test01@gmail.com
Password: test
```

<br>

# Architecture

This is how TsuTsu looks like behind the scene
<img width="1029" alt="architecture" src="https://user-images.githubusercontent.com/90205595/170695917-478ba7cf-4204-4cb0-be08-71ecc841e8cb.png">

[<div align="right">Back to README</div>](#README)

<br>

# Features

- [Search by ingredients](#Search-by-ingredients)
- [Recipe access management](#Recipe-access-management)
- [Inspiration everywhere](#Inspiration-everywhere)

<br>

## Search by ingredients

Type your keywords in the search bar.
\
You will get categorized keywords in the filter section
![search-1](https://user-images.githubusercontent.com/90205595/170813741-f49dd333-8109-4569-8057-91a68122580a.gif)

Add any keyword in the filter to search what you need
![search-2](https://user-images.githubusercontent.com/90205595/170814898-dc531dbd-c7d1-4995-924b-a607d087e4f7.gif)

[<div align="right">Back to README</div>](#README)

<br>

## Recipe access management

You can set your recipe's accessibility
![set-private](https://user-images.githubusercontent.com/90205595/170818653-eaab855a-3dd3-4198-b229-28b14761d83c.gif)

<details>
<summary>Click to see what your user page looks like</summary>
<br>
This is what you will see on your user page

![User_Author](https://user-images.githubusercontent.com/90205595/170817814-aac6f83e-a472-4df6-a27b-dbdea177dc30.png)

This is what other users will see on your page
![User_non-author](https://user-images.githubusercontent.com/90205595/170819062-b34e955e-18ea-44aa-8f4a-c2fa6e604ff9.png)

Even your recipe is in other users' favorite, they won't see the content.
![User_favorite](https://user-images.githubusercontent.com/90205595/170819170-b06d4c09-8589-4e12-97d2-8794d0b93457.png)

</details>

[<div align="right">Back to README</div>](#README)

<br>

## Inspiration everywhere

This is how you can explore more recipes
![inspiration-1](https://user-images.githubusercontent.com/90205595/170814854-87f9b59f-6821-4866-9c2a-58eda60972d0.gif)

You can just checkout the recipe
![home-to-recipe](https://user-images.githubusercontent.com/90205595/170814864-2220c376-fbea-4d1e-a1f8-e89fef6399df.gif)

Try to click the tag to find out more recipes
![recipe-to-search](https://user-images.githubusercontent.com/90205595/170828102-936d50e3-24dc-496b-b8d7-736e0cda5ab6.gif)

You can also find out more on user page
![home-to-author](https://user-images.githubusercontent.com/90205595/170814860-913b22ba-41c5-4747-bc00-b52971628481.gif)

<details>
<summary>Want to add ingredients to your shopping list?</summary>
<br>

With one click, you can copy ingredients to your clipboard
![copy-ingredients](https://user-images.githubusercontent.com/90205595/170828097-143ecdc7-a25f-4e56-bf4a-342a6bd1a082.gif)

</details>

[<div align="right">Back to README</div>](#README)

<br>

# DB Schema

### Elasticsearch mapping

<details>
<summary>recipes</summary>

```
{
  "recipes-v1" : {
    "mappings" : {
      "properties" : {
        "authorId" : {
          "type" : "text"
        },
        "cookTime" : {
          "type" : "integer"
        },
        "description" : {
          "type" : "text"
        },
        "favoriteCount" : {
          "type" : "integer"
        },
        "ingredients" : {
          "type" : "text"
        },
        "isPublic" : {
          "type" : "boolean"
        },
        "recipeImage" : {
          "type" : "text"
        },
        "recipeName" : {
          "type" : "text"
        },
        "tags" : {
          "type" : "text"
        }
      }
    }
  }
}
```

</details>
<details>
<summary>ingredients</summary>

```
{
  "ingredients-v1" : {
    "mappings" : {
      "properties" : {
        "ingredient" : {
          "type" : "text"
        }
      }
    }
  }
}
```

</details>

<br>

### MongoDB Schema

<details>
<summary>recipes</summary>

```
{
  timeCreated: { type: Date, default: Date.now },
  timeEdited: { type: Date, default: null },
  recipeImage: { type: String, required: true },
  servings: { type: Number, required: true },
  recipeSteps: {
    type: [
      {
        step: { type: String, required: true },
        image: { type: String, default: null },
        _id: false,
      },
    ],
    required: true,
  },
  reviewCount: { type: Number, default: 0 },
  recipeName: { type: String, required: true },
  description: { type: String, default: null },
  cookTime: { type: Number, required: true },
  ingredients: [{ type: String, required: true }],
  isPublic: { type: Boolean, default: "true" },
  favoriteCount: { type: Number, default: 0 },
  tags: [{ type: String, default: [] }],
  author: { type: String },
  authorId: { type: String, required: true },
  viewCount: { type: Number, default: 0 },
}
```

</details>

<details>

<summary>reviews</summary>

```
{
  userId: { type: String, required: true },
  review: { type: String, required: true },
  timeCreated: { type: Date, default: Date.now },
  recipeId: { type: mongoose.SchemaTypes.ObjectId, required: true },
}
```

</details>

<details>
<summary>users</summary>

```
{
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  userName: { type: String },
  introduction: { type: String, default: "" },
  userImage: {
    type: String,
    default:
      "https://tsutsu-s3.s3.ap-northeast-1.amazonaws.com/assets/default/user.png",
  },
  following: { type: [String], default: [] },
  follower: { type: [String], default: [] },
  userFavorites: { type: [mongoose.SchemaTypes.ObjectId], default: [] },
}
```

</details>

<details>
<summary>keywords</summary>

```
{
  timeCreated: { type: Date, default: Date.now },
  userId: { type: String, default: null },
  queryField: { type: String, default: null },
  keyword: [{ type: String, required: true }],
}
```

</details>

<details>
<summary>eslogs</summary>

```
{
  timeCreated: { type: Date, default: Date.now },
  type: { type: String },
  recipeId: { type: String, required: true },
  errorMsg: { type: String },
  errorStatus: { type: Number },
}
```

</details>

[<div align="right">Back to README</div>](#README)

<br>

# Future Features

1. Optimize crontab docker image
2. Add autocomplete to search
3. Improve availability by applying AWS Auto Scaling

[<div align="right">Back to README</div>](#README)

<br>

# Contact Me

If you have any idea or comment, please don't hesitate to contact me via
\
`yzyang32@gmail.com`
