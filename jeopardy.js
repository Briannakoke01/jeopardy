let categories = [];
const DOLLAR_AMOUNTS = [100, 200, 300, 400, 500];

/** Get NUM_CATEGORIES random categories from API.
 *
 * Returns array of category ids
 */
async function getCategoryIds() {
  const NUM_CATEGORIES = 6;
  try {
    const response = await axios.get(`https://rithm-jeopardy.herokuapp.com/api/categories?count=100`);
    const allCategories = response.data;
    const selectedCategories = _.sampleSize(allCategories, NUM_CATEGORIES);
    return selectedCategories.map(category => category.id);
  } catch (error) {
    console.error("Failed to fetch category IDs:", error);
    alert("Unable to fetch category IDs. Please try again later.");
    return [];
  }
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */
async function getCategory(catId) {
  try {
    const response = await axios.get(`https://rithm-jeopardy.herokuapp.com/api/category?id=${catId}`);
    const data = response.data;
    const clues = _.sampleSize(data.clues, 5).map((clue, index) => ({
      question: clue.question,
      answer: clue.answer,
      showing: null,
      value: DOLLAR_AMOUNTS[index]
    }));
    return { title: data.title, clues: clues };
  } catch (error) {
    console.error(`Failed to fetch category ${catId}:`, error);
    return { title: "Unknown", clues: [] };
  }
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initially, just show a "$" where the question/answer would go.)
 */
async function fillTable() {
  const NUM_CATEGORIES = 6;
  const NUM_QUESTIONS_PER_CAT = 5;

  const $table = $('#jeopardy');
  const $thead = $table.find('thead');
  const $tbody = $table.find('tbody');

  // Clear previous content
  $thead.empty();
  $tbody.empty();

  const categoryIds = await getCategoryIds();
  if (categoryIds.length === 0) return;

  categories = await Promise.all(categoryIds.map(id => getCategory(id)));

  // Fill thead with category titles
  const $headRow = $('<tr>');
  categories.forEach(category => {
    const $th = $('<th>').text(category.title);
    $headRow.append($th);
  });
  $thead.append($headRow);

  // Fill tbody with questions
  for (let i = 0; i < NUM_QUESTIONS_PER_CAT; i++) {
    const $row = $('<tr>');
    categories.forEach((category, catIdx) => {
      const clue = category.clues[i];
      const $cell = $('<td>').text(`$${clue.value}`).data({ catIdx, clueIdx: i }).on('click', handleClick);
      $row.append($cell);
    });
    $tbody.append($row);
  }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */
function handleClick(evt) {
  const $cell = $(evt.target);
  const catIdx = $cell.data('catIdx');
  const clueIdx = $cell.data('clueIdx');
  const clue = categories[catIdx].clues[clueIdx];

  if (clue.showing === null) {
    $cell.text(clue.question);
    clue.showing = 'question';
  } else if (clue.showing === 'question') {
    $cell.text(clue.answer);
    clue.showing = 'answer';
  }
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */
function showLoadingView() {
  $('#spinner').show();
  $('#start-button').prop('disabled', true);
}

/** Remove the loading spinner and update the button used to fetch data. */
function hideLoadingView() {
  $('#spinner').hide();
  $('#start-button').prop('disabled', false);
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */
async function setupAndStart() {
  showLoadingView();
  await fillTable();
  hideLoadingView();
}

/** On click of start / restart button, set up game. */
$('#start-button').on('click', setupAndStart);

/** On page load, add event handler for clicking clues */
$(document).ready(() => {
  setupAndStart();
});
