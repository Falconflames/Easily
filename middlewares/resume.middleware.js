import multer from "multer";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("Uploads directory didn't exist, so it was created.");
    }

    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    try {
      const uniqueFilename = `${Date.now()}-${file.originalname}`;
      console.log('Filename function called. Unique filename:', uniqueFilename);
      cb(null, uniqueFilename);
    } catch (error) {
      console.error('Error in filename method:', error);
      cb(error);
    }
  }
});

// Configure Multer with storage
const upload = multer({ storage: storage});

export default upload;

