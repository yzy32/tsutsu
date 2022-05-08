const { custom } = require("joi");
const es = require("./es");

async function testToken() {
  await client.indices.create({
    index: "recipe-test",
    body: {
      settings: {
        index: { number_of_shards: 1, number_of_replicas: 0 },
        analysis: {
          analyzer: {
            ingredient_dictionary: {
              tokenizer: custom,
            },
          },
        },
      },
      mappings: {
        properties: {
          recipeName: { type: "text" },
          description: { type: "text" },
          cookTime: { type: "integer" },
          ingredients: { type: "text" },
          isPublic: { type: "boolean" },
          favoriteCount: { type: "integer" },
          tags: { type: "text" },
          authorId: { type: "text" },
          author: { type: "text" },
          recipeImage: { type: "text" },
        },
      },
    },
  });
}
