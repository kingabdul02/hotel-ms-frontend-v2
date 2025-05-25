import axiosInstance from '@/service/AxiosInstance';

export class ItemService {
    constructor() {
        this.apiBase = '/admin/items';
        // this.apiBase2 = '/admin/inventories';
    }

    async getRecords() {
        const response = await axiosInstance.get(this.apiBase);
        return response.data.data;
    }

    // async getRecords2() {
    //     const response = await axiosInstance.get(this.apiBase2);
    //     return response.data.data;
    // }

    async addRecord(payload) {
        const response = await axiosInstance.post(this.apiBase, payload);
        return response.data;
    }

    async updateRecord(id, payload) {
        const response = await axiosInstance.put(`${this.apiBase}/${id}`, payload);
        return response.data;
    }

    async deleteRecord(id) {
        const response = await axiosInstance.delete(`${this.apiBase}/${id}`);
        return response.data;
    }
}
