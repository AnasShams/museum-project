"""
Custom Actions for MuseumPass Bangalore Chatbot
Handles museum data lookup, booking logic, and payment redirect.
"""

from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, AllSlotsReset, FollowupAction
from datetime import datetime, timedelta
import json
import re

# ============================================================
# Translation Helper
# ============================================================

LANG_MAP = {
    "en": "english", "hi": "hindi", "kn": "kannada", "ta": "tamil",
    "te": "telugu", "bn": "bengali", "mr": "marathi", "gu": "gujarati",
    "ml": "malayalam", "pa": "punjabi", "or": "odia", "as": "assamese",
    "ur": "urdu"
}

_translation_cache = {}

def translate_text(text, lang_code):
    """Translate text to the target language. Returns original if English or on error."""
    if not lang_code or lang_code == "en" or lang_code not in LANG_MAP:
        return text
    
    cache_key = (text, lang_code)
    if cache_key in _translation_cache:
        return _translation_cache[cache_key]
    
    try:
        from deep_translator import GoogleTranslator
        translated = GoogleTranslator(source='en', target=lang_code).translate(text)
        if translated:
            _translation_cache[cache_key] = translated
            return translated
    except Exception as e:
        print(f"Translation error: {e}")
    return text

def t(tracker, text):
    """Shorthand: translate text using the tracker's language slot."""
    lang = tracker.get_slot("language") or "en"
    return translate_text(text, lang)

# ============================================================
# Museum Data (matches frontend mockMuseumInfo.js)
# ============================================================

