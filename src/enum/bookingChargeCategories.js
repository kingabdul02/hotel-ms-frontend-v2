// Reusable list of booking charge categories for Booking Charges dialog and related features
// Keep this in sync with backend accepted values if validation exists.

export const bookingChargeCategories = [
  { label: 'Late Check-Out Fee', value: 'late_checkout' },
  { label: 'Early Check-In Fee', value: 'early_check_in' },
  { label: 'Room Upgrade Charge', value: 'room_upgrade' },
  { label: 'Extra Guest Fee (beyond standard occupancy)', value: 'extra_guest' },
  { label: 'Extra Bed / Crib Fee', value: 'extra_bed_crib' },
  { label: 'Early Departure Fee', value: 'early_departure' },
  { label: 'No-Show Fee', value: 'no_show' },
  { label: 'Cancellation Fee', value: 'cancellation' },
  { label: 'Pet Fee (per stay or per night)', value: 'pet_fee' },
  { label: 'Cleaning / Deep Cleaning Fee (e.g., for smoking in a non-smoking room)', value: 'cleaning' },
  { label: 'Damage Charge (furniture, electronics, property)', value: 'damage' },
  { label: 'Key Replacement Fee', value: 'key_replacement' },
  { label: 'Parking Fee (per night)', value: 'parking' },
  { label: 'Administrative / Processing Fee', value: 'administrative' },
  { label: 'Miscellaneous Adjustment (catch-all for ad-hoc charges)', value: 'misc' }
];

export default bookingChargeCategories;
