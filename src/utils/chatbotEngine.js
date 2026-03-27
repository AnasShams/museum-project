import { chatbotResponses } from '../data/chatbotResponses';
import { museums } from '../data/mockMuseumInfo';

const STATES = {
    INIT: 'INIT',
    LANGUAGE_SELECT: 'LANGUAGE_SELECT',
    MUSEUM_SELECT: 'MUSEUM_SELECT',
    MAIN_MENU: 'MAIN_MENU',
    BOOKING_DATE: 'BOOKING_DATE',
    BOOKING_SLOT: 'BOOKING_SLOT',
    BOOKING_CATEGORY: 'BOOKING_CATEGORY',
    BOOKING_QUANTITY: 'BOOKING_QUANTITY',
    BOOKING_CONFIRM: 'BOOKING_CONFIRM',
    INFO_MENU: 'INFO_MENU',
    FAQ_MENU: 'FAQ_MENU',
};

export function createChatbotEngine() {
    let state = STATES.INIT;
    let language = 'en';
    let bookingData = {};
    let selectedMuseum = null;

    function getSelectedMuseum() {
        return selectedMuseum || museums[0];
    }

    function getResponses() {
        return chatbotResponses[language] || chatbotResponses.en;
    }

    // Validate a date string: must be YYYY-MM-DD, not in the past, not >30 days away
    function validateDate(dateStr) {
        const dateRegex = /(\d{4}-\d{2}-\d{2})/;
        const match = dateStr.match(dateRegex);
        if (!match) return { valid: false, error: 'Please enter a valid date in YYYY-MM-DD format.\nExample: 2026-03-15' };

        const date = new Date(match[0] + 'T00:00:00');
        if (isNaN(date.getTime())) return { valid: false, error: 'Invalid date. Please enter a valid date.\nExample: 2026-03-15' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date < tomorrow) return { valid: false, error: '❌ Date must be at least tomorrow. Please choose a future date.' };

        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 30);
        if (date > maxDate) return { valid: false, error: '❌ Date must be within the next 30 days. Please choose an earlier date.' };

        return { valid: true, date: match[0] };
    }

    function getQuickReplies() {
        switch (state) {
            case STATES.INIT:
            case STATES.LANGUAGE_SELECT:
                return [
                    { text: 'English', value: 'lang_en' },
                    { text: 'हिंदी', value: 'lang_hi' },
                    { text: 'বাংলা', value: 'lang_bn' },
                    { text: 'தமிழ்', value: 'lang_ta' },
                    { text: 'తెలుగు', value: 'lang_te' },
                    { text: 'मराठी', value: 'lang_mr' },
                    { text: 'ગુજરાતી', value: 'lang_gu' },
                    { text: 'ಕನ್ನಡ', value: 'lang_kn' },
                    { text: 'മലയാളം', value: 'lang_ml' },
                    { text: 'ਪੰਜਾਬੀ', value: 'lang_pa' },
                    { text: 'ଓଡ଼ିଆ', value: 'lang_or' },
                    { text: 'অসমীয়া', value: 'lang_as' },
                    { text: 'اردو', value: 'lang_ur' },
                ];
            case STATES.MUSEUM_SELECT:
                return museums.map((m, i) => ({
                    text: `${m.emoji} ${m.shortName}`,
                    value: `museum_${i}`,
                }));
            case STATES.MAIN_MENU:
                return [
                    { text: '🎫 Book Tickets', value: 'book' },
                    { text: 'ℹ️ Museum Info', value: 'info' },
                    { text: '❓ FAQs', value: 'faq' },
                    { text: '📞 Contact', value: 'contact' },
                    { text: '🔄 Change Museum', value: 'change_museum' },
                ];
            case STATES.BOOKING_DATE:
                return [{ text: '🔙 Back to Menu', value: 'back' }];
            case STATES.BOOKING_SLOT:
                return [
                    ...getSelectedMuseum().timeSlots.map((slot, i) => ({
                        text: `🕐 ${slot.time}`,
                        value: `slot_${i + 1}`,
                    })),
                    { text: '🔙 Back', value: 'back' },
                ];
            case STATES.BOOKING_CATEGORY:
                return [
                    ...getSelectedMuseum().ticketCategories.map((cat, i) => ({
                        text: `${cat.name} - ₹${cat.price}`,
                        value: `cat_${i + 1}`,
                    })),
                    { text: '🔙 Back', value: 'back' },
                ];
            case STATES.BOOKING_QUANTITY:
                return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => ({
                    text: `${n}`,
                    value: `qty_${n}`,
                }));
            case STATES.BOOKING_CONFIRM:
                return [
                    { text: '✅ Confirm & Pay', value: 'confirm_yes' },
                    { text: '❌ Cancel', value: 'confirm_no' },
                ];
            case STATES.INFO_MENU:
                return [
                    { text: '🏛️ History', value: 'info_history' },
                    { text: '🖼️ Galleries', value: 'info_galleries' },
                    { text: '🕐 Hours', value: 'info_hours' },
                    { text: '📋 Rules', value: 'info_rules' },
                    { text: '🎪 Events', value: 'info_events' },
                    { text: '📍 Location', value: 'info_location' },
                    { text: '🔙 Back', value: 'back' },
                ];
            case STATES.FAQ_MENU:
                return [
                    { text: '❌ Cancel Booking?', value: 'faq_cancel' },
                    { text: '🅿️ Parking?', value: 'faq_parking' },
                    { text: '♿ Wheelchair?', value: 'faq_wheelchair' },
                    { text: '☕ Cafe?', value: 'faq_cafe' },
                    { text: '🗣️ Guided Tour?', value: 'faq_guide' },
                    { text: '🔙 Back', value: 'back' },
                ];
            default:
                return [{ text: '🔙 Main Menu', value: 'back' }];
        }
    }

    function processMessage(input) {
        const r = getResponses();
        const text = input.toLowerCase().trim();

        // Handle back/menu at any point
        if (text === 'back' || text === 'menu' || text === 'main menu' || text === '🔙 back to menu') {
            state = STATES.MAIN_MENU;
            return [{ text: r.mainMenu, quickReplies: getQuickReplies() }];
        }

        switch (state) {
            case STATES.INIT:
                state = STATES.LANGUAGE_SELECT;
                return [{
                    text: "🇮🇳 Welcome to MuseumPass Bangalore!\n\nPlease select your language / कृपया अपनी भाषा चुनें / ದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ:",
                    quickReplies: getQuickReplies(),
                }];

            case STATES.LANGUAGE_SELECT: {
                const langMap = {
                    lang_en: 'en', lang_hi: 'hi', lang_bn: 'bn', lang_ta: 'ta',
                    lang_te: 'te', lang_mr: 'mr', lang_gu: 'gu', lang_kn: 'kn',
                    lang_ml: 'ml', lang_pa: 'pa', lang_or: 'or', lang_as: 'as',
                    lang_ur: 'ur',
                };
                if (langMap[text]) {
                    language = langMap[text];
                } else if (text.includes('english') || text.includes('en')) {
                    language = 'en';
                } else if (text.includes('hindi') || text.includes('हिंदी')) {
                    language = 'hi';
                } else if (text.includes('bengali') || text.includes('bangla') || text.includes('বাংলা')) {
                    language = 'bn';
                } else if (text.includes('tamil') || text.includes('தமிழ்')) {
                    language = 'ta';
                } else if (text.includes('telugu') || text.includes('తెలుగు')) {
                    language = 'te';
                } else if (text.includes('marathi') || text.includes('मराठी')) {
                    language = 'mr';
                } else if (text.includes('gujarati') || text.includes('ગુજરાતી')) {
                    language = 'gu';
                } else if (text.includes('kannada') || text.includes('ಕನ್ನಡ')) {
                    language = 'kn';
                } else if (text.includes('malayalam') || text.includes('മലയാളം')) {
                    language = 'ml';
                } else if (text.includes('punjabi') || text.includes('ਪੰਜਾਬੀ')) {
                    language = 'pa';
                } else if (text.includes('odia') || text.includes('ଓଡ଼ିଆ')) {
                    language = 'or';
                } else if (text.includes('assamese') || text.includes('অসমীয়া')) {
                    language = 'as';
                } else if (text.includes('urdu') || text.includes('اردو')) {
                    language = 'ur';
                } else {
                    language = 'en';
                }
                state = STATES.MUSEUM_SELECT;
                const rr = getResponses();
                return [
                    { text: rr.languageSelected },
                    { text: rr.greeting },
                    { text: "🏛️ Please select a museum:", quickReplies: getQuickReplies() },
                ];
            }

            case STATES.MUSEUM_SELECT: {
                let museumIdx = -1;
                if (text.startsWith('museum_')) {
                    museumIdx = parseInt(text.split('_')[1]);
                } else {
                    museumIdx = museums.findIndex(m =>
                        text.includes(m.shortName.toLowerCase()) || text.includes(m.name.toLowerCase())
                    );
                }
                if (museumIdx >= 0 && museumIdx < museums.length) {
                    selectedMuseum = museums[museumIdx];
                } else {
                    return [{ text: "⚠️ Museum not found. Please select from the options:", quickReplies: getQuickReplies() }];
                }
                const r2 = getResponses();
                state = STATES.MAIN_MENU;
                return [
                    { text: `✅ ${selectedMuseum.emoji} **${selectedMuseum.shortName}** selected!` },
                    { text: r2.mainMenu, quickReplies: getQuickReplies() },
                ];
            }

            case STATES.MAIN_MENU:
                if (text.includes('book') || text === 'book' || text === '1' || text === 'ticket') {
                    state = STATES.BOOKING_DATE;
                    bookingData = { museumName: getSelectedMuseum().shortName, museumId: getSelectedMuseum().id };
                    return [{
                        text: r.booking.selectDate,
                        showDatePicker: true,
                        quickReplies: getQuickReplies(),
                    }];
                } else if (text.includes('info') || text === 'info' || text === '2' || text === 'museum') {
                    state = STATES.INFO_MENU;
                    const museum = getSelectedMuseum();
                    return [
                        { text: `${museum.emoji} **${museum.shortName}**\n${museum.tagline}` },
                        { text: r.info?.menu || "What would you like to know?", quickReplies: getQuickReplies() },
                    ];
                } else if (text.includes('faq') || text === 'faq' || text === '3' || text === 'question') {
                    state = STATES.FAQ_MENU;
                    return [{ text: r.faq?.menu || "Frequently Asked Questions:", quickReplies: getQuickReplies() }];
                } else if (text.includes('contact') || text === 'contact' || text === '4') {
                    const museum = getSelectedMuseum();
                    const contactMsg = `📍 **${museum.shortName}**\n\n📌 ${museum.contact.address}\n📞 ${museum.contact.phone}${museum.contact.email ? '\n📧 ' + museum.contact.email : ''}${museum.contact.website ? '\n🌐 ' + museum.contact.website : ''}`;
                    return [
                        { text: contactMsg },
                        { text: r.mainMenu, quickReplies: getQuickReplies() },
                    ];
                } else if (text.includes('change') || text === 'change_museum') {
                    state = STATES.MUSEUM_SELECT;
                    return [{ text: "🏛️ Select a different museum:", quickReplies: getQuickReplies() }];
                } else if (text.includes('thank') || text.includes('bye')) {
                    state = STATES.INIT;
                    return [{ text: r.thanks }];
                }
                return [{ text: r.fallback, quickReplies: getQuickReplies() }];

            case STATES.BOOKING_DATE: {
                const validation = validateDate(text);
                if (validation.valid) {
                    bookingData.date = validation.date;
                    state = STATES.BOOKING_SLOT;
                    return [
                        { text: r.booking.dateConfirmed(bookingData.date) },
                        { text: r.booking.selectTimeSlot, quickReplies: getQuickReplies() },
                    ];
                }
                return [{
                    text: validation.error,
                    showDatePicker: true,
                    quickReplies: getQuickReplies(),
                }];
            }

            case STATES.BOOKING_SLOT: {
                const curMuseum = getSelectedMuseum();
                let slotIndex = -1;
                if (text.startsWith('slot_')) {
                    slotIndex = parseInt(text.split('_')[1]) - 1;
                } else {
                    const num = parseInt(text);
                    if (num >= 1 && num <= curMuseum.timeSlots.length) slotIndex = num - 1;
                }
                if (slotIndex >= 0 && slotIndex < curMuseum.timeSlots.length) {
                    bookingData.timeSlot = curMuseum.timeSlots[slotIndex].time;
                    state = STATES.BOOKING_CATEGORY;
                    return [
                        { text: r.booking.slotConfirmed(bookingData.timeSlot) },
                        { text: r.booking.selectCategory, quickReplies: getQuickReplies() },
                    ];
                }
                return [{ text: r.booking.selectTimeSlot, quickReplies: getQuickReplies() }];
            }

            case STATES.BOOKING_CATEGORY: {
                const curMuseum2 = getSelectedMuseum();
                let catIndex = -1;
                if (text.startsWith('cat_')) {
                    catIndex = parseInt(text.split('_')[1]) - 1;
                } else {
                    const num = parseInt(text);
                    if (num >= 1 && num <= curMuseum2.ticketCategories.length) catIndex = num - 1;
                }
                if (catIndex >= 0 && catIndex < curMuseum2.ticketCategories.length) {
                    bookingData.category = curMuseum2.ticketCategories[catIndex].name;
                    bookingData.price = curMuseum2.ticketCategories[catIndex].price;
                    state = STATES.BOOKING_QUANTITY;
                    return [
                        { text: r.booking.categoryConfirmed(bookingData.category) },
                        { text: r.booking.selectQuantity, quickReplies: getQuickReplies() },
                    ];
                }
                return [{ text: r.booking.selectCategory, quickReplies: getQuickReplies() }];
            }

            case STATES.BOOKING_QUANTITY: {
                let qty = 0;
                if (text.startsWith('qty_')) {
                    qty = parseInt(text.split('_')[1]);
                } else {
                    qty = parseInt(text);
                }
                if (qty >= 1 && qty <= 10) {
                    bookingData.quantity = qty;
                    bookingData.total = qty * bookingData.price;
                    state = STATES.BOOKING_CONFIRM;

                    const summaryText = `📋 **Booking Summary**\n\n🏛️ Museum: ${bookingData.museumName}\n📅 Date: ${bookingData.date}\n🕐 Time: ${bookingData.timeSlot}\n🎫 Category: ${bookingData.category}\n👥 Quantity: ${bookingData.quantity}\n💰 Total: ₹${bookingData.total.toLocaleString()}\n\n${r.booking.summary ? r.booking.summary(bookingData) : 'Confirm your booking?'}`;

                    return [{
                        text: summaryText,
                        quickReplies: getQuickReplies(),
                    }];
                }
                return [{ text: r.booking.selectQuantity, quickReplies: getQuickReplies() }];
            }

            case STATES.BOOKING_CONFIRM:
                if (text.includes('yes') || text === 'confirm_yes' || text === '1' || text.includes('confirm') || text.includes('pay')) {
                    state = STATES.MAIN_MENU;
                    return [{
                        text: r.booking.paymentRedirect || "🔄 Redirecting to payment...",
                        action: 'REDIRECT_PAYMENT',
                        bookingData: { ...bookingData },
                    }];
                } else {
                    state = STATES.MAIN_MENU;
                    bookingData = {};
                    return [
                        { text: r.booking.cancelled },
                        { text: r.mainMenu, quickReplies: getQuickReplies() },
                    ];
                }

            case STATES.INFO_MENU: {
                const infoMuseum = getSelectedMuseum();
                if (text.includes('history') || text === '1' || text === 'info_history') {
                    return [{ text: `🏛️ **${infoMuseum.shortName} — History**\n\n${infoMuseum.history}`, quickReplies: getQuickReplies() }];
                } else if (text.includes('galler') || text.includes('exhibit') || text === '2' || text === 'info_galleries') {
                    const galleryText = infoMuseum.galleries
                        .map(g => `${g.image} **${g.name}**\n${g.description}${g.items > 0 ? '\n📊 ' + g.items.toLocaleString() + ' exhibits' : ''}`)
                        .join('\n\n');
                    return [{ text: `🖼️ **Galleries & Exhibits**\n\n${galleryText}`, quickReplies: getQuickReplies() }];
                } else if (text.includes('hour') || text === '3' || text === 'info_hours') {
                    let hoursText = `🕐 **Visiting Hours**\n\n📅 Weekdays: ${infoMuseum.visitingHours.regular}\n📅 Weekends: ${infoMuseum.visitingHours.weekend}\n🚫 Closed: ${infoMuseum.visitingHours.closed}\n⏰ Last Entry: ${infoMuseum.visitingHours.lastEntry}`;
                    if (infoMuseum.visitingHours.specialNote) hoursText += `\n📌 ${infoMuseum.visitingHours.specialNote}`;
                    return [{ text: hoursText, quickReplies: getQuickReplies() }];
                } else if (text.includes('rule') || text === '4' || text === 'info_rules') {
                    return [{ text: `📋 **Museum Rules**\n\n${infoMuseum.rules.map(rule => '• ' + rule).join('\n')}`, quickReplies: getQuickReplies() }];
                } else if (text.includes('event') || text === '5' || text === 'info_events') {
                    const eventText = infoMuseum.events
                        .map(e => `🎪 **${e.title}**\n📅 ${e.date} | ⏰ ${e.time}\n${e.description}\n💰 ${e.price}`)
                        .join('\n\n');
                    return [{ text: `🎪 **Upcoming Events**\n\n${eventText}`, quickReplies: getQuickReplies() }];
                } else if (text.includes('location') || text.includes('contact') || text === '6' || text === 'info_location') {
                    return [{ text: `📍 **Location & Contact**\n\n📌 ${infoMuseum.contact.address}\n📞 ${infoMuseum.contact.phone}${infoMuseum.contact.email ? '\n📧 ' + infoMuseum.contact.email : ''}${infoMuseum.contact.website ? '\n🌐 ' + infoMuseum.contact.website : ''}`, quickReplies: getQuickReplies() }];
                }
                state = STATES.MAIN_MENU;
                return [{ text: r.mainMenu, quickReplies: getQuickReplies() }];
            }

            case STATES.FAQ_MENU:
                if (text.includes('cancel') || text === '1' || text === 'faq_cancel') {
                    return [{ text: r.faq.cancel, quickReplies: getQuickReplies() }];
                } else if (text.includes('parking') || text === '2' || text === 'faq_parking') {
                    return [{ text: r.faq.parking, quickReplies: getQuickReplies() }];
                } else if (text.includes('wheelchair') || text === '3' || text === 'faq_wheelchair') {
                    return [{ text: r.faq.wheelchair, quickReplies: getQuickReplies() }];
                } else if (text.includes('cafe') || text === '4' || text === 'faq_cafe') {
                    return [{ text: r.faq.cafe, quickReplies: getQuickReplies() }];
                } else if (text.includes('guide') || text.includes('tour') || text === '5' || text === 'faq_guide') {
                    return [{ text: r.faq.guidedTour, quickReplies: getQuickReplies() }];
                }
                state = STATES.MAIN_MENU;
                return [{ text: r.mainMenu, quickReplies: getQuickReplies() }];

            default:
                state = STATES.MAIN_MENU;
                return [{ text: r.fallback, quickReplies: getQuickReplies() }];
        }
    }

    function getInitialMessages() {
        state = STATES.LANGUAGE_SELECT;
        return [{
            text: "🇮🇳 Welcome to MuseumPass Bangalore!\n\nYour smart ticket booking assistant for Bangalore's finest museums.\n\nPlease select your language / कृपया अपनी भाषा चुनें / ದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ:",
            quickReplies: getQuickReplies(),
            isBot: true,
        }];
    }

    function getBookingData() {
        return { ...bookingData };
    }

    function getCurrentLanguage() {
        return language;
    }

    return {
        processMessage,
        getInitialMessages,
        getQuickReplies,
        getBookingData,
        getCurrentLanguage,
    };
}