MUSEUMS = {
    "visvesvaraya": {
        "id": "visvesvaraya",
        "name": "Visvesvaraya Industrial & Technological Museum",
        "shortName": "Visvesvaraya Museum",
        "location": "Kasturba Road, Bangalore - 560001",
        "phone": "+91-80-2286-4563",
        "email": "info@vismuseum.gov.in",
        "history": "Founded in 1962, the Visvesvaraya Industrial and Technological Museum is named after Sir M. Visvesvaraya, the renowned engineer and former Diwan of Mysore. The museum houses over 500 exhibits across 7 galleries, covering topics from space exploration to biotechnology. It has welcomed over 30 million visitors since its inception.",
        "hours": "Tuesday to Sunday: 9:30 AM - 6:00 PM\nClosed: Monday\nLast Entry: 5:00 PM\nPublic Holidays: 9:30 AM - 6:00 PM",
        "rules": "Photography allowed in designated areas only (no flash)\nNo food or beverages inside galleries\nMaintain silence in exhibition areas\nChildren under 12 must be accompanied by adults\nLarge bags must be deposited at cloakroom\nDo not touch exhibits",
        "galleries": [
            {"name": "Engine Hall", "desc": "Steam engines, motors, and mechanical marvels"},
            {"name": "Space Gallery", "desc": "Space exploration, satellites, and rockets"},
            {"name": "Electrotechnic Gallery", "desc": "Electricity, magnetism, and electronics"},
            {"name": "Fun Science Gallery", "desc": "Interactive science experiments for all ages"},
            {"name": "Dinosaurium", "desc": "Life-size dinosaur models and prehistoric exhibits"},
            {"name": "Wright Brothers Gallery", "desc": "Aviation history and aircraft models"},
            {"name": "Biotechnology Gallery", "desc": "DNA, genetics, and biotech innovations"}
        ],
        "events": [
            {"name": "Science Day Celebration", "date": "Feb 28, 2026", "desc": "Interactive science demos and workshops"},
            {"name": "Robotics Workshop", "date": "Every Saturday", "desc": "Hands-on robotics for kids aged 8-14"},
            {"name": "Night at the Museum", "date": "Mar 15, 2026", "desc": "Special evening tour with light shows"}
        ],
        "ticketPrices": {"Adult": 300, "Child": 100, "Senior Citizen": 150, "Student": 150, "Foreign National": 650}
    },
    "govt-museum": {
        "id": "govt-museum",
        "name": "Government Museum Bangalore",
        "shortName": "Government Museum",
        "location": "Kasturba Road, Bangalore - 560001",
        "phone": "+91-80-2286-4483",
        "email": "info@govtmuseumblr.gov.in",
        "history": "One of the oldest museums in India, established in 1865 by the British. It spans 18 galleries and houses over 12,000 artifacts including geological specimens, art, and archaeological finds from the Indus Valley Civilization.",
        "hours": "Tuesday to Sunday: 10:00 AM - 5:00 PM\nClosed: Monday & Public Holidays\nLast Entry: 4:30 PM",
        "rules": "Photography with prior permission only\nNo touching artifacts\nSilence in galleries\nChildren under 10 must be accompanied",
        "galleries": [
            {"name": "Archaeology Gallery", "desc": "Artifacts from Mohenjodaro and Harappa"},
            {"name": "Art Gallery", "desc": "Paintings from Mysore, Tanjore, and Deccan"},
            {"name": "Geology Gallery", "desc": "Rare minerals and geological specimens"},
            {"name": "Numismatics Gallery", "desc": "Ancient coins from various Indian kingdoms"}
        ],
        "events": [
            {"name": "Heritage Walk", "date": "Every Sunday", "desc": "Guided heritage walk through museum grounds"},
            {"name": "Coin Exhibition", "date": "Apr 2026", "desc": "Special exhibition of rare Indian coins"}
        ],
        "ticketPrices": {"Adult": 300, "Child": 100, "Senior Citizen": 150, "Student": 150, "Foreign National": 650}
    },
    "hal-aerospace": {
        "id": "hal-aerospace",
        "name": "HAL Heritage Centre & Aerospace Museum",
        "shortName": "HAL Aerospace Museum",
        "location": "HAL Airport Road, Bangalore - 560017",
        "phone": "+91-80-2522-0649",
        "email": "museum@hal-india.com",
        "history": "Established in 2001 by Hindustan Aeronautics Limited, this museum showcases India's aviation journey. It features real aircraft, engines, flight simulators, and the history of Indian aerospace defense spanning over 80 years.",
        "hours": "All days: 9:00 AM - 5:00 PM\nClosed: Major national holidays\nLast Entry: 4:30 PM",
        "rules": "Photography allowed everywhere\nFlight simulator rules apply\nSafety instructions must be followed near aircraft\nChildren under 8 must be supervised",
        "galleries": [
            {"name": "Aircraft Display", "desc": "Real fighter jets, helicopters, and trainer aircraft"},
            {"name": "Engine Gallery", "desc": "Jet engines, turboprops, and aerospace engines"},
            {"name": "Flight Simulator Zone", "desc": "VR and physical flight simulators"},
            {"name": "Heritage Gallery", "desc": "HAL's 80-year journey in Indian aviation"}
        ],
        "events": [
            {"name": "Air Show Preview", "date": "Feb 2026", "desc": "Preview of Aero India exhibits"},
            {"name": "Aviation Career Day", "date": "Mar 2026", "desc": "Career guidance in aerospace industry"}
        ],
        "ticketPrices": {"Adult": 300, "Child": 100, "Senior Citizen": 150, "Student": 150, "Foreign National": 650}
    },
    "ngma": {
        "id": "ngma",
        "name": "National Gallery of Modern Art, Bangalore",
        "shortName": "NGMA Bangalore",
        "location": "49, Palace Road, Bangalore - 560052",
        "phone": "+91-80-2234-2338",
        "email": "ngma.bangalore@gov.in",
        "history": "The Bangalore branch of NGMA was established in 2009 in the heritage Manikyavelu Mansion. It hosts over 500 works of modern and contemporary Indian art spanning painting, sculpture, and graphic art.",
        "hours": "Tuesday to Sunday: 10:00 AM - 5:00 PM\nFriday: 10:00 AM - 8:00 PM (Extended)\nClosed: Monday & National Holidays\nLast Entry: 30 min before closing",
        "rules": "No photography inside galleries\nNo food or beverages\nMaintain silence\nDo not touch artworks",
        "galleries": [
            {"name": "Permanent Collection", "desc": "Works by Raja Ravi Varma, Amrita Sher-Gil, and M.F. Husain"},
            {"name": "Contemporary Gallery", "desc": "Rotating exhibitions of modern art"},
            {"name": "Sculpture Garden", "desc": "Outdoor sculptures in the mansion gardens"},
            {"name": "Photography Gallery", "desc": "Exhibitions of fine art photography"}
        ],
        "events": [
            {"name": "Art Workshop", "date": "Every Weekend", "desc": "Painting and sculpture workshops for visitors"},
            {"name": "Film Screening", "date": "Monthly", "desc": "Art cinema and documentary screenings"}
        ],
        "ticketPrices": {"Adult": 300, "Child": 100, "Senior Citizen": 150, "Student": 150, "Foreign National": 650}
    },
    "bangalore-palace": {
        "id": "bangalore-palace",
        "name": "Bangalore Palace",
        "shortName": "Bangalore Palace",
        "location": "Vasanth Nagar, Bangalore - 560052",
        "phone": "+91-80-2336-0818",
        "email": "palacevisit@bangalorepalace.com",
        "history": "Built in 1878 by King Chamaraja Wadiyar, Bangalore Palace is inspired by England's Windsor Castle. It spans 454 acres and features Tudor-style architecture, fortified towers, and lush green lawns.",
        "hours": "All days: 10:00 AM - 5:30 PM\nLast Entry: 5:00 PM",
        "rules": "Photography charges apply separately\nNo touching palace interiors\nFollow guided tour route only\nNo climbing on structures",
        "galleries": [
            {"name": "Durbar Hall", "desc": "Grand hall with ornate ceilings and royal portraits"},
            {"name": "Tudor Towers", "desc": "Gothic towers with panoramic city views"},
            {"name": "Palace Grounds", "desc": "Sprawling 454-acre grounds with gardens"},
            {"name": "Royal Gallery", "desc": "Collection of Wadiyar dynasty memorabilia"}
        ],
        "events": [
            {"name": "Palace Illumination Night", "date": "Every Friday", "desc": "Evening light show at the palace"},
            {"name": "Heritage Festival", "date": "Jan 2026", "desc": "Cultural performances in palace grounds"}
        ],
        "ticketPrices": {"Adult": 300, "Child": 100, "Senior Citizen": 150, "Student": 150, "Foreign National": 650}
    },
    "tipu-palace": {
        "id": "tipu-palace",
        "name": "Tipu Sultan's Summer Palace",
        "shortName": "Tipu Sultan's Palace",
        "location": "Albert Victor Road, Chamrajpet, Bangalore - 560018",
        "phone": "+91-80-2672-1677",
        "email": "asi.tipupalace@gov.in",
        "history": "Built around 1791, this elegant palace was the summer residence of Tipu Sultan, the 'Tiger of Mysore'. The palace features Indo-Islamic architecture with teakwood pillars, arches, and balconies.",
        "hours": "All days: 8:30 AM - 5:30 PM\nLast Entry: 5:00 PM",
        "rules": "No flash photography\nNo touching wooden structures\nShoes must be removed at entrance\nMaintain silence inside the palace",
        "galleries": [
            {"name": "Main Hall", "desc": "Ornate teak pillars and arched corridors"},
            {"name": "Tipu Sultan Exhibition", "desc": "Historical artifacts, weapons, and paintings"},
            {"name": "Coin Gallery", "desc": "Coins from the Mysore Kingdom era"}
        ],
        "events": [
            {"name": "Tipu Jayanti", "date": "Nov 2026", "desc": "Annual celebration of Tipu Sultan's birthday"},
            {"name": "ASI Heritage Tour", "date": "Monthly", "desc": "Guided archaeological heritage tour"}
        ],
        "ticketPrices": {"Adult": 300, "Child": 100, "Senior Citizen": 150, "Student": 150, "Foreign National": 650}
    },
    "nehru-planetarium": {
        "id": "nehru-planetarium",
        "name": "Jawaharlal Nehru Planetarium",
        "shortName": "Nehru Planetarium",
        "location": "Sri T. Chowdaiah Road, Bangalore - 560001",
        "phone": "+91-80-2267-1543",
        "email": "jnplanetarium@bangaloreast.gov.in",
        "history": "Opened in 1989, the Nehru Planetarium is one of five planetariums in India set up by Jawaharlal Nehru Memorial Fund. It features a sky theatre, telescopes, and interactive space science exhibits.",
        "hours": "Tuesday to Sunday: 10:00 AM - 5:30 PM\nShows: 11:00 AM, 1:00 PM, 3:00 PM, 5:00 PM\nClosed: Monday",
        "rules": "No entry after show begins\nNo photography during sky shows\nSilence during shows\nChildren below 3 not allowed for sky shows",
        "galleries": [
            {"name": "Sky Theatre", "desc": "360-degree projection dome with daily shows"},
            {"name": "Science Park", "desc": "Outdoor interactive science experiments"},
            {"name": "Observatory", "desc": "Telescope viewing on clear nights"},
            {"name": "Space Gallery", "desc": "Models of satellites, rockets, and solar system"}
        ],
        "events": [
            {"name": "Star Gazing Night", "date": "Every Full Moon", "desc": "Telescopic observation of celestial bodies"},
            {"name": "Space Week", "date": "Oct 2026", "desc": "Week-long space science activities"}
        ],
        "ticketPrices": {"Adult": 300, "Child": 100, "Senior Citizen": 150, "Student": 150, "Foreign National": 650}
    },
    "ime": {
        "id": "ime",
        "name": "Indian Music Experience Museum",
        "shortName": "Indian Music Experience",
        "location": "JP Nagar, Bangalore - 560078",
        "phone": "+91-80-2659-5599",
        "email": "info@indianmusicexperience.org",
        "history": "India's first interactive music museum, opened in 2019. It spans 45,000 sq ft across 3 floors with 16 galleries dedicated to India's diverse musical heritage from classical to Bollywood.",
        "hours": "Wednesday to Monday: 10:00 AM - 6:00 PM\nClosed: Tuesday\nLast Entry: 5:00 PM",
        "rules": "No outside instruments\nHeadphones available at listening stations\nNo food in gallery areas\nPhotography allowed without flash",
        "galleries": [
            {"name": "Sound Garden", "desc": "Outdoor musical instruments and sound sculptures"},
            {"name": "Classical Music Gallery", "desc": "Carnatic and Hindustani music traditions"},
            {"name": "Bollywood Gallery", "desc": "100 years of Hindi film music"},
            {"name": "Recording Studio", "desc": "Try recording your own music"}
        ],
        "events": [
            {"name": "Live Concert Series", "date": "Every Saturday", "desc": "Live performances by emerging artists"},
            {"name": "Music Workshop", "date": "Weekly", "desc": "Learn instruments with expert musicians"}
        ],
        "ticketPrices": {"Adult": 300, "Child": 100, "Senior Citizen": 150, "Student": 150, "Foreign National": 650}
    }
}

