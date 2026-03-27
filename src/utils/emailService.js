import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Sends a booking confirmation email with a QR code via EmailJS
 * @param {Object} booking - The booking details
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendBookingEmail(booking) {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY ||
        SERVICE_ID === 'YOUR_SERVICE_ID') {
        console.warn('EmailJS not configured. Skipping email.');
        return { success: false, message: 'Email service not configured' };
    }

    const ticketData = JSON.stringify({
        id: booking.bookingId,
        museum: booking.museumName,
        date: booking.date,
        time: booking.timeSlotLabel,
        tickets: booking.totalTickets,
        verified: true,
    });

    // Generate QR code URL using a free public API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticketData)}`;

    // Build the ticket breakdown string
    const breakdownText = booking.breakdown
        ? booking.breakdown.map(b => `${b.quantity}x ${b.category} (₹${b.price * b.quantity})`).join(', ')
        : booking.category || 'N/A';

    const templateParams = {
        to_email: booking.email,
        to_name: 'Visitor',
        booking_id: booking.bookingId,
        museum_name: booking.museumName || 'Museum',
        visit_date: new Date(booking.date).toLocaleDateString('en-US', {
            weekday: 'short', year: 'numeric', month: 'long', day: 'numeric'
        }),
        time_slot: booking.timeSlotLabel,
        tickets: breakdownText,
        total_tickets: booking.totalTickets,
        total_amount: `₹${booking.totalAmount?.toLocaleString()}`,
        mobile: booking.mobile,
        qr_code_url: qrCodeUrl,
    };

    try {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        return { success: true, message: `Email sent to ${booking.email}` };
    } catch (error) {
        console.error('EmailJS error:', error);
        return { success: false, message: 'Failed to send email' };
    }
}
