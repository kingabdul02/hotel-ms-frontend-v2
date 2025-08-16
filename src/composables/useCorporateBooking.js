import { ref, reactive } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import axiosInstance from '@/service/AxiosInstance';
import { LOADING_SPINNER_SHOW_MUTATION } from '@/store/storeconstants';
import { useConfirm } from 'primevue/useconfirm';

export function useCorporateBooking() {
  const store = useStore();
  const toast = useToast();
  const confirm = useConfirm();
  const corporateBookings = ref([]);
  const loading = ref(false);
  const totalRecords = ref(0);
  const searchQuery = ref('');
  const selectedStatus = ref('');
  const selectedPaymentStatus = ref('');
  const filterDateRange = ref([]);
  const filterCheckoutRange = ref([]);
  const filterBookingDateRange = ref([]);
  const expandedBookings = ref([]);
  const showBookingDialog = ref(false);
  const isEditMode = ref(false);
  const bookingIdToEdit = ref(null);
  const corporateBookingForm = reactive({
    is_new_company: true,
    check_in_date: null,
    check_out_date: null,
    company: { name: '', address: '', phone: '', email: '' },
    coordinator: { full_name: '', email: '', phone: '', nin: '', id_card_file: null },
    guests: [],
    expected_guests: 0, // Initialize expected_guests
    halls: [] // Initialize halls array
  });
  const selectedCompany = ref(null);
  const availableRooms = ref([]);
  const availableHalls = ref([]);
  const companies = ref([]);
  const filteredCompanies = ref([]);

  const lastFetchParams = ref({ first: 0, rows: 10, page: 1 });
  const lastFetchFilters = ref({});

  const fetchCorporateBookings = async (params = { first: 0, rows: 10, page: 1 }, filters = {}) => {
    lastFetchParams.value = params;
    lastFetchFilters.value = filters;

    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    loading.value = true;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
      const response = await axiosInstance.get('/admin/corporate-booking', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: params.page,
          per_page: params.rows,
          search: searchQuery.value || '',
          status: selectedStatus.value || '',
          payment_status: selectedPaymentStatus.value || '',
          check_in_from: filters.check_in_from || '',
          check_in_to: filters.check_in_to || '',
          check_out_from: filters.check_out_from || '',
          check_out_to: filters.check_out_to || '',
          booking_from: filters.booking_from || '',
          booking_to: filters.booking_to || '',
        }
      });
      corporateBookings.value = response.data.data;
      totalRecords.value = response.data.meta.total;
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch corporate bookings', life: 3000 });
      console.error('Error fetching corporate bookings:', error);
    } finally {
      loading.value = false;
      store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
  };

  const fetchBookingById = async (bookingId) => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    loading.value = true;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
      const response = await axiosInstance.get(`/admin/corporate-booking/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const booking = response.data.data;
      corporateBookingForm.is_new_company = !booking.company?.registration_number;
      corporateBookingForm.check_in_date = booking.check_in_date || null;
      corporateBookingForm.check_out_date = booking.check_out_date || null;
      corporateBookingForm.company = {
        name: booking.company?.name || '',
        address: booking.company?.address || '',
        phone: booking.company?.phone || '',
        email: booking.company?.email || ''
      };
      corporateBookingForm.coordinator = {
        full_name: booking.coordinator?.full_name || '',
        email: booking.coordinator?.email || '',
        phone: booking.coordinator?.phone || '',
        nin: booking.coordinator?.nin || '',
        id_card_file: booking.coordinator?.id_card_file || null
      };
      corporateBookingForm.guests = booking.guests.map(guest => ({
        id: guest.id,
        full_name: guest.full_name || '',
        email: guest.email || '',
        phone: guest.phone || '',
        room_id: guest.room?.id || null,
        gender: guest.gender || 'Male',
        is_checked_in: guest.is_checked_in || false,
        is_checked_out: guest.is_checked_out || false
      }));
      corporateBookingForm.expected_guests = booking.expected_guests || booking.guests.length;
      corporateBookingForm.halls = booking.halls ? booking.halls.map(hall => ({
        id: hall.id,
        hall_id: hall.hall_id,
        hall_name: hall.hall?.name || '',
        start_date: hall.start_date,
        end_date: hall.end_date,
        amount: hall.amount || 0,
        hall_price: hall.hall?.price || 0
      })) : [];
      selectedCompany.value = booking.company?.registration_number ? booking.company : null;
      return booking;
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch booking details', life: 3000 });
      console.error('Error fetching booking by ID:', error);
      return null;
    } finally {
      loading.value = false;
      store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
  };

      const updateCorporateBooking = async (bookingId, formData) => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
      const payload = { ...formData };
      if (!payload.is_new_company && selectedCompany.value) {
        payload.registration_number = selectedCompany.value.registration_number;
        payload.company = selectedCompany.value;
      }
      await axiosInstance.put(`/admin/corporate-booking/${bookingId}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      toast.add({ severity: 'success', summary: 'Success', detail: 'Corporate booking updated successfully', life: 3000 });
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Failed to update corporate booking', life: 3000 });
      console.error('Error updating corporate booking:', error);
      throw error;
    } finally {
      store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
  };

  const fetchAvailableRooms = async (check_in_date, check_out_date, bookingId = null) => {
    if (!check_in_date || !check_out_date) return;
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
      const params = {
        check_in_date,
        check_out_date
      };
      if (bookingId) {
        params.booking_id = bookingId;
      }
      const response = await axiosInstance.get('/room/search', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      availableRooms.value = response.data.data;
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch available rooms', life: 3000 });
      console.error('Error fetching available rooms:', error);
    } finally {
      store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
  };

  const fetchAvailableHalls = async () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
      const response = await axiosInstance.get('/halls', {
        headers: { Authorization: `Bearer ${token}` },
      });
      availableHalls.value = response.data?.data || [];
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch available halls', life: 3000 });
    } finally {
      store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
  };

  const fetchCompanies = async () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    try {
      const response = await axiosInstance.get('/admin/companies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      companies.value = response.data.companies || [];
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const searchCompanies = (event) => {
    filteredCompanies.value = companies.value.filter(company =>
      company.name.toLowerCase().includes(event.query.toLowerCase())
    );
  };

  const onCompanySelect = (event) => {
    selectedCompany.value = event.value;
    corporateBookingForm.company = { ...event.value };
  };

  const addGuest = () => {
    corporateBookingForm.guests.push({
      id: `guest-${Date.now()}-${Math.random()}`, // Generate unique ID
      full_name: '',
      email: '',
      phone: '',
      room_id: null,
      gender: 'Male'
    });
  };

  const removeGuest = (index) => {
    corporateBookingForm.guests.splice(index, 1);
  };

  const addHall = () => {
    corporateBookingForm.halls.push({
      id: `hall-${Date.now()}-${Math.random()}`,
      hall_id: null,
      hall_name: '',
      start_date: null,
      end_date: null,
      amount: 0,
      hall_price: 0
    });
  };

  const removeHall = (index) => {
    corporateBookingForm.halls.splice(index, 1);
  };

  const resetCorporateBookingForm = () => {
    Object.assign(corporateBookingForm, {
      is_new_company: true,
      check_in_date: null,
      check_out_date: null,
      company: { name: '', address: '', phone: '', email: '' },
      coordinator: { full_name: '', email: '', phone: '', nin: '', id_card_file: null },
      guests: [],
      expected_guests: 0,
      halls: []
    });
    selectedCompany.value = null;
    availableRooms.value = [];
    availableHalls.value = [];
  };

  const submitCorporateBooking = async () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
    try {
      const formData = { ...corporateBookingForm };
      if (!formData.is_new_company && selectedCompany.value) {
        formData.company = selectedCompany.value;
      }
      await axiosInstance.post('/admin/corporate-booking', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      toast.add({ severity: 'success', summary: 'Success', detail: 'Corporate booking created successfully', life: 3000 });
      resetCorporateBookingForm();
      await fetchCorporateBookings();
      showBookingDialog.value = false;
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Failed to create corporate booking', life: 3000 });
      console.error('Error creating corporate booking:', error);
    } finally {
      store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
  };

  const toggleBookingExpansion = (bookingId) => {
    const index = expandedBookings.value.indexOf(bookingId);
    if (index > -1) {
      expandedBookings.value.splice(index, 1);
    } else {
      expandedBookings.value.push(bookingId);
    }
  };

  const getBookingStatus = (booking) => {
    const allCheckedOut = booking.guests.every(guest => guest.is_checked_out);
    const someCheckedIn = booking.guests.some(guest => guest.is_checked_in);
    if (allCheckedOut) return 'Completed';
    if (someCheckedIn) return 'In Progress';
    return 'Pending';
  };

  const getBookingStatusSeverity = (booking) => {
    const status = getBookingStatus(booking);
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'info';
      case 'Pending': return 'warning';
      default: return 'info';
    }
  };

  const getGuestStatus = (guest) => {
    if (guest.is_checked_out) return 'Checked Out';
    if (guest.is_checked_in) return 'Checked In';
    return 'Pending';
  };

  const getGuestStatusSeverity = (guest) => {
    if (guest.is_checked_out) return 'info';
    if (guest.is_checked_in) return 'success';
    return 'warning';
  };

  const getCheckedInCount = () => {
    return corporateBookings.value.reduce((count, booking) => {
      return count + booking.guests.filter(guest => guest.is_checked_in && !guest.is_checked_out).length;
    }, 0);
  };

  const getCheckedOutCount = () => {
    return corporateBookings.value.reduce((count, booking) => {
      return count + booking.guests.filter(guest => guest.is_checked_out).length;
    }, 0);
  };

  const getTotalGuestsCount = () => {
    return corporateBookings.value.reduce((count, booking) => {
      return count + booking.guests.length;
    }, 0);
  };

  const checkInGuest = async (guest) => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    try {
      store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
      const response = await axiosInstance.post(`/admin/corporate-booking/guest/${guest.id}/check-in`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.add({ severity: 'success', summary: 'Success', detail: `${guest.full_name} has been checked in successfully`, life: 3000 });
      await fetchCorporateBookings(lastFetchParams.value, lastFetchFilters.value);
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Failed to check in guest', life: 3000 });
      console.error('Error checking in guest:', error);
    } finally {
      store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
  };

  const checkOutGuest = async (guest) => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    try {
      store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
      const response = await axiosInstance.post(`/admin/corporate-booking/guest/${guest.id}/check-out`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.add({ severity: 'success', summary: 'Success', detail: `${guest.full_name} has been checked out successfully`, life: 3000 });
      await fetchCorporateBookings(lastFetchParams.value, lastFetchFilters.value);
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Failed to check out guest', life: 3000 });
      console.error('Error checking out guest:', error);
    } finally {
      store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
  };

  const confirmCheckIn = (guest) => {
    confirm.require({
      message: `Are you sure you want to check in ${guest.full_name}?`,
      header: 'Check-In Confirmation',
      icon: 'pi pi-info-circle',
      rejectClass: 'p-button-text p-button-text',
      acceptClass: 'p-button-success',
      accept: () => checkInGuest(guest),
    });
  };

  const confirmCheckOut = (guest) => {
    confirm.require({
      message: `Are you sure you want to check out ${guest.full_name}?`,
      header: 'Check-Out Confirmation',
      icon: 'pi pi-info-circle',
      rejectClass: 'p-button-text p-button-text',
      acceptClass: 'p-button-danger',
      accept: () => checkOutGuest(guest),
    });
  };

  // Booking-level check-in/check-out methods
  const checkInBooking = async (booking) => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    try {
      const response = await axiosInstance.post(`/admin/corporate-booking/${booking.id}/check-in`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.add({ severity: 'success', summary: 'Success', detail: 'Corporate booking checked in successfully', life: 3000 });
      await fetchCorporateBookings(lastFetchParams.value, lastFetchFilters.value);
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to check in corporate booking', life: 3000 });
      console.error('Error checking in corporate booking:', error);
      throw error;
    }
  };

  const checkOutBooking = async (booking) => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    try {
      const response = await axiosInstance.post(`/admin/corporate-booking/${booking.id}/check-out`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.add({ severity: 'success', summary: 'Success', detail: 'Corporate booking checked out successfully', life: 3000 });
      await fetchCorporateBookings(lastFetchParams.value, lastFetchFilters.value);
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to check out corporate booking', life: 3000 });
      console.error('Error checking out corporate booking:', error);
      throw error;
    }
  };

  const confirmBookingCheckIn = (booking) => {
    confirm.require({
      message: `Are you sure you want to check in all guests for corporate booking ${booking.reservation_code}?`,
      header: 'Booking Check-In Confirmation',
      icon: 'pi pi-sign-in',
      acceptClass: 'p-button-success',
      accept: () => checkInBooking(booking),
    });
  };

  const confirmBookingCheckOut = (booking) => {
    confirm.require({
      message: `Are you sure you want to check out all guests for corporate booking ${booking.reservation_code}?`,
      header: 'Booking Check-Out Confirmation',
      icon: 'pi pi-sign-out',
      acceptClass: 'p-button-danger',
      accept: () => checkOutBooking(booking),
    });
  };

  const fetchCorporateBill = async (reservationCode) => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const token = userData?.token;
    try {
      store.commit(LOADING_SPINNER_SHOW_MUTATION, true);
      const response = await axiosInstance.get(
        `admin/corporate-booking/bill/${reservationCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Failed to fetch corporate bill',
        life: 3000,
      });
      console.error('Error fetching corporate bill:', error);
      return null;
    } finally {
      store.commit(LOADING_SPINNER_SHOW_MUTATION, false);
    }
  };

  return {
    corporateBookings,
    loading,
    totalRecords,
    searchQuery,
    selectedStatus,
    selectedPaymentStatus,
    filterDateRange,
    filterCheckoutRange,
    filterBookingDateRange,
    expandedBookings,
    corporateBookingForm,
    selectedCompany,
    availableRooms,
    availableHalls,
    companies,
    filteredCompanies,
    fetchCorporateBookings,
    fetchBookingById,
    updateCorporateBooking,
    fetchAvailableRooms,
    fetchAvailableHalls,
    fetchCompanies,
    searchCompanies,
    onCompanySelect,
    addGuest,
    removeGuest,
    addHall,
    removeHall,
    resetCorporateBookingForm,
    submitCorporateBooking,
    toggleBookingExpansion,
    getBookingStatus,
    getBookingStatusSeverity,
    getGuestStatus,
    getGuestStatusSeverity,
    getCheckedInCount,
    getCheckedOutCount,
    getTotalGuestsCount,
    confirmCheckIn,
    confirmCheckOut,
    confirmBookingCheckIn,
    confirmBookingCheckOut,
    fetchCorporateBill,
    toast,
    confirm,
    showBookingDialog,
    isEditMode,
    bookingIdToEdit
  };
}