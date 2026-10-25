/* Gift Shop: the catalog (emoji + silly name + price), occasions, quirks and budgets. */
(function () {
  const E = window.PP.engine;
  window.PP.GIFT_ITEMS = [
    ["🧦", "Suspiciously Soft Socks", 2], ["🕯️", "Candle That Smells Like Rain", 3], ["🍫", "Emergency Chocolate", 2], ["🎸", "Air Guitar (Real, Invisible)", 4],
    ["🦆", "Rubber Duck Bodyguard", 2], ["🪴", "Plant That Judges You", 3], ["🎩", "Fancy Hat For No Reason", 4], ["🚲", "Bike With Opinions", 9],
    ["🧸", "Cuddle Bear (XL)", 6], ["💐", "Bouquet of Apologies", 4], ["🍕", "Lifetime Pizza Rumour", 8], ["🎟️", "Coupon: One Free Hug", 1],
    ["🔮", "Fortune Ball (Always Says Maybe)", 3], ["🧃", "Juice Box, Adult Size", 2], ["🛋️", "Nap Couch", 9], ["🎁", "A Slightly Smaller Gift", 3],
    ["📚", "Book You'll Start Soon", 3], ["🎧", "Headphones That Hum Back", 7], ["🕶️", "Cool Shades (Indoor Use)", 3], ["🧀", "Cheese of Unusual Size", 5],
    ["🪩", "Pocket Disco Ball", 4], ["🦄", "Unicorn (Inflatable)", 5], ["🍩", "Donut With Ambition", 2], ["☕", "Mug Saying 'Not Before Coffee'", 3],
    ["🎮", "Controller With Feelings", 6], ["🧴", "Mystery Lotion", 2], ["🌮", "Taco Tuesday Pass", 3], ["🎤", "Karaoke Confidence Potion", 3],
    ["🪁", "Kite of Good Intentions", 3], ["🛼", "Roller Skates (Ambitious)", 6], ["🥑", "Perfectly Ripe Avocado", 4], ["🐢", "Slow Turtle (Moral Support)", 5],
    ["🧢", "Hat That Says 'Boss'", 3], ["🎨", "Paints, Messy Edition", 4], ["🔭", "Telescope For Nosey Moon Watching", 7], ["🧩", "1000-Piece Puzzle (Sky Only)", 4],
    ["💌", "Love Letter (Mostly Doodles)", 1], ["🏆", "Trophy: World's Okayest Human", 2], ["🧁", "Cupcake Wearing a Tiny Crown", 2], ["🪄", "Wand (Wood, Hope)", 4],
    ["🛁", "Bubble Bath For Ducks and People", 3], ["🍿", "Bottomless Popcorn Bucket", 3], ["🎈", "A Single Dramatic Balloon", 1], ["👑", "Crown (Plastic, Regal)", 3],
    ["🧊", "Ice Cube Collection", 1], ["🐙", "Octopus Hugs (Voucher)", 2], ["📸", "Disposable Camera, 3 Shots", 3], ["🌈", "Rainbow In a Jar", 5],
    ["🥐", "Croissant Delivery Service", 6], ["🛹", "Skateboard (Dignity Not Included)", 5], ["🍷", "Bottle of Grape Juice, Fancy Label", 3], ["🪑", "Chair That Fits You Perfectly", 5],
    ["🦖", "Pocket Dinosaur", 4], ["🎷", "Saxophone, Surprise Lessons", 7], ["🔦", "Torch For Midnight Snacks", 2], ["🥇", "Gold Medal For Surviving Today", 2],
    ["🚀", "Ticket To Somewhere Vague", 8], ["🏝️", "Tiny Island (Terms Apply)", 10], ["🍰", "Cake That Says Sorry", 4], ["🧼", "Soap Shaped Like a Fish", 1],
  ];
  E.registerDeck("gift-occasion", [
    { t: "It's a regular Tuesday", v: "f", g: ["mundane"] }, { t: "They survived a Monday", v: "f", g: ["mundane"] }, { t: "National Nap Day", v: "s", g: ["silly"] },
    { t: "They won an argument with a pigeon", v: "s", g: ["silly"] }, { t: "They got a haircut and nobody noticed", v: "f", g: ["mundane"] }, { t: "They finally learned how the dishwasher works", v: "f", g: ["mundane"] },
    { t: "They watched a whole season in one weekend", v: "f", g: ["mundane"] }, { t: "They cooked something that didn't burn", v: "f", g: ["mundane"] }, { t: "First day of spring", v: "f", g: ["season"] },
    { t: "It's the anniversary of nothing in particular", v: "s", g: ["silly"] }, { t: "They didn't lose their keys all week", v: "f", g: ["mundane"] }, { t: "They said 'you too' to the waiter's 'enjoy your meal'", v: "s", g: ["silly"] },
    { t: "They found money in an old coat", v: "f", g: ["luck"] }, { t: "Their plant is still alive", v: "f", g: ["mundane"] }, { t: "They parallel-parked on the first try", v: "f", g: ["luck"] },
    { t: "They laughed so hard they snorted", v: "s", g: ["silly"] }, { t: "They answered a call from an unknown number bravely", v: "s", g: ["silly"] }, { t: "It's their half-birthday", v: "f", g: ["birthday"] },
    { t: "They sneezed seven times in a row", v: "s", g: ["silly"] }, { t: "They made it to the weekend", v: "f", g: ["mundane"] }, { t: "They remembered a password without resetting it", v: "f", g: ["luck"] },
    { t: "It's World Hug Day (probably)", v: "s", g: ["silly"] }, { t: "They got through a whole movie without checking their phone", v: "f", g: ["mundane"] }, { t: "They helped a stranger carry a sofa", v: "f", g: ["kind"] },
    { t: "They learned to whistle", v: "f", g: ["achievement"] }, { t: "They survived assembling flat-pack furniture", v: "f", g: ["achievement"] }, { t: "They tried a new food and pretended to like it", v: "s", g: ["silly"] },
    { t: "Because they're simply the best", v: "f", g: ["sweet"] }, { t: "They kept a straight face at a very silly moment", v: "s", g: ["silly"] }, { t: "It's raining and they brought an umbrella for once", v: "f", g: ["luck"] },
  ]);
  E.registerDeck("gift-quirk", [
    { t: "has very dramatic feelings about balloons", v: "s", g: ["fear"] }, { t: "collects spoons", v: "s", g: ["hobby"] }, { t: "talks to their plants", v: "f", g: ["quirk"] },
    { t: "can't whistle but tries constantly", v: "f", g: ["quirk"] }, { t: "swears they're a morning person", v: "f", g: ["quirk"] }, { t: "has strong opinions about toast", v: "s", g: ["quirk"] },
    { t: "dances only when no one is watching", v: "f", g: ["quirk"] }, { t: "names every car they see", v: "s", g: ["quirk"] }, { t: "is allergic to Mondays", v: "f", g: ["quirk"] },
    { t: "believes they'd win any survival challenge", v: "f", g: ["quirk"] }, { t: "has a favourite cloud", v: "s", g: ["quirk"] }, { t: "loves a fancy coffee but orders 'whatever's easiest'", v: "f", g: ["quirk"] },
    { t: "is convinced the cat understands everything", v: "f", g: ["pets"] }, { t: "pronounces 'pasta' with way too much flair", v: "s", g: ["quirk"] }, { t: "has 47 unread voice notes", v: "f", g: ["quirk"] },
    { t: "talks to the GPS like a friend", v: "f", g: ["quirk"] }, { t: "has never finished a puzzle", v: "f", g: ["quirk"] }, { t: "wants to be a lighthouse keeper someday", v: "s", g: ["dream"] },
    { t: "hoards the good pen", v: "s", g: ["quirk"] }, { t: "is a secret karaoke legend", v: "f", g: ["talent"] }, { t: "argues with the self-checkout machine", v: "f", g: ["fear"] },
    { t: "believes in aliens, fairies, and sensible shoes", v: "s", g: ["quirk"] }, { t: "can nap anywhere, anytime", v: "f", g: ["quirk"] }, { t: "is oddly competitive about board games", v: "f", g: ["quirk"] },
    { t: "keeps a snack in every bag", v: "f", g: ["food"] }, { t: "gets emotional about cartoon films", v: "f", g: ["sweet"] }, { t: "says 'I'll just have a bite' and eats the whole thing", v: "f", g: ["food"] },
    { t: "dreams of owning a very small dog in a very big coat", v: "s", g: ["dream"] }, { t: "never knows what day it is", v: "f", g: ["quirk"] }, { t: "has a lucky sock they refuse to wash", v: "s", g: ["quirk"] },
  ]);
  E.registerDeck("gift-budget", [3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ t: n, v: "b", g: ["budget"] })));
})();
