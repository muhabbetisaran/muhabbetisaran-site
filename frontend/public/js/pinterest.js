let editingPinterestId = null;
let editingPinterestEntry = null;

document.addEventListener('DOMContentLoaded', () => {
  fetchPinterest();

  document.getElementById('add-pinterest-btn').addEventListener('click', () => {
    openPinterestModal(false, null);
  });

  document.getElementById('pinterest-modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const link = document.getElementById('pinterest-modal-link').value;
    const note = document.getElementById('pinterest-modal-note').value;
    if (editingPinterestId) {
      await fetch(`/api/pinterest/${editingPinterestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link, note })
      });
    } else {
      await fetch('/api/pinterest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link, note })
      });
    }
    closePinterestModal();
    fetchPinterest();
  });
});

async function fetchPinterest() {
  const res = await fetch('/api/pinterest');
  const pins = await res.json();
  const list = document.getElementById('pinterest-list');
  list.innerHTML = '';
  for (const pin of pins) {
    const div = document.createElement('div');
    div.className = 'pinterest-card';
    div.innerHTML = `
      <div class="pinterest-img-container">
        ${await getPinterestImage(pin.link)}
      </div>
      <div class="pinterest-link"><a href="${pin.link}" target="_blank">Pinterest Link</a></div>
      <div class="pinterest-note">${escapeHTML(pin.note)}</div>
      <div class="pinterest-actions">
        <button onclick="openPinterestModal(true, ${pin.id})">Edit</button>
        <button onclick="deletePinterest(${pin.id})">Delete</button>
      </div>
    `;
    list.appendChild(div);
  }
}

async function getPinterestImage(link) {
  // Always show a beautiful Pinterest logo as the preview
  return `<div class="pinterest-img-container">
    <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png" class="pinterest-img" alt="Pinterest Logo" style="width:80px;height:80px;object-fit:contain;filter:drop-shadow(0 2px 8px #a5b4fc33);margin-top:30px;" />
  </div>`;
}

function openPinterestModal(isEdit, id) {
  document.getElementById('pinterest-modal').style.display = 'block';
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('pinterest-modal-title').textContent = isEdit ? 'Edit Pinterest' : 'Add Pinterest';
  if (isEdit) {
    fetch(`/api/pinterest/${id}`)
      .then(res => res.json())
      .then(entry => {
        editingPinterestId = entry.id;
        editingPinterestEntry = entry;
        document.getElementById('pinterest-modal-link').value = entry.link;
        document.getElementById('pinterest-modal-note').value = entry.note;
      });
  } else {
    editingPinterestId = null;
    editingPinterestEntry = null;
    document.getElementById('pinterest-modal-link').value = '';
    document.getElementById('pinterest-modal-note').value = '';
  }
}

function closePinterestModal() {
  document.getElementById('pinterest-modal').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
}

async function deletePinterest(id) {
  if (confirm('Are you sure you want to delete this Pinterest entry?')) {
    await fetch(`/api/pinterest/${id}`, { method: 'DELETE' });
    fetchPinterest();
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, function(tag) {
    const charsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return charsToReplace[tag] || tag;
  });
} 