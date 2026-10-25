/* Story Chain: openers, plot twists, and the filler that fills in when someone goes quiet. */
(function () {
  const E = window.PP.engine;
  const O = (t, v) => ({ t, v: v || "f", g: ["opener"] });
  E.registerDeck("story-opener", [
    O("It was a quiet Tuesday until the toaster started to sing."), O("Nobody knew why the llama was driving the bus.", "s"), O("The lighthouse keeper had one rule: never open the blue door."),
    O("On the very first day of summer, a tiny dragon moved in next door."), O("The map led them to a café that only appeared at midnight."), O("Everything was normal until the pigeons started wearing hats.", "s"),
    O("Somewhere between the moon and a bag of crisps, the adventure began."), O("They'd planned a quiet picnic, but the sandwich had other ideas.", "s"), O("The new neighbour looked ordinary — apart from the wings."),
    O("It all started when someone said 'what could go wrong?'"), O("The letter arrived by owl, but it was addressed to the wrong wizard.", "s"), O("There was a knock at the door, and nobody was home — including the door."),
    O("The world's grumpiest cat had just been elected mayor.", "s"), O("When the clock struck thirteen, the garden gnomes woke up.", "s"), O("The treasure was real. The problem was the squirrel guarding it."),
    O("The spaceship had a snack drawer and one very strong opinion."), O("The moment they pressed the big red button, the cheese started floating.", "s"), O("The detective had solved every case — except the mystery of the missing sock."),
    O("They found a door in the forest that said 'Please Knock (Loudly)'."), O("Every full moon, the town's pigeons held a very serious meeting.", "s"), O("The robot was supposed to make toast. It built a rocket instead.", "s"),
    O("The wedding was perfect until the cake started to talk.", "s"), O("The map said 'X marks the spot'. The spot was in someone's kitchen."), O("They'd been shrunk to the size of a teacup, and the cat had noticed.", "s"),
    O("A very polite ghost knocked on the window and asked for sugar.", "s"), O("The wizard's wand turned everything into pancakes. Everything."), O("In a village where it only rained on Fridays, a dragon booked a holiday."),
    O("It was the last biscuit in the tin, and everyone knew it."), O("The treehouse had no stairs, no ladder — just a very confident goat.", "s"), O("The moment the penguin opened the door, the adventure was already late."),
    O("There was a note on the fridge: 'Do NOT feed the cloud.'", "s"), O("The party was at the end of the rainbow. Nobody warned them about the dress code."), O("Behind the bookshelf, there was another, smaller bookshelf, and behind that, a very small door."),
    O("She was the best baker in the galaxy. He was the worst critic. Together, they were trouble."), O("The elevator went up, sideways, and then — somehow — to the beach.", "s"), O("They agreed it was a bad idea, then did it anyway, in matching hats."),
  ]);
  E.registerDeck("story-twist", [
    { t: "A llama arrives with urgent news", v: "s", g: ["twist"] }, { t: "Someone sneezes and everything changes", v: "s", g: ["twist"] }, { t: "Introduce a villain with a very silly name", v: "s", g: ["twist"] },
    { t: "A character reveals a surprising talent", v: "f", g: ["twist"] }, { t: "It starts to rain… cheese", v: "s", g: ["twist"] }, { t: "Someone has been secretly a wizard all along", v: "f", g: ["twist"] },
    { t: "The weather suddenly gets very dramatic", v: "f", g: ["twist"] }, { t: "A mysterious stranger asks for a snack", v: "f", g: ["twist"] }, { t: "Time suddenly runs backwards", v: "s", g: ["twist"] },
    { t: "Everyone starts speaking in rhyme", v: "s", g: ["twist"] }, { t: "The hero loses something very important (like a shoe)", v: "f", g: ["twist"] }, { t: "A tiny dragon shows up", v: "f", g: ["twist"] },
    { t: "Everyone realises they've been walking in circles", v: "f", g: ["twist"] }, { t: "A pigeon delivers a ridiculous message", v: "s", g: ["twist"] }, { t: "The floor turns out to be lava (only a little)", v: "s", g: ["twist"] },
    { t: "Add a cliffhanger!", v: "f", g: ["twist"] }, { t: "Someone yells 'plot twist!' and it works", v: "s", g: ["twist"] }, { t: "A very polite monster appears", v: "s", g: ["twist"] },
    { t: "Introduce an unexpected friendship", v: "f", g: ["twist"] }, { t: "A door appears where there wasn't one", v: "f", g: ["twist"] },
  ]);
  E.registerDeck("story-filler", [
    "…and then everyone suddenly took a long nap.", "…and nobody knew what happened next, least of all the narrator.", "…then a pigeon walked in, looked around, and left.", "…and that's when the snacks arrived.",
    "…but first, a dramatic pause that lasted three minutes.", "…and suddenly it was Tuesday again.", "…then somebody remembered they'd left the oven on.", "…and the story took a very long, scenic route.",
  ]);
  E.registerDeck("truth-topic", ["🍕 Food crimes", "🧒 Childhood", "✈️ Travel", "😳 Embarrassing moments", "🎭 Hidden talents", "🐶 Animals", "🏫 School days", "🎉 Parties", "🍳 Kitchen disasters", "🌙 Weird dreams", "🚗 Road trips", "📱 Tech fails"].map((t) => ({ t, v: "f", g: ["topic"] })));
})();
