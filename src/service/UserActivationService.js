import axiosInstance from '@/service/AxiosInstance';

export class UserActivationService {
    constructor() {
        this.apiBase = '/admin';
    }

    async deactivateUser(id) {
        const response = await axiosInstance.get(`${this.apiBase}/dedactivate-user/${id}`);
        return response.data;
    }

    async activateUser(id) {
        const response = await axiosInstance.get(`${this.apiBase}/activate-user/${id}`);
        return response.data;
    }
}
