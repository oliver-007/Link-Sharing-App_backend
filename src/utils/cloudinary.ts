// contact_management_app
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ++++++++++++++ UPLOAD IMAGE FILE ON CLOUDINARY +++++++++++++
const uploadOnCloudinary = async (
  localFilePath: string
): Promise<UploadApiResponse | null> => {
  try {
    if (!localFilePath) return null;

    // Upload the file on Cloudinary
    const response: UploadApiResponse = await cloudinary.uploader.upload(
      localFilePath,
      // OPTIONS ---
      {
        resource_type: "auto",
        use_filename: true,
        folder: "contact_management_app",
      }
    );

    // Remove locally saved temp file
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // Remove locally saved temp file as the upload operation failed
    console.log(
      "File upload on Cloudinary FAILED !!!",
      (error as UploadApiErrorResponse)?.message
    );
    return null;
  }
};

// ++++++++ DELETE FILE FROM CLOUDINARY +++++++++
const deleteFromCloudinary = async (
  public_id: string,
  resource_type: "image" | "video" | "raw" = "image" // Specify the resource_type type
): Promise<{ result: string } | undefined> => {
  try {
    if (!public_id) return undefined;

    // DELETE IMG FILE
    const response = await cloudinary.uploader.destroy(public_id, {
      resource_type,
    });

    return response;
  } catch (error) {
    console.log(
      "File deletion FAILED: ",
      (error as UploadApiErrorResponse)?.message
    );
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
