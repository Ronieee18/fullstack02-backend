import mongoose from "mongoose";
const subscriptionSchema=new mongoose.Schema({
    subscriber:{ //one who is subscribing 
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{ // one who is subscribed by subscribers
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

export const Subscription=mongoose.model("Subscription",subscriptionSchema)