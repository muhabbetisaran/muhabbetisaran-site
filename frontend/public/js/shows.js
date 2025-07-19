let editingShowId = null;

document.addEventListener('DOMContentLoaded', () => {
  fetchShows();

  document.getElementById('show-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('show-title').value;
    const type = document.getElementById('show-type').value;
    const description = document.getElementById('show-description').value;
    const best_line = document.getElementById('show-best_line').value;
    const youtube_link = document.getElementById('show-youtube_link').value;
    const instagram_link = document.getElementById('show-instagram_link').value;

    await fetch('/api/shows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, type, description, best_line, youtube_link, instagram_link })
    });
    fetchShows();
    e.target.reset();
  });

  document.getElementById('edit-show-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('edit-show-title').value;
    const type = document.getElementById('edit-show-type').value;
    const description = document.getElementById('edit-show-description').value;
    const best_line = document.getElementById('edit-show-best_line').value;
    const youtube_link = document.getElementById('edit-show-youtube_link').value;
    const instagram_link = document.getElementById('edit-show-instagram_link').value;

    await fetch(`/api/shows/${editingShowId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, type, description, best_line, youtube_link, instagram_link })
    });
    closeEditShowModal();
    fetchShows();
  });
});

async function fetchShows() {
  const res = await fetch('/api/shows');
  const shows = await res.json();
  const list = document.getElementById('shows-list');
  list.innerHTML = '';
  for (const show of shows) {
    const div = document.createElement('div');
    div.className = 'crush-card';
    div.innerHTML = `
      <button class="delete-btn" onclick="deleteShow(${show.id})">&times;</button>
      <button class="edit-btn" onclick="openEditShowModal(${show.id})">&#9998;</button>
      <h4>${show.title} <span style="font-size:0.8em;color:#6366f1;">(${show.type})</span></h4>
      <p>${show.description}</p>
      ${show.best_line ? `<div style='font-style:italic;color:#b91c1c;margin-bottom:0.5em;'>"${show.best_line}"</div>` : ''}
      ${show.instagram_link ? getInstagramEmbed(show.instagram_link) : ''}
      ${show.youtube_link ? getYouTubeEmbed(show.youtube_link) : ''}
    `;
    list.appendChild(div);
  }
}

async function deleteShow(showId) {
  if (confirm('Are you sure you want to delete this movie/series?')) {
    await fetch(`/api/shows/${showId}`, { method: 'DELETE' });
    fetchShows();
  }
}

function openEditShowModal(showId) {
  editingShowId = showId;
  fetch(`/api/shows/${showId}`)
    .then(res => res.json())
    .then(show => {
      document.getElementById('edit-show-title').value = show.title;
      document.getElementById('edit-show-type').value = show.type;
      document.getElementById('edit-show-description').value = show.description;
      document.getElementById('edit-show-best_line').value = show.best_line || '';
      document.getElementById('edit-show-youtube_link').value = show.youtube_link || '';
      document.getElementById('edit-show-instagram_link').value = show.instagram_link || '';
      document.getElementById('edit-show-modal').style.display = 'block';
      document.getElementById('modal-overlay').style.display = 'block';
    });
}

function closeEditShowModal() {
  document.getElementById('edit-show-modal').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
}

function getYouTubeEmbed(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  if (match && match[1]) {
    return `<iframe width="300" height="170" src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allowfullscreen></iframe>`;
  }
  return '';
}

function getInstagramEmbed(url) {
  const match = url.match(/instagram\.com\/(reel|p)\/([\w-]+)/);
  if (match && match[1] && match[2]) {
    return `<iframe src="https://www.instagram.com/${match[1]}/${match[2]}/embed" width="300" height="400" frameborder="0" allowfullscreen></iframe>`;
  }
  return '';
} 