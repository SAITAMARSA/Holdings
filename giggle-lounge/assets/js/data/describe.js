/* Describe It cards (describe the title without saying its words). c = deck, a = accepted aliases. */
(function () {
  const E = window.PP.engine;
  const mk = (c, v) => (t, a) => ({ t, c, v: v || "f", g: [c.toLowerCase()], a: a || [] });
  const mv = mk("Movies"), cn = mk("Cartoons"), tv = mk("TV"), th = mk("Things", "s");
  E.registerDeck("describe", [
    mv("Titanic"), mv("Jaws"), mv("The Lion King"), mv("Frozen"), mv("Shrek"), mv("Home Alone"), mv("Ghostbusters"), mv("Jurassic Park"), mv("The Matrix", ["matrix"]),
    mv("Back to the Future"), mv("Forrest Gump"), mv("Rocky"), mv("Gladiator"), mv("Grease"), mv("Mamma Mia"), mv("Mean Girls"), mv("Notting Hill"),
    mv("Pretty Woman"), mv("The Godfather", ["godfather"]), mv("Star Wars"), mv("Harry Potter"), mv("The Lord of the Rings", ["lord of the rings"]), mv("Spider-Man", ["spiderman"]),
    mv("Batman"), mv("Iron Man"), mv("Black Panther"), mv("Avatar"), mv("Inception"), mv("Top Gun"), mv("Mission Impossible"), mv("James Bond", ["007"]), mv("Indiana Jones"),
    mv("Pirates of the Caribbean"), mv("The Wizard of Oz", ["wizard of oz"]), mv("Mary Poppins"), mv("Jumanji"), mv("Night at the Museum"), mv("Home Alone 2"), mv("Elf"),
    mv("The Sound of Music", ["sound of music"]), mv("La La Land"), mv("The Notebook", ["notebook"]), mv("Dirty Dancing"), mv("Love Actually"), mv("Bridget Jones"),
    mv("Barbie"), mv("Oppenheimer"), mv("Twilight"), mv("The Hunger Games", ["hunger games"]), mv("Fast and Furious", ["fast furious"]), mv("Mad Max"), mv("King Kong"),
    cn("Toy Story"), cn("Finding Nemo"), cn("Up"), cn("Cars"), cn("Ratatouille"), cn("Moana"), cn("Coco"), cn("Aladdin"), cn("Mulan"), cn("Cinderella"), cn("The Little Mermaid"),
    cn("Beauty and the Beast"), cn("Kung Fu Panda"), cn("Madagascar"), cn("Inside Out"), cn("Despicable Me"), cn("Monsters Inc", ["monsters"]), cn("The Incredibles", ["incredibles"]),
    cn("Peppa Pig"), cn("SpongeBob", ["spongebob squarepants", "sponge bob"]), cn("Tom and Jerry"), cn("Scooby-Doo", ["scooby doo"]), cn("The Simpsons", ["simpsons"]),
    cn("Bluey"), cn("Paw Patrol"), cn("Mickey Mouse"), cn("Winnie the Pooh", ["pooh"]), cn("Pokémon", ["pokemon", "pikachu"]), cn("Shrek 2"), cn("Dora the Explorer", ["dora"]),
    tv("Friends"), tv("The Office", ["office"]), tv("Game of Thrones"), tv("Stranger Things"), tv("Breaking Bad"), tv("The Crown", ["crown"]), tv("Squid Game"), tv("Money Heist"),
    tv("Bridgerton"), tv("The Big Bang Theory", ["big bang theory"]), tv("How I Met Your Mother"), tv("Brooklyn Nine-Nine", ["brooklyn 99"]), tv("Seinfeld"), tv("The Bachelor"),
    tv("Love Island"), tv("MasterChef", ["master chef"]), tv("Britain's Got Talent", ["got talent"]), tv("Strictly Come Dancing", ["strictly", "dancing with the stars"]),
    tv("Doctor Who"), tv("Sherlock"), tv("The Mandalorian", ["mandalorian"]), tv("Ted Lasso"), tv("Modern Family"), tv("Gilmore Girls"), tv("Grey's Anatomy", ["greys anatomy"]),
    th("Selfie stick"), th("Umbrella"), th("Toaster"), th("Rubber duck"), th("Trampoline"), th("Karaoke machine"), th("Snow globe"), th("Pogo stick"), th("Lava lamp"), th("Roomba"),
    th("Bubble wrap"), th("Whoopee cushion"), th("Disco ball"), th("Garden gnome"), th("Hot air balloon"), th("Photo booth"), th("Fortune cookie"), th("Jack-in-the-box", ["jack in the box"]),
    th("Piñata", ["pinata"]), th("Snorkel"), th("Hammock"), th("Fidget spinner"), th("Voicemail"), th("Parking ticket"), th("Alarm clock"), th("Bunk bed"), th("Traffic cone"), th("Bouncy castle"),
    th("Slinky"), th("Rubik's Cube", ["rubiks cube", "rubix cube"]), th("Tamagotchi"), th("Etch A Sketch", ["etch a sketch"]), th("Karaoke"), th("Escape room"), th("Mini golf", ["crazy golf"]),
  ]);
  // Dice twists for the describer: one silly rule per turn
  E.registerDeck("describe-twists", [
    { t: "🤖 Talk like a robot", v: "f", g: ["voice"] }, { t: "🏴‍☠️ Pirate voice, matey", v: "s", g: ["voice"] }, { t: "🤫 Whisper only", v: "f", g: ["voice"] },
    { t: "🎭 Super dramatic, like a soap opera", v: "s", g: ["voice"] }, { t: "🎵 Sing your clues", v: "s", g: ["voice"] }, { t: "🫢 Sit on your hands", v: "f", g: ["body"] },
    { t: "🥸 Fake a fancy accent", v: "s", g: ["voice"] }, { t: "🐌 Talk in slow motion", v: "f", g: ["voice"] }, { t: "📢 Sports commentator voice", v: "f", g: ["voice"] },
    { t: "🧸 Baby talk (affectionate)", v: "s", g: ["voice"] }, { t: "👀 Close your eyes", v: "f", g: ["body"] }, { t: "🗣️ One word per clue", v: "f", g: ["rule"] },
    { t: "🐱 Everything sounds like a cat", v: "s", g: ["voice"] }, { t: "🧙 Wizard voice, ancient and wise", v: "s", g: ["voice"] }, { t: "🎤 Nature documentary narrator", v: "f", g: ["voice"] },
    { t: "🙃 Describe it badly on purpose", v: "s", g: ["rule"] },
  ]);
})();
