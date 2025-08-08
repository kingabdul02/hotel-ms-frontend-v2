import axiosInstance from '@/service/AxiosInstance';

export class HousekeepingV2Service {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL;
    }

    /**
     * Get housekeeping dashboard stats
     * @param {Object} [params] - Optional query params e.g. { date: 'YYYY-MM-DD' }
     * @returns {Promise<Object>} Stats payload
     */
    async getHousekeepingStats(params = {}) {
        try {
            const response = await axiosInstance.get(
                `${this.baseURL}/v2/housekeeping/stats`,
                { params }
            );
            return response?.data?.data || response?.data;
        } catch (error) {
            console.error('Error fetching housekeeping stats:', error);
            throw error;
        }
    }

    /**
     * Extract status counts (clean, dirty, inProgress, maintenance) from stats payload
     * @param {Object} stats - Payload from getHousekeepingStats
     * @returns {{clean:number, dirty:number, inProgress:number, maintenance:number}}
     */
    getStatusCountsFromStats(stats = {}) {
        return {
            clean: stats?.cleanRooms?.count ?? 0,
            dirty: stats?.dirtyRooms?.count ?? 0,
            inProgress: stats?.inProgressRooms?.count ?? 0,
            maintenance: 0 // Not provided by backend stats currently
        };
    }

    /**
     * Update room cleaning status
     * @param {string} roomId - The room ID
     * @param {string} status - New status: Clean, Dirty, In-Progress, Out-of-Service
     * @returns {Promise} API response
     */
    async updateRoomStatus(roomId, status) {
        try {
            const response = await axiosInstance.put(
                `${this.baseURL}/v2/housekeeping/rooms/${roomId}/status`,
                { status }
            );
            return response.data;
        } catch (error) {
            console.error('Error updating room status:', error);
            throw error;
        }
    }

    /**
     * Assign rooms to housekeeper
     * @param {string} housekeeperId - The housekeeper ID
     * @param {Array} roomIds - Array of room IDs to assign
     * @returns {Promise} API response
     */
    async assignRoomsToHousekeeper(housekeeperId, roomIds) {
        try {
            const assignmentData = {
                assignments: [
                    {
                        housekeeper_id: housekeeperId,
                        room_ids: roomIds,
                        assignment_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
                    }
                ]
            };
            const response = await axiosInstance.post(`${this.baseURL}/v2/housekeeping/assignments`, assignmentData);
            return response.data;
        } catch (error) {
            console.error('Error assigning rooms to housekeeper:', error);
            throw error;
        }
    }

    /**
     * Get housekeeping assignments
     * @returns {Promise} API response
     */
    async getHousekeepingAssignments() {
        try {
            const response = await axiosInstance.get(
                `${this.baseURL}/v2/housekeeping/assignments`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching housekeeping assignments:', error);
            throw error;
        }
    }

    /**
     * Get available housekeepers
     * @param {Object} [params] - Query parameters (e.g., page)
     * @returns {Promise} API response
     */
    async getAvailableHousekeepers(params = {}) {
        try {
            const response = await axiosInstance.get(`${this.baseURL}/v2/available-housekeepers`, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching housekeepers:', error);
            throw error;
        }
    }

    /**
     * Get rooms with current status, supports pagination, search, and filters
     * @param {Object} [params] - Query parameters (page, per_page, search, status, room_type_id, is_available, no_of_guests, no_of_bedrooms)
     * @returns {Promise} API response containing data, links, and meta
     */
    async getRoomsWithStatus(params = {}) {
        try {
            const response = await axiosInstance.get(
                `${this.baseURL}/rooms`,
                { params }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching rooms with status:', error);
            throw error;
        }
    }
}
