import axiosInstance from '@/service/AxiosInstance';

export class RoomTypeService {
    constructor() {
        this.apiBase = '/admin/room-types';
    }

    async getRoomTypes() {
        const response = await axiosInstance.get(this.apiBase);
        return response.data.data;
    }

    async addRoomType(roomType) {
        console.log("Adding room type:", roomType);
        const response = await axiosInstance.post(this.apiBase, roomType);
        console.log("Response from addRoomType:", response.data);
        return response.data;
    }

    async updateRoomType(id, roomType) {
        console.log(`Updating room type with id ${id}:`, roomType);
        const response = await axiosInstance.put(`${this.apiBase}/${id}`, roomType);
        console.log("Response from updateRoomType:", response.data);
        return response.data;
    }

    async deleteRoomType(id) {
        console.log(`Deleting room type with id ${id}`);
        const response = await axiosInstance.delete(`${this.apiBase}/${id}`);
        console.log("Response from deleteRoomType:", response.data);
        return response.data;
    }
}
