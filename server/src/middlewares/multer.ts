import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).fields([
  { name: 'storeImage', maxCount: 1 },
  { name: 'storeBanner', maxCount: 1 }
]);

export const singleUpload = multer().single("photo");
export const mutliUpload = multer().array("photos", 5);
