import { Router } from "express";
import { changePassword, 
    getCurrentUser,
    getUserChannel,
    getWatchHistory,
    login,
    logout,
    pushVideoToWatchHistory,
    refreshAccessToken,
    registerUser,
    updateAccountDetails,
    updateAvtarImage,
    updateCoverImage
    } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router=Router()
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1,
        },
        {
            name:"coverImage",
            maxCount:1,
        }
    ]),
    registerUser)

router.route("/login").post(login)


//secured routes: means the routes that can only be accessed only if user is login
router.route("/logout").post(verifyJwt, logout)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJwt,changePassword)
router.route("/current-user").get(verifyJwt,getCurrentUser)

router.route("/update-account").patch(verifyJwt,updateAccountDetails)
router.route("/avatar").patch(verifyJwt,upload.single("avatar"),updateAvtarImage)
router.route("/cover-Image").patch(verifyJwt,upload.single("coverImage"),updateCoverImage)
router.route("/c/:username").get(verifyJwt,getUserChannel)
router.route("/watch-History").get(verifyJwt,getWatchHistory)
router.route('/add/:_id').post(verifyJwt,pushVideoToWatchHistory)


export default router