import axiosInstance from '@/service/AxiosInstance';

export class POSService {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL;
    }

    /**
     * Post POS charges to guest room per API v2 spec
     * @param {Object} payload - Charges payload { booking_id, outlet_id, items: [{ item_id, quantity, unit_price, modifications? }], server_id?, table_number?, notes? }
     * @returns {Promise<Object>} API response
     */
    async addPOSCharges(payload) {
        try {
            const response = await axiosInstance.post(
                `${this.baseURL}/v2/pos/charges`,
                payload
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
     * Get POS outlets with optional filters and pagination
     * @param {Object} [params] - { name?, type?, status?, search?, page?, per_page? }
     * @returns {Promise<Object>} API response
     */
    async getPOSOutlets(params = {}) {
        try {
            const response = await axiosInstance.get(
                `${this.baseURL}/v2/pos/outlets`,
                { params }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching POS outlets:', error);
            throw error;
        }
    }

    /**
     * Get POS items grouped by category for a given outlet
     * @param {number|string} outletId - The outlet ID
     * @param {string|number} [category] - Category name (partial) or ID
     * @returns {Promise<Object>} API response
     */
    async getPOSItems(outletId, category) {
        try {
            const response = await axiosInstance.get(
                `${this.baseURL}/v2/pos/items`,
                { params: { outlet_id: outletId, category } }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching POS items:', error);
            throw error;
        }
    }
}
