"use strict";

import { ChromaClient } from "chromadb";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import * as tf from "@tensorflow/tfjs";
import { createClient } from "pexels";

const PEXELS_API_KEY =
  "5ctSyyc9ESNIneBXDfuqwD6y9lVwnvS8gz5tXgNxUj88ZPb75Vm5T4TT";
console.log("Using TensorFlow backend: ", tf.getBackend());
const client = new ChromaClient();
const pexelClient = createClient(PEXELS_API_KEY);

// const query = "flowers";
const photoArr = [];
const idArr = [];
const photoAltArr = [];

export const getPhotoFn = function (query) {
  pexelClient.photos.search({ query, per_page: 3 }).then((photos) => {
    const PhotoMeta = class {
      constructor(photo) {
        this.id = photo.id;
        this.photographer = photo.photographer;
        this.url = photo.photographer_url;
        this.imgOriginal = photo.src.original;
        this.imgSmall = photo.src.small;
        this.altText = photo.alt;
      }
    };
    photos.photos.forEach((photo) => {
      const newPhoto = new PhotoMeta(photo);
      photoArr.push(newPhoto);
      idArr.push(`${newPhoto.id}`);
      photoAltArr.push(`${newPhoto.altText}`);
    });
    console.log(photoArr, photoArr.length);
    console.log(idArr, idArr.length);

    return photos;
  });
};

export async function getTextEmbedding(text) {
  try {
    const sentences = text;
    const model = await use.load();
    const embeddings = await model.embed(sentences);
    const embeddingArray = embeddings.arraySync();
    console.log(embeddingArray, embeddingArray.length);
    return embeddingArray;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

const creatTextImgCollection = async function () {
  let textImgCollection = await client.getOrCreateCollection({
    name: "my_collection",
  });
  console.log(textImgCollection);
  const id = await idArr;
  const altEmb = await getTextEmbedding(photoAltArr);
  const photo = await photoArr;
  const alt = await photoAltArr;
  const flowers = await getTextEmbedding(["chess"]);
  console.log(altEmb, photo, flowers);

  await textImgCollection.upsert({
    ids: id,
    embeddings: altEmb,
    metadatas: photo,
    // documents: alt,
  });

  const photoMeta = await textImgCollection.query({
    queryEmbeddings: flowers,
    nResults: 3,
  });
  console.log(photoMeta, altEmb);
};

getPhotoFn("flowers");
// getTextEmbedding(["I am a boy"]);
// getTextEmbedding(photoAltArr);
creatTextImgCollection();
console.log(photoArr);

const init = function () {};

console.log(
  idArr.length,
  getTextEmbedding(photoAltArr).length,
  photoArr.length
);
