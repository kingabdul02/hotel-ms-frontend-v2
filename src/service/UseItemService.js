import axiosInstance from '@/service/AxiosInstance';

export class UseItemService {
    constructor() {
        this.apiBase = '/admin/use-inventory';
    }

    async useItem() {
        const response = await axiosInstance.post(this.apiBase);
        return response.data.data;
    }

    async useItem(payload) {
        const response = await axiosInstance.post(this.apiBase, payload);
        return response.data;
    }
}
