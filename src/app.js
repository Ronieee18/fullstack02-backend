import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app=express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))


app.use(express.json({limit:"20kb"}))
app.use(express.urlencoded({extended:true,limit:"20kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes
import userrouter from './routes/user.route.js'
import videorouter from "./routes/video.route.js"
import subscriberouter from "./routes/subscription.routes.js"


app.use("/api/v1/users",userrouter)
app.use("/api/v1/videos", videorouter)
app.use("/api/v1/subscribe", subscriberouter)



export {app}