TIME_SLOTS = [
    "10:00 AM - 11:30 AM",
    "11:30 AM - 1:00 PM",
    "1:00 PM - 2:30 PM",
    "2:30 PM - 4:00 PM",
    "4:00 PM - 5:30 PM",
    "5:30 PM - 7:00 PM"
]

CATEGORIES = [
    {"name": "Adult", "price": 300},
    {"name": "Child", "price": 100},
    {"name": "Senior Citizen", "price": 150},
    {"name": "Student", "price": 150},
    {"name": "Foreign National", "price": 650}
]


def get_museum(tracker):
    """Get museum data from slot."""
    museum_id = tracker.get_slot("selected_museum")
    if museum_id and museum_id in MUSEUMS:
        return MUSEUMS[museum_id]
    return None


# Aliases for fuzzy museum name matching
MUSEUM_ALIASES = {
    # Visvesvaraya
    "visvesvaraya": "visvesvaraya",
    "visv": "visvesvaraya",
    "science museum": "visvesvaraya",
    "industrial museum": "visvesvaraya",
    "technological museum": "visvesvaraya",
    # Government Museum
    "govt-museum": "govt-museum",
    "government museum": "govt-museum",
    "govt museum": "govt-museum",
    "state museum": "govt-museum",
    # HAL Aerospace
    "hal-aerospace": "hal-aerospace",
    "hal": "hal-aerospace",
    "aerospace": "hal-aerospace",
    "aerospace museum": "hal-aerospace",
    "hal aerospace": "hal-aerospace",
    "hal aerospace museum": "hal-aerospace",
    "aviation museum": "hal-aerospace",
    "air force museum": "hal-aerospace",
    # NGMA
    "ngma": "ngma",
    "national gallery": "ngma",
    "modern art": "ngma",
    "art gallery": "ngma",
    "ngma bangalore": "ngma",
    # Bangalore Palace
    "bangalore-palace": "bangalore-palace",
    "bangalore palace": "bangalore-palace",
    "palace": "bangalore-palace",
    # Tipu Sultan's Palace
    "tipu-palace": "tipu-palace",
    "tipu": "tipu-palace",
    "tipu sultan": "tipu-palace",
    "tipu palace": "tipu-palace",
    "tipu sultan's palace": "tipu-palace",
    "summer palace": "tipu-palace",
    # Nehru Planetarium
    "nehru-planetarium": "nehru-planetarium",
    "planetarium": "nehru-planetarium",
    "nehru planetarium": "nehru-planetarium",
    "nehru": "nehru-planetarium",
    # Indian Music Experience
    "ime": "ime",
    "music museum": "ime",
    "music experience": "ime",
    "indian music": "ime",
    "indian music experience": "ime",
}


def resolve_museum_id(raw_value):
    """Resolve a free-text museum name to a museum dict key."""
    if not raw_value:
        return None

    val = raw_value.strip().lower()

    # 1. Exact key match
    if val in MUSEUMS:
        return val

    # 2. Alias match
    if val in MUSEUM_ALIASES:
        return MUSEUM_ALIASES[val]

    # 3. Partial match — check if any alias is contained in the input
    for alias, museum_id in MUSEUM_ALIASES.items():
        if alias in val or val in alias:
            return museum_id

    # 4. Check against museum short names and full names
    for mid, mdata in MUSEUMS.items():
        if val in mdata["shortName"].lower() or val in mdata["name"].lower():
            return mid
        if mdata["shortName"].lower() in val or mdata["name"].lower() in val:
            return mid

    return None


def normalize_category(cat_str):
    for c in CATEGORIES:
        cat_name = c["name"].lower()
        if cat_name in cat_str.lower() or cat_str.lower() in cat_name:
            return c["name"]
        if cat_str.lower().endswith('s') and cat_str.lower()[:-1] in cat_name:
            return c["name"]
        if cat_str.lower() in ['kid', 'kids', 'children'] and c["name"].lower() == "child":
            return c["name"]
    return None

