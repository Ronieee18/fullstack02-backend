import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";


const publishVideo=asyncHandler(async(req,res)=>{
    const {title,description}=req.body
    if(!title && !description){
        throw new ApiError(400,"video title and description are required")
    }
    const thumbnailLocalPath=req.files?.thumbnail[0]?.path
    const videoLocalPath=req.files?.videoFile[0].path
    if(!thumbnailLocalPath){
        throw new ApiError(400,"thumbnail is required")

    }
    if(!videoLocalPath){
        throw new ApiError(400,"video is required")

    }
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)
    const video=await uploadOnCloudinary(videoLocalPath)
    console.log(req.user)
    // const user=await User.findById(req.user._id)
    const videoData=await Video.create({
        title,
        description,
        thumbnail:thumbnail.url,
        videoFile:video.url,
        owner:new mongoose.Types.ObjectId(req.user._id),
    })

    const createdVideoData=await Video.findById(videoData._id)
    if(!createdVideoData){
        throw new ApiError(500,"Something went wrong while publishing video")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200,"published video successfully",videoData)
        )
    
})

const getAllvideos=asyncHandler(async(req,res)=>{
    // const user=await User.findById(req.user._id)
    const videos=await Video.aggregate([
        
        {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
            },
          },
          {
            $unwind: "$owner",
          },
          {
            $addFields: {
              isOwner: false,
            },
          },
        
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200,"all videos fetched successfully",videos)//videos.map((video)=> video.videoFile)
        )
})

const getUserVideos=asyncHandler(async(req,res)=>{
    const user=await User.findById(req.user._id)
    const videos=await Video.aggregate([
        {
            $match:{
                owner:req.user._id
            }
        },
        {
            $addFields:{
                isOwner:true,
            }
        },
        {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
            },
          },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200,"all videos fetched successfully",videos)//videos.map((video)=> video.videoFile)
        )
})

const deleteVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"video not found")
    }
    try {
        await video.deleteOne();
    } catch (error) {
        throw new ApiError(500,"failed to delete video")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200,"video deleted successfully",{})
        )

})

const getVideoById=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"video not found")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200,"video fetched success",video)
        )
})

const updateVideoDetails=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const videoDetails=req.body
    
    const video=await Video.findByIdAndUpdate(
        videoId,
        videoDetails,
        {
            new:true,
        }

    )

    return res
        .status(200)
        .json(
            new ApiResponse(200,"details updated successfully",video)
        )

})


const updateThumbnail=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    
    const thumbnailLocalPath=req.file?.path
    if(!thumbnailLocalPath){
        throw new ApiError(400,'No Thumbnail Image Uploaded')
    }
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail.url){
        throw new ApiError(401,"thumbnail file missing")
     }
    const video=Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                thumbnail:thumbnail.url,
            }
        },
        {
            new:true,
        }
     )
     
        return res
            .status(200)
            .json(
                new ApiResponse(200,"thumbnail changed successfully",video)
            )
})


const getSubscribersVideo = asyncHandler(async (req, res) => {
    try {
        const videos = await Video.aggregate([
            {
              $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel", // Match based on the channel (owner) field in subscriptions
                as: "subscribers",
              },
            },
            {
              $unwind: "$subscribers", // Unwind to separate each subscriber
            },
            {
                $lookup: {
                  from: "users",
                  localField: "owner",
                  foreignField: "_id",
                  as: "owner",
                },
              },
              
            {
              $match: {
                "subscribers.subscriber": req.user._id, // Match only subscriptions for the current user
              },
            },
            {
              $group: {
                _id: "$owner", // Group by video owner (channel)
                videos: {
                  $push: {
                    _id: "$_id",
                    videoFile: "$videoFile",
                    thumbnail: "$thumbnail",
                    title: "$title",
                    description: "$description",
                    duration: "$duration",
                    views: "$views",
                    owner: "$owner",
                    createdAt: "$createdAt",
                    updatedAt: "$updatedAt",
                  },
                },
              },
            },
          ]);
  
      return res.status(200).json(new ApiResponse(200, "Subscribers' videos fetched successfully", videos));
    } catch (error) {
      console.error('Error fetching subscribers\' videos:', error);
      return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
    }
  });
  

export {
    getSubscribersVideo,
    publishVideo,
    getAllvideos,
    getUserVideos,
    deleteVideo,
    getVideoById,
    updateVideoDetails,
    updateThumbnail
} 