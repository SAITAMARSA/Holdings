/* Data for the "trust" games: Think Alike prompts, Mind Meld starter words, Word Duo answers. All wholesome. */
(function () {
  "use strict";
  const PP = window.PP, E = PP.engine;
  const Q = (t, o, v, g, sa) => ({ t, o, v: v || "f", g: (sa ? ["sa"] : []).concat([g || "general"]) });
  E.registerDeck("think-alike", [
    Q("Pick the perfect braai side", ["Pap & chakalaka 🌽", "Potato salad 🥔", "Garlic bread 🧄", "Coleslaw 🥗"], "f", "braai", 1),
    Q("What do you do when load shedding hits?", ["Board games 🎲", "Candles & chat 🕯️", "A long nap 😴", "Netflix on a power bank 📱"], "f", "loadshedding", 1),
    Q("Rusks go best with…", ["Rooibos 🍵", "Coffee ☕", "Milk 🥛", "Eaten dry 😅"], "f", "food", 1),
    Q("Pick a Saturday plan", ["Braai 🔥", "Beach 🏖️", "Netflix 📺", "Road trip 🚗"], "f", "plans", 1),
    Q("Pick a weekend getaway", ["Garden Route 🌿", "Durban 🏖️", "Kruger 🐘", "Cape Town 🏔️"], "f", "travel", 1),
    Q("Pick a Netflix mood", ["SA drama 🇿🇦", "Rom-com 💕", "Baking show 🎂", "Comedy special 🎤"], "f", "tv", 1),
    Q("Pick a dessert", ["Melktert 🥧", "Malva pudding 🍮", "Koeksister 🍩", "Ice cream 🍦"], "f", "food", 1),
    Q("Pick a braai meat", ["Boerewors 🌭", "Chops 🍖", "Steak 🥩", "Chicken 🍗"], "f", "braai", 1),
    Q("Pick a soapie plot", ["Big family drama 👨‍👩‍👧", "Love triangle 💘", "Secret twin 👯", "Dramatic slap ✋"], "s", "tv", 1),
    Q("Pick a road-trip soundtrack", ["Amapiano 🕺", "Singalong classics 🎤", "Classic rock 🎸", "Chill acoustic 🎶"], "f", "music", 1),
    Q("Pick a way to travel", ["Plane ✈️", "Train 🚆", "Bakkie 🛻", "Minibus taxi 🚐"], "f", "travel", 1),
    Q("Pick a snack", ["Biltong 🥓", "Chips 🥔", "Chocolate 🍫", "Popcorn 🍿"], "f", "food", 1),
    Q("Pick a pizza topping", ["Pepperoni 🍕", "Mushrooms 🍄", "Pineapple 🍍", "Extra cheese 🧀"], "f", "food"),
    Q("Pick a superpower", ["Flying 🕊️", "Teleporting ✨", "Talking to animals 🐶", "Stopping time ⏱️"], "f", "power"),
    Q("Pick a colour", ["Pink 💗", "Blue 💙", "Green 💚", "Yellow 💛"], "f", "colour"),
    Q("Pick an animal", ["Dog 🐶", "Cat 🐱", "Penguin 🐧", "Giraffe 🦒"], "f", "animal"),
    Q("Pick a breakfast", ["Pancakes 🥞", "Eggs 🍳", "Cereal 🥣", "Toast 🍞"], "f", "food"),
    Q("Pick a season", ["Spring 🌸", "Summer ☀️", "Autumn 🍂", "Winter ❄️"], "f", "weather"),
    Q("Pick a cosy thing", ["Blanket 🧣", "Hot-water bottle 🫖", "Fireplace 🔥", "Fluffy socks 🧦"], "f", "cozy"),
    Q("Pick a cartoon", ["Bluey 🐶", "SpongeBob 🧽", "Tom & Jerry 🐭", "Peppa Pig 🐷"], "f", "tv"),
    Q("Pick a date night", ["Home-cooked dinner 🍝", "Mini golf ⛳", "Stargazing ✨", "Movie & takeaway 🍕"], "f", "plans"),
    Q("Pick a hobby", ["Baking 🧁", "Hiking 🥾", "Gaming 🎮", "Dancing 💃"], "f", "hobby"),
    Q("Pick a sound", ["Rain on a tin roof 🌧️", "Braai crackle 🔥", "Ocean waves 🌊", "Birdsong 🐦"], "f", "sounds", 1),
    Q("Pick a hot drink", ["Rooibos 🍵", "Coffee ☕", "Hot chocolate 🍫", "Chai 🫖"], "f", "food", 1),
    Q("Pick a place to wake up", ["Treehouse 🌳", "Beach hut 🏝️", "Castle 🏰", "Cabin in the mountains ⛰️"], "s", "place"),
    Q("Pick a silly hat", ["Wizard hat 🧙", "Pirate hat 🏴‍☠️", "Chef hat 👨‍🍳", "Crown 👑"], "s", "silly"),
    Q("Pick a sidekick", ["Talking parrot 🦜", "Brave goat 🐐", "Tiny dragon 🐉", "Dramatic llama 🦙"], "s", "silly"),
    Q("Pick a Sunday vibe", ["Roast lunch 🍗", "Sunday drive 🚗", "Braai 🔥", "Sleep in 😴"], "f", "plans", 1),
    Q("Pick a sweet treat", ["Chappies 🍬", "Jelly tots 🍭", "Peppermint Crisp 🍫", "Marshmallows 🍡"], "f", "food", 1),
    Q("Pick a game night game", ["Charades 🎭", "Board game 🎲", "Cards 🃏", "Trivia 🧠"], "f", "games"),
    Q("Pick an ice-cream flavour", ["Vanilla 🍦", "Chocolate 🍫", "Strawberry 🍓", "Mint choc chip 🌿"], "f", "food"),
    Q("Pick a thing to bring to a braai", ["Salad 🥗", "Dessert 🍰", "Drinks 🧃", "Good music 🎶"], "f", "braai", 1),
    Q("Pick a mood for tonight", ["Cosy 🛋️", "Silly 🤪", "Adventurous 🧭", "Sleepy 😴"], "f", "mood"),
  ]);

  E.registerDeck("mind-words", ["braai", "taxi", "robot", "rusk", "rooibos", "biltong", "bakkie", "protea", "springbok", "sunshine", "pizza", "ocean", "rainbow", "moon", "castle", "guitar", "cheese", "rocket", "bicycle", "banana", "thunder", "puzzle", "balloon",
    "sandwich", "mountain", "jungle", "popcorn", "umbrella", "island", "camera", "pirate", "wizard", "penguin", "giraffe", "pancake", "treasure", "lantern", "carnival", "picnic", "sunset", "waterfall", "kite", "teapot", "piano", "marshmallow", "campfire", "dragon", "trampoline", "doughnut", "volcano", "lighthouse", "seashell"]
    .map((t) => ({ t, v: "f", g: ["word"] })));

  PP.WORDS = ("about above actor adult after again agree ahead alarm album alive allow alone along amaze angel apple apron arena arise armor aroma arrow aside asset avoid award aware awful bacon badge baker basic basin batch beach beard beast begin being below bench berry black blade blame blank blast blaze blend bless blind block blond bloom board boast bonus boost booth braai brain brake brand brave bread break brick bride brief bring broad brown brush buddy build bunch burst buyer cabin cable candy canoe carry carve catch cause chain chair chalk charm chart chase cheap check cheek cheer chess chest chick chief child chill choir chord chunk cider civil claim class clean clear clerk click cliff climb clock close cloth cloud clown coach coast cocoa color couch could count court cover crack craft crane crazy cream creek crisp cross crowd crown crush curly curry curve daily dairy daisy dance dealt decor delay dense depth diary dizzy dodge donut doubt dough dozen draft drain drama dream dress dried drift drink drive eager eagle early earth eight elbow elder email empty enjoy enter equal event every exact extra faint fairy faith fancy feast fence fever fiber field fifth fifty fight final first flame flash fleet float flock flood floor flour fluid flute focus force forth forum found frame fresh fried front frost fruit funny giant glass globe glory glove grace grade grain grand grape graph grass great green greet grill group guard guess guest guide habit happy heart heavy hello honey honor horse hotel house human humor hurry ideal image index inner input issue ivory jelly jewel jolly judge juice jumbo kayak kombi label laser later laugh layer learn lemon level light limit linen lobby local logic loose lucky lunar lunch magic major maker maple march match mayor media melon mercy metal meter might minor mixed model money month moral motor mount mouse mouth movie music naive nerve never night noble noise north novel nurse nutty ocean offer olive onion opera orbit order otter outer owner paint panel paper party pasta patch pause peace peach pearl pedal penny phase phone photo piano piece pilot pinch pitch pixel pizza place plain plane plant plate plaza point polar pound power press price pride prime print prize proof proud pulse punch puppy pupil purse queen quest quick quiet quilt quote radio raise rally ranch range rapid reach ready realm relax reply rider ridge right rival river roast robin robot rocky round route royal rugby ruler rural rusks salad sauce scale scarf scene scent scone score scout sense serve seven shade shake shape share shark sharp sheep sheet shelf shell shine shirt shoes shore short shout sight silly since skate skill skirt slate sleep slice slide small smart smell smile smoke snack snail snake solar solid sound south space spaza spare spark speak speed spell spend spice spicy spine spoon sport spray squad stack staff stage stair stamp stand start state steak steam steel stick still stock stone store storm story stove straw study stuff style sugar suite sunny super sweet swift swing table taste teach teddy thank theme there thick thing think three throw thumb tiger tight toast today tooth topic torch total touch tough towel tower trace track trade trail train treat trend trial tribe trick troop truck truly trunk trust truth tulip twice twist uncle under union unity upper urban usual valid value venue verse video villa vinyl visit vital vivid vocal voice waist waltz waste watch water wheat wheel where which while white whole whose width woman world worry worth would wrist yacht young youth zebra").split(" ");
})();
