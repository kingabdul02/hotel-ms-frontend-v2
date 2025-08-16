import { ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import axiosInstance from '@/service/AxiosInstance';
import { LOADING_SPINNER_SHOW_MUTATION } from '@/store/storeconstants';

export function useBooking() {
  const store  = useStore();
  const toast  = useToast();

  /* ───────── Dashboard stats ───────── */
  const checkInsToday      = ref(0);
  const checkOutsToday     = ref(0);
  const availableRoomCount = ref(0);

  /* ───────── Paginated bookings ───────── */
  const recentBookings = ref([]);
  const pagingMeta     = ref({ current_page: 1, per_page: 10, total: 0 });

  /* ───────── Room availability search ───────── */
  const availableRooms   = ref([]);
  const isSearchingRooms = ref(false);

  /* ───────── Reservation creation ───────── */
  const isCreatingReservation = ref(false);

  /* ──────────────────────────────────────────── */
  const statisticsBooking = async (page = 1, filters = {}, rowsPerPage = 10) => {
    const token = getToken();
    if (!token) return null;
  
    try {
      store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
      const { data } = await axiosInstance.get('/admin/statistics/booking', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          per_page: rowsPerPage,
          search: filters.search || '',
          room_type_id: filters.room_type_id || '',
          payment_status: filters.payment_status || '',
          booking_status: filters.booking_status || '',
          check_in_from: filters.check_in_from || '',
          check_in_to: filters.check_in_to || '',
          check_out_from: filters.check_out_from || '',
          check_out_to: filters.check_out_to || '',
          booking_date_from: filters.booking_date_from || '',
          booking_date_to: filters.booking_date_to || '',
        }
      });
  
      // set state...
      checkInsToday.value      = data.checkInsToday      ?? 0;
      checkOutsToday.value     = data.checkOutsToday     ?? 0;
      availableRoomCount.value = data.availableRoomCount ?? 0;
  
      const pageObj = data.recentBookings;
      recentBookings.value = pageObj.data;
      pagingMeta.value = {
        current_page: pageObj.current_page,
        per_page    : Number(pageObj.per_page),
        total       : pageObj.total
      };
  
      return data;
    } catch (err) {
      errorToast('Failed to fetch booking statistics', err);
      return null;
    } finally {
      store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
  };  

   /* ─────── booking actions (unchanged) ─────── */
   const handleCheckIn = async (id) => actionRequest(`/admin/check-in-booking/${id}`, 'Booking checked in successfully');
   const handleCheckOut = async (id) => actionRequest(`/admin/check-out-booking/${id}`, 'Booking checked out successfully');

  const actionRequest = async (url, successMessage) => {
    const token = getToken();
    if (!token) return false;

    try {
      await axiosInstance.get(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.add({ severity: 'success', summary: 'Success', detail: successMessage, life: 3000 });
      // refresh dashboard to include new booking
      await statisticsBooking(pagingMeta.value.current_page);
      return true;
    } catch (err) {
      errorToast('Action failed', err);
      return false;
    }
  };

  /* ───────── Search for available rooms ───────── */
  const searchRooms = async (params) => {
    const token = getToken();
    if (!token) return [];

    isSearchingRooms.value = true;
    try {
      const { data } = await axiosInstance.get('/room/search', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      availableRooms.value = data?.data || data;
      return availableRooms.value;
    } catch (err) {
      errorToast('Room search failed', err);
      return [];
    } finally {
      isSearchingRooms.value = false;
    }
  };

  /* ───────── Create a reservation ───────── */
  const createReservation = async (payload) => {
    const token = getToken();
    if (!token) return false;
    isCreatingReservation.value = true;
    try {
      await axiosInstance.post('/admin/book-room', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.add({ severity: 'success', summary: 'Success', detail: 'Reservation created', life: 3000 });
      // refresh dashboard to include new booking
      await statisticsBooking(pagingMeta.value.current_page);
      return true;
    } catch (err) {
      errorToast('Reservation creation failed', err.response.data.message || err);
      return false;
    } finally {
      isCreatingReservation.value = false;
    }
  };

  /* ───────── Helpers ───────── */
  const getToken = () => {
    const token = JSON.parse(localStorage.getItem('userData') || '{}')?.token;
    if (!token) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Authentication token missing', life: 3000 });
    }
    return token;
  };

  const errorToast = (msg, err) => {
    toast.add({ severity: 'error', summary: 'Error', detail: `${msg}: ${err?.message || err}`, life: 4000 });
  };

  /* ───────── Exports ───────── */
  return {
    /* stats & bookings */
    statisticsBooking,
    recentBookings,
    pagingMeta,
    checkInsToday,
    checkOutsToday,
    availableRoomCount,

    /* availability search */
    searchRooms,
    availableRooms,
    isSearchingRooms,

    /* reservation */
    createReservation,
    isCreatingReservation,
    /* booking actions */
    handleCheckIn,
    handleCheckOut,

    /* toast util (optional external) */
    toast
  };
}
