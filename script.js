const modal = document.querySelector('#report-modal');
const form = document.querySelector('#report-form');
const thanks = document.querySelector('#thanks');
const itemField = form.elements.item;
const reportSummary = document.querySelector('#report-summary');
const matchResult = document.querySelector('#match-result');
const matchTitle = document.querySelector('#match-title');
const matchCopy = document.querySelector('#match-copy');

function openReport(type = 'Lost', item = '') {
  form.reset();
  form.elements.type.value = type;
  itemField.value = item;
  form.hidden = false;
  thanks.hidden = true;
  matchResult.hidden = true;
  modal.showModal();
  window.setTimeout(() => itemField.focus(), 100);
}

function normalise(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function words(value) {
  return new Set(normalise(value).split(' ').filter((word) => word.length > 2));
}

function overlaps(first, second) {
  const right = words(second);
  return [...words(first)].some((word) => right.has(word));
}

function findBestMatch(details) {
  const wantedKind = details.get('type') === 'Lost' ? 'found' : 'lost';
  return cards
    .filter((card) => card.dataset.kind === wantedKind)
    .map((card) => {
      const name = card.querySelector('h3').textContent;
      let score = 0;
      if (overlaps(details.get('item'), name)) score += 45;
      if (overlaps(details.get('colour'), card.dataset.colour)) score += 25;
      if (normalise(details.get('category')) === normalise(card.dataset.category)) score += 20;
      if (overlaps(details.get('location'), card.dataset.location)) score += 10;
      return { name, score };
    })
    .sort((first, second) => second.score - first.score)[0];
}

document.querySelectorAll('[data-open-modal]').forEach((button) => {
  button.addEventListener('click', () => openReport(button.dataset.type || 'Lost'));
});

document.querySelectorAll('[data-item]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    openReport('Lost', link.dataset.item);
  });
});

document.querySelector('.close-modal').addEventListener('click', () => modal.close());
document.querySelector('#done-button').addEventListener('click', () => modal.close());

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const details = new FormData(form);
  const item = details.get('item');
  const colour = details.get('colour');
  const category = details.get('category');
  reportSummary.textContent = `Your ${details.get('type').toLowerCase()} ${item} report is saved. We will compare its ${category.toLowerCase()}, ${colour.toLowerCase()} colour, location and time with reports from the Smart College community.`;
  const match = findBestMatch(details);
  if (match && match.score >= 45) {
    matchTitle.textContent = `Possible match: ${match.name} (${match.score}% match)`;
    matchCopy.textContent = 'The item name, colour, category or location has something in common. Check the listing and confirm private details before claiming it.';
  } else {
    matchTitle.textContent = 'No close match yet';
    matchCopy.textContent = 'Your report will stay available as new items are added. We only show a match when the details are sufficiently similar.';
  }
  matchResult.hidden = false;
  form.hidden = true;
  thanks.hidden = false;
});

modal.addEventListener('click', (event) => {
  if (event.target === modal) modal.close();
});

const search = document.querySelector('#item-search');
const cards = [...document.querySelectorAll('.item-card')];
const noResults = document.querySelector('#no-results');
let selectedFilter = 'all';

function showItems() {
  const term = search.value.trim().toLowerCase();
  let visible = 0;
  cards.forEach((card) => {
    const matchesFilter = selectedFilter === 'all' || card.dataset.kind === selectedFilter;
    const matchesSearch = !term || card.dataset.search.includes(term);
    const shouldShow = matchesFilter && matchesSearch;
    card.hidden = !shouldShow;
    if (shouldShow) visible += 1;
  });
  noResults.hidden = visible !== 0;
}

document.querySelectorAll('.filter').forEach((filter) => {
  filter.addEventListener('click', () => {
    selectedFilter = filter.dataset.filter;
    document.querySelectorAll('.filter').forEach((button) => button.classList.toggle('active', button === filter));
    showItems();
  });
});

document.querySelector('#search-button').addEventListener('click', () => {
  document.querySelector('#recent-items').scrollIntoView({ behavior: 'smooth', block: 'start' });
  showItems();
});

search.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') document.querySelector('#search-button').click();
});
