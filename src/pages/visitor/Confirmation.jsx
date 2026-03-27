import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaCheckCircle, FaDownload, FaHome, FaTicketAlt, FaEnvelope, FaSms } from 'react-icons/fa';
import { sendBookingEmail } from '../../utils/emailService';

export default function Confirmation() {
    const location = useLocation();
    const booking = location.state;
    const [emailStatus, setEmailStatus] = useState('sending'); // 'sending' | 'sent' | 'failed'
    const [smsStatus, setSmsStatus] = useState('sending');

    // Send email + simulate SMS on mount
    useEffect(() => {
        if (!booking) return;

        // Real email via EmailJS
        sendBookingEmail(booking).then(result => {
            setEmailStatus(result.success ? 'sent' : 'failed');
        });

        // Simulated SMS (delay for realism)
        const smsTimer = setTimeout(() => setSmsStatus('sent'), 2500);
        return () => clearTimeout(smsTimer);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (!booking) {
        return (
            <div className="min-h-screen bg-soft-white pt-20 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lgray-dark mb-4">No booking data found.</p>
                    <Link to="/museums" className="btn-gold">Browse Museums</Link>
                </div>
            </div>
        );
    }

    const museumName = booking.museumName || 'Museum';

    const ticketQR = JSON.stringify({
        id: booking.bookingId,
        museum: museumName,
        date: booking.date,
        time: booking.timeSlotLabel,
        tickets: booking.totalTickets,
        verified: true,
    });

    const statusIcon = (status) => {
        if (status === 'sending') return <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />;
        if (status === 'sent') return <FaCheckCircle className="text-green-300 text-base" />;
        return <span className="text-red-300 text-sm">✕</span>;
    };

    const statusText = (status, type) => {
        if (status === 'sending') return `Sending ${type}...`;
        if (status === 'sent') return `${type} sent successfully!`;
        return `${type} could not be sent`;
    };

    return (
        <div className="min-h-screen bg-soft-white pt-20">
            <div className="bg-gradient-hero py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="animate-bounce-in">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaCheckCircle className="text-white text-4xl" />
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-soft-white mb-2 animate-fade-in">
                        Booking <span className="text-gradient-gold">Confirmed!</span>
                    </h1>
                    <p className="text-lgray animate-fade-in mb-5">Your tickets for <strong>{museumName}</strong> have been booked successfully</p>

                    {/* Notification Toasts */}
                    <div className="max-w-md mx-auto space-y-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        {/* Email Toast */}
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-500 ${
                            emailStatus === 'sent' ? 'bg-green-500/15 border border-green-500/25 text-green-100' :
                            emailStatus === 'failed' ? 'bg-red-500/15 border border-red-500/25 text-red-200' :
                            'bg-white/10 border border-white/15 text-white/80'
                        }`}>
                            {statusIcon(emailStatus)}
                            <FaEnvelope className="text-gold/80" />
                            <span>{statusText(emailStatus, 'Email')} {emailStatus === 'sent' && <strong>{booking.email}</strong>}</span>
                        </div>
                        {/* SMS Toast */}
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-500 ${
                            smsStatus === 'sent' ? 'bg-green-500/15 border border-green-500/25 text-green-100' :
                            'bg-white/10 border border-white/15 text-white/80'
                        }`}>
                            {statusIcon(smsStatus)}
                            <FaSms className="text-gold/80" />
                            <span>{statusText(smsStatus, 'SMS')} {smsStatus === 'sent' && <strong>{booking.mobile}</strong>}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Ticket Card */}
                <div className="admin-card animate-slide-up overflow-hidden">
                    {/* Ticket Header */}
                    <div className="bg-navy -mx-6 -mt-6 px-6 py-4 mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FaTicketAlt className="text-gold text-xl" />
                            <div>
                                <h2 className="text-soft-white font-heading font-bold">{museumName}</h2>
                                <p className="text-gold text-xs">E-Ticket — MuseumPass</p>
                            </div>
                        </div>
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            CONFIRMED
                        </span>
                    </div>

                    {/* Ticket Details */}
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                        <div>
                            <p className="text-xs text-lgray-dark mb-1">Booking ID</p>
                            <p className="font-mono font-bold text-navy">{booking.bookingId}</p>
                        </div>
                        <div>
                            <p className="text-xs text-lgray-dark mb-1">Visit Date</p>
                            <p className="font-medium text-navy">
                                {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-lgray-dark mb-1">Time Slot</p>
                            <p className="font-medium text-navy">{booking.timeSlotLabel}</p>
                        </div>
                        <div>
                            <p className="text-xs text-lgray-dark mb-1">Total Tickets</p>
                            <p className="font-medium text-navy">{booking.totalTickets}</p>
                        </div>
                        <div>
                            <p className="text-xs text-lgray-dark mb-1">Mobile</p>
                            <p className="font-medium text-navy">{booking.mobile}</p>
                        </div>
                        <div>
                            <p className="text-xs text-lgray-dark mb-1">Email</p>
                            <p className="font-medium text-navy text-sm break-all">{booking.email}</p>
                        </div>
                        {booking.breakdown ? (
                            <div>
                                <p className="text-xs text-lgray-dark mb-1">Categories</p>
                                <p className="font-medium text-navy">{booking.breakdown.map(b => `${b.quantity} ${b.category}`).join(', ')}</p>
                            </div>
                        ) : booking.category && (
                            <div>
                                <p className="text-xs text-lgray-dark mb-1">Category</p>
                                <p className="font-medium text-navy">{booking.category}</p>
                            </div>
                        )}
                    </div>

                    {/* Divider (perforated line effect) */}
                    <div className="relative my-6">
                        <div className="border-t-2 border-dashed border-lgray"></div>
                        <div className="absolute -left-9 top-1/2 -translate-y-1/2 w-6 h-6 bg-soft-white rounded-full"></div>
                        <div className="absolute -right-9 top-1/2 -translate-y-1/2 w-6 h-6 bg-soft-white rounded-full"></div>
                    </div>

                    {/* QR Code */}
                    <div className="text-center">
                        <p className="text-sm text-lgray-dark mb-3">Show this QR code at the museum entrance</p>
                        <div className="inline-block p-3 bg-white rounded-xl border-2 border-navy/10 shadow-sm">
                            <QRCodeSVG value={ticketQR} size={160} fgColor="#0B1F3A" level="H" />
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="mt-6 bg-gold/10 rounded-xl p-4 flex justify-between items-center">
                        <span className="text-navy font-medium">Amount Paid</span>
                        <span className="text-2xl font-bold text-gold">₹{booking.totalAmount?.toLocaleString()}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                    <button className="btn-gold flex items-center gap-2">
                        <FaDownload /> Download Ticket
                    </button>
                    <Link to="/" className="btn-outline flex items-center gap-2">
                        <FaHome /> Back to Home
                    </Link>
                </div>

                {/* Guidelines */}
                <div className="mt-8 admin-card">
                    <h3 className="font-heading font-bold text-navy mb-3">Important Information</h3>
                    <ul className="space-y-2 text-sm text-lgray-dark">
                        <li>• Please arrive 15 minutes before your time slot</li>
                        <li>• Carry a valid photo ID along with this e-ticket</li>
                        <li>• Cancellation is free up to 24 hours before visit</li>
                        <li>• For queries, contact: support@museumpass.in</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