def extract_breakdown_from_entities(entities):
    category_entities = [e for e in entities if e["entity"] == "ticket_category"]
    qty_entities = [e for e in entities if e["entity"] == "quantity"]
    
    breakdown = {}
    if category_entities:
        for cat in category_entities:
            norm_cat = normalize_category(cat["value"])
            if not norm_cat:
                continue
                
            closest_qty = None
            if qty_entities:
                min_dist = 9999
                for q in qty_entities:
                    dist = min(abs(cat["start"] - q["end"]), abs(q["start"] - cat["end"]))
                    if dist < min_dist:
                        min_dist = dist
                        closest_qty = int(q["value"]) if str(q["value"]).isdigit() else None
                        
            if norm_cat in breakdown and breakdown[norm_cat] is not None:
                pass 
            else:
                breakdown[norm_cat] = closest_qty
                
    return breakdown


class ActionSetLanguage(Action):
    def name(self):
        return "action_set_language"

    def run(self, dispatcher, tracker, domain):
        lang = tracker.get_slot("language") or "en"
        lang_label = LANG_MAP.get(lang, "english").title()
        dispatcher.utter_message(
            text=t(tracker, f"Language set to {lang_label}. Now please select a museum:"),
            buttons=[
                {"title": "🔬 Visvesvaraya Museum", "payload": '/select_museum{"museum_name": "visvesvaraya"}'},
                {"title": "🏛️ Government Museum", "payload": '/select_museum{"museum_name": "govt-museum"}'},
                {"title": "✈️ HAL Aerospace Museum", "payload": '/select_museum{"museum_name": "hal-aerospace"}'},
                {"title": "🖼️ NGMA Bangalore", "payload": '/select_museum{"museum_name": "ngma"}'},
                {"title": "🏰 Bangalore Palace", "payload": '/select_museum{"museum_name": "bangalore-palace"}'},
                {"title": "🐅 Tipu Sultan's Palace", "payload": '/select_museum{"museum_name": "tipu-palace"}'},
                {"title": "🌌 Nehru Planetarium", "payload": '/select_museum{"museum_name": "nehru-planetarium"}'},
                {"title": "🎵 Indian Music Experience", "payload": '/select_museum{"museum_name": "ime"}'}
            ]
        )
        return [SlotSet("language", lang)]


class ActionSetMuseum(Action):
    def name(self):
        return "action_set_museum"

    def run(self, dispatcher, tracker, domain):
        museum_id = None

        # Try slot first
        raw = tracker.get_slot("selected_museum")
        if raw:
            museum_id = resolve_museum_id(raw)

        # Try entity extraction
        if not museum_id:
            entities = tracker.latest_message.get("entities", [])
            for e in entities:
                if e["entity"] == "museum_name":
                    museum_id = resolve_museum_id(e["value"])
                    if museum_id:
                        break

        # Try resolving from the full message text as last resort
        if not museum_id:
            text = tracker.latest_message.get("text", "")
            museum_id = resolve_museum_id(text)

        museum = MUSEUMS.get(museum_id) if museum_id else None
        if museum:
            dispatcher.utter_message(
                text=t(tracker, f"You've selected {museum['shortName']}! Location: {museum['location']}. What would you like to do?"),
                buttons=[
                    {"title": "🎫 Book Tickets", "payload": "/book_tickets"},
                    {"title": "ℹ️ Museum Info", "payload": "/museum_info"},
                    {"title": "❓ FAQs", "payload": "/ask_faq"},
                    {"title": "📞 Contact", "payload": "/ask_contact"},
                    {"title": "🔄 Change Museum", "payload": "/change_museum"}
                ]
            )
            return [SlotSet("selected_museum", museum_id)]
        else:
            dispatcher.utter_message(
                text=t(tracker, "I couldn't identify that museum. Please select from the list:"),
                buttons=[
                    {"title": "🔬 Visvesvaraya Museum", "payload": '/select_museum{"museum_name": "visvesvaraya"}'},
                    {"title": "🏛️ Government Museum", "payload": '/select_museum{"museum_name": "govt-museum"}'},
                    {"title": "✈️ HAL Aerospace Museum", "payload": '/select_museum{"museum_name": "hal-aerospace"}'},
                    {"title": "🖼️ NGMA Bangalore", "payload": '/select_museum{"museum_name": "ngma"}'},
                    {"title": "🏰 Bangalore Palace", "payload": '/select_museum{"museum_name": "bangalore-palace"}'},
                    {"title": "🐅 Tipu Sultan's Palace", "payload": '/select_museum{"museum_name": "tipu-palace"}'},
                    {"title": "🌌 Nehru Planetarium", "payload": '/select_museum{"museum_name": "nehru-planetarium"}'},
                    {"title": "🎵 Indian Music Experience", "payload": '/select_museum{"museum_name": "ime"}'}
                ]
            )
            return []


class ActionStartBooking(Action):
    def name(self):
        return "action_start_booking"

    def run(self, dispatcher, tracker, domain):
        museum = get_museum(tracker)
        if not museum:
            dispatcher.utter_message(text=t(tracker, "Please select a museum first!"))
            return []

        events = []
        
        # Extract early breakdown if user typed everything in one sentence
        entities = tracker.latest_message.get("entities", [])
        breakdown = extract_breakdown_from_entities(entities)
        
        if breakdown:
            events.append(SlotSet("booking_category", json.dumps(breakdown)))
            # If all quantities are filled, we can also sum them for booking_quantity
            if all(v is not None for v in breakdown.values()):
                events.append(SlotSet("booking_quantity", str(sum(breakdown.values()))))

        # If date is already provided, skip asking and process it
        if tracker.get_slot("booking_date") or any(e["entity"] == "date" for e in entities):
            events.append(FollowupAction("action_process_date"))
            return events

        dispatcher.utter_message(
            text=t(tracker, f"Let's book tickets for {museum['shortName']}! Please enter your preferred visit date. Format: YYYY-MM-DD (e.g., 2026-03-28). Date must be today or within the next 30 days."),
            custom={"type": "date_input"}
        )
        return events


