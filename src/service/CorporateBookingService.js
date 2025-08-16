import axiosInstance from '@/service/AxiosInstance';

export class CorporateBookingService {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL;
    }

    /**
     * Add custom charges to a corporate booking
     * @param {string} corporateBookingId
     * @param {Array|Object} payloadOrCharges
     * @returns {Promise}
     */
    async addCorporateBookingCharges(corporateBookingId, payloadOrCharges) {
        const body = Array.isArray(payloadOrCharges)
            ? { charges: payloadOrCharges }
            : payloadOrCharges;
        try {
            const response = await axiosInstance.post(
                `${this.baseURL}/v2/corporate-bookings/${corporateBookingId}/charges`,
                body
            );
            return response.data;
        } catch (error) {
            console.error('Error adding corporate booking charges:', error);
            throw error;
        }
    }

    /**
     * Get custom charges for a corporate booking
     * @param {string} corporateBookingId
     * @returns {Promise}
     */
    async getCorporateBookingCharges(corporateBookingId) {
        try {
            const response = await axiosInstance.get(
                `${this.baseURL}/v2/corporate-bookings/${corporateBookingId}/charges`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching corporate booking charges:', error);
            throw error;
        }
    }

    /**
     * Add POS charges to a corporate booking
     * @param {string} corporateBookingId
     * @param {Array|Object} items
     * @returns {Promise}
     */
    async addCorporatePOSCharges(corporateBookingId, items) {
        const body = Array.isArray(items) ? { items } : items;
        try {
            const response = await axiosInstance.post(
                `${this.baseURL}/v2/corporate-bookings/${corporateBookingId}/pos-charges`,
                body
            );
            return response.data;
        } catch (error) {
            console.error('Error adding corporate POS charges:', error);
            throw error;
        }
    }

    /**
     * Get POS charges for a corporate booking
     * @param {string} corporateBookingId
     * @returns {Promise}
     */
    async getCorporatePOSCharges(corporateBookingId) {
        try {
            const response = await axiosInstance.get(
                `${this.baseURL}/v2/corporate-bookings/${corporateBookingId}/pos-charges`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching corporate POS charges:', error);
            throw error;
        }
    }
}
