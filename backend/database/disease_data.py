"""
Static disease information, treatment recommendations, and translations.
Used when MongoDB is unavailable or to pre-populate the database.
"""

import re

DISEASE_INFO = {
    "Tomato_Bacterial_spot": {
        "name": "Bacterial Spot",
        "scientific_name": "Xanthomonas campestris pv. vesicatoria",
        "type": "Bacterial",
        "severity_default": "Moderate",
        "description": (
            "Bacterial spot is one of the most common and destructive diseases "
            "of tomato in warm, moist climates. It causes small, water-soaked "
            "spots that turn dark brown with yellow halos on leaves."
        ),
        "symptoms": [
            "Small, water-soaked circular spots on leaves",
            "Spots turn dark brown with yellow halos",
            "Infected leaves turn yellow and drop prematurely",
            "Dark, raised, scabby spots on fruit",
            "Stem lesions in severe cases",
        ],
        "causes": [
            "Caused by Xanthomonas bacteria",
            "Spreads through rain splash, wind, and contaminated tools",
            "Warm temperatures (24–30°C) with high humidity favor spread",
            "Infected seeds and transplants",
        ],
        "management": [
            "Remove and destroy infected plant material",
            "Avoid overhead irrigation; use drip irrigation",
            "Apply copper-based bactericides as a preventive measure",
            "Rotate crops — avoid planting tomatoes in the same spot for 2–3 years",
            "Use certified disease-free seeds and transplants",
            "Sterilize gardening tools between plants",
        ],
        "prevention": [
            "Plant resistant varieties",
            "Maintain plant spacing for good air circulation",
            "Apply mulch to reduce soil splash",
            "Scout plants regularly for early detection",
        ],
        "risk_conditions": {
            "temperature_range": [24, 30],
            "humidity_threshold": 70,
            "rainfall_risk": True,
        },
        "kannada": "ಬ್ಯಾಕ್ಟೀರಿಯಲ್ ಸ್ಪಾಟ್",
        "hindi": "बैक्टीरियल स्पॉट",
        "color": "#FF6B35",
        "icon": "🦠",
    },

    "Tomato_Early_blight": {
        "name": "Early Blight",
        "scientific_name": "Alternaria solani",
        "type": "Fungal",
        "severity_default": "Moderate",
        "description": (
            "Early blight is a common fungal disease caused by Alternaria solani. "
            "It produces characteristic dark brown spots with concentric rings "
            "forming a target-like pattern on leaves."
        ),
        "symptoms": [
            "Dark brown spots with concentric rings (target-board pattern)",
            "Yellow halo surrounding each spot",
            "Lower leaves affected first",
            "Spots enlarge and merge as disease progresses",
            "Premature defoliation in severe cases",
        ],
        "causes": [
            "Caused by Alternaria solani fungus",
            "Survives in soil and infected plant debris",
            "Warm temperatures (24–29°C) and wet conditions",
            "Spreads through wind and water splash",
        ],
        "management": [
            "Remove and destroy infected leaves immediately",
            "Apply fungicides containing chlorothalonil or mancozeb",
            "Improve air circulation by proper plant spacing",
            "Avoid working with plants when foliage is wet",
            "Water at the base of the plant to keep foliage dry",
        ],
        "prevention": [
            "Use disease-free transplants",
            "Rotate crops with non-solanaceous plants",
            "Apply organic mulch to reduce soil splash",
            "Use drip irrigation systems",
        ],
        "risk_conditions": {
            "temperature_range": [24, 29],
            "humidity_threshold": 65,
            "rainfall_risk": True,
        },
        "kannada": "ಅರ್ಲಿ ಬ್ಲೈಟ್",
        "hindi": "अर्ली ब्लाइट",
        "color": "#8B4513",
        "icon": "🍂",
    },

    "Tomato_Late_blight": {
        "name": "Late Blight",
        "scientific_name": "Phytophthora infestans",
        "type": "Fungal (Oomycete)",
        "severity_default": "Severe",
        "description": (
            "Late blight is a devastating disease caused by Phytophthora infestans. "
            "It can destroy an entire crop within days under favorable conditions. "
            "This disease was responsible for the Irish Potato Famine."
        ),
        "symptoms": [
            "Large, irregular, water-soaked lesions on leaves",
            "White mold growth on undersides of leaves in humid conditions",
            "Dark brown to black lesions spreading rapidly",
            "Infected fruit shows dark, firm rot",
            "Stem lesions that can girdle the plant",
        ],
        "causes": [
            "Caused by Phytophthora infestans (water mold)",
            "Cool temperatures (10–25°C) with high humidity",
            "Spreads rapidly through wind-blown spores",
            "Infected transplants and volunteer plants",
        ],
        "management": [
            "Remove and destroy all infected plant material immediately",
            "Apply fungicides at first sign of disease (metalaxyl, cymoxanil)",
            "Avoid overhead irrigation",
            "Improve drainage and air circulation",
            "Monitor forecasts for disease-favorable weather",
        ],
        "prevention": [
            "Plant resistant varieties",
            "Avoid planting near potatoes (same pathogen)",
            "Apply preventive fungicide sprays in high-risk periods",
            "Remove volunteer solanaceous plants",
        ],
        "risk_conditions": {
            "temperature_range": [10, 25],
            "humidity_threshold": 80,
            "rainfall_risk": True,
        },
        "kannada": "ಲೇಟ್ ಬ್ಲೈಟ್",
        "hindi": "लेट ब्लाइट",
        "color": "#2D1B69",
        "icon": "☠️",
    },

    "Tomato_Leaf_Mold": {
        "name": "Leaf Mold",
        "scientific_name": "Passalora fulva",
        "type": "Fungal",
        "severity_default": "Moderate",
        "description": (
            "Leaf mold primarily affects greenhouse tomatoes but can occur outdoors. "
            "It causes distinctive olive-green mold on the undersides of leaves "
            "with pale green to yellow patches on upper surfaces."
        ),
        "symptoms": [
            "Pale green to yellowish spots on upper leaf surface",
            "Olive-green to grayish-purple mold on lower leaf surface",
            "Infected leaves may curl and wither",
            "Severe infections cause premature leaf drop",
            "Usually starts on older lower leaves",
        ],
        "causes": [
            "Caused by Passalora fulva fungus",
            "High humidity (above 85%) promotes sporulation",
            "Poor ventilation in greenhouses",
            "Moderate temperatures (22–27°C)",
        ],
        "management": [
            "Improve ventilation in greenhouses",
            "Reduce leaf wetness through proper spacing",
            "Apply fungicides (chlorothalonil, mancozeb)",
            "Remove and destroy infected leaves",
            "Avoid wetting foliage during irrigation",
        ],
        "prevention": [
            "Use resistant varieties",
            "Maintain relative humidity below 85%",
            "Prune to improve air circulation",
            "Sanitize greenhouse structures between crops",
        ],
        "risk_conditions": {
            "temperature_range": [22, 27],
            "humidity_threshold": 85,
            "rainfall_risk": False,
        },
        "kannada": "ಲೀಫ್ ಮೋಲ್ಡ್",
        "hindi": "लीफ मोल्ड",
        "color": "#6B8E23",
        "icon": "🌿",
    },

    "Tomato_Septoria_leaf_spot": {
        "name": "Septoria Leaf Spot",
        "scientific_name": "Septoria lycopersici",
        "type": "Fungal",
        "severity_default": "Moderate",
        "description": (
            "Septoria leaf spot is one of the most common diseases of tomato "
            "worldwide. It appears as numerous small circular spots with dark "
            "borders and light-colored centers."
        ),
        "symptoms": [
            "Numerous small, circular spots (3–5mm diameter)",
            "Spots have dark brown margins and light gray centers",
            "Tiny black dots (pycnidia) visible in the center",
            "Lower leaves affected first, progresses upward",
            "Severe infection causes complete defoliation",
        ],
        "causes": [
            "Caused by Septoria lycopersici fungus",
            "Survives in infected plant debris in soil",
            "Warm, wet weather promotes spread",
            "Spreads through rain splash, tools, hands",
        ],
        "management": [
            "Remove and destroy infected lower leaves",
            "Apply fungicides (chlorothalonil, copper-based)",
            "Stake plants to keep foliage off the ground",
            "Avoid overhead watering",
            "Practice crop rotation",
        ],
        "prevention": [
            "Mulch soil to prevent spore splash",
            "Rotate crops (2–3 year cycle)",
            "Keep garden clear of plant debris",
            "Ensure good air circulation",
        ],
        "risk_conditions": {
            "temperature_range": [20, 25],
            "humidity_threshold": 70,
            "rainfall_risk": True,
        },
        "kannada": "ಸೆಪ್ಟೋರಿಯಾ ಲೀಫ್ ಸ್ಪಾಟ್",
        "hindi": "सेप्टोरिया लीफ स्पॉट",
        "color": "#D2691E",
        "icon": "⚫",
    },

    "Tomato_Spider_mites_Two_spotted_spider_mite": {
        "name": "Spider Mites (Two-Spotted)",
        "scientific_name": "Tetranychus urticae",
        "type": "Pest (Arachnid)",
        "severity_default": "Moderate",
        "description": (
            "Two-spotted spider mites are tiny arachnids that feed on plant cells, "
            "causing characteristic stippling and bronzing of leaves. They thrive "
            "in hot, dry conditions and can rapidly infest plants."
        ),
        "symptoms": [
            "Tiny yellow or white stippling on upper leaf surface",
            "Leaf undersides covered with fine silken webbing",
            "Leaves turn bronze, yellow, or brown",
            "Premature leaf drop in severe infestations",
            "Tiny moving dots visible on undersides of leaves",
        ],
        "causes": [
            "Two-spotted spider mite (Tetranychus urticae)",
            "Hot, dry weather promotes rapid reproduction",
            "Dusty conditions reduce natural predators",
            "Overuse of broad-spectrum insecticides kills natural enemies",
        ],
        "management": [
            "Apply miticides or insecticidal soap sprays",
            "Spray strong jets of water to dislodge mites",
            "Introduce predatory mites (Phytoseiulus persimilis)",
            "Avoid water stress — keep plants well watered",
            "Apply neem oil as an organic alternative",
        ],
        "prevention": [
            "Maintain plant health with adequate watering",
            "Avoid excessive nitrogen fertilization",
            "Conserve natural predators",
            "Monitor plants regularly, especially during hot dry spells",
        ],
        "risk_conditions": {
            "temperature_range": [27, 40],
            "humidity_threshold": 40,
            "rainfall_risk": False,
        },
        "kannada": "ಸ್ಪೈಡರ್ ಮೈಟ್ಸ್",
        "hindi": "स्पाइडर माइट्स",
        "color": "#FF4500",
        "icon": "🕷️",
    },

    "Tomato_Target_Spot": {
        "name": "Target Spot",
        "scientific_name": "Corynespora cassiicola",
        "type": "Fungal",
        "severity_default": "Moderate",
        "description": (
            "Target spot produces characteristic concentric ring patterns on "
            "leaves, similar to early blight but caused by a different organism. "
            "It can affect leaves, stems, and fruit."
        ),
        "symptoms": [
            "Circular to irregular brown spots with concentric rings",
            "Yellow halo around lesions",
            "Small dark brown spots initially, enlarging over time",
            "Defoliation in severe cases",
            "Water-soaked lesions on fruit",
        ],
        "causes": [
            "Caused by Corynespora cassiicola fungus",
            "Warm humid conditions (20–30°C)",
            "Survives in plant debris",
            "Spreads through wind and water splash",
        ],
        "management": [
            "Apply fungicides (azoxystrobin, chlorothalonil)",
            "Remove infected plant material",
            "Improve air circulation through pruning",
            "Avoid wetting foliage",
        ],
        "prevention": [
            "Use disease-free planting material",
            "Practice crop rotation",
            "Maintain proper plant spacing",
            "Scout regularly for early detection",
        ],
        "risk_conditions": {
            "temperature_range": [20, 30],
            "humidity_threshold": 75,
            "rainfall_risk": True,
        },
        "kannada": "ಟಾರ್ಗೆಟ್ ಸ್ಪಾಟ್",
        "hindi": "टारगेट स्पॉट",
        "color": "#B8860B",
        "icon": "🎯",
    },

    "Tomato_Tomato_Yellow_Leaf_Curl_Virus": {
        "name": "Yellow Leaf Curl Virus",
        "scientific_name": "Tomato yellow leaf curl virus (TYLCV)",
        "type": "Viral",
        "severity_default": "Severe",
        "description": (
            "Yellow Leaf Curl Virus is a devastating viral disease transmitted "
            "by whiteflies. Infected plants show characteristic upward leaf "
            "curling and severe stunting with no effective cure."
        ),
        "symptoms": [
            "Upward curling and cupping of young leaves",
            "Yellowing (chlorosis) of leaf margins",
            "Stunted plant growth",
            "Flowers may drop without setting fruit",
            "Reduced fruit production",
        ],
        "causes": [
            "Caused by Tomato yellow leaf curl virus (TYLCV)",
            "Transmitted by silverleaf whitefly (Bemisia tabaci)",
            "No plant-to-plant transmission without the vector",
            "Infected seedlings introduced into the field",
        ],
        "management": [
            "Control whitefly populations immediately",
            "Remove and destroy infected plants to prevent spread",
            "Apply systemic insecticides to manage whitefly vectors",
            "Use yellow sticky traps to monitor whitefly populations",
            "There is no cure — prevention through vector control is essential",
        ],
        "prevention": [
            "Plant resistant or tolerant varieties",
            "Use insect-proof screens in nurseries",
            "Apply reflective mulches to repel whiteflies",
            "Inspect and quarantine transplants before planting",
        ],
        "risk_conditions": {
            "temperature_range": [25, 35],
            "humidity_threshold": 50,
            "rainfall_risk": False,
        },
        "kannada": "ಯೆಲ್ಲೋ ಲೀಫ್ ಕರ್ಲ್ ವೈರಸ್",
        "hindi": "येलो लीफ कर्ल वायरस",
        "color": "#FFD700",
        "icon": "🟡",
    },

    "Tomato_Tomato_mosaic_virus": {
        "name": "Mosaic Virus",
        "scientific_name": "Tomato mosaic virus (ToMV)",
        "type": "Viral",
        "severity_default": "Moderate",
        "description": (
            "Tomato mosaic virus causes a distinctive mosaic pattern of light "
            "and dark green areas on leaves. It is highly contagious and spreads "
            "mechanically through contact."
        ),
        "symptoms": [
            "Light and dark green mosaic pattern on leaves",
            "Leaf distortion, curling, and blistering",
            "Stunted plant growth",
            "Mottled discoloration on fruit",
            "Internal browning of fruit in some strains",
        ],
        "causes": [
            "Caused by Tomato mosaic virus (ToMV)",
            "Spreads mechanically through sap on hands, tools, clothing",
            "Infected seeds can carry the virus",
            "Survives on crop debris for extended periods",
        ],
        "management": [
            "Remove and destroy infected plants",
            "Wash hands and disinfect tools between plants",
            "There is no cure — manage through sanitation and prevention",
            "Control insect vectors (aphids, thrips)",
        ],
        "prevention": [
            "Use virus-free certified seeds",
            "Plant resistant varieties with Tm-2 gene",
            "Avoid smoking near plants (tobacco can carry related viruses)",
            "Disinfect tools with 10% bleach or 70% alcohol",
        ],
        "risk_conditions": {
            "temperature_range": [22, 30],
            "humidity_threshold": 60,
            "rainfall_risk": False,
        },
        "kannada": "ಮೊಸಾಯಿಕ್ ವೈರಸ್",
        "hindi": "मोसैक वायरस",
        "color": "#32CD32",
        "icon": "🟩",
    },

    "Tomato_healthy": {
        "name": "Healthy",
        "scientific_name": "N/A",
        "type": "Healthy",
        "severity_default": "None",
        "description": (
            "Your tomato plant appears healthy. The leaf shows no visible signs "
            "of disease, pest damage, or nutrient deficiency. Continue your "
            "current care practices."
        ),
        "symptoms": ["No disease symptoms detected"],
        "causes": ["No disease causes — plant is healthy"],
        "management": [
            "Continue regular watering and fertilization",
            "Monitor plants weekly for early signs of disease",
            "Maintain proper plant spacing for air circulation",
            "Practice integrated pest management (IPM)",
        ],
        "prevention": [
            "Maintain regular scouting schedule",
            "Keep garden clean and free of debris",
            "Rotate crops each season",
            "Use balanced fertilization",
        ],
        "risk_conditions": {
            "temperature_range": [18, 30],
            "humidity_threshold": 70,
            "rainfall_risk": False,
        },
        "kannada": "ಆರೋಗ್ಯಕರ",
        "hindi": "स्वस्थ",
        "color": "#22C55E",
        "icon": "✅",
    },
}


def get_disease_info(class_name: str) -> dict:
    """Return disease information for a given class name."""
    disease = DISEASE_INFO.get(class_name)
    if disease is None:
        normalized_class = re.sub(r"[^a-z0-9]", "", class_name.casefold())
        disease = next(
            (
                info
                for known_class, info in DISEASE_INFO.items()
                if re.sub(r"[^a-z0-9]", "", known_class.casefold()) == normalized_class
            ),
            None,
        )
    if disease is not None:
        return disease
    return {
        "name": class_name.replace("_", " "),
        "type": "Unknown",
        "description": "No information available for this detection.",
        "symptoms": [],
        "causes": [],
        "management": ["Consult a local agricultural expert."],
        "prevention": [],
        "kannada": class_name,
        "hindi": class_name,
        "color": "#6B7280",
        "icon": "❓",
    }


def get_all_diseases() -> list:
    """Return a summary list of all known diseases."""
    return [
        {
            "class_name": k,
            "name": v["name"],
            "type": v["type"],
            "icon": v["icon"],
            "color": v["color"],
            "kannada": v.get("kannada", ""),
            "hindi": v.get("hindi", ""),
        }
        for k, v in DISEASE_INFO.items()
    ]
