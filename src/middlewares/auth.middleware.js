import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'

export const verifyJwt=asyncHandler(async(req,_,next)=>{
    try {
        const tokens=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        // console.log(tokens)
        if(!tokens){
            throw new ApiError(401,"unautorized request")
        }

        const decodedToken= jwt.verify(tokens,process.env.ACCESS_TOKEN_SECRET)
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(404,'Invalid token')
        }
        req.user=user
        next()
    } catch (error) {
        console.error("JWT Verification Error:", error);

        throw new ApiError(401,error?.message|| "invalid access token")
    }
})