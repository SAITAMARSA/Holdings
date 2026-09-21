/* Equipment catalog. Plain script (not JSON) so the site works from file:// too.
   `accent` drives the card artwork gradient. All brands, specs and prices are
   fictional demo content. */
window.SOLAR_PRODUCTS = [
  {
    id: "helion-h440",
    name: "Helion H440",
    category: "Panels",
    brand: "Helion",
    price: 289,
    warranty: 25,
    accent: "#d95926",
    blurb: "Our workhorse monocrystalline panel. Best cost per watt in the range and it ships from stock.",
    specs: { Output: "440 W", Efficiency: "21.4%", Cells: "108 half-cut" },
    tags: ["monocrystalline", "roof", "best value"]
  },
  {
    id: "helion-h505",
    name: "Helion H505 Pro",
    category: "Panels",
    brand: "Helion",
    price: 412,
    warranty: 30,
    accent: "#ff7a45",
    blurb: "Higher output per square metre for roofs where space runs out before budget does.",
    specs: { Output: "505 W", Efficiency: "23.1%", Cells: "132 half-cut" },
    tags: ["monocrystalline", "high output", "small roof"]
  },
  {
    id: "aureus-slate",
    name: "Aureus Slate",
    category: "Panels",
    brand: "Aureus",
    price: 498,
    warranty: 25,
    accent: "#4a3aa7",
    blurb: "All-black frame and backsheet. Chosen when the array has to disappear into the roofline.",
    specs: { Output: "410 W", Efficiency: "20.8%", Cells: "108 half-cut" },
    tags: ["all-black", "low profile", "heritage"]
  },
  {
    id: "aureus-tilefit",
    name: "Aureus TileFit",
    category: "Panels",
    brand: "Aureus",
    price: 615,
    warranty: 25,
    accent: "#3987e5",
    blurb: "In-roof mounting kit and panel in one. Sits flush with tiles instead of standing off them.",
    specs: { Output: "395 W", Efficiency: "20.1%", Cells: "108 half-cut" },
    tags: ["in-roof", "new build", "flush"]
  },
  {
    id: "voltbank-13",
    name: "Voltbank 13",
    category: "Batteries",
    brand: "Voltbank",
    price: 6400,
    warranty: 10,
    accent: "#199e70",
    blurb: "Covers a typical evening and overnight draw. The default choice for a three-bedroom home.",
    specs: { Capacity: "13.5 kWh", "Peak output": "7 kW", Chemistry: "LFP" },
    tags: ["lfp", "whole home", "backup"]
  },
  {
    id: "voltbank-26",
    name: "Voltbank 26 Stack",
    category: "Batteries",
    brand: "Voltbank",
    price: 11900,
    warranty: 10,
    accent: "#1baf7a",
    blurb: "Two units stacked on one controller. Worth it if you run a heat pump or charge overnight.",
    specs: { Capacity: "27 kWh", "Peak output": "11 kW", Chemistry: "LFP" },
    tags: ["lfp", "heat pump", "off-peak"]
  },
  {
    id: "voltbank-mini",
    name: "Voltbank Mini",
    category: "Batteries",
    brand: "Voltbank",
    price: 3250,
    warranty: 10,
    accent: "#008300",
    blurb: "Entry-size storage for shifting a few peak hours. Expandable later without swapping the inverter.",
    specs: { Capacity: "5 kWh", "Peak output": "3.3 kW", Chemistry: "LFP" },
    tags: ["lfp", "compact", "expandable"]
  },
  {
    id: "meridian-hybrid-6",
    name: "Meridian Hybrid 6",
    category: "Inverters",
    brand: "Meridian",
    price: 1850,
    warranty: 12,
    accent: "#eda100",
    blurb: "Solar and battery on one unit. Keeps essential circuits alive through a grid outage.",
    specs: { Rating: "6 kW", Efficiency: "97.5%", Strings: "2 MPPT" },
    tags: ["hybrid", "backup", "single phase"]
  },
  {
    id: "meridian-hybrid-10",
    name: "Meridian Hybrid 10",
    category: "Inverters",
    brand: "Meridian",
    price: 2640,
    warranty: 12,
    accent: "#c98500",
    blurb: "Three-phase sibling of the Hybrid 6, for larger arrays and heavier simultaneous loads.",
    specs: { Rating: "10 kW", Efficiency: "98.1%", Strings: "3 MPPT" },
    tags: ["hybrid", "three phase", "large array"]
  },
  {
    id: "meridian-micro",
    name: "Meridian Microline",
    category: "Inverters",
    brand: "Meridian",
    price: 165,
    warranty: 20,
    accent: "#d55181",
    blurb: "One microinverter per panel, priced per unit. The answer for roofs with awkward shading.",
    specs: { Rating: "400 W", Efficiency: "96.8%", Strings: "1 per panel" },
    tags: ["microinverter", "shading", "per panel"]
  },
  {
    id: "caldera-ev7",
    name: "Caldera EV7",
    category: "EV charging",
    brand: "Caldera",
    price: 890,
    warranty: 5,
    accent: "#4cc9f0",
    blurb: "Charges from surplus generation instead of the grid. Tracks the array minute by minute.",
    specs: { Rating: "7.4 kW", Mode: "Solar-matched", Cable: "5 m tethered" },
    tags: ["ev", "surplus", "smart"]
  },
  {
    id: "caldera-sense",
    name: "Caldera Sense",
    category: "Monitoring",
    brand: "Caldera",
    price: 240,
    warranty: 5,
    accent: "#e66767",
    blurb: "Circuit-level metering so you can see which loads actually move the bill, not just the total.",
    specs: { Channels: "12", Sampling: "1 s", Export: "CSV + API" },
    tags: ["metering", "per circuit", "api"]
  }
];
