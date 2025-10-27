(function(){
  const STORAGE_KEY = 'anon_feed_v1';
  const postInput = document.getElementById('postInput');
  const postBtn = document.getElementById('postBtn');
  const feedEl = document.getElementById('feed');
  const clearBtn = document.getElementById('clearBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importModal = document.getElementById('importModal');
  const importArea = document.getElementById('importArea');
  const doImportBtn = document.getElementById('doImportBtn');
  const cancelImportBtn = document.getElementById('cancelImportBtn');

  function nowStr(){
    return new Date().toLocaleString('uk-UA');
  }

  function sanitize(text){
    return String(text)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  function loadFeed(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return [];
      return JSON.parse(raw);
    }catch(e){
      console.error('Failed to load feed',e);
      return [];
    }
  }

  function saveFeed(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    // вручную триггерим событие для текущей вкладки
    window.dispatchEvent(new Event('anon_feed_updated'));
  }

  function renderFeed(){
    const list = loadFeed();
    feedEl.innerHTML = '';
    if(list.length === 0){
      const empty = document.createElement('div');
      empty.className = 'post';
      empty.innerHTML = '<div class="meta">Стрічка порожня</div><div class="text">Почніть першим — ваша анонімність збережена.</div>';
      feedEl.appendChild(empty);
      return;
    }
    list.slice().reverse().forEach(item => {
      const post = document.createElement('div');
      post.className = 'post';
      post.innerHTML = `
        <div class="meta">${sanitize(item.time)}</div>
        <div class="text">${sanitize(item.text)}</div>
      `;
      feedEl.appendChild(post);
    });
  }

  function addPost(text){
    if(!text || !text.trim()) return;
    const list = loadFeed();
    list.push({text: text.trim(), time: nowStr()});
    saveFeed(list);
    postInput.value = '';
    renderFeed();
  }

  postBtn.addEventListener('click', ()=> addPost(postInput.value));
  postInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){
      addPost(postInput.value);
    }
  });

  clearBtn.addEventListener('click', ()=>{
    if(!confirm('Впевнені, що хочете очистити локальну стрічку? Це видалить лише локальні дані.')) return;
    saveFeed([]);
    renderFeed();
  });

  exportBtn.addEventListener('click', ()=>{
    const list = loadFeed();
    const payload = JSON.stringify({exportedAt: new Date().toISOString(), list}, null, 2);
    // предложим скачать файл
    const blob = new Blob([payload], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anon_feed_export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', ()=>{
    importArea.value = '';
    importModal.classList.remove('hidden');
  });
  cancelImportBtn.addEventListener('click', ()=>{
    importModal.classList.add('hidden');
  });

  doImportBtn.addEventListener('click', ()=>{
    const raw = importArea.value.trim();
    if(!raw) return alert('Вставте JSON для імпорту');
    try{
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed)){
        // если передали напрямую массив — принимаем
        const list = parsed;
        const existing = loadFeed();
        const merged = existing.concat(list);
        saveFeed(merged);
        renderFeed();
        importModal.classList.add('hidden');
        return;
      }
      if(parsed && parsed.list && Array.isArray(parsed.list)){
        const existing = loadFeed();
        const merged = existing.concat(parsed.list);
        saveFeed(merged);
        renderFeed();
        importModal.classList.add('hidden');
        return;
      }
      alert('Невідомий формат JSON. Очікується обʼєкт з полем `list` або масив постів.');
    }catch(e){
      alert('Не вдалося розпарсити JSON: '+ e.message);
    }
  });

  // Обработчик внешнего события storage — синхронизирует вкладки в одном origin
  window.addEventListener('storage', (ev)=>{
    if(ev.key === STORAGE_KEY){
      renderFeed();
    }
  });

  // локальное событие для явной перерисовки
  window.addEventListener('anon_feed_updated', ()=> renderFeed());

  // Инициализация
  document.addEventListener('DOMContentLoaded', ()=>{
    renderFeed();
  });

})();