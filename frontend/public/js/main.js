let currentCrushId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const bgImg = document.getElementById('bg-img'); 
  if(bgImg){
    const res = await fetch('/api/backgrounds');
    const images = await res.json();
    if (images.length > 0) {
      const random = images[Math.floor(Math.random() * images.length)];
      bgImg.src = `/backgrounds/${random}`;
      bgImg.style.display = 'block';
  }
  
  
  }
});

document.addEventListener('DOMContentLoaded', () => {
    fetchCrushes();

    document.getElementById('crush-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const description = document.getElementById('description').value;
      const instagram_link = document.getElementById('instagram_link').value;
      const youtube_link = document.getElementById('youtube_link').value;
  
      await fetch('/api/crushes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, instagram_link, youtube_link })
      });
  
      fetchCrushes();
      e.target.reset();
    });
  });
  
  
  async function fetchCrushes() {
    const res = await fetch('/api/crushes');
    const crushes = await res.json();
    const list = document.getElementById('crushes-list');
    list.innerHTML = '';
    for (const crush of crushes) {
      const div = document.createElement('div');
      div.className = 'crush-card';
      div.innerHTML = `
        <button class="delete-btn" onclick="deleteCrush(${crush.id})">&times;</button>
        <button class="edit-btn" onclick="openEditModal(${crush.id})">&#9998;</button>
        <h4>${crush.name}</h4>
        <p>${crush.description}</p>
        ${crush.instagram_link ? getInstagramEmbed(crush.instagram_link) : ''}
        ${crush.youtube_link ? getYouTubeEmbed(crush.youtube_link) : ''}
        <div class="photos" id="photos-${crush.id}"></div>
        <button onclick="openPhotoModal(${crush.id}, '${crush.name}')">Add Photo</button>
      `;
      list.appendChild(div);
      fetchPhotos(crush.id);
    }
  }

  async function fetchPhotos(crushId) {
    const res = await fetch(`/api/crushes/${crushId}/photos`);
    const photos = await res.json();
    const photosDiv = document.getElementById(`photos-${crushId}`);
    photosDiv.innerHTML = photos.map(photo =>
      `<img src="${photo.photo_url}" class="crush-photo" alt="Crush Photo" />`
    ).join('');
  }

  function openPhotoModal(crushId, crushName) {
    currentCrushId = crushId;
    document.getElementById('modal-crush-name').textContent = crushName;
    document.getElementById('photo-upload-modal').style.display = 'block';
  }

  function closePhotoModal() {
    document.getElementById('photo-upload-modal').style.display = 'none';
  }

  document.getElementById('photo-upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('photo-file');
    const formData = new FormData();
    formData.append('photo', fileInput.files[0]);
    await fetch(`/api/crushes/${currentCrushId}/photos`, {
      method: 'POST',
      body: formData
    });
    closePhotoModal();
    fetchPhotos(currentCrushId);
  });

  async function deleteCrush(crushId) {
    if (confirm('Are you sure you want to delete this crush?')) {
      await fetch(`/api/crushes/${crushId}`, { method: 'DELETE' });
      fetchCrushes();
    }
  };

function getYouTubeEmbed(url) {
  // Supports various YouTube URL formats, including shorts
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  if (match && match[1]) {
    return `<iframe width="300" height="170" src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allowfullscreen></iframe>`;
  }
  return '';
}

function getInstagramEmbed(url) {
  // Match both /reel/ and /p/ (post) URLs
  const match = url.match(/instagram\.com\/(reel|p)\/([\w-]+)/);
  if (match && match[1] && match[2]) {
    return `<iframe src="https://www.instagram.com/${match[1]}/${match[2]}/embed" width="300" height="400" frameborder="0" allowfullscreen></iframe>`;
  }
  return '';
}

let editingCrushId = null;

function openEditModal(crushId) {
  console.log('Opening edit modal for crush ID:', crushId);
  editingCrushId = crushId;
  // Find the crush data
  fetch(`/api/crushes/${crushId}`)
    .then(res => res.json())
    .then(crush => {
      
      document.getElementById('edit-name').value = crush.name;
      document.getElementById('edit-description').value = crush.description;
      document.getElementById('edit-instagram_link').value = crush.instagram_link || '';
      document.getElementById('edit-youtube_link').value = crush.youtube_link || '';
      document.getElementById('edit-show-modal').style.display = 'block';
      document.getElementById('modal-overlay').style.display = 'block';
      console.log('Modal should now be visible');
      console.log('Crush data received:', crush);
    });
}

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'none';
}

document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('edit-name').value;
  const description = document.getElementById('edit-description').value;
  const instagram_link = document.getElementById('edit-instagram_link').value;
  const youtube_link = document.getElementById('edit-youtube_link').value;

  console.log('Submitting edit:', { name, description, instagram_link, youtube_link });

  await fetch(`/api/crushes/${editingCrushId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, instagram_link, youtube_link })
  });
  closeEditModal();
  fetchCrushes();
});