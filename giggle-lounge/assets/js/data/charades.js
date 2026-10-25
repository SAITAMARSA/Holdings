/* Emoji Charades subjects. c = category (the giver's hint), a = extra accepted answers. */
(function () {
  const E = window.PP.engine;
  const mk = (c, v, g) => (t, a) => ({ t, c, v, g: [g], a: a || [] });
  const movie = mk("Movie", "f", "movie"), song = mk("Song", "f", "song"), food = mk("Food", "f", "food"), place = mk("Place", "f", "place"),
        phrase = mk("Phrase", "f", "phrase"), sit = mk("Everyday disaster", "s", "disaster");
  E.registerDeck("charades", [
    movie("Titanic"), movie("The Lion King"), movie("Frozen"), movie("Finding Nemo", ["nemo"]), movie("Shrek"), movie("Harry Potter"), movie("Toy Story"),
    movie("Jurassic Park"), movie("The Matrix", ["matrix"]), movie("Star Wars"), movie("Spider-Man", ["spiderman"]), movie("Batman"), movie("Home Alone"),
    movie("Back to the Future"), movie("Beauty and the Beast"), movie("Cinderella"), movie("Mulan"), movie("Aladdin"), movie("The Little Mermaid", ["little mermaid"]), movie("Up"),
    movie("Cars"), movie("Ratatouille"), movie("Mamma Mia"), movie("Barbie"), movie("Avatar"), movie("Forrest Gump"), movie("Rocky"),
    movie("Kung Fu Panda"), movie("Moana"), movie("Coco"), movie("Madagascar"), movie("Inside Out"), movie("Pirates of the Caribbean", ["pirates caribbean"]), movie("The Lord of the Rings", ["lord of the rings", "lotr"]),
    movie("Mean Girls"), movie("Grease"), movie("Dirty Dancing"), movie("Notting Hill"), movie("Love Actually"), movie("Bridget Jones"), movie("The Wizard of Oz", ["wizard of oz"]),
    movie("Mary Poppins"), movie("Jumanji"), movie("Despicable Me", ["minions"]), movie("How to Train Your Dragon", ["train your dragon"]),
    song("Let It Go"), song("Shake It Off"), song("Hey Jude"), song("Bohemian Rhapsody"), song("Happy"), song("Despacito"), song("Single Ladies"), song("Thriller"),
    song("Livin' on a Prayer", ["living on a prayer"]), song("Dancing Queen"), song("Uptown Funk"), song("Rolling in the Deep"), song("Hotel California"), song("Yesterday"),
    song("Shape of You"), song("Africa"), song("Take on Me"), song("Baby Shark"), song("Under the Sea"), song("Waka Waka"), song("Fireflies"), song("Umbrella"),
    song("Eye of the Tiger"), song("Sweet Caroline"), song("Staying Alive"), song("Fly Me to the Moon"), song("Purple Rain"), song("Walking on Sunshine"), song("Total Eclipse of the Heart"),
    food("Pizza"), food("Spaghetti and meatballs", ["spaghetti meatballs"]), food("Hot dog"), food("Birthday cake"), food("Sushi"), food("Ice cream sundae", ["sundae"]), food("Pancakes"),
    food("Avocado toast"), food("Fish and chips"), food("Popcorn"), food("Cheeseburger", ["burger"]), food("Grilled cheese"), food("Taco Tuesday", ["tacos"]),
    food("Chocolate chip cookie", ["cookie", "cookies"]), food("Pumpkin spice latte", ["psl"]), food("Breakfast in bed"), food("Picnic"), food("Garlic bread"), food("Cup of tea", ["tea"]),
    place("Eiffel Tower"), place("Statue of Liberty"), place("Great Wall of China"), place("Grand Canyon"), place("Niagara Falls"), place("Disney World", ["disneyland", "disney"]),
    place("Las Vegas", ["vegas"]), place("Hollywood"), place("Pyramids of Giza", ["pyramids"]), place("Mount Everest", ["everest"]), place("Beach holiday", ["beach"]),
    place("Camping trip", ["camping"]), place("Road trip"), place("Space station"), place("Airport security", ["airport"]), place("Roller coaster"),
    phrase("Raining cats and dogs"), phrase("Break a leg"), phrase("Piece of cake"), phrase("Spill the beans"), phrase("Butterflies in my stomach", ["butterflies in stomach"]),
    phrase("Elephant in the room"), phrase("Cold feet"), phrase("Under the weather"), phrase("Hit the hay"), phrase("Let the cat out of the bag", ["cat out of the bag"]),
    phrase("Couch potato"), phrase("Bad hair day"), phrase("Head over heels"), phrase("Once in a blue moon"), phrase("Walking on eggshells"), phrase("The last straw"),
    sit("Stuck in traffic", ["traffic jam"]), sit("Forgot my keys"), sit("Stepped on a Lego", ["lego"]), sit("Left the oven on"), sit("Phone at one percent", ["low battery"]),
    sit("Reply all disaster", ["reply all"]), sit("Zoom call while muted", ["you're on mute", "on mute"]), sit("Autocorrect fail", ["autocorrect"]), sit("Parallel parking"),
    sit("Assembling flat-pack furniture", ["ikea", "flat pack furniture"]), sit("Wi-Fi is down", ["wifi down", "no wifi"]), sit("Sneezing in a library"),
    sit("Pigeon stole my sandwich", ["pigeon sandwich"]), sit("Dad dancing"), sit("Karaoke night", ["karaoke"]), sit("Texted the wrong person"), sit("Brain freeze"),
    sit("Fell asleep during a movie", ["fell asleep movie"]), sit("Hiccups in a quiet meeting", ["hiccups"]), sit("Walked into a glass door", ["glass door"]), sit("Burnt the toast", ["burnt toast"]),
  ]);
})();
