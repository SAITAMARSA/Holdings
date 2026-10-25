/* Pitch It: a product, a customer, and sometimes a twist. */
(function () {
  const E = window.PP.engine;
  const P = (t, v, g) => ({ t, v: v || "f", g: [g || "product"] });
  E.registerDeck("pitch-product", [
    P("A waterproof umbrella"), P("Self-stirring soup 🍲"), P("A pillow that apologises", "s"), P("Shoes with built-in snacks 👟", "s"), P("An alarm clock that bribes you"),
    P("A GPS that only gives scenic routes 🗺️"), P("Invisible furniture", "s"), P("A toaster that tells jokes 🍞", "s"), P("A hat with a tiny fan"), P("A mug that keeps coffee warm forever ☕"),
    P("A dog translator app 🐶"), P("Socks that never get lost 🧦"), P("A fridge that judges your midnight snacks", "s"), P("A cloud you can rent ☁️", "s"), P("A pocket-sized sunrise 🌅"),
    P("A rain-powered phone charger 🌧️"), P("A mirror that only says nice things 🪞"), P("A bed with a 'snooze for life' button", "s"), P("Edible sunglasses 😎", "s"), P("A pen that writes your excuses ✍️"),
    P("A backpack that follows you like a pet 🎒"), P("A treadmill that generates pizza 🍕", "s"), P("Instant-noodle perfume 🍜", "s"), P("A teapot with feelings 🫖", "s"), P("A sofa that hugs back 🛋️"),
    P("Self-folding laundry 🧺"), P("A door that knocks for you", "s"), P("A pillow fort kit for adults 🏰"), P("A weather forecast that's always sunny ☀️"), P("A bicycle for four"),
    P("Shoes that make you dance 💃", "s"), P("A hairbrush that tells your fortune 🔮", "s"), P("A raincoat for dogs 🐕"), P("A snack drawer with a password 🔐"), P("An app that rates your naps 😴"),
    P("A lamp that glows when you're happy 💡"), P("Jam that's also butter 🧈", "s"), P("A scarf that doubles as a blanket 🧣"), P("A talking houseplant 🪴", "s"), P("A bubble-wrap yoga mat 🧘", "s"),
    P("A tent that's bigger on the inside ⛺"), P("A chair that finds the best seat in any room 🪑"), P("A time machine, but only to 5 minutes ago ⏳", "s"), P("A lunchbox that keeps hot things hot and cold things cold 🥪"),
    P("A teleporting umbrella ☂️", "s"), P("A smart watch for cats 🐱", "s"), P("A karaoke shower 🚿"), P("Candles that smell like old books 🕯️"), P("A fidget toy that's also a snack 🍫", "s"), P("A very polite alarm 🔔"),
  ]);
  E.registerDeck("pitch-customer", [
    P("a sleepy astronaut 🚀", "f", "customer"), P("a nervous wizard 🧙", "s", "customer"), P("a toddler with a briefcase 👶", "s", "customer"), P("a retired pirate 🏴‍☠️", "s", "customer"),
    P("a busy octopus 🐙", "s", "customer"), P("a very tired parent 😴", "f", "customer"), P("a medieval knight on a lunch break 🛡️", "s", "customer"), P("a famous dog 🐕", "f", "customer"),
    P("a lighthouse keeper 🔆", "f", "customer"), P("an alien visiting Earth 👽", "f", "customer"), P("a shy dragon 🐉", "s", "customer"), P("a nana who knows everything 👵", "f", "customer"),
    P("a clown who is afraid of balloons 🤡", "s", "customer"), P("a marathon runner 🏃", "f", "customer"), P("a grumpy cat 😾", "f", "customer"),
    P("a superhero on a day off 🦸", "f", "customer"), P("a student during exam week 📚", "f", "customer"), P("a chef who hates cooking 👨‍🍳", "s", "customer"), P("a penguin in the desert 🐧", "s", "customer"),
    P("a very serious robot 🤖", "f", "customer"), P("a mermaid on land 🧜", "s", "customer"), P("a mayor of a tiny town 🎩", "f", "customer"),
    P("a bored lifeguard 🏊", "f", "customer"), P("a teacher on a Friday 🍎", "f", "customer"), P("a farmer with a tractor obsession 🚜", "f", "customer"), P("a detective who solves nothing 🕵️", "s", "customer"),
    P("a bride and groom who forgot the cake 🎂", "f", "customer"), P("a time traveller who's lost 🕰️", "s", "customer"), P("someone on their first day of retirement 🌴", "f", "customer"),
    P("a squirrel with a mortgage 🐿️", "s", "customer"), P("a king who just wants a nap 👑", "s", "customer"), P("a night-shift baker 🥐", "f", "customer"), P("a chaotic best friend 🤪", "f", "customer"),
  ]);
  E.registerDeck("pitch-twist", [
    P("In exactly ten words", "f", "twist"), P("It must rhyme", "s", "twist"), P("Say it like a car-advert narrator 🚗", "s", "twist"), P("Include the word 'banana' 🍌", "s", "twist"),
    P("Add a catchy slogan", "f", "twist"), P("It's on sale — add a price 💰", "f", "twist"), P("Whisper-quiet infomercial energy 📺", "s", "twist"), P("End with 'but wait, there's more!'", "f", "twist"),
    P("Include a fake celebrity quote ⭐", "f", "twist"), P("Pitch it as a love song 🎶", "s", "twist"), P("Mention a tiny side effect ⚠️", "s", "twist"), P("As if it's the end of the world 🌍", "s", "twist"),
  ]);
})();
