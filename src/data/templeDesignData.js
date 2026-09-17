export const templeStylesData = [
  {
    id: "dravidian",
    name: "Classical Dravidian",
    era: "6th – 12th Century CE",
    origin: "Pallava & Early Chola Heartland",
    description: "The foundational architectural lexicon of South Indian temples. Defined by square sanctums (Garbhagriha), tiered pyramidal superstructures (Vimanas) capped by octagonal or circular stone domical crowns (Shikharas), and pillared ardha-mandapams.",
    keyFeatures: [
      "Adhisthana (Moulded stone plinth with lotus and elephant friezes)",
      "Pilasters with refined capital brackets (Kuta and Sala niches)",
      "Strict horizontal tier registers (Talas) ascending harmoniously",
      "Kudu arched windows and decorative horse-shoe gavaksha motifs"
    ],
    canonicalText: "Mayamata & Manasara Shilpa Shastras",
    stonePreference: "Gneissic Granite, Dark Krishna Shila"
  },
  {
    id: "chola",
    name: "Imperial Chola",
    era: "9th – 13th Century CE",
    origin: "Thanjavur, Gangaikonda Cholapuram & Darasuram",
    description: "The zenith of monumental granite engineering in world history. Marked by colossal Vimanas that dramatically dwarf the peripheral entrance gopurams. Built exclusively of massive interlocking granite monoliths engineered to withstand millennia without structural decay.",
    keyFeatures: [
      "Monumental Vimana (Up to 216 feet) crowned with a single 80-tonne monolithic cupola",
      "Double-storeyed sanctum ambulatory corridor (Sandhara)",
      "Heroic scale, severe geometric perfection, and minimal superficial ornament",
      "Integrated water engineering (sacred Teppakulam reservoirs)"
    ],
    canonicalText: "Brihat Samhita & Kamika Agama",
    stonePreference: "Dense Plutonic Granite (Karunkal)"
  },
  {
    id: "pandya",
    name: "Later Pandya",
    era: "12th – 14th Century CE",
    origin: "Madurai & Tirunelveli Basin",
    description: "A profound spatial paradigm shift: the peripheral entrance towers (Rajagopurams) grew colossal and soared far higher than the central sanctum Vimana. Features graceful concave silhouette curves and deeply undercut stone relief carvings.",
    keyFeatures: [
      "Sky-scraping Rajagopuram gateways with 7, 9, or 11 diminishing tiers",
      "Curved roll-cornices (Kodungai) with water drop stone droplets",
      "Elaborate Kirtimukha (Face of Glory) crests crowning each tier",
      "Expansive concentric prakaram stone boulevards"
    ],
    canonicalText: "Kasyapa Shilpa Shastra",
    stonePreference: "Granite Plinths with Brick-Lime Superstructure"
  },
  {
    id: "vijayanagara",
    name: "Vijayanagara & Nayaka",
    era: "14th – 17th Century CE",
    origin: "Hampi, Madurai & Rameswaram",
    description: "The theatrical and acoustic peak of South Indian sacred design. Characterized by vast 1,000-pillar hypostyle halls (Kalyana Mandapams), monolithic musical columns tuned to musical scales, and rearing mythical Yali horsemen.",
    keyFeatures: [
      "Monolithic musical pillars that chime tones when tapped",
      "Rearing Yali and rampant cavalry beast columns carved from single stones",
      "Elaborate pushpa-potika (hanging floral bud) brackets",
      "Corbelled granite stone ceilings with inverted lotus bosses"
    ],
    canonicalText: "Suprabhedagama & Shilpa Ratna",
    stonePreference: "Resonant Crystalline Biotite Granite"
  }
];

