import type { Concept } from "./types";

// Seed curriculum for the Grade 7-9 beachhead. Broadly aligned with the
// South African CAPS Senior Phase. Small on purpose: the pilot validates the
// loop before we invest in breadth.
export const CONCEPTS: Concept[] = [
  {
    id: "m-integers", subject: "maths", grade: 7, title: "Integers",
    summary: "Adding and subtracting positive and negative whole numbers.",
    prerequisites: [],
    items: [
      { id: "m-integers-1", prompt: "What is −7 + 12?", options: ["−19", "5", "−5", "19"], answer: 1, hint: "Start at −7 on a number line and move 12 to the right.", explanation: "Moving 12 right from −7 lands on 5." },
      { id: "m-integers-2", prompt: "What is 4 − 9?", options: ["5", "−5", "13", "−13"], answer: 1, hint: "Taking away more than you have goes below zero.", explanation: "4 − 9 = −5 because 9 is 5 more than 4." },
      { id: "m-integers-3", prompt: "What is −3 − (−8)?", options: ["−11", "11", "5", "−5"], answer: 2, hint: "Subtracting a negative is the same as adding.", explanation: "−3 − (−8) = −3 + 8 = 5." },
      { id: "m-integers-4", prompt: "Which is the smallest: −2, −10, 0, 3?", options: ["−2", "−10", "0", "3"], answer: 1, hint: "Further left on the number line is smaller.", explanation: "−10 is furthest left, so it is the smallest." },
    ],
  },
  {
    id: "m-fractions", subject: "maths", grade: 7, title: "Fractions",
    summary: "Equivalent fractions, and adding fractions with different denominators.",
    prerequisites: ["m-integers"],
    items: [
      { id: "m-fractions-1", prompt: "Which fraction equals 2/4?", options: ["1/4", "1/2", "3/4", "2/8"], answer: 1, hint: "Divide top and bottom by the same number.", explanation: "2/4 ÷ 2/2 = 1/2." },
      { id: "m-fractions-2", prompt: "What is 1/3 + 1/6?", options: ["2/9", "1/2", "2/6", "1/9"], answer: 1, hint: "Make the denominators the same first.", explanation: "1/3 = 2/6, so 2/6 + 1/6 = 3/6 = 1/2." },
      { id: "m-fractions-3", prompt: "What is 3/4 of 20?", options: ["15", "12", "5", "16"], answer: 0, hint: "Find one quarter, then take three of them.", explanation: "20 ÷ 4 = 5, and 5 × 3 = 15." },
    ],
  },
  {
    id: "m-ratio", subject: "maths", grade: 8, title: "Ratio and rate",
    summary: "Comparing quantities and sharing amounts in a given ratio.",
    prerequisites: ["m-fractions"],
    items: [
      { id: "m-ratio-1", prompt: "Share R60 between two people in the ratio 1:2. How much does the second person get?", options: ["R20", "R30", "R40", "R45"], answer: 2, hint: "1:2 means 3 equal parts in total.", explanation: "R60 ÷ 3 = R20 per part. Second person gets 2 parts = R40." },
      { id: "m-ratio-2", prompt: "A taxi travels 120 km in 2 hours. What is its speed?", options: ["40 km/h", "60 km/h", "120 km/h", "240 km/h"], answer: 1, hint: "Speed is distance divided by time.", explanation: "120 ÷ 2 = 60 km/h." },
      { id: "m-ratio-3", prompt: "Simplify the ratio 12:18.", options: ["6:9", "2:3", "3:2", "4:6"], answer: 1, hint: "Divide both by their highest common factor.", explanation: "12 and 18 share a factor of 6: 12:18 = 2:3." },
    ],
  },
  {
    id: "m-linear", subject: "maths", grade: 8, title: "Linear equations",
    summary: "Solving equations with one unknown by doing the same to both sides.",
    prerequisites: ["m-integers"],
    items: [
      { id: "m-linear-1", prompt: "Solve: x + 7 = 12", options: ["x = 19", "x = 5", "x = −5", "x = 7"], answer: 1, hint: "Subtract 7 from both sides.", explanation: "x = 12 − 7 = 5." },
      { id: "m-linear-2", prompt: "Solve: 3x = 21", options: ["x = 63", "x = 18", "x = 7", "x = 24"], answer: 2, hint: "Divide both sides by 3.", explanation: "x = 21 ÷ 3 = 7." },
      { id: "m-linear-3", prompt: "Solve: 2x − 4 = 10", options: ["x = 3", "x = 7", "x = 14", "x = 5"], answer: 1, hint: "Add 4 first, then divide by 2.", explanation: "2x = 14, so x = 7." },
    ],
  },
  {
    id: "m-pythag", subject: "maths", grade: 9, title: "Theorem of Pythagoras",
    summary: "Finding a missing side of a right-angled triangle.",
    prerequisites: ["m-linear"],
    items: [
      { id: "m-pythag-1", prompt: "A right-angled triangle has short sides 3 and 4. What is the hypotenuse?", options: ["5", "7", "12", "25"], answer: 0, hint: "a² + b² = c².", explanation: "9 + 16 = 25, and √25 = 5." },
      { id: "m-pythag-2", prompt: "Hypotenuse 13, one side 5. What is the other side?", options: ["8", "12", "18", "144"], answer: 1, hint: "c² − a² = b².", explanation: "169 − 25 = 144, and √144 = 12." },
    ],
  },
  {
    id: "e-parts", subject: "english", grade: 7, title: "Parts of speech",
    summary: "Nouns, verbs, adjectives and adverbs, and what each one does in a sentence.",
    prerequisites: [],
    items: [
      { id: "e-parts-1", prompt: "In \"The quick dog ran,\" which word is the adjective?", options: ["The", "quick", "dog", "ran"], answer: 1, hint: "Adjectives describe nouns.", explanation: "\"Quick\" describes the dog." },
      { id: "e-parts-2", prompt: "Which word is a verb?", options: ["happiness", "slowly", "jump", "blue"], answer: 2, hint: "A verb is an action or a state.", explanation: "\"Jump\" is an action." },
      { id: "e-parts-3", prompt: "In \"She sang beautifully,\" which word is the adverb?", options: ["She", "sang", "beautifully", "none"], answer: 2, hint: "Adverbs often end in -ly and describe verbs.", explanation: "\"Beautifully\" describes how she sang." },
    ],
  },
  {
    id: "e-tenses", subject: "english", grade: 7, title: "Tenses",
    summary: "Past, present and future, and keeping tense consistent.",
    prerequisites: ["e-parts"],
    items: [
      { id: "e-tenses-1", prompt: "Choose the past tense: \"Yesterday I ___ to school.\"", options: ["walk", "walked", "will walk", "walking"], answer: 1, hint: "Yesterday tells you the time.", explanation: "\"Walked\" is the simple past." },
      { id: "e-tenses-2", prompt: "Which sentence is in the future tense?", options: ["I eat lunch.", "I ate lunch.", "I will eat lunch.", "I am eating lunch."], answer: 2, hint: "Look for \"will\".", explanation: "\"Will eat\" points to the future." },
      { id: "e-tenses-3", prompt: "Fix the tense: \"She runs fast and won the race.\"", options: ["She ran fast and won the race.", "She runs fast and win the race.", "She running fast and won.", "It is already correct."], answer: 0, hint: "Both verbs should match.", explanation: "\"Ran\" and \"won\" are both past tense." },
    ],
  },
  {
    id: "e-main-idea", subject: "english", grade: 8, title: "Finding the main idea",
    summary: "Working out what a paragraph is mostly about, and separating it from details.",
    prerequisites: ["e-parts"],
    items: [
      { id: "e-main-idea-1", prompt: "\"Bees pollinate crops. Without them, many fruits would not grow. Farmers depend on bees.\" What is the main idea?", options: ["Bees make honey.", "Bees are important for food.", "Farmers like fruit.", "Fruit is healthy."], answer: 1, hint: "Every sentence points to the same big idea.", explanation: "Each sentence shows how bees matter to food and farming." },
      { id: "e-main-idea-2", prompt: "A detail is:", options: ["The big point of the text", "A fact that supports the main idea", "The title", "The author's name"], answer: 1, hint: "Details are the small pieces.", explanation: "Details support the main idea with evidence or examples." },
    ],
  },
  {
    id: "e-persuasive", subject: "english", grade: 9, title: "Persuasive writing",
    summary: "Making a clear argument with reasons, evidence and a call to action.",
    prerequisites: ["e-main-idea"],
    items: [
      { id: "e-persuasive-1", prompt: "Which is a persuasive technique?", options: ["A rhetorical question", "A list of ingredients", "A date", "A page number"], answer: 0, hint: "Persuasion tries to move the reader.", explanation: "Rhetorical questions pull the reader into agreeing." },
      { id: "e-persuasive-2", prompt: "A strong argument needs:", options: ["Only opinions", "Reasons and evidence", "Long words", "Many exclamation marks"], answer: 1, hint: "Think about what convinces you.", explanation: "Reasons backed by evidence persuade more than emotion alone." },
    ],
  },
];

export const conceptById = (id: string) => CONCEPTS.find((c) => c.id === id);

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", zu: "isiZulu", xh: "isiXhosa", st: "Sesotho", tn: "Setswana", af: "Afrikaans",
};
