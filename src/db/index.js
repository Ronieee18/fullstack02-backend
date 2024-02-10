import mongoose from 'mongoose'
import { DB_NAME } from '../constraints.js'

const connectDB=async()=>{
    try {
       const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
       console.log(`Mongodb succesfully connected: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log(`MongoDB connection FAILED: ${error}`)
        process.exit(1)
    }
}
export default connectDB