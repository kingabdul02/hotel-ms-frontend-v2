import axiosInstance from '@/service/AxiosInstance';

export class DashboardV2Service {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL;
    }

    /**
     * Get availability calendar data
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @returns {Promise} API response
     */
    async getAvailabilityCalendar(startDate, endDate) {
        try {
            const response = await axiosInstance.get(
                `${this.baseURL}/v2/dashboard/availability-calendar`,
                {
                    params: { startDate, endDate }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching availability calendar:', error);
            throw error;
        }
    }

    /**
     * Get occupancy heatmap data
     * @param {string} period - Period type: daily, weekly, monthly
     * @param {string} startDate - Optional start date for custom periods
     * @param {string} endDate - Optional end date for custom periods
     * @returns {Promise} API response
     */
    async getOccupancyHeatmap(period = 'daily', startDate = null, endDate = null) {
        try {
            const params = { period };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await axiosInstance.get(
                `${this.baseURL}/v2/dashboard/occupancy-heatmap`,
                { params }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching occupancy heatmap:', error);
            throw error;
        }
    }

    /**
     * Get RevPAR (Revenue per Available Room) data
     * @param {string} period - Period: today, 7d, 30d, custom
     * @param {string} startDate - Start date for custom period
     * @param {string} endDate - End date for custom period
     * @returns {Promise} API response
     */
    async getRevPAR(period = 'today', startDate = null, endDate = null) {
        try {
            const params = { period };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await axiosInstance.get(
                `${this.baseURL}/v2/dashboard/revpar`,
                { params }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching RevPAR:', error);
            throw error;
        }
    }
}
