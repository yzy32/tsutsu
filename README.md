# <img width="35" alt="image" src="https://user-images.githubusercontent.com/90205595/170696813-30073298-d9ed-4390-a2e6-b342dc1882ec.png" style="margin-bottom: -10px"> TsuTsu

A recipe website that inspires your cooking ideas, you can expect:

- Inspiration everywhere
- Search by ingredients
- Recipe access management

Click [here](https://yzyang.site/) to check it out

# In This README

- Demo
- Architecture
- Website Introduction
- DB Schema

## Demo

## Architecture

<img width="1029" alt="architecture" src="https://user-images.githubusercontent.com/90205595/170695917-478ba7cf-4204-4cb0-be08-71ecc841e8cb.png">

## Features

1. Inspiration everywhere (#Inspiration-everywhere)
2. Search by ingredients
3. Recipe access management

## Inspiration everywhere

You can share all URL of this website and browse more recipes from:

1. Home Page
   ![inspiration-1](https://user-images.githubusercontent.com/90205595/170712571-edf54a18-0f98-47bf-a185-40962a97df7e.gif)
2. Recipe Page
   ![inspiration-2](https://user-images.githubusercontent.com/90205595/170713289-6eba4f45-f4a3-4904-a22c-599d4a99001b.gif)

   - Get recipes based on searching and sorting result

   - Tags (when clicking tags, you will be redirect to search page)

3. User Page
   - Recipes
   - Favorites

## Search Page

Type in the search bar
![search-1](https://user-images.githubusercontent.com/90205595/170807331-97e242e0-2a7c-4193-b57f-e3ee4f09829a.gif)

Exclude the ingredients you don't want
![search-2](https://user-images.githubusercontent.com/90205595/170807407-a6dd48f5-91ba-43a4-a663-ff4a15e5eb78.gif)

You can search recipes based on

- Including the ingredients
- Excluding the ingredients
- Including other non-ingredients keywords
- Including recipes within specified cooking time
- Specifying "only search my recipe", if you only want to search in your recipes

You can also browse the results sorted by

- Relevance
- Time
- Favorite

## Recipe Page

If you are the author of this recipe, you can edit it.

If you are not the author, you can:

- Keep this recipes in your favorite
- Follow this author
- Leave a review
- Copy the ingredients to your clipboard

## User Page

If you are the owner of this user page, you can setting your recipes'

- accessibility (public / private)
- edit the content

If you are browsing other user's page, you can follow this user and view:

- recipes
- favorites
- following
- follower

## DB Schema

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
