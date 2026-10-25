/* Vibe Check dials: l = left pole, r = right pole. */
(function () {
  const E = window.PP.engine;
  const S = (l, r, v, g) => ({ t: l + " ↔ " + r, l, r, v: v || "f", g: [g || "general"] });
  E.registerDeck("spectrums", [
    S("Overrated", "Underrated"), S("Terrible pizza topping", "Best pizza topping", "f", "food"), S("Cold", "Hot"), S("Bad movie", "Great movie"), S("Useless superpower", "Amazing superpower", "s", "silly"),
    S("Boring job", "Dream job"), S("Easy to cook", "Impossible to cook", "f", "food"), S("Morning person", "Night owl"), S("Quiet sound", "Loud sound"), S("Cringe", "Cool"),
    S("Tiny animal", "Huge animal", "f", "animal"), S("Sensible", "Chaotic", "s", "silly"), S("Bad gift", "Perfect gift"), S("Forgettable", "Memorable"), S("Rough day", "Perfect day"),
    S("Silly name", "Serious name", "s", "silly"), S("Cheap", "Expensive"), S("Cosy", "Cold and drafty"), S("Weak coffee", "Rocket-fuel coffee", "f", "food"), S("Lazy Sunday activity", "Productive Sunday activity"),
    S("Bad smell", "Lovely smell"), S("Awkward", "Smooth"), S("Dangerous", "Safe"), S("Hard to spell", "Easy to spell"), S("Ancient", "Futuristic"),
    S("Embarrassing", "Proud"), S("Casual", "Fancy"), S("Boring holiday", "Epic holiday"), S("Unlucky", "Lucky"), S("A bad idea", "A great idea"),
    S("Terrible dancer", "Amazing dancer"), S("Messy", "Spotless"), S("Terrible singer", "Amazing singer"), S("Soft", "Hard"), S("Slow", "Fast"),
    S("Rude", "Polite"), S("Likely to nap", "Likely to run a marathon", "s", "silly"), S("Not a snack", "The ultimate snack", "f", "food"), S("A bad pet", "The perfect pet", "f", "animal"),
    S("Mild", "Spicy", "f", "food"), S("Underwhelming", "Mind-blowing"), S("Lame party game", "Best party game"), S("Gross", "Delicious", "f", "food"), S("Haunted", "Cheerful", "s", "silly"),
    S("Old-fashioned", "Trendy"), S("Secret", "Obvious"), S("A baby's name", "A grandpa's name", "s", "silly"), S("Easy to find", "Always lost", "s", "silly"), S("Peaceful", "Chaos"),
    S("A bad hair day", "Perfect hair day"), S("Gentle", "Fierce"), S("Plain", "Extra"), S("A bad habit", "A good habit"), S("Pointless", "Essential"),
    S("A bad smell, but you love it", "A lovely smell, but you hate it", "s", "silly"), S("A little white lie", "A whopper", "s", "silly"), S("Tastes like nothing", "Tastes like everything", "s", "silly"),
    S("Hug from a stranger", "Hug from a bear", "s", "silly"), S("Dog person", "Cat person", "f", "animal"), S("Beach", "Mountains"), S("Winter", "Summer"), S("Sweet", "Savoury", "f", "food"),
    S("Early to arrive", "Fashionably late", "f", "general"), S("Planner", "Spontaneous"), S("Movie night in", "Party night out"), S("Ordinary", "Legendary"), S("Mess-up", "Masterpiece"),
  ]);
})();
