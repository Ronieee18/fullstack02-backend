import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_CLOUD_APIKEY, 
  api_secret: process.env.CLOUDINARY_CLOUD_APISECRET
});

const uploadOnCloudinary=async(localFilePath)=>{
    try {
        if(!localFilePath) return null;
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        fs.unlinkSync(localFilePath); //delete the local file after it has been uploaded to Cloudinary
        
        return response;

    } catch (error) {
        console.log('Error in imageUpload', error);
        fs.unlinkSync(localFilePath)
        return null;
        
    }
}
export {uploadOnCloudinary}