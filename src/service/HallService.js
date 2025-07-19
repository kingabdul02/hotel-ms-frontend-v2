import axiosInstance from './AxiosInstance';

export class HallService {
    getHalls() {
        return axiosInstance.get('/halls').then((res) => res.data.data);
    }

    addHall(hall) {
        return axiosInstance.post('/halls', hall).then((res) => res.data.data);
    }

    updateHall(id, hall) {
        return axiosInstance.put(`/halls/${id}`, hall).then((res) => res.data.data);
    }

    deleteHall(id) {
        return axiosInstance.delete(`/halls/${id}`).then((res) => res.data.data);
    }
}