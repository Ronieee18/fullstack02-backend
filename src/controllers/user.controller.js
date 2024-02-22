import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from 'jsonwebtoken'
import mongoose from "mongoose"  


const generateAccessTokenAndRefreshToken=async(userId)=>{
   try {
      const user=await User.findById(userId)
      const accessToken=user.generateAccessToken()
      const refreshToken=user.generateRefreshToken()
      user.refreshToken=refreshToken
      await user.save({validateBeforeSave:false})  
      return {accessToken,refreshToken}
   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating referesh and access token")

   }
}

const registerUser=asyncHandler(async(req,res)=>{
   const {fullName,email,username,password}=req.body
   console.log(req.body)
   console.log(`email: ${email}`)
   
   //check if any field is empty
   if(
      [fullName,email,username,password].some((field)=>field?.trim()==="")
   ){
      throw new ApiError(400,"all field are required")
   }


   //check if username or email already existed
   const existed=await User.findOne({
      $or:[{username},{email}]
   })
   if(existed){
      throw new ApiError(409,"user with email or username already exist")
   }


   //getting local path of avatar and coverImage to upload on cloudinary
   const avatarLocalPath=req.files?.avatar[0]?.path;
   // const coverImageLocalPath=req.files?.coverImage[0]?.path;

   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
      coverImageLocalPath=req.files.coverImage[0].path
   }

   if(!coverImageLocalPath){
      throw new ApiError(400,"coverimage is required  ")

   }
   if(!avatarLocalPath){
      throw new ApiError(400,"avatar is required  ")

   }
   

   //uploading on cloudinary
   const avatar= await uploadOnCloudinary(avatarLocalPath)
   const coverImage=await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar){
      throw new ApiError(400,"avatar is required  ")

   }
   


   //creating user object in db
   const user=await User.create({
      fullName,
      avatar:avatar.url,
      coverImage:coverImage?.url || "",
      email,
      password,
      username:username.toLowerCase()
   })

   const createdUser=await User.findById(user._id).select("-password -refreshToken")
   if(!createdUser){
      throw new ApiError(500,"something went wrong while registering user")
   }

   return res.status(201).json(
      new ApiResponse(200,"user registered succesfully",createdUser)
   )

})

const login=asyncHandler(async(req,res)=>{
   const {email,password,username}=req.body
   if(!email && !username){
      throw new ApiError(400,"email and username is required");
   }
   const user=await User.findOne({
      $and:[{email},{username}]
   })
   if(!user){
      throw new ApiError(404,"user not found")
   }
   const isPasswordMatched=await user.isPasswordCorrect(password);
   if(!isPasswordMatched){
      throw new ApiError(401,"Invalid credentials")
   }

   const {accessToken,refreshToken}=await generateAccessTokenAndRefreshToken(user._id)

   const loggedUser=await User.findById(user._id).select("-password -refreshToken")
   const options={
      httpOnly:true,
      // secure:true,
   }
   return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",refreshToken,options)
      .json(
         new ApiResponse(
            200,
            "user logged in successfully",
            {
            user:loggedUser,accessToken,refreshToken
            }
         )
      )



   
})

const logout=asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset:{
            refreshToken:1 
         }
      },
      {
         new:true,
      }
   )
   
   const options={
      httpOnly:true,
      secure:true,
   }

   return res
      .status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json(
         new ApiResponse(
            200,"user logged OUT",{}
         )
      )


})

const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
   if(!incomingRefreshToken){
      throw new ApiError(401,"unauthorized request")
   }

   try {
      const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
      const user=await User.findById(decodedToken?._id)
      if(!user){
         throw new ApiError(401,"invalid refresh token")
      }
      if(user.refreshToken!==incomingRefreshToken){
         throw new ApiError(401,"refresh token is expired or used")
      }
      //create a new access token and update the users refresh token
      const options={
         httpOnly:true,
         secure:true,

      }
      const {accessToken,newRefreshToken}=generateAccessTokenAndRefreshToken(user._id)

      return res 
         .status(200)
         .cookie("refreshToken",newRefreshToken,options)
         .cookie("accessToken",accessToken,options)
         .json(
            new ApiResponse(200,"access token refreshed",{accessToken,refreshToken:newRefreshToken})
         )

   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token")
   }


})

const changePassword=asyncHandler(async(req,res)=>{
   const {currentPassword,newPassword} = req.body;
   const user=await User.findById(req.user?._id) 
   const isPasswordCorrect=await user.isPasswordCorrect(currentPassword)
   if(!isPasswordCorrect){
   throw new ApiError(400,"invalid old password")
   }
   user.password=newPassword
   await user.save({validateBeforeSave:false})

   return res  
      .status(200)
      .json(
         new ApiResponse(200,"changed password successfully",{})
      )
})

