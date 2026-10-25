/* Draw & Guess words. Some are plain nouns, some are absurd scenes (matched on key words). */
(function () {
  const E = window.PP.engine;
  const W = (t, v, g, a) => ({ t, v: v || "f", g: [g || "thing"], a: a || [] });
  E.registerDeck("draw", [
    W("Pizza", "f", "food"), W("Elephant", "f", "animal"), W("Sunglasses"), W("Bicycle"), W("Volcano", "f", "nature"), W("Spaceship", "f", "scifi", ["rocket"]), W("Snowman"), W("Cactus", "f", "nature"),
    W("Dragon", "f", "fantasy"), W("Pirate ship", "f", "fantasy", ["pirate boat"]), W("Birthday cake", "f", "food"), W("Giraffe", "f", "animal"), W("Octopus", "f", "animal"), W("Lighthouse", "f", "place"),
    W("Rainbow", "f", "nature"), W("Hot air balloon", "f", "place"), W("Windmill", "f", "place"), W("Penguin", "f", "animal"), W("Robot", "f", "scifi"), W("Mermaid", "f", "fantasy"),
    W("Castle", "f", "place"), W("Banana", "f", "food"), W("Umbrella"), W("Guitar"), W("Ladder"), W("Snail", "f", "animal"), W("Kangaroo", "f", "animal"), W("Treehouse", "f", "place"),
    W("Campfire", "f", "place"), W("Ice cream cone", "f", "food", ["ice cream"]), W("Fireworks"), W("Skateboard"), W("Teapot"), W("Ghost", "f", "fantasy"), W("Crab", "f", "animal"),
    W("Tent", "f", "place"), W("Hamburger", "f", "food", ["burger", "cheeseburger"]), W("Flamingo", "f", "animal"), W("Sloth", "f", "animal"), W("Unicorn", "f", "fantasy"), W("Toothbrush"),
    W("Dinosaur", "f", "animal"), W("Roller coaster", "f", "place"), W("Cupcake", "f", "food"), W("Hedgehog", "f", "animal"), W("Telescope"), W("Whale", "f", "animal"), W("Piano"),
    W("Wizard hat", "f", "fantasy", ["wizard"]), W("Alien", "f", "scifi"), W("Parachute"), W("Santa Claus", "f", "holiday", ["santa"]), W("Bee", "f", "animal"), W("Spider", "f", "animal"),
    W("A pigeon at a wedding", "s", "absurd", ["pigeon wedding"]), W("A cat doing taxes", "s", "absurd", ["cat taxes"]), W("A dog driving a bus", "s", "absurd", ["dog bus"]),
    W("A penguin on a surfboard", "s", "absurd", ["penguin surfboard", "penguin surfing"]), W("A sleepy octopus", "s", "absurd"), W("A snowman at the beach", "s", "absurd", ["snowman beach"]),
    W("A giraffe in a lift", "s", "absurd", ["giraffe elevator", "giraffe lift"]), W("A dragon eating spaghetti", "s", "absurd", ["dragon spaghetti"]), W("A wizard stuck in traffic", "s", "absurd", ["wizard traffic"]),
    W("A ghost doing laundry", "s", "absurd", ["ghost laundry"]), W("A flamingo on a bicycle", "s", "absurd", ["flamingo bicycle", "flamingo bike"]), W("A cow in space", "s", "absurd", ["cow space"]),
    W("A squirrel with sunglasses", "s", "absurd", ["squirrel sunglasses"]), W("A robot learning to dance", "s", "absurd", ["robot dancing", "robot dance"]), W("A shark on a skateboard", "s", "absurd", ["shark skateboard"]),
    W("A crab playing the piano", "s", "absurd", ["crab piano"]), W("A bear eating pizza", "s", "absurd", ["bear pizza"]), W("A hedgehog's birthday party", "s", "absurd", ["hedgehog birthday"]),
    W("A llama in a tuxedo", "s", "absurd", ["llama tuxedo"]), W("A tiny knight on a snail", "s", "absurd", ["knight snail"]), W("A dinosaur at a tea party", "s", "absurd", ["dinosaur tea party"]),
    W("A duck in a bathtub", "s", "absurd", ["duck bath", "duck bathtub"]), W("Two sloths racing", "s", "absurd", ["sloth race", "sloths racing"]), W("A moose wearing a scarf", "s", "absurd", ["moose scarf"]),
    W("A hamster driving a tractor", "s", "absurd", ["hamster tractor"]), W("A frog with an umbrella", "s", "absurd", ["frog umbrella"]), W("A pirate who's afraid of water", "s", "absurd", ["pirate afraid water"]),
    W("A turtle running late", "s", "absurd", ["turtle late"]), W("A unicorn doing yoga", "s", "absurd", ["unicorn yoga"]), W("A caterpillar on a first date", "s", "absurd", ["caterpillar date"]),
    W("Eiffel Tower", "f", "place"), W("Statue of Liberty", "f", "place"), W("Big Ben", "f", "place"), W("Pyramids", "f", "place"), W("Sydney Opera House", "f", "place"),
    W("Chicken", "f", "animal"), W("Peacock", "f", "animal"), W("Butterfly", "f", "animal"), W("Parrot", "f", "animal"), W("Shark", "f", "animal"), W("Owl", "f", "animal"), W("Monkey", "f", "animal"),
    W("Sandcastle", "f", "place"), W("Lollipop", "f", "food"), W("Donut", "f", "food"), W("Sushi", "f", "food"), W("Taco", "f", "food"), W("Popcorn", "f", "food"), W("Watermelon", "f", "food"),
    W("Pineapple", "f", "food"), W("Cheese", "f", "food"), W("Broccoli", "f", "food"), W("Candy cane", "f", "holiday"), W("Gingerbread man", "f", "holiday"), W("Pumpkin", "f", "holiday"),
    W("Rocket", "f", "scifi"), W("Satellite", "f", "scifi"), W("Moon", "f", "nature"), W("Tornado", "f", "nature"), W("Waterfall", "f", "nature"), W("Mountain", "f", "nature"),
    W("Camera"), W("Headphones"), W("Scissors"), W("Key"), W("Clock"), W("Lamp"), W("Mailbox"), W("Backpack"), W("Trampoline"), W("Treasure map", "f", "fantasy"), W("Magic wand", "f", "fantasy"),
  ]);
})();
