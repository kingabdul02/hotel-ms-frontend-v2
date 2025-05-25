import axiosInstance from '@/service/AxiosInstance';

export class RoomsService {
    constructor() {
        this.apiBase = '/admin/rooms';
    }

    async getRooms() {
        const response = await axiosInstance.get(this.apiBase);
        return response.data.data;
    }

    async addRoom(room) {
        console.log("Adding room type:", room);
        const response = await axiosInstance.post(this.apiBase, room);
        console.log("Response from addRoom:", response.data);
        return response.data;
    }

    async updateRoom(id, room) {
        console.log(`Updating room type with id ${id}:`, room);
        const response = await axiosInstance.put(`${this.apiBase}/${id}`, room);
        console.log("Response from updateRoom:", response.data);
        return response.data;
    }

    async deleteRoom(id) {
        console.log(`Deleting room type with id ${id}`);
        const response = await axiosInstance.delete(`${this.apiBase}/${id}`);
        console.log("Response from deleteRoom:", response.data);
        return response.data;
    }
}
