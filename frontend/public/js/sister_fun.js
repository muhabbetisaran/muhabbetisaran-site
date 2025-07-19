// Dummy random messages for missed days
const randomMessages = [
  "Ablanı neden zorbalamıyosuun !!!",
  "Bugün hiç ablanı zorbalamadın :(, bir sorun mu var?",
  "Hatırlıyo musun bi keresinde uzaylılardan evlat edindik demiştin ne sarmıştı ya, hadi bida zorbala:).",
  "Ablan zorbalanmak istiyo gibi geldi ne dedin?",
  "Ne yapıyosan acilen bırak ve ablanı zorbala"
];

let selectedDate = null;
let today = null;
let currentEntryId = null;
let currentEntry = null;

document.addEventListener('DOMContentLoaded', () => {
  today = new Date();
  selectedDate = formatDate(today);
  renderToday();
  renderCalendar(today.getFullYear(), today.getMonth());
  loadEntry(selectedDate);

  // Birthday animation
  if (today.getDate() === 20 && today.getMonth() === 6) {
    document.getElementById('birthday-animation').style.display = 'block';
  }

  document.getElementById('joke-modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const description = document.getElementById('joke-modal-description').value;
    const rating = document.getElementById('joke-modal-rating').value;
    await fetch('/api/sister-fun', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, description, rating })
    });
    closeJokeModal();
    loadEntry(selectedDate);
    renderCalendar(today.getFullYear(), today.getMonth());
  });

  document.getElementById('fun-delete-btn').addEventListener('click', async () => {
    if (currentEntryId) {
      await fetch(`/api/sister-fun/${currentEntryId}`, { method: 'DELETE' });
      loadEntry(selectedDate);
      renderCalendar(today.getFullYear(), today.getMonth());
    }
  });
});

function renderToday() {
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const now = new Date();
  document.getElementById('today-date').textContent =
    `Ablanı zorbaladın mı bugün?`;
}

function renderCalendar(year, month) {
  const calendarDiv = document.getElementById('calendar');
  calendarDiv.innerHTML = '';
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  fetch(`/api/sister-fun?month=${year}-${String(month+1).padStart(2,'0')}`)
    .then(res => res.json())
    .then(entries => {
      const entryMap = {};
      entries.forEach(e => entryMap[e.date] = e);

      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      let html = `<div class='calendar-header'>
        <button id='prev-month'>&lt;</button>
        <span>${months[month]} ${year}</span>
        <button id='next-month'>&gt;</button>
      </div>
      <div class='calendar-grid'>
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      `;

      for (let i = 0; i < startDay; i++) html += "<div></div>";

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        let classes = 'calendar-day';
        if (dateStr === formatDate(today)) classes += ' today';
        if (entryMap[dateStr]) classes += ' has-entry';
        html += `<div class='${classes}' data-date='${dateStr}'>${d}</div>`;
      }
      html += "</div>";
      calendarDiv.innerHTML = html;

      document.getElementById('prev-month').onclick = () => {
        renderCalendar(month === 0 ? year-1 : year, month === 0 ? 11 : month-1);
      };
      document.getElementById('next-month').onclick = () => {
        renderCalendar(month === 11 ? year+1 : year, month === 11 ? 0 : month+1);
      };

      document.querySelectorAll('.calendar-day').forEach(day => {
        day.onclick = () => {
          selectedDate = day.getAttribute('data-date');
          loadEntry(selectedDate);
        };
      });
    });
}

function loadEntry(date) {
  const entryTitle = document.getElementById('entry-title');
  const noFunMsg = document.getElementById('no-fun-message');
  const randomMsg = document.getElementById('random-message');
  const funEntry = document.getElementById('fun-entry');
  const deleteBtn = document.getElementById('fun-delete-btn');

  currentEntryId = null;
  currentEntry = null;

  // Update entry title
  const d = new Date(date);
  entryTitle.textContent =
    `Bugün ${d.getDate()} ${["January","February","March","April","May","June","July","August","September","October","November","December"][d.getMonth()]} ${d.getFullYear()}`;

  // Clear previous content
  funEntry.querySelectorAll('.joke-content, .joke-actions, .add-joke-btn').forEach(el => el.remove());
  noFunMsg.style.display = 'none';
  randomMsg.style.display = 'none';
  deleteBtn.style.display = 'none';

  fetch(`/api/sister-fun/${date}`)
    .then(res => {
      if (!res.ok) throw new Error('No entry');
      return res.json();
    })
    .then(entry => {
      currentEntryId = entry.id;
      currentEntry = entry;
      // Show joke content
      const jokeDiv = document.createElement('div');
      jokeDiv.className = 'joke-content';
      jokeDiv.innerHTML = `<div style='margin:1em 0;'><strong>Joke:</strong> ${entry.description}</div><div><strong>Rating:</strong> ${entry.rating}</div>`;
      funEntry.insertBefore(jokeDiv, noFunMsg);
      // Show actions
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'joke-actions';
      actionsDiv.style.marginTop = '1em';
      actionsDiv.innerHTML = `<button type='button' onclick='openJokeModal(true, currentEntry)'>Edit</button> <button type='button' id='fun-delete-btn-inline'>Delete</button>`;
      funEntry.insertBefore(actionsDiv, noFunMsg);
      // Inline delete button
      actionsDiv.querySelector('#fun-delete-btn-inline').onclick = async () => {
        if (currentEntryId) {
          await fetch(`/api/sister-fun/${currentEntryId}`, { method: 'DELETE' });
          loadEntry(selectedDate);
          renderCalendar(today.getFullYear(), today.getMonth());
        }
      };
    })
    .catch(() => {
      // No entry for this date
      // Show random message at the top
      randomMsg.style.display = 'block';
      randomMsg.textContent = randomMessages[Math.floor(Math.random() * randomMessages.length)];
      funEntry.insertBefore(randomMsg, funEntry.firstChild);
      // Show no-fun message in the middle
      noFunMsg.style.display = 'block';
      noFunMsg.textContent = "Bugün ablanı zorbalamadın hiç :(";
      // Show Add Joke button at the bottom
      let addBtn = funEntry.querySelector('.add-joke-btn');
      if (!addBtn) {
        addBtn = document.createElement('button');
        addBtn.className = 'add-joke-btn';
        addBtn.type = 'button';
        addBtn.textContent = 'Zorbalama Ekle';
        addBtn.style.marginTop = '1em';
      }
      // Remove and re-insert to ensure order
      if (addBtn.parentNode) addBtn.parentNode.removeChild(addBtn);
      funEntry.appendChild(addBtn);
      addBtn.onclick = () => openJokeModal(false, null);
    });
}

function openJokeModal(isEdit, entry) {
  document.getElementById('joke-modal').style.display = 'block';
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('joke-modal-title').textContent = isEdit ? 'Edit Joke' : 'Add Joke';
  document.getElementById('joke-modal-description').value = entry ? entry.description : '';
  document.getElementById('joke-modal-rating').value = entry ? entry.rating : '';
}

function closeJokeModal() {
  document.getElementById('joke-modal').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
}

function formatDate(date) {
  if (typeof date === 'string') return date;
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
}
