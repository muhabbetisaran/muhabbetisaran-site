let editingMotivationId = null;
let editingMotivationEntry = null;

document.addEventListener('DOMContentLoaded', () => {
  fetchMotivation();

  document.getElementById('add-motivation-btn').addEventListener('click', () => {
    openMotivationModal(false, null);
  });

  document.getElementById('motivation-modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = document.getElementById('motivation-modal-text').value;
    if (editingMotivationId) {
      await fetch(`/api/motivation/${editingMotivationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
    } else {
      await fetch('/api/motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
    }
    closeMotivationModal();
    fetchMotivation();
  });
});

async function fetchMotivation() {
  const res = await fetch('/api/motivation');
  const entries = await res.json();
  const list = document.getElementById('motivation-list');
  list.innerHTML = '';
  for (const entry of entries) {
    const div = document.createElement('div');
    div.className = 'motivation-card';
    div.innerHTML = `
      <div class="motivation-text">${escapeHTML(entry.text)}</div>
      <div class="motivation-actions">
        <button onclick="openMotivationModal(true, ${entry.id})">Edit</button>
        <button onclick="deleteMotivation(${entry.id})">Delete</button>
      </div>
    `;
    list.appendChild(div);
  }
}

function openMotivationModal(isEdit, id) {
  document.getElementById('motivation-modal').style.display = 'block';
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('motivation-modal-title').textContent = isEdit ? 'Edit Motivation' : 'Add Motivation';
  document.getElementById('motivation-modal-form').reset();
  if (isEdit) {
    fetch(`/api/motivation/${id}`)
      .then(res => res.json())
      .then(entry => {
        editingMotivationId = entry.id;
        editingMotivationEntry = entry;
        document.getElementById('motivation-modal-text').value = entry.text || '';
      });
  } else {
    editingMotivationId = null;
    editingMotivationEntry = null;
  }
}

function closeMotivationModal() {
  document.getElementById('motivation-modal').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
}

async function deleteMotivation(id) {
  if (confirm('Are you sure you want to delete this motivation?')) {
    await fetch(`/api/motivation/${id}`, { method: 'DELETE' });
    fetchMotivation();
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
window.openMotivationModal = openMotivationModal;
window.closeMotivationModal = closeMotivationModal;
window.deleteMotivation = deleteMotivation;