class ActionProcessDate(Action):
    def name(self):
        return "action_process_date"

    def run(self, dispatcher, tracker, domain):
        date_str = tracker.get_slot("booking_date")
        if not date_str:
            entities = tracker.latest_message.get("entities", [])
            for e in entities:
                if e["entity"] == "date":
                    date_str = e["value"]
                    break

        if not date_str:
            text = tracker.latest_message.get("text", "")
            import re
            match = re.search(r"\d{4}-\d{2}-\d{2}", text)
            if match:
                date_str = match.group()

        if not date_str:
            dispatcher.utter_message(text=t(tracker, "Please enter a valid date in YYYY-MM-DD format (or type 'today' / 'tomorrow')."))
            return []

        # Parse natural language "today" and "tomorrow"
        if date_str.lower() == "today":
            date_str = datetime.now().strftime("%Y-%m-%d")
        elif date_str.lower() == "tomorrow":
            date_str = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

        try:
            visit_date = datetime.strptime(date_str, "%Y-%m-%d")
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            max_date = today + timedelta(days=30)

            if visit_date < today:
                dispatcher.utter_message(text=t(tracker, "Date cannot be in the past. Please enter a future date."))
                return [SlotSet("booking_date", None)]

            if visit_date > max_date:
                dispatcher.utter_message(text=t(tracker, f"Date must be within 30 days from today. Please try again."))
                return [SlotSet("booking_date", None)]

            # Check if time_slot is already provided, if so skip showing buttons
            time_slot_entity_present = any(e["entity"] == "time_slot" for e in tracker.latest_message.get("entities", []))
            
            if tracker.get_slot("booking_time_slot") or time_slot_entity_present:
                dispatcher.utter_message(text=t(tracker, f"Date selected: {date_str}"))
                return [SlotSet("booking_date", date_str), FollowupAction("action_set_time_slot")]
                
            # Otherwise, show time slots
            dispatcher.utter_message(text=t(tracker, f"Date selected: {date_str}"))
            return [SlotSet("booking_date", date_str), FollowupAction("action_show_time_slots")]

        except ValueError:
            dispatcher.utter_message(text=t(tracker, "Invalid date format. Please use YYYY-MM-DD."))
            return [SlotSet("booking_date", None)]


class ActionShowTimeSlots(Action):
    def name(self):
        return "action_show_time_slots"

    def run(self, dispatcher, tracker, domain):
        buttons = []
        for i, slot in enumerate(TIME_SLOTS):
            buttons.append({
                "title": f"{i+1}️⃣ {slot}",
                "payload": f'/select_time_slot{{"time_slot": "{slot}"}}'
            })

        dispatcher.utter_message(
            text=t(tracker, "Please select a time slot:"),
            buttons=buttons
        )
        return []


class ActionSetTimeSlot(Action):
    def name(self):
        return "action_set_time_slot"

    def run(self, dispatcher, tracker, domain):
        slot = tracker.get_slot("booking_time_slot")
        if not slot:
            entities = tracker.latest_message.get("entities", [])
            for e in entities:
                if e["entity"] == "time_slot":
                    slot = e["value"]
                    break

        # Handle slot number input
        if slot and str(slot).isdigit(): # Ensure slot is a string digit before converting
            idx = int(slot) - 1
            if 0 <= idx < len(TIME_SLOTS):
                slot = TIME_SLOTS[idx]

        if slot:
            # Check if category is already provided
            category_entity_present = any(e["entity"] == "ticket_category" for e in tracker.latest_message.get("entities", []))
            
            if tracker.get_slot("booking_category") or category_entity_present:
                dispatcher.utter_message(text=t(tracker, f"Time slot: {slot}"))
                return [SlotSet("booking_time_slot", slot), FollowupAction("action_set_category")]
                
            # Otherwise show categories
            dispatcher.utter_message(text=t(tracker, f"Time slot: {slot}"))
            return [SlotSet("booking_time_slot", slot), FollowupAction("action_show_categories")]
        else:
            dispatcher.utter_message(text=t(tracker, "Please select a valid time slot."))
            return []


class ActionShowCategories(Action):
    def name(self):
        return "action_show_categories"

    def run(self, dispatcher, tracker, domain):
        buttons = []
        for i, cat in enumerate(CATEGORIES):
            buttons.append({
                "title": f"{cat['name']} - ₹{cat['price']}",
                "payload": f'/select_category{{"ticket_category": "{cat["name"]}"}}'
            })

        dispatcher.utter_message(
            text=t(tracker, "Select ticket category:"),
            buttons=buttons
        )
        return []


class ActionSetCategory(Action):
    def name(self):
        return "action_set_category"

    def run(self, dispatcher, tracker, domain):
        # We will use booking_category slot to store a JSON string of {"CategoryName": quantity, ...}
        # If quantity is not yet known, it will be None: {"CategoryName": None}
        
        entities = tracker.latest_message.get("entities", [])
        category_entities = [e for e in entities if e["entity"] == "ticket_category"]
        
        breakdown = {}
        
        existing_cat = tracker.get_slot("booking_category")
        if existing_cat:
            try:
                breakdown = json.loads(existing_cat)
            except json.JSONDecodeError:
                norm = normalize_category(existing_cat)
                if norm:
                    breakdown = {norm: None}

        # If there are new category entities in the message, rebuild the breakdown
        if category_entities:
            # Only completely replace if the user typed entirely new categories,
            # otherwise merge or use the global extractor
            new_breakdown = extract_breakdown_from_entities(entities)
            if new_breakdown:
                breakdown.update(new_breakdown)

        if not breakdown:
            dispatcher.utter_message(text=t(tracker, "Please select a valid category."))
            return []

        # Check if any category is missing a quantity
        missing_qty = any(v is None for v in breakdown.values())
        
        if not missing_qty:
            # All categories have quantities! Format a nice message
            parts = []
            for k, v in breakdown.items():
                price = next((c["price"] for c in CATEGORIES if c["name"] == k), 300)
                parts.append(f"{v}x {k} (₹{price})")
            
            dispatcher.utter_message(text=t(tracker, f"Tickets: {', '.join(parts)}"))
            
            # Since quantities are filled, calculate total quantity to satisfy the quantity slot
            total_qty = sum(breakdown.values())
            
            return [
                SlotSet("booking_category", json.dumps(breakdown)),
                SlotSet("booking_quantity", str(total_qty)),
                FollowupAction("action_ask_booking_contact")
            ]
        else:
            # Not all have quantities. Ask for quantity for the first missing one.
            missing_cat = next(k for k, v in breakdown.items() if v is None)
            price = next((c["price"] for c in CATEGORIES if c["name"] == missing_cat), 300)
            
            dispatcher.utter_message(
                text=t(tracker, f"Category: {missing_cat} (Rs.{price}/ticket). How many {missing_cat} tickets do you need? (1-10)"),
                buttons=[{"title": str(i), "payload": f'/select_quantity{{"quantity": "{i}"}}'} for i in range(1, 6)]
            )
            return [SlotSet("booking_category", json.dumps(breakdown))]


