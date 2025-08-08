import axiosInstance from '@/service/AxiosInstance';

export class BookingV2Service {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL;
    }

    /**
     * Update an existing booking
     * @param {string} bookingId - The booking ID
     * @param {Object} bookingData - Updated booking data
     * @returns {Promise} API response
     */
    async updateBooking(bookingId, bookingData) {
        try {
            const response = await axiosInstance.put(
                `${this.baseURL}/v2/bookings/${bookingId}`,
                bookingData
            );
            return response.data;
        } catch (error) {
            console.error('Error updating booking:', error);
            throw error;
        }
    }

    /**
     * Cancel a booking
     * @param {string} bookingId - The booking ID
     * @param {Object} cancellationData - Cancellation details
     * @returns {Promise} API response
     */
    async cancelBooking(bookingId, cancellationData = {}) {
        try {
            const response = await axiosInstance.post(
                `${this.baseURL}/v2/bookings/${bookingId}/cancel`,
                cancellationData
            );
            return response.data;
        } catch (error) {
            console.error('Error canceling booking:', error);
            throw error;
        }
    }

    /**
     * Add custom charges to a booking
     * @param {string} bookingId - The booking ID
     * @param {Array} charges - Array of charge items
     * @returns {Promise} API response
     */
    async addBookingCharges(bookingId, charges) {
        try {
            const response = await axiosInstance.post(
                `${this.baseURL}/v2/bookings/${bookingId}/charges`,
                { charges }
            );
            return response.data;
        } catch (error) {
            console.error('Error adding booking charges:', error);
            throw error;
        }
    }

    /**
     * Get booking details with charges
     * @param {string} bookingId - The booking ID
     * @returns {Promise} API response
     */
    async getBookingDetails(bookingId) {
        try {
            const response = await axiosInstance.get(
                `${this.baseURL}/v2/bookings/${bookingId}`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching booking details:', error);
            throw error;
        }
    }
}
