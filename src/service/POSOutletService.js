import axiosInstance from '@/service/AxiosInstance';

// Generic helpers to normalize various API shapes
const extractList = (res) => {
    const d = res?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.data?.data)) return d.data.data; // paginated
    if (d?.success && Array.isArray(d?.data)) return d.data;
    return [];
};

const extractObject = (res) => res?.data ?? {};

export class POSOutletService {
    constructor() {
        this.apiBase = '/v2/pos/outlets';
    }

    async getRecords(params = {}) {
        const response = await axiosInstance.get(this.apiBase, { params });
        return extractList(response);
    }

    async addRecord(payload) {
        const response = await axiosInstance.post(this.apiBase, payload);
        return extractObject(response);
    }

    async updateRecord(id, payload) {
        const response = await axiosInstance.put(`${this.apiBase}/${id}`, payload);
        return extractObject(response);
    }

    async deleteRecord(id) {
        const response = await axiosInstance.delete(`${this.apiBase}/${id}`);
        return extractObject(response);
    }
}
