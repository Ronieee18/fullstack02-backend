import { ApiError } from "../utils/ApiError.js";

const validateVideoMimeType = (req, res, next) => {
    const mimeType = req.file?.mimetype;
    if(!mimeType){
        throw new ApiError(400,"file not found")
    }
    console.log(mimeType);
   
    // Check if the MIME type starts with 'video/'
    if (mimeType.startsWith('video/')) {
       next();
    } else {
       // Remove the uploaded file from the server if it is not a video
       fs.unlinkSync(req.file.path);
   
       // Return an error response
       throw new ApiError(400,"invalid video file ..Try uploading video ")
    }
   };

export {validateVideoMimeType}