class ActionSetQuantity(Action):
    def name(self):
        return "action_set_quantity"

    def run(self, dispatcher, tracker, domain):
        entities = tracker.latest_message.get("entities", [])
        qty_entities = [e["value"] for e in entities if e["entity"] == "quantity"]
        
        quantity = None
        
        text = tracker.latest_message.get("text", "").strip()
        # Guard: If text matches an email pattern, skip quantity processing
        email_pattern = r'\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b'
        if re.search(email_pattern, text):
            return []
            
        if re.match(r'^\d{10}$', text):
            return [FollowupAction("action_set_mobile")]
            
        if qty_entities and str(qty_entities[0]).isdigit():
            quantity = int(qty_entities[0])
            
        if not quantity:
            text = tracker.latest_message.get("text", "").strip()
            if text.isdigit():
                quantity = int(text)

        if not quantity or not (1 <= quantity <= 10):
            dispatcher.utter_message(text=t(tracker, "Please enter a valid number of tickets (1-10)."))
            return []

        # Update the breakdown
        existing_cat = tracker.get_slot("booking_category")
        breakdown = {}
        if existing_cat:
            try:
                breakdown = json.loads(existing_cat)
            except json.JSONDecodeError:
                pass
                
        # Find the first category missing a quantity and assign it
        updated = False
        for k, v in breakdown.items():
            if v is None:
                breakdown[k] = quantity
                updated = True
                break
                
        if not updated and len(breakdown) == 1:
            # If there was a default or only one category, just overwrite it
            k = list(breakdown.keys())[0]
            breakdown[k] = quantity

        total_qty = sum(v for v in breakdown.values() if v is not None)

        return [
            SlotSet("booking_category", json.dumps(breakdown)),
            SlotSet("booking_quantity", str(total_qty)),
            FollowupAction("action_ask_booking_contact")
        ]
class ActionAskBookingContact(Action):
    def name(self):
        return "action_ask_booking_contact"

    def run(self, dispatcher, tracker, domain):
        mobile = tracker.get_slot("booking_mobile")
        email = tracker.get_slot("booking_email")
        
        if not mobile:
            dispatcher.utter_message(text=t(tracker, "Almost done! Please provide your 10-digit mobile number for the tickets."))
            return []
            
        if not email:
            dispatcher.utter_message(text=t(tracker, "Great! Now, please provide your email address to receive your tickets."))
            return []
            
        return [FollowupAction("action_show_booking_summary")]


class ActionSetMobile(Action):
    def name(self):
        return "action_set_mobile"

    def run(self, dispatcher, tracker, domain):
        entities = tracker.latest_message.get("entities", [])
        mobile_entities = [e["value"] for e in entities if e["entity"] == "mobile_number"]
        
        mobile = None
        if mobile_entities:
            mobile = mobile_entities[0]
        else:
            import re
            text = tracker.latest_message.get("text", "")
            match = re.search(r'\b\d{10}\b', text)
            if match:
                mobile = match.group(0)

        if not mobile:
            dispatcher.utter_message(text=t(tracker, "Please enter a valid 10-digit mobile number."))
            return []
            
        return [
            SlotSet("booking_mobile", mobile),
            FollowupAction("action_ask_booking_contact")
        ]


class ActionSetEmail(Action):
    def name(self):
        return "action_set_email"

    def run(self, dispatcher, tracker, domain):
        entities = tracker.latest_message.get("entities", [])
        email_entities = [e["value"] for e in entities if e["entity"] == "email"]
        
        email = None
        if email_entities:
            email = email_entities[0]
        else:
            import re
            text = tracker.latest_message.get("text", "")
            match = re.search(r'\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b', text)
            if match:
                email = match.group(0)

        if not email:
            dispatcher.utter_message(text=t(tracker, "Please enter a valid email address."))
            return []
            
        return [
            SlotSet("booking_email", email),
            FollowupAction("action_ask_booking_contact")
        ]


class ActionShowBookingSummary(Action):
    def name(self):
        return "action_show_booking_summary"

    def run(self, dispatcher, tracker, domain):
        museum = get_museum(tracker)
        date = tracker.get_slot("booking_date")
        time_slot = tracker.get_slot("booking_time_slot")
        category_json = tracker.get_slot("booking_category")
        
        breakdown = {}
        if category_json:
            try:
                breakdown = json.loads(category_json)
            except:
                pass

        if not all([museum, date, time_slot, breakdown]):
            dispatcher.utter_message(text=t(tracker, "Booking details incomplete. Please start over."))
            return []

        total_amount = 0
        total_tickets = 0
        breakdown_text = ""
        breakdown_array = []
        
        for cat_name, qty in breakdown.items():
            if not qty: continue
            price = next((c["price"] for c in CATEGORIES if c["name"] == cat_name), 300)
            subtotal = price * int(qty)
            total_amount += subtotal
            total_tickets += int(qty)
            breakdown_text += f"• {qty}x {cat_name} (₹{subtotal})\n"
            breakdown_array.append({"category": cat_name, "quantity": qty, "price": price})

        summary = (
            f"📋 **Booking Summary**\n\n"
            f"🏛️ Museum: {museum['shortName']}\n"
            f"📅 Date: {date}\n"
            f"⏰ Time: {time_slot}\n"
            f"🎟️ Tickets:\n{breakdown_text}"
            f"💰 Total Amount: ₹{total_amount:,}\n"
            f"📱 Mobile: {tracker.get_slot('booking_mobile')}\n"
            f"📧 Email: {tracker.get_slot('booking_email')}\n\n"
            f"Would you like to proceed to payment?"
        )

        # For the frontend, pass the array of categories so it can display them
        category_label = ", ".join([f"{item['quantity']} {item['category']}" for item in breakdown_array])

        dispatcher.utter_message(
            text=t(tracker, summary),
            buttons=[
                {"title": "✅ Confirm & Pay", "payload": "/confirm_booking"},
                {"title": "➕ Add Another Category", "payload": "/add_more_tickets"},
                {"title": "❌ Cancel", "payload": "/cancel_booking"}
            ],
            custom={
                "type": "booking_summary",
                "data": {
                    "museumId": museum["id"],
                    "museumName": museum["shortName"],
                    "date": date,
                    "timeSlot": time_slot,
                    "category": category_label,
                    "breakdown": breakdown_array,
                    "quantity": total_tickets,
                    "total": total_amount
                }
            }
        )
        return []


