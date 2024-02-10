import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {getSubscribersVideo, deleteVideo, getAllvideos, getVideoById, publishVideo, updateThumbnail, updateVideoDetails,getUserVideos } from "../controllers/video.controller.js";
import { validateVideoMimeType } from "../middlewares/filetype.middleware.js";





const router =Router()
// router.use(verifyJwt)





router.route("/").post(
    verifyJwt,
    upload.fields([
        {
            name:"thumbnail",
            maxCount:1,
            
        },
        {
            name:"videoFile",
            maxCount:1,
        }
    ]),
    
    publishVideo
)
router.route("/subscribed").get(verifyJwt,getSubscribersVideo)
router.route("/allvideos").get(getAllvideos)
router.route("/myvideos").get(verifyJwt,getUserVideos)
router.route("/:videoId")
    .delete(verifyJwt,deleteVideo)
    .get(verifyJwt,getVideoById)
    .patch(verifyJwt,updateVideoDetails)
    


export default router