const getCurrentUser=asyncHandler(async(req,res)=>{
   // console.log(req.cookies)
   return res
      .status(200)
      .json(
         new ApiResponse(200,"current user fetched successfully",req.user)
      )
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
   const {fullName,email,username}=req.body
   const user=await User.findByIdAndUpdate(
      req.user._id,
      {
         $set:{
            fullName,
            email,
            username
         }
      },
      {
         new:true //returns the updated information
      }
   ).select("-password")

   return res
      .status(200)
      .json(
         new ApiResponse(200,"account details changes successfully",user)
      )
})

const updateAvtarImage=asyncHandler(async(req,res)=>{
   const avatarLocalPath=req.file?.path
   if(!avatarLocalPath){
      throw new ApiError(401,"avatar file missing")
   }
   const avatar=await uploadOnCloudinary(avatarLocalPath)
   if(!avatar.url){
      throw new ApiError(401,"avatar file missing")
   }
   
   const user=await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            avatar:avatar.url,
         }
      },{
         new:true,
      }
   ).select("-password")

   return res
      .status(200)
      .json(
         new ApiResponse(200,"avatar image changed successfully",user)
      )
})

const updateCoverImage=asyncHandler(async(req,res)=>{
   const coverImageLocalPath=req.file?.path
   if(!coverImageLocalPath){
      throw new ApiError(401,"cover image file missing")
   }
   const  coverImage=await uploadOnCloudinary(coverImageLocalPath)
   if(!coverImage.url){
      throw new ApiError(401,"cover image not found")
   }
   const user=await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set:{
            coverImage:coverImage.url,
         }
      },{
         new:true
      }

   ).select("-password")

   return res
      .status(200)
      .json(
         new ApiResponse(200,"cover Image changed successfully",user)
      )
})

const getUserChannel=asyncHandler(async(req,res)=>{
   const {username}=req.params
   if(!username?.trim()){
      throw new ApiError(400,"username missing")
   }
   const channel=await User.aggregate([
      {
         $match:{
            username:username?.toLowerCase()
         }
      },
      {
         $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"
         }
      },
      {
         $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
         }
      },
      {
         $addFields:{
            subscribersCount:{
               $size:"$subscribers"
            },
            subscribedTo:{
               $size:"$subscribedTo"
            },
            isSubscribed:{
               $cond:{
                  if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                  then:true,
                  else:false,
               }
            }
         }
      },
     {
      $project:{
         fullName:1,
         avatar:1,
         username:1,
         email:1,
         subscribersCount:1,
         subscribedTo:1,
         coverImage:1,
         isSubscribed:1,
         

         
      }
     }

   ])

   if(!channel?.length){
      throw new ApiError(404,"channel doesn't exist")
   }
   console.log(channel)
   return res
      .status(200)
      .json(
         new ApiResponse(200,"channel fetched successfully",channel[0])
      )
})

const getWatchHistory=asyncHandler(async(req,res)=>{
   const user=await User.aggregate([
      {
         $match:{
            _id:new mongoose.Types.ObjectId(req.user._id) //in aggregation 
         }
      },
      {
         $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
               {
                  $lookup:{
                     from:"users",
                     localField:"owner",
                     foreignField:"_id",
                     as:"owner",
                     pipeline:[
                        {
                           $project:{
                              fullName:1,
                              username:1,
                              avatar:1,
                           }
                        }
                     ]
                  }
               },
               {
                  $addFields:{
                     owner:{
                        $first:"$owner"
                     }
                  }
               }  
            ]
            
         }
      }
   ])
   console.log(user)
   return res
      .status(200)
      .json(
         new ApiResponse(200,"watch history fetched successfully",user[0].watchHistory)
      )

})

const pushVideoToWatchHistory=asyncHandler(async(req,res)=>{
   const videoId = req.params._id;
   const user=req.user
   if(!user||!videoId){
      throw new ApiError(404,"no video or user found");
   }
   user.watchHistory.push(videoId)

   await user.save();
   return res  
      .status(200)
      .json(
         new ApiResponse(200,"video added to wat history successfully",{})
      )

})

export {registerUser,
   login,
   logout,
   refreshAccessToken,
   changePassword,
   getCurrentUser,
   updateAccountDetails,
   updateAvtarImage,
   updateCoverImage,
   getUserChannel,
   getWatchHistory,
   pushVideoToWatchHistory
}