class ActionConfirmPayment(Action):
    def name(self):
        return "action_confirm_payment"

    def run(self, dispatcher, tracker, domain):
        museum = get_museum(tracker)
        date = tracker.get_slot("booking_date")
        time_slot = tracker.get_slot("booking_time_slot")
        category_json = tracker.get_slot("booking_category")
        
        breakdown = {}
        if category_json:
            try:
                breakdown = json.loads(category_json)
            except:
                pass

        if not all([museum, date, time_slot, breakdown]):
            dispatcher.utter_message(text=t(tracker, "Booking details incomplete. Please start over."))
            return []

        total_amount = 0
        total_tickets = 0
        breakdown_array = []
        
        for cat_name, qty in breakdown.items():
            if not qty: continue
            price = next((c["price"] for c in CATEGORIES if c["name"] == cat_name), 300)
            subtotal = price * int(qty)
            total_amount += subtotal
            total_tickets += int(qty)
            breakdown_array.append({"category": cat_name, "quantity": qty, "price": price})

        category_label = ", ".join([f"{item['quantity']} {item['category']}" for item in breakdown_array])

        dispatcher.utter_message(
            text=t(tracker, "Redirecting you to payment. Please click the button below to complete your booking."),
            custom={
                "type": "redirect_payment",
                "data": {
                    "museumId": museum["id"],
                    "museumName": museum["shortName"],
                    "date": date,
                    "timeSlot": time_slot,
                    "category": category_label,
                    "breakdown": breakdown_array,
                    "quantity": total_tickets,
                    "total": total_amount,
                    "mobile": tracker.get_slot("booking_mobile"),
                    "email": tracker.get_slot("booking_email")
                }
            }
        )
        return [AllSlotsReset()]


class ActionShowMuseumHistory(Action):
    def name(self):
        return "action_show_museum_history"

    def run(self, dispatcher, tracker, domain):
        museum = get_museum(tracker)
        if museum:
            dispatcher.utter_message(
                text=t(tracker, f"{museum['shortName']} — History: {museum['history']}"),
                buttons=[
                    {"title": "ℹ️ More Info", "payload": "/museum_info"},
                    {"title": "🎫 Book Tickets", "payload": "/book_tickets"},
                    {"title": "🔙 Menu", "payload": "/book_tickets"}
                ]
            )
        else:
            dispatcher.utter_message(text=t(tracker, "Please select a museum first."))
        return []


class ActionShowGalleries(Action):
    def name(self):
        return "action_show_galleries"

    def run(self, dispatcher, tracker, domain):
        museum = get_museum(tracker)
        if museum:
            galleries_text = "\n".join([f"🖼️ **{g['name']}** — {g['desc']}" for g in museum["galleries"]])
            dispatcher.utter_message(
                text=t(tracker, f"{museum['shortName']} — Galleries: {galleries_text}"),
                buttons=[
                    {"title": "ℹ️ More Info", "payload": "/museum_info"},
                    {"title": "🎫 Book Tickets", "payload": "/book_tickets"},
                    {"title": "🔙 Menu", "payload": "/book_tickets"}
                ]
            )
        else:
            dispatcher.utter_message(text=t(tracker, "Please select a museum first."))
        return []


class ActionShowHours(Action):
    def name(self):
        return "action_show_hours"

    def run(self, dispatcher, tracker, domain):
        museum = get_museum(tracker)
        if museum:
            dispatcher.utter_message(
                text=t(tracker, f"{museum['shortName']} — Visiting Hours: {museum['hours']}"),
                buttons=[
                    {"title": "ℹ️ More Info", "payload": "/museum_info"},
                    {"title": "🎫 Book Tickets", "payload": "/book_tickets"}
                ]
            )
        else:
            dispatcher.utter_message(text=t(tracker, "Please select a museum first."))
        return []


class ActionShowRules(Action):
    def name(self):
        return "action_show_rules"

    def run(self, dispatcher, tracker, domain):
        museum = get_museum(tracker)
        if museum:
            rules_formatted = "\n".join([f"• {r}" for r in museum["rules"].split("\n")])
            dispatcher.utter_message(
                text=t(tracker, f"{museum['shortName']} — Rules and Guidelines: {rules_formatted}"),
                buttons=[
                    {"title": "ℹ️ More Info", "payload": "/museum_info"},
                    {"title": "🎫 Book Tickets", "payload": "/book_tickets"}
                ]
            )
        else:
            dispatcher.utter_message(text=t(tracker, "Please select a museum first."))
        return []


class ActionShowEvents(Action):
    def name(self):
        return "action_show_events"

    def run(self, dispatcher, tracker, domain):
        museum = get_museum(tracker)
        if museum:
            events_text = "\n".join([f"🎪 **{e['name']}** ({e['date']})\n   {e['desc']}" for e in museum["events"]])
            dispatcher.utter_message(
                text=t(tracker, f"{museum['shortName']} — Upcoming Events: {events_text}"),
                buttons=[
                    {"title": "ℹ️ More Info", "payload": "/museum_info"},
                    {"title": "🎫 Book Tickets", "payload": "/book_tickets"}
                ]
            )
        else:
            dispatcher.utter_message(text=t(tracker, "Please select a museum first."))
        return []


class ActionShowContact(Action):
    def name(self):
        return "action_show_contact"

    def run(self, dispatcher, tracker, domain):
        museum = get_museum(tracker)
        if museum:
            dispatcher.utter_message(
                text=t(tracker, f"{museum['shortName']} — Contact: Address: {museum['location']}, Phone: {museum['phone']}, Email: {museum['email']}"),
                buttons=[
                    {"title": "ℹ️ More Info", "payload": "/museum_info"},
                    {"title": "🎫 Book Tickets", "payload": "/book_tickets"}
                ]
            )
        else:
            dispatcher.utter_message(text=t(tracker, "Please select a museum first."))
        return []


class ActionChangeMuseum(Action):
    def name(self):
        return "action_change_museum"

    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(
            text=t(tracker, "Select a new museum:"),
            buttons=[
                {"title": "🔬 Visvesvaraya Museum", "payload": '/select_museum{"museum_name": "visvesvaraya"}'},
                {"title": "🏛️ Government Museum", "payload": '/select_museum{"museum_name": "govt-museum"}'},
                {"title": "✈️ HAL Aerospace Museum", "payload": '/select_museum{"museum_name": "hal-aerospace"}'},
                {"title": "🖼️ NGMA Bangalore", "payload": '/select_museum{"museum_name": "ngma"}'},
                {"title": "🏰 Bangalore Palace", "payload": '/select_museum{"museum_name": "bangalore-palace"}'},
                {"title": "🐅 Tipu Sultan's Palace", "payload": '/select_museum{"museum_name": "tipu-palace"}'},
                {"title": "🌌 Nehru Planetarium", "payload": '/select_museum{"museum_name": "nehru-planetarium"}'},
                {"title": "🎵 Indian Music Experience", "payload": '/select_museum{"museum_name": "ime"}'}
            ]
        )
        return [SlotSet("selected_museum", None)]


