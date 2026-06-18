interface CloudinaryUploadResponse {
  secure_url: string;
}

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as
  | string
  | undefined;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env
  .VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export const cloudinaryService = {
  async uploadImage(file: File, folder = "seller-profiles"): Promise<string> {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      throw new Error("Cloudinary chưa được cấu hình.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error("Tải ảnh lên Cloudinary thất bại.");
    }

    const data = (await response.json()) as CloudinaryUploadResponse;
    return data.secure_url;
  },
};
