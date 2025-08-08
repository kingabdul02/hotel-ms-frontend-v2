import axiosInstance from '@/service/AxiosInstance';

export class POSService {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL;
    }

    /**
     * Add POS charges to a guest's room account
     * @param {string} bookingId - The booking ID
     * @param {Array} items - Array of purchase items
     * @param {string} outlet - The outlet name (Restaurant, Bar, Spa, Laundry)
     * @returns {Promise} API response
     */
    async addPOSCharges(bookingId, items, outlet) {
        try {
            const response = await axiosInstance.post(
                `${this.baseURL}/v2/pos/charges`,
                { bookingId, items, outlet }
            );
            return response.data;
        } catch (error) {
            console.error('Error adding POS charges:', error);
            throw error;
        }
    }

    /**
     * Get consolidated bill for a booking
     * @param {string} bookingId - The booking ID
     * @returns {Promise} API response
     */
    async getConsolidatedBill(bookingId) {
        try {
            const response = await axiosInstance.get(
                `${this.baseURL}/v2/pos/bill/${bookingId}`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching consolidated bill:', error);
            throw error;
        }
    }

    /**
     * Get POS outlets
     * @returns {Promise} API response
     */
    async getPOSOutlets() {
        try {
            const response = await axiosInstance.get(
                `${this.baseURL}/v2/pos/outlets`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching POS outlets:', error);
            throw error;
        }
    }

    /**
     * Get POS items for an outlet
     * @param {string} outlet - The outlet name
     * @returns {Promise} API response
     */
    async getPOSItems(outlet) {
        try {
            const response = await axiosInstance.get(
                `${this.baseURL}/v2/pos/items/${outlet}`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching POS items:', error);
            throw error;
        }
    }
}
