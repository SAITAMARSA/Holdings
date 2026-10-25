/* 🇿🇦 Mzansi pack — South African flavour for every deck: local soapies, SA Netflix shows, braai culture,
 * slang, food, places. Light-hearted only. Items are tagged "sa" so a game can offer a "just Mzansi" mode. */
(function () {
  "use strict";
  const PP = window.PP, E = PP.engine;
  const sa = (extra) => ["sa"].concat(extra || []);

  /* ---------- Emoji Charades ---------- */
  const mk = (c, v, g) => (t, a) => ({ t, c, v: v || "f", g: sa([g]), a: a || [] });
  const movie = mk("Movie", "f", "movie"), song = mk("Song", "f", "song"), food = mk("Food", "f", "food"), place = mk("Place", "f", "place"),
        phrase = mk("Phrase", "f", "phrase"), sit = mk("Everyday disaster", "s", "disaster");
  E.extendDeck("charades", [
    movie("Blood & Water", ["blood and water"]), movie("Queen Sono"), movie("Kings of Joburg", ["kings of johannesburg", "kings of jo'burg"]), movie("Savage Beauty"), movie("Jiva", ["jiva!"]),
    movie("How to Ruin Christmas"), movie("The Gods Must Be Crazy", ["gods must be crazy"]), movie("Tsotsi"), movie("Sarafina", ["sarafina!"]), movie("Invictus"), movie("Chappie"), movie("Skeem Saam"),
    movie("Generations"), movie("Isidingo"), movie("Uzalo"), movie("The River"), movie("Muvhango"), movie("7de Laan", ["sewende laan"]), movie("Scandal", ["scandal!"]), movie("Gomora"), movie("Rhythm City"),
    movie("Idols South Africa", ["idols sa", "idols"]), movie("MasterChef South Africa", ["masterchef sa", "masterchef"]), movie("Top Billing"), movie("Emily in Paris"), movie("Heartstopper"), movie("Queer Eye"),
    movie("Nailed It", ["nailed it!"]), movie("Is It Cake", ["is it cake?"]), movie("The Great British Bake Off", ["bake off", "great british bake off"]), movie("Love Is Blind"), movie("Selling Sunset"),
    movie("Never Have I Ever"), movie("Ginny and Georgia", ["ginny & georgia"]), movie("Cobra Kai"), movie("Virgin River"), movie("Outer Banks"), movie("Floor Is Lava", ["the floor is lava"]),
    song("Jerusalema"), song("Shosholoza"), song("Pata Pata"), song("Asimbonanga"), song("Impi"), song("Weekend Special"), song("Vuli Ndlela"), song("Ke Star"), song("Bobbejaan Klim Die Berg", ["bobbejaan"]), song("Suikerbossie"),
    food("Braai", ["barbecue", "bbq"]), food("Biltong"), food("Bunny chow", ["bunny"]), food("Boerewors roll", ["boerewors", "wors roll"]), food("Pap and vleis", ["pap en vleis", "pap and meat"]), food("Koeksisters", ["koeksister"]),
    food("Melktert", ["milk tart"]), food("Vetkoek", ["fat cakes"]), food("Amagwinya"), food("Rusks", ["rusk"]), food("Rooibos tea", ["rooibos"]), food("Chakalaka"), food("Gatsby"), food("Kota", ["spatlo"]),
    food("Peppermint Crisp tart", ["peppermint crisp"]), food("Malva pudding", ["malva"]), food("Potjiekos", ["potjie"]), food("Sosaties", ["sosatie"]), food("Droewors", ["droëwors"]), food("Chutney sandwich"),
    place("Table Mountain"), place("Cape Point"), place("Kruger Park", ["kruger national park", "kruger"]), place("Robben Island"), place("Sun City"), place("Soweto"), place("Durban beachfront", ["golden mile"]),
    place("Sani Pass"), place("Drakensberg", ["the berg"]), place("Blyde River Canyon", ["blyde canyon"]), place("V&A Waterfront", ["waterfront", "va waterfront"]), place("Camps Bay"), place("Union Buildings"),
    place("Gold Reef City"), place("uShaka Marine World", ["ushaka"]), place("Hout Bay"), place("Stellenbosch winelands", ["stellenbosch", "winelands"]), place("Garden Route"), place("Bo-Kaap", ["bo kaap"]),
    phrase("Eish"), phrase("Ja nee", ["yes no"]), phrase("Just now"), phrase("Now now"), phrase("Lekker"), phrase("Howzit"), phrase("Sharp sharp", ["sharp"]), phrase("Shame man", ["shame"]), phrase("Yebo"),
    phrase("Aweh"), phrase("Ag man"), phrase("Hayibo", ["haibo", "hayibo!"]), phrase("Braai day", ["heritage day"]), phrase("Is it", ["is it?"]), phrase("Do the robot", ["robot"]),
    sit("Load shedding mid-episode", ["load shedding", "loadshedding", "power cut"]), sit("Forgot the charcoal for the braai", ["no charcoal"]), sit("Waiting at a robot", ["red robot", "red light"]),
    sit("Rain on braai day", ["rain at the braai"]), sit("Dropped the boerewors in the dirt", ["dropped boerewors"]), sit("Queue at the spaza shop", ["spaza shop queue", "spaza"]),
    sit("Hadeda wakes everyone at dawn", ["hadeda", "hadeda at dawn"]), sit("Dog stole the biltong", ["dog biltong"]), sit("Pothole eats a wheel", ["pothole"]), sit("Are we there yet on the N1", ["are we there yet"]),
    sit("Generator won't start", ["generator"]), sit("Wind blows the umbrella inside out", ["umbrella inside out"]), sit("Lost the braai tongs", ["where are the tongs"]),
  ]);

  /* ---------- Describe It: its own "Mzansi" deck ---------- */
  const dz = (t, a) => ({ t, c: "Mzansi", v: "f", g: sa(["mzansi"]), a: a || [] });
  E.extendDeck("describe", [
    dz("Generations"), dz("Isidingo"), dz("Uzalo"), dz("Skeem Saam"), dz("The River"), dz("Muvhango"), dz("7de Laan"), dz("Scandal"), dz("Gomora"), dz("Rhythm City"), dz("Top Billing"),
    dz("Idols South Africa", ["idols sa", "idols"]), dz("Blood & Water", ["blood and water"]), dz("Queen Sono"), dz("Kings of Joburg"), dz("Savage Beauty"), dz("Jiva"), dz("How to Ruin Christmas"),
    dz("Braai"), dz("Biltong"), dz("Bunny chow"), dz("Boerewors roll"), dz("Koeksisters"), dz("Melktert"), dz("Vetkoek"), dz("Rusks"), dz("Rooibos tea"), dz("Gatsby"), dz("Potjiekos"), dz("Chakalaka"),
    dz("Vuvuzela"), dz("Bakkie"), dz("Minibus taxi", ["taxi", "kombi"]), dz("Spaza shop", ["spaza"]), dz("Load shedding"), dz("Braai tongs"), dz("Hadeda"), dz("Springbok", ["bokke"]), dz("Protea"), dz("Meerkat"),
    dz("Table Mountain"), dz("Kruger Park"), dz("Cable car"), dz("Robben Island"), dz("Sun City"), dz("Soweto"), dz("Durban beach"), dz("Cape Town wind", ["cape doctor"]), dz("Shweshwe"), dz("Traffic robot", ["robot"]),
    dz("Bafana Bafana"), dz("Proteas cricket", ["proteas"]), dz("Rugby on a Saturday", ["rugby"]), dz("Braai day", ["heritage day"]), dz("Boerie roll"), dz("Peppermint Crisp tart"), dz("Malva pudding"),
  ].concat(
    ["Emily in Paris", "Heartstopper", "Queer Eye", "Nailed It", "Is It Cake", "The Great British Bake Off", "Love Is Blind", "Selling Sunset", "Never Have I Ever", "Ginny and Georgia", "Cobra Kai", "Virgin River", "Outer Banks", "Floor Is Lava", "Too Hot to Handle", "Lupin"].map((t) => ({ t, c: "TV", v: "f", g: ["tv"], a: [] }))));

  /* ---------- Draw & Guess ---------- */
  const dw = (t, v, a) => ({ t, v: v || "f", g: sa([v === "s" ? "absurd" : "thing"]), a: a || [] });
  E.extendDeck("draw", [
    dw("Braai"), dw("Vuvuzela"), dw("Table Mountain"), dw("Springbok"), dw("Protea flower", "f", ["protea"]), dw("Minibus taxi", "f", ["taxi", "kombi"]), dw("Bunny chow", "f", ["bunny"]), dw("Biltong"), dw("Rooibos teapot", "f", ["rooibos", "teapot"]),
    dw("Hadeda"), dw("Meerkat"), dw("Elephant at the waterhole", "f", ["elephant waterhole"]), dw("Boulders Beach penguins", "f", ["penguins", "penguin"]), dw("Cable car"), dw("Bakkie"), dw("Spaza shop"), dw("Traffic robot", "f", ["robot", "traffic light"]),
    dw("Boerewors roll", "f", ["boerewors"]), dw("Potjie pot", "f", ["potjie"]), dw("Rusk and a cup of tea", "f", ["rusk"]), dw("Koeksister"), dw("Rhino"), dw("Giraffe at sunset", "f", ["giraffe"]), dw("Lighthouse at Cape Point", "f", ["lighthouse"]),
    dw("A hadeda on a braai", "s", ["hadeda braai"]), dw("A springbok in a bakkie", "s", ["springbok bakkie"]), dw("A meerkat at a braai", "s", ["meerkat braai"]), dw("A penguin on Table Mountain", "s", ["penguin table mountain"]),
    dw("A vuvuzela at the library", "s", ["vuvuzela library"]), dw("A taxi full of penguins", "s", ["taxi penguins"]), dw("A braai on a surfboard", "s", ["braai surfboard"]), dw("A hadeda driving a minibus", "s", ["hadeda taxi", "hadeda minibus"]),
    dw("A giraffe at a traffic robot", "s", ["giraffe robot"]), dw("Load shedding at a disco", "s", ["load shedding disco"]), dw("A rusk dunking itself", "s", ["rusk dunking"]), dw("A springbok eating bunny chow", "s", ["springbok bunny chow"]),
  ]);

  /* ---------- Hot Takes ---------- */
  const R = (q, i, v, g) => ({ t: q, i, v: v || "f", g: sa([g || "food"]) });
  E.extendDeck("ranks", [
    R("Rank these braai sides, best to worst", ["Pap & chakalaka 🌽", "Potato salad 🥔", "Garlic bread 🧄", "Coleslaw 🥗", "Braaibroodjie 🥪"], "f", "braai"),
    R("Rank these things on the braai", ["Boerewors 🌭", "Lamb chops 🍖", "Sosaties 🍢", "Steak 🥩", "Chicken wings 🍗"], "f", "braai"),
    R("Rank these SA desserts", ["Melktert 🥧", "Malva pudding 🍮", "Koeksister 🍩", "Peppermint Crisp tart 🍫", "Ice cream & Oros 🍦"], "f", "food"),
    R("Rank these ways to survive load shedding", ["Candles & chat 🕯️", "Board games 🎲", "A long nap 😴", "Braai it all 🔥", "Power bank & Netflix 🔋"], "f", "loadshedding"),
    R("Rank these SA sounds, least annoying first", ["Vuvuzela 📯", "Hadeda at dawn 🐦", "Taxi hooter 🚕", "Rain on a tin roof 🌧️", "Crackling braai fire 🔥"], "s", "sounds"),
    R("Rank these SA holiday spots", ["Garden Route 🌿", "Durban beaches 🏖️", "Kruger Park 🐘", "Cape Town 🏔️", "The Drakensberg ⛰️"], "f", "travel"),
    R("Rank these rusk habits", ["Dunk quickly 🫖", "Dunk until it falls apart 🫠", "Eat dry 🦷", "Rusk in coffee ☕", "Rusk in rooibos 🍵"], "s", "food"),
    R("Rank these SA snacks", ["Biltong 🥓", "Chappies 🍬", "Simba chips 🥔", "Jelly Tots 🍭", "Droëwors 🌭"], "f", "food"),
    R("Rank these soapie plot twists", ["'You're my long-lost twin!' 👯", "Everyone's secretly related 🌳", "The will is read 📜", "A very dramatic slap ✋", "Amnesia. Again. 🤕"], "s", "tv"),
    R("Rank these ways to get around", ["Minibus taxi 🚐", "Bakkie 🛻", "Gautrain 🚆", "Bicycle 🚲", "Walking 🚶"], "f", "travel"),
    R("Rank these things to hear at a braai", ["'The fire's ready!' 🔥", "'Who has the tongs?' 🥢", "'It's starting to rain…' 🌧️", "'The meat is done!' 🥩", "'Who brought the salad?' 🥗"], "s", "braai"),
    R("Rank these Netflix moods", ["A feel-good SA drama 🇿🇦", "A rom-com 💕", "A baking show 🎂", "A comedy special 🎤", "A cartoon 🐭"], "f", "tv"),
    R("Rank these hot drinks on a cold Cape evening", ["Rooibos 🍵", "Hot chocolate 🍫", "Coffee ☕", "Milo 🥛", "Chai 🫖"], "f", "food"),
    R("Rank these as a braai-master nickname", ["Tongs Tyson 🥢", "Sir Sizzle 🔥", "Chop Chop Charlie 🍖", "The Boerie Baron 🌭", "Smokey Joe 💨"], "s", "braai"),
    R("Rank these SA animals as a pet", ["Meerkat 🦦", "Springbok 🦌", "Hadeda 🐦", "Penguin 🐧", "Giraffe 🦒"], "s", "animal"),
    R("Rank these after-braai activities", ["Sit by the fire 🔥", "Play music 🎶", "Games 🃏", "Dessert 🍰", "Nap on the grass 😴"], "f", "braai"),
    R("Rank these SA slang words", ["Lekker 😎", "Eish 😬", "Sharp sharp 👍", "Howzit 👋", "Ja nee 🤷"], "f", "slang"),
    R("Rank these for a lazy Sunday", ["Braai 🔥", "Roast lunch 🍗", "Beach 🏖️", "Netflix marathon 📺", "Sunday drive 🚗"], "f", "plans"),
  ]);

  /* ---------- Vibe Check ---------- */
  const S = (l, r, v, g) => ({ t: l + " ↔ " + r, l, r, v: v || "f", g: sa([g || "general"]) });
  E.extendDeck("spectrums", [
    S("Load shedding", "Lights on all day"), S("Soft pap", "Stywe pap", "f", "food"), S("Sharp sharp", "Eish"), S("Braai master", "Braai disaster", "s", "braai"), S("Quiet Karoo", "Busy Joburg"),
    S("Cold Cape winter", "Hot Durban summer"), S("Rusk dunked briefly", "Rusk dunked forever", "s", "food"), S("Bakkie", "Sports car"), S("Boerewors", "Steak", "f", "food"), S("Just now", "Right now", "s", "slang"),
    S("Underdone boerie", "Burnt boerie", "s", "braai"), S("Soapie drama", "Quiet documentary", "f", "tv"), S("Lekker", "Not lekker", "f", "slang"), S("Taxi chaos", "Calm train ride"), S("Mild chutney", "Hot chutney", "f", "food"),
    S("Worst braai side", "Best braai side", "f", "braai"), S("Plain rusk", "Fancy rusk", "f", "food"), S("Windy Cape Town", "Still Joburg day"), S("Mzansi's best export", "Mzansi's best-kept secret"), S("Cheap spaza snack", "Fancy restaurant meal", "f", "food"),
  ]);

  /* ---------- Pitch It ---------- */
  const P = (t, v, g) => ({ t, v: v || "f", g: sa([g || "product"]) });
  E.extendDeck("pitch-product", [
    P("A braai that lights itself 🔥"), P("A bakkie that parks itself 🛻"), P("A load-shedding-proof kettle ⚡"), P("A vuvuzela with a volume knob 📯", "s"), P("A self-cleaning braai grid 🧽"), P("A mug that dunks your rusk ☕", "s"),
    P("An umbrella for Highveld thunderstorms ☔"), P("A potjie pot that stirs itself 🍲"), P("Biltong that never runs out 🥓", "s"), P("A drone that delivers from the spaza shop 🚁"), P("A robot that explains 'now now' vs 'just now' 🤖", "s"),
    P("Tongs that never get lost 🥢"), P("A hadeda alarm clock 🐦", "s"), P("A taxi with a built-in disco 🚐", "s"), P("Wind-proof hair for Cape Town 💨"), P("A Netflix remote that shouts when load shedding hits 📺"),
  ]);
  E.extendDeck("pitch-customer", [
    P("a Springbok supporter on match day 🏉", "f", "customer"), P("a taxi driver at a red robot 🚦", "f", "customer"), P("a gogo who controls the TV remote 👵", "f", "customer"), P("a kid at the spaza shop 🍬", "f", "customer"),
    P("a Capetonian in the wind 🌬️", "f", "customer"), P("a Joburger stuck in traffic 🚗", "f", "customer"), P("a Durban surfer 🏄", "f", "customer"), P("a Karoo farmer with a very big hat 🤠", "f", "customer"),
    P("a very serious braai master 🔥", "s", "customer"), P("an Uber driver in Sandton 🚕", "f", "customer"), P("a meerkat with a mortgage 🦦", "s", "customer"), P("a hadeda with opinions 🐦", "s", "customer"),
  ]);

  /* ---------- Gift Shop ---------- */
  PP.GIFT_ITEMS.push(["🥓", "A Stick of Biltong (Disappears Fast)", 2], ["🍪", "Tin of Rusks, Dunk-Ready", 3], ["📯", "Vuvuzela (Neighbours Not Included)", 3], ["🧣", "Shweshwe Scarf with Attitude", 4],
    ["🥢", "Golden Braai Tongs", 4], ["🕯️", "Load-Shedding Candle Collection", 2], ["🔋", "Power Bank for Emergencies of the Heart", 4], ["🏔️", "Table Mountain Snow Globe (No Snow)", 3],
    ["🌺", "Bouquet of Proteas", 4], ["🍵", "Rooibos Hug in a Mug", 2], ["🥪", "Bunny Chow Voucher", 3], ["🍲", "Potjie Pot, Seasoned by Hope", 6], ["🐦", "Hadeda Plush (Squawks on Request)", 3], ["🦦", "Meerkat Lookout Buddy", 3],
    ["🍬", "Bag of Chappies", 1], ["🥧", "Melktert, Still Warm", 3], ["🎟️", "Braai Invite (Bring Your Own Salad)", 2], ["🚐", "Ride in a Disco Taxi", 5]);
  const MU = (t, v, g) => ({ t, v: v || "f", g: sa([g]) });
  E.extendDeck("gift-occasion", [MU("It's braai day", "f", "braai"), MU("Load shedding just ended after four hours", "f", "mundane"), MU("They survived rush hour on the N1", "f", "mundane"), MU("The Springboks won (or lost) and feelings are strong", "f", "sport"), MU("Their rusk didn't break off in the tea", "s", "silly"), MU("They finally understood 'now now' vs 'just now'", "s", "silly")]);
  E.extendDeck("gift-quirk", [MU("has opinions about the correct braai fire", "f", "braai"), MU("dunks rusks until they dissolve", "s", "food"), MU("narrates soapie plots from memory", "f", "tv"), MU("always asks 'is it?' at the right moment", "s", "slang"), MU("negotiates with the traffic robot", "s", "quirk"), MU("keeps biltong in every handbag", "f", "food")]);

  /* ---------- Story Chain & Two Truths ---------- */
  const O = (t, v) => ({ t, v: v || "f", g: sa(["opener"]) });
  E.extendDeck("story-opener", [
    O("It was a quiet Sunday braai until the boerewors started singing.", "s"), O("The hadeda knocked on the window and demanded rusks.", "s"), O("When load shedding hit, the whole street came out to tell stories.", "f"),
    O("The bakkie had never driven to Table Mountain on its own before.", "s"), O("A meerkat in a tuxedo strolled into the spaza shop and asked for the manager.", "s"), O("The minibus taxi took a very surprising detour to the beach.", "f"),
    O("Nobody knew who invited the springbok to the braai, but he brought dessert.", "s"), O("It started with a lost pair of braai tongs and ended in a parade.", "f"),
  ]);
  E.extendDeck("story-twist", [{ t: "A hadeda delivers an important message", v: "s", g: sa(["twist"]) }, { t: "Load shedding strikes at the worst possible moment", v: "f", g: sa(["twist"]) }, { t: "A taxi arrives with a very surprising passenger", v: "s", g: sa(["twist"]) }]);
  E.extendDeck("truth-topic", ["🔥 Braai stories", "⚡ Load-shedding adventures", "🚐 Taxi adventures", "🛒 Spaza shop memories", "📺 Soapie obsessions"].map((t) => ({ t, v: "f", g: sa(["topic"]) })));
})();
