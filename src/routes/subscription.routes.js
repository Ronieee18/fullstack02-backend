import { toggleSubscription } from "../controllers/subsciption.controller.js";
import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router=Router();
router.use(verifyJwt)

router.route('/:username').post(toggleSubscription)


export default router