# ============================================================
# Translated Domain Response Actions
# ============================================================

class ActionGreet(Action):
    def name(self):
        return "action_greet"

    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(
            text="🇮🇳 Welcome to MuseumPass Bangalore!\n\nI'm your AI-powered ticket booking assistant for Bangalore's finest museums.\n\nPlease select your language:",
            buttons=[
                {"title": "English", "payload": '/select_language{"language": "en"}'},
                {"title": "हिंदी", "payload": '/select_language{"language": "hi"}'},
                {"title": "ಕನ್ನಡ", "payload": '/select_language{"language": "kn"}'},
                {"title": "தமிழ்", "payload": '/select_language{"language": "ta"}'},
                {"title": "తెలుగు", "payload": '/select_language{"language": "te"}'},
                {"title": "বাংলা", "payload": '/select_language{"language": "bn"}'},
                {"title": "मराठी", "payload": '/select_language{"language": "mr"}'},
                {"title": "ગુજરાતી", "payload": '/select_language{"language": "gu"}'},
                {"title": "മലയാളം", "payload": '/select_language{"language": "ml"}'},
                {"title": "ਪੰਜਾਬੀ", "payload": '/select_language{"language": "pa"}'},
                {"title": "ଓଡ଼ିଆ", "payload": '/select_language{"language": "or"}'},
                {"title": "অসমীয়া", "payload": '/select_language{"language": "as"}'},
                {"title": "اردو", "payload": '/select_language{"language": "ur"}'}
            ]
        )
        return []


class ActionGoodbye(Action):
    def name(self):
        return "action_goodbye"

    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(text=t(tracker, "Thank you for using MuseumPass Bangalore! Have a wonderful day!"))
        return []


class ActionThank(Action):
    def name(self):
        return "action_thank"

    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(
            text=t(tracker, "You're welcome! Is there anything else I can help you with?"),
            buttons=[
                {"title": "🎫 Book Tickets", "payload": "/book_tickets"},
                {"title": "ℹ️ Museum Info", "payload": "/museum_info"},
                {"title": "👋 Goodbye", "payload": "/goodbye"}
            ]
        )
        return []


class ActionMainMenu(Action):
    def name(self):
        return "action_main_menu"

    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(
            text=t(tracker, "What would you like to do?"),
            buttons=[
                {"title": "🎫 Book Tickets", "payload": "/book_tickets"},
                {"title": "ℹ️ Museum Info", "payload": "/museum_info"},
                {"title": "❓ FAQs", "payload": "/ask_faq"},
                {"title": "📞 Contact", "payload": "/ask_contact"},
                {"title": "🔄 Change Museum", "payload": "/change_museum"}
            ]
        )
        return []


class ActionBookingCancelled(Action):
    def name(self):
        return "action_booking_cancelled"

    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(text=t(tracker, "Booking cancelled. Feel free to start again anytime!"))
        return []


class ActionInfoMenu(Action):
    def name(self):
        return "action_info_menu"

    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(
            text=t(tracker, "What would you like to know about this museum?"),
            buttons=[
                {"title": "🏛️ History", "payload": "/ask_history"},
                {"title": "🖼️ Galleries", "payload": "/ask_galleries"},
                {"title": "🕐 Hours", "payload": "/ask_hours"},
                {"title": "📋 Rules", "payload": "/ask_rules"},
                {"title": "🎪 Events", "payload": "/ask_events"},
                {"title": "📍 Contact", "payload": "/ask_contact"},
                {"title": "🔙 Back", "payload": "/book_tickets"}
            ]
        )
        return []


class ActionFaqMenu(Action):
    def name(self):
        return "action_faq_menu"

    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(
            text=t(tracker, "Frequently Asked Questions:"),
            buttons=[
                {"title": "❌ Cancel Booking?", "payload": "/faq_cancel"},
                {"title": "🅿️ Parking?", "payload": "/faq_parking"},
                {"title": "♿ Wheelchair?", "payload": "/faq_wheelchair"},
                {"title": "☕ Cafe?", "payload": "/faq_cafe"},
                {"title": "🗣️ Guided Tour?", "payload": "/faq_guided_tour"},
                {"title": "🔙 Back", "payload": "/book_tickets"}
            ]
        )
        return []


class ActionFaqCancel(Action):
    def name(self):
        return "action_faq_cancel"
    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(text=t(tracker, "Yes! You can cancel your booking up to 24 hours before the visit for a full refund. Cancellations within 24 hours will incur a 20% fee."))
        return []

class ActionFaqParking(Action):
    def name(self):
        return "action_faq_parking"
    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(text=t(tracker, "Yes, most museums in Bangalore have parking facilities for both cars and two-wheelers."))
        return []

class ActionFaqWheelchair(Action):
    def name(self):
        return "action_faq_wheelchair"
    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(text=t(tracker, "Absolutely! Wheelchairs are available free of charge at the entrance of most museums. The museums are accessible with ramps and elevators."))
        return []

class ActionFaqCafe(Action):
    def name(self):
        return "action_faq_cafe"
    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(text=t(tracker, "Yes, most museums have a cafe or canteen offering snacks, beverages, and light meals during museum hours."))
        return []

class ActionFaqGuidedTour(Action):
    def name(self):
        return "action_faq_guided_tour"
    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(text=t(tracker, "Yes! Guided tours are available at most museums in multiple languages. Check with the specific museum for schedules and pricing."))
        return []

class ActionDefaultFallback(Action):
    def name(self):
        return "action_default_fallback"
    def run(self, dispatcher, tracker, domain):
        dispatcher.utter_message(
            text=t(tracker, "I'm not sure I understand. Could you rephrase or choose from the options?"),
            buttons=[
                {"title": "🎫 Book Tickets", "payload": "/book_tickets"},
                {"title": "ℹ️ Museum Info", "payload": "/museum_info"},
                {"title": "❓ FAQs", "payload": "/ask_faq"}
            ]
        )
        return []

