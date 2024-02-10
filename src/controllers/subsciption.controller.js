import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const toggleSubscription=asyncHandler(async(req,res)=>{
    // console.log(req.params)
    const {username}=req.params;
    if(!username){
        throw new ApiError(404,"username not found");
    }
    const channel=await User.findOne({username})
//    const subscriber=req.user;
    
    if(!channel){
        throw new ApiError(404,"channel not found");
    }
   let unsubscribe;
   let subscribe;

   const itHasSubscription = await Subscription.findOne({
    subscriber:req.user?._id,
    channel: channel._id,
    })
    if(itHasSubscription){
        // unsubscribe
         unsubscribe = await Subscription.findOneAndDelete(
            {
                subscriber:req.user?._id,
                channel: channel._id,
            }
        )
            if(!unsubscribe){
                throw new ApiError(500,"something went wrongg");
            }
            return res 
                .status(200)
                .json(
                    new ApiResponse(200,"chaannel unsubscibed successfully",unsubscribe)
                )

        }
        else{
            subscribe=await Subscription.create({
                subscriber:req.user?._id,
                channel: channel._id,
            })
            if(!subscribe){
                throw new ApiError(500, "something went wrong while subscribe the channel")
            }

            return res 
                .status(200)
                .json(
                    new ApiResponse(200,"chaannel subscribed successfully",subscribe)
                )
        }


})

    

export {
    toggleSubscription
}