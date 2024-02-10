import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";
const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim: true,  //removes any extra spaces before or after the string,
        index:true,
        lowercase:true,

    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true, 
        index: true
    },
    password:{
        type:String,
        required:[true,"Password is required"],
    },
    watchHistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }],
    coverImage:{
        type:String,
        
    },
    avatar:{
        type:String,
        required:true,
    },
    refreshToken:{
        type:String,
    }
},{timestamps:true})


userSchema.pre('save',async function(next){
    if(!this.isModified("password")) return next();
    this.password= await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect=async function(password){
   return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken=function(){
    return jwt.sign({
        _id:this._id,
        username:this.username,
        fullName:this.fullName,
        email:this.email
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign({
        _id:this._id,
        
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

export const User=mongoose.model("User",userSchema)