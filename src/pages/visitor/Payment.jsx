import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { FaShieldAlt, FaClock, FaCheckCircle } from 'react-icons/fa';

export default function Payment() {
    const location = useLocation();
    const navigate = useNavigate();
    const bookingDetails = location.state;
    const [timeLeft, setTimeLeft] = useState(300); // 5 min timer
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!bookingDetails) {
            navigate('/museums');
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [bookingDetails, navigate]);

    if (!bookingDetails) return null;

    const museumName = bookingDetails.museumName || 'Museum';
    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    function handlePayment() {
        setProcessing(true);
        setTimeout(() => {
            navigate('/confirmation', { state: bookingDetails });
        }, 2000);
    }

    const qrData = JSON.stringify({
        id: bookingDetails.bookingId,
        amount: bookingDetails.totalAmount,
        museum: museumName,
        upi: `museumpass@upi`,
    });

    return (
        <div className="min-h-screen bg-soft-white pt-20">
            <div className="bg-gradient-hero py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-soft-white mb-2">
                        Secure <span className="text-gradient-gold">Payment</span>
                    </h1>
                    <p className="text-lgray">Complete your payment to confirm booking at <strong>{museumName}</strong></p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="grid md:grid-cols-5 gap-6">
                    {/* QR Code Section */}
                    <div className="md:col-span-3 admin-card text-center">
                        <div className="mb-4">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${timeLeft > 60 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                                }`}>
                                <FaClock />
                                Time remaining: {formatTime(timeLeft)}
                            </div>
                        </div>

                        <div className="inline-block p-4 bg-white rounded-2xl shadow-lg border-2 border-gold/20 mb-6">
                            <QRCodeSVG
                                value={qrData}
                                size={200}
                                bgColor="#FFFFFF"
                                fgColor="#0B1F3A"
                                level="H"
                                includeMargin={true}
                            />
                        </div>

                        <p className="text-sm text-lgray-dark mb-6">
                            Scan this QR code with any UPI app to complete payment
                        </p>

                        <div className="text-3xl font-bold text-navy mb-6">
                            ₹{bookingDetails.totalAmount?.toLocaleString()}
                        </div>

                        {/* Payment Methods */}
                        <div className="flex justify-center gap-3 mb-6">
                            {['UPI', 'Card', 'Net Banking'].map((method) => (
                                <span
                                    key={method}
                                    className="px-3 py-1.5 bg-lgray/30 rounded-lg text-xs font-medium text-navy"
                                >
                                    {method}
                                </span>
                            ))}
                        </div>

                        {/* Demo Pay Button */}
                        <button
                            onClick={handlePayment}
                            disabled={processing || timeLeft === 0}
                            className="btn-gold w-full text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {processing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-navy/40 border-t-navy rounded-full animate-spin" />
                                    Processing Payment...
                                </>
                            ) : timeLeft === 0 ? (
                                'Session Expired'
                            ) : (
                                <>
                                    <FaCheckCircle /> Complete Payment (Demo)
                                </>
                            )}
                        </button>

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-lgray-dark">
                            <FaShieldAlt className="text-green-500" />
                            Secured by 256-bit SSL encryption
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="md:col-span-2 admin-card h-fit">
                        <h3 className="font-heading font-bold text-navy mb-4">Order Summary</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-lgray/30">
                                <span className="text-lgray-dark">Booking ID</span>
                                <span className="font-mono font-medium text-navy">{bookingDetails.bookingId}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-lgray/30">
                                <span className="text-lgray-dark">Museum</span>
                                <span className="font-medium text-navy">{museumName}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-lgray/30">
                                <span className="text-lgray-dark">Date</span>
                                <span className="font-medium text-navy">{bookingDetails.date}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-lgray/30">
                                <span className="text-lgray-dark">Time Slot</span>
                                <span className="font-medium text-navy">{bookingDetails.timeSlotLabel}</span>
                            </div>
                            {bookingDetails.breakdown ? (
                                bookingDetails.breakdown.map((item, idx) => (
                                    <div key={idx} className="flex justify-between py-2 border-b border-lgray/30">
                                        <span className="text-lgray-dark">{item.category} Tickets</span>
                                        <span className="font-medium text-navy">{item.quantity} <span className="text-xs text-lgray-dark ml-1">(₹{item.price * item.quantity})</span></span>
                                    </div>
                                ))
                            ) : bookingDetails.category && (
                                <div className="flex justify-between py-2 border-b border-lgray/30">
                                    <span className="text-lgray-dark">Category</span>
                                    <span className="font-medium text-navy">{bookingDetails.category}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2 border-b border-lgray/30">
                                <span className="text-lgray-dark">Mobile</span>
                                <span className="font-medium text-navy">{bookingDetails.mobile}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-lgray/30">
                                <span className="text-lgray-dark">Email</span>
                                <span className="font-medium text-navy">{bookingDetails.email}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-lgray/30">
                                <span className="text-lgray-dark">Total Tickets</span>
                                <span className="font-medium text-navy">{bookingDetails.totalTickets}</span>
                            </div>
                            <div className="flex justify-between py-3 bg-navy/5 rounded-xl px-3 mt-2">
                                <span className="font-bold text-navy">Total</span>
                                <span className="font-bold text-gold text-lg">₹{bookingDetails.totalAmount?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
