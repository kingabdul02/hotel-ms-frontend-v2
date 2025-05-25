import axiosInstance from '@/service/AxiosInstance';

export const uploadImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post('/file-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.filename;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error; // Handle error as per your application's error handling strategy
    }
};