export const templeAnatomyData = [
  {
    id: "gopuram",
    name: "Gopuram (राजगोपुरम्)",
    role: "The Monumental Gateway Tower",
    meaning: "The cosmic threshold bridging the mundane exterior world with the sacred interior reality. Symbolizes the feet of the cosmic deity (Viraat Purusha).",
    geometry: "Oblong rectangular base tapering vertically with a trapezoidal profile, topped with a barrel-vaulted Shala roof and gold-plated Kalasam finials (always an odd number: 5, 7, 9, or 11).",
    materials: "Dressed granite base (adhisthana) with sculpted stone and lime-mortar superstructure.",
    significance: "Visible from miles away, reminding travelers to orient their consciousness toward the divine.",
    hotspot: { x: "28%", y: "35%" }
  },
  {
    id: "vimana",
    name: "Vimana (विमान)",
    role: "The Sacred Sanctum Tower",
    meaning: "The vertical axis mundi directly crowning the Garbhagriha. Represents the cosmic mountain (Mount Meru) and channels celestial cosmic energy downward into the deity.",
    geometry: "Square base ascending in stepped pyramidal horizontal tiers (Talas), capped by the Greeva (neck), Shikhara (domical stone crown), and Stupi (finial).",
    materials: "100% solid granite monolithic interlocking masonry.",
    significance: "The heart and soul of the temple; in Chola tradition, the Vimana dominates the entire landscape.",
    hotspot: { x: "72%", y: "24%" }
  },
  {
    id: "garbhagriha",
    name: "Garbhagriha (गर्भगृह)",
    role: "The Womb Chamber / Inner Sanctum",
    meaning: "The silent, unadorned center of pure consciousness. Where the consecrated Moolavar deity resides in complete focus and darkness, lit only by oil lamps.",
    geometry: "Perfect square based on the 1x1 central Brahma-sthana of the Vastu Mandala. Thick monolithic walls with no exterior windows to preserve sacred acoustics and thermal stability.",
    materials: "Dense black Krishna granite (Karunkal), hand-honed to seamless precision.",
    significance: "All temple geometry, alignments, and Ayadi ratios radiate outward from this singular focal point.",
    hotspot: { x: "72%", y: "68%" }
  },
  {
    id: "mandapam",
    name: "Mandapam (मण्डपम्)",
    role: "Acoustic Pillared Assembly Pavilion",
    meaning: "Hypostyle pillared hall designed for sacred gatherings, classical Carnatic music, Veda chanting, and dance rituals (Ardha-Mandapam, Maha-Mandapam, Kalyana-Mandapam).",
    geometry: "Rectangular or square pillared hall with modular rhythmic spacing based on musical intervals and sacred proportional modules.",
    materials: "Carved granite monolithic columns with monolithic cross-lintels and carved stone roof slabs.",
    significance: "Transforms reverberating soundwaves into spiritual resonance through acoustic stone geometry.",
    hotspot: { x: "52%", y: "62%" }
  },
  {
    id: "prakaram",
    name: "Prakaram (प्राकार)",
    role: "Concentric Cloistered Courtyards",
    meaning: "The multi-tiered concentric ambulatory corridors surrounding the central sanctum. Symbolizes the five protective sheaths (Pancha Koshas) enclosing the immortal human soul.",
    geometry: "Concentric rectangular stone-paved walkways flanked by continuous covered colonnades.",
    materials: "Paved granite slabs with peripheral stone drainage and rainwater harvesting catchments.",
    significance: "Facilitates Pradakshina (sacred circumambulation), calming the mind step by step before reaching the sanctum.",
    hotspot: { x: "42%", y: "82%" }
  },
  {
    id: "dhwajastambha",
    name: "Dhwajastambha & Balipeetham (ध्वजस्तम्भ)",
    role: "The Cosmic Flagstaff & Altar of Surrender",
    meaning: "Represents the Sushumna Nadi (the central spine of spiritual energy) and the axis linking earth to the heavens. Devotees offer their ego before entering.",
    geometry: "Monolithic granite core sheathed in consecrated brass or gold-leaf copper rings, aligned in an exact straight line with the deity.",
    materials: "Solid seasoned teak or granite core encased in embossed repoussé bronze/gold.",
    significance: "Acts as a spiritual lightning rod protecting the sanctum during cosmic events and lightning strikes.",
    hotspot: { x: "36%", y: "58%" }
  }
];
