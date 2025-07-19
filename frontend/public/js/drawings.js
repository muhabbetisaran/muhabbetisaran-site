let editingDrawingId = null;
let editingDrawingEntry = null;
let drawingPopup = null;

document.addEventListener('DOMContentLoaded', () => {
  fetchDrawings();

  document.getElementById('add-drawing-btn').addEventListener('click', () => {
    openDrawingModal(false, null);
  });

  document.getElementById('drawing-modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('note', document.getElementById('drawing-modal-note').value);
    const drawingFile = document.getElementById('drawing-modal-drawing').files[0];
    const originalFile = document.getElementById('drawing-modal-original').files[0];
    if (drawingFile) formData.append('drawing', drawingFile);
    if (originalFile) formData.append('original', originalFile);
    if (editingDrawingId) {
      await fetch(`/api/drawings/${editingDrawingId}`, {
        method: 'PUT',
        body: formData
      });
    } else {
      await fetch('/api/drawings', {
        method: 'POST',
        body: formData
      });
    }
    closeDrawingModal();
    fetchDrawings();
  });

  document.getElementById('drawing-modal-drawing').addEventListener('change', function() {
    previewImage(this, 'preview-drawing');
  });
  document.getElementById('drawing-modal-original').addEventListener('change', function() {
    previewImage(this, 'preview-original');
  });
});

async function fetchDrawings() {
  const res = await fetch('/api/drawings');
  const drawings = await res.json();
  const list = document.getElementById('drawings-list');
  list.innerHTML = '';
  for (const drawing of drawings) {
    const div = document.createElement('div');
    div.className = 'drawing-card';
    div.innerHTML = `
      <div class="drawing-title">${escapeHTML(drawing.note || 'Untitled')}</div>
      <div class="drawing-imgs">
        <div class="drawing-img-block">
          <div class="drawing-img-label">Nisa's Drawing</div>
          ${drawing.drawing_url ? `<img src="${drawing.drawing_url}" class="drawing-img" alt="Drawing" />` : '<div class="drawing-img drawing-placeholder">No Image</div>'}
        </div>
        <div class="drawing-img-block">
          <div class="drawing-img-label">Original</div>
          ${drawing.original_url ? `<img src="${drawing.original_url}" class="drawing-img" alt="Original" />` : '<div class="drawing-img drawing-placeholder">No Image</div>'}
        </div>
      </div>
      <div class="drawing-actions">
        <button onclick="openDrawingModal(true, ${drawing.id})">Edit</button>
        <button onclick="deleteDrawing(${drawing.id})">Delete</button>
      </div>
    `;
    // Add popup logic
    div.onclick = (e) => {
      // Prevent popup on edit/delete button click
      if (e.target.tagName === 'BUTTON') return;
      showDrawingPopup(drawing);
    };
    list.appendChild(div);
  }
}

function openDrawingModal(isEdit, id) {
  document.getElementById('drawing-modal').style.display = 'block';
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById('drawing-modal-title').textContent = isEdit ? 'Edit Drawing' : 'Add Drawing';
  document.getElementById('drawing-modal-form').reset();
  document.getElementById('preview-drawing').style.display = 'none';
  document.getElementById('preview-original').style.display = 'none';
  if (isEdit) {
    fetch(`/api/drawings/${id}`)
      .then(res => res.json())
      .then(entry => {
        editingDrawingId = entry.id;
        editingDrawingEntry = entry;
        document.getElementById('drawing-modal-note').value = entry.note || '';
        if (entry.drawing_url) {
          document.getElementById('preview-drawing').src = entry.drawing_url;
          document.getElementById('preview-drawing').style.display = 'block';
        }
        if (entry.original_url) {
          document.getElementById('preview-original').src = entry.original_url;
          document.getElementById('preview-original').style.display = 'block';
        }
      });
  } else {
    editingDrawingId = null;
    editingDrawingEntry = null;
  }
}

function closeDrawingModal() {
  document.getElementById('drawing-modal').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
}

async function deleteDrawing(id) {
  if (confirm('Are you sure you want to delete this drawing?')) {
    await fetch(`/api/drawings/${id}`, { method: 'DELETE' });
    fetchDrawings();
  }
}

function previewImage(input, previewId) {
  const preview = document.getElementById(previewId);
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
  } else {
    preview.src = '';
    preview.style.display = 'none';
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
window.openDrawingModal = openDrawingModal;
window.closeDrawingModal = closeDrawingModal;
window.deleteDrawing = deleteDrawing;

function showDrawingPopup(drawing) {
  if (drawingPopup) drawingPopup.remove();
  drawingPopup = document.createElement('div');
  drawingPopup.className = 'drawing-popup-modal';
  drawingPopup.innerHTML = `
    <button class="drawing-popup-close" onclick="closeDrawingPopup()">&times;</button>
    <div class="drawing-popup-title">${escapeHTML(drawing.note || 'Untitled')}</div>
    <div class="drawing-popup-imgs">
      <div class="drawing-img-block">
        <div class="drawing-img-label">Nisa's Drawing</div>
        ${drawing.drawing_url ? `<img src="${drawing.drawing_url}" class="drawing-popup-img" alt="Drawing" />` : '<div class="drawing-img drawing-placeholder">No Image</div>'}
      </div>
      <div class="drawing-img-block">
        <div class="drawing-img-label">Original</div>
        ${drawing.original_url ? `<img src="${drawing.original_url}" class="drawing-popup-img" alt="Original" />` : '<div class="drawing-img drawing-placeholder">No Image</div>'}
      </div>
    </div>
  `;
  document.body.appendChild(drawingPopup);
  document.getElementById('modal-overlay').style.display = 'block';
}

function closeDrawingPopup() {
  if (drawingPopup) {
    drawingPopup.remove();
    drawingPopup = null;
  }
  document.getElementById('modal-overlay').style.display = 'none';
}
window.showDrawingPopup = showDrawingPopup;
window.closeDrawingPopup = closeDrawingPopup; 