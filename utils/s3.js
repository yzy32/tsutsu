require("dotenv").config();
const crypto = require("crypto");
const multer = require("multer");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");

//for generate upload url
const s3 = new aws.S3({
  region: process.env.AWS_S3_REGION,
  accessKeyId: process.env.AWS_ACCESSKEY_ID,
  secretAccessKey: process.env.AWS_ACCESSKEY_SECRET,
  signatureVersion: "v4",
});

async function generateUploadURL(req, res) {
  try {
    // let { imageName } = req.body;
    // let imageType = imageName.split(".")[1];
    const customFileName = crypto
      .randomBytes(18)
      .toString("hex")
      .substring(0, 8);
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `assets/recipe/${customFileName}.jpg`,
      Expires: 60,
      ContentType: `image/jpeg`,
    };
    const uploadURL = await s3.getSignedUrlPromise("putObject", params);
    res.status(200).json({ s3Url: uploadURL });
  } catch (error) {
    console.log(error);
    throw error;
  }
}

//upload recipe img to s3
const s3Config = new aws.S3({
  accessKeyId: process.env.AWS_ACCESSKEY_ID,
  secretAccessKey: process.env.AWS_ACCESSKEY_SECRET,
  Bucket: process.env.AWS_BUCKET_NAME,
});

var upload = multer({
  fileFilter: function (req, file, cb) {
    const fileExtension = file.mimetype.split("/")[1];
    if (
      fileExtension !== "jpg" &&
      fileExtension !== "jpeg" &&
      fileExtension !== "png" &&
      fileExtension !== "gif"
    ) {
      return cb(null, false);
    }
    cb(null, true);
  },
  storage: multerS3({
    s3: s3Config,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      console.log("1.recipte creation in multer: ", new Date());
      const customFileName = crypto
        .randomBytes(18)
        .toString("hex")
        .substring(0, 8);
      const fileExtension = file.mimetype.split("/")[1]; // get file extension from original file name
      cb(null, `assets/recipe/` + customFileName + "." + fileExtension);
    },
  }),
  fileFilter: function (req, file, cb) {
    const fileType = file.mimetype.split("/")[0];
    console.log("filefilter: ", fileType);
    console.log(file);
    if (fileType !== "image") {
      let error = new Error("Only image is allowed");
      error.status = 400;
      return cb(error);
    }
    cb(null, true);
  },
});

//upload profile image to s3
var uploadProfile = multer({
  storage: multerS3({
    s3: s3Config,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const customFileName = req.user.userId;
      const fileExtension = file.mimetype.split("/")[1]; // get file extension from original file name
      cb(null, `assets/profile/` + customFileName + "." + fileExtension);
    },
  }),
  fileFilter: function (req, file, cb) {
    const fileType = file.mimetype.split("/")[0];
    console.log("filefilter: ", fileType);
    console.log(file);
    if (fileType !== "image") {
      let error = new Error("Only image is allowed");
      error.status = 400;
      return cb(error);
    }
    cb(null, true);
  },
});

module.exports = {
  generateUploadURL,
  upload,
  uploadProfile,
};
