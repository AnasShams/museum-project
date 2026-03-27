import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaComments, FaTimes, FaPaperPlane, FaRobot, FaUser, FaMinus } from 'react-icons/fa';

const RASA_API_URL = '/api/rasa/webhooks/rest/webhook';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateValue, setDateValue] = useState('');
    const [sessionId] = useState(() => 'user_' + Date.now().toString(36));
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Date limits
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    async function sendToRasa(message) {
        try {
            const response = await fetch(RASA_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: sessionId,
                    message: message,
                }),
            });

            if (!response.ok) throw new Error('Rasa API error');
            const data = await response.json();
            return data; // Array of {recipient_id, text, buttons, custom}
        } catch (error) {
            console.error('Rasa API error:', error);
            return [{
                text: '⚠️ Connection error. Please make sure the Rasa server is running.\n\nStart it with:\nrasa run --enable-api --cors "*"',
            }];
        }
    }

    async function openChat() {
        setIsOpen(true);
        setIsMinimized(false);
        if (messages.length === 0) {
            setIsTyping(true);
            // Send initial greeting trigger to Rasa
            const responses = await sendToRasa('/greet');
            setIsTyping(false);
            const botMsgs = responses.map((r, i) => parseRasaResponse(r, i));
            setMessages(botMsgs);
        }
    }

    function closeChat() {
        setIsOpen(false);
    }

    function parseRasaResponse(response, index = 0) {
        const msg = {
            text: response.text || '',
            isBot: true,
            id: Date.now() + index + Math.random(),
        };

        // Convert Rasa buttons to quickReplies format
        if (response.buttons && response.buttons.length > 0) {
            msg.quickReplies = response.buttons.map(btn => ({
                text: btn.title,
                value: btn.payload,
            }));
        }

        // Handle custom payloads from Rasa actions
        if (response.custom) {
            if (response.custom.type === 'date_input') {
                msg.showDatePicker = true;
            }
            if (response.custom.type === 'redirect_payment') {
                msg.action = 'REDIRECT_PAYMENT';
                msg.bookingData = response.custom.data;
            }
            if (response.custom.type === 'booking_summary') {
                msg.bookingData = response.custom.data;
            }
        }

        return msg;
    }

    async function sendMessage(text, displayTitle = null) {
        if (!text.trim()) return;
        const userMsg = { text: displayTitle || text.trim(), isBot: false, id: Date.now() + Math.random() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setShowDatePicker(false);
        setDateValue('');
        setIsTyping(true);

        const responses = await sendToRasa(text.trim());
        setIsTyping(false);

        const botMsgs = responses.map((r, i) => parseRasaResponse(r, i));
        setMessages(prev => [...prev, ...botMsgs]);

        // Show date picker if any message has the flag
        const dateMsg = botMsgs.find(m => m.showDatePicker);
        if (dateMsg) setShowDatePicker(true);

        // Handle payment redirect
        const paymentMsg = botMsgs.find(m => m.action === 'REDIRECT_PAYMENT');
        if (paymentMsg && paymentMsg.bookingData) {
            setTimeout(() => {
                navigate('/payment', {
                    state: {
                        museumName: paymentMsg.bookingData.museumName,
                        museumId: paymentMsg.bookingData.museumId,
                        date: paymentMsg.bookingData.date,
                        timeSlotLabel: paymentMsg.bookingData.timeSlot,
                        category: paymentMsg.bookingData.category,
                        breakdown: paymentMsg.bookingData.breakdown,
                        totalTickets: paymentMsg.bookingData.quantity,
                        totalAmount: paymentMsg.bookingData.total,
                        mobile: paymentMsg.bookingData.mobile,
                        email: paymentMsg.bookingData.email,
                        bookingId: 'BK' + Date.now().toString().slice(-6),
                    },
                });
            }, 1500);
        }
    }

    function handleQuickReply(qr) {
        sendMessage(qr.value, qr.text);
    }

    function handleSubmit(e) {
        e.preventDefault();
        sendMessage(input);
    }

    function handleDateSelect() {
        if (dateValue) {
            sendMessage(dateValue);
        }
    }

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={openChat}
                    className="fixed bottom-6 right-6 z-[999] w-16 h-16 bg-gold rounded-full flex items-center justify-center shadow-2xl shadow-gold/30 hover:scale-110 hover:shadow-gold/50 active:scale-95 transition-all duration-300 group cursor-pointer"
                >
                    <FaComments className="text-navy text-2xl group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
                        AI
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className={`fixed bottom-6 right-6 z-[999] w-[380px] max-w-[calc(100vw-2rem)] transition-all duration-500 animate-slide-up ${isMinimized ? 'h-14' : 'h-[600px] max-h-[calc(100vh-3rem)]'
                    } flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-royal/30`}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-navy to-royal px-4 py-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gold rounded-xl flex items-center justify-center">
                                <FaRobot className="text-navy text-sm" />
                            </div>
                            <div>
                                <h3 className="text-soft-white font-bold text-sm">MuseumPass AI Assistant</h3>
                                <p className="text-green-400 text-[10px] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    Powered by Rasa NLP
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="w-8 h-8 rounded-lg text-lgray hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <FaMinus size={12} />
                            </button>
                            <button
                                onClick={closeChat}
                                className="w-8 h-8 rounded-lg text-lgray hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <FaTimes size={14} />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.map((msg) => (
                                    <div key={msg.id}>
                                        <div className={`flex items-end gap-2 ${msg.isBot ? '' : 'flex-row-reverse'}`}>
                                            {msg.isBot && (
                                                <div className="w-7 h-7 bg-royal rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <FaRobot className="text-white text-xs" />
                                                </div>
                                            )}
                                            <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${msg.isBot
                                                ? 'bg-royal text-white rounded-bl-md'
                                                : 'bg-lgray text-navy rounded-br-md'
                                                }`}>
                                                {msg.text}
                                            </div>
                                            {!msg.isBot && (
                                                <div className="w-7 h-7 bg-lgray rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <FaUser className="text-navy text-xs" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Quick Replies (from Rasa buttons) */}
                                        {msg.isBot && msg.quickReplies && (
                                            <div className="mt-2 ml-9 flex flex-wrap gap-1.5">
                                                {msg.quickReplies.map((qr, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleQuickReply(qr)}
                                                        className="px-3 py-1.5 bg-white border border-royal/30 rounded-full text-xs text-royal font-medium hover:bg-royal hover:text-white transition-all duration-300 cursor-pointer"
                                                    >
                                                        {qr.text}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {isTyping && (
                                    <div className="flex items-end gap-2">
                                        <div className="w-7 h-7 bg-royal rounded-lg flex items-center justify-center">
                                            <FaRobot className="text-white text-xs" />
                                        </div>
                                        <div className="bg-royal/10 px-4 py-3 rounded-2xl rounded-bl-md">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-royal/50 rounded-full animate-typing"></span>
                                                <span className="w-2 h-2 bg-royal/50 rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></span>
                                                <span className="w-2 h-2 bg-royal/50 rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Date Picker (shown when booking asks for date) */}
                            {showDatePicker && (
                                <div className="p-3 bg-gold/10 border-t border-gold/30 flex gap-2 flex-shrink-0">
                                    <input
                                        type="date"
                                        value={dateValue}
                                        min={minDate}
                                        max={maxDateStr}
                                        onChange={(e) => setDateValue(e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-gold/50 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all"
                                    />
                                    <button
                                        onClick={handleDateSelect}
                                        disabled={!dateValue}
                                        className="px-4 py-2 bg-gold rounded-xl text-navy text-sm font-medium hover:bg-gold-light transition-all disabled:opacity-30 cursor-pointer"
                                    >
                                        Select
                                    </button>
                                </div>
                            )}

                            {/* Text Input */}
                            <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-lgray/50 flex gap-2 flex-shrink-0">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-lgray/50 text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 focus:border-royal transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-navy hover:bg-gold-light active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
                                >
                                    <FaPaperPlane size={14} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
