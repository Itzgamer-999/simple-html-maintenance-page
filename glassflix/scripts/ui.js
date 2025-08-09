import { imgPath } from './api.js';
import { isSaved, toggle as toggleSave } from './store.js';

export function createCard(item) {
  const id = item.id;
  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const title = item.title || item.name;
  const poster = item.poster_path ? imgPath(item.poster_path, 'w342') : '';
  const rating = (item.vote_average || 0).toFixed(1);
  const href = `details.html?type=${mediaType}&id=${id}`;

  const card = document.createElement('a');
  card.href = href;
  card.className = 'card content-visibility-auto anim-pop';
  card.setAttribute('data-id', String(id));
  card.setAttribute('data-type', mediaType);

  const img = document.createElement('img');
  img.className = 'poster';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.alt = title;
  if (poster) img.dataset.src = poster; else img.classList.add('skeleton');

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.innerHTML = `<div class="title">${title}</div><div class="rating">★ ${rating}</div>`;

  const actions = document.createElement('div');
  actions.className = 'actions';
  const btn = document.createElement('button');
  btn.className = 'btn btn-secondary';
  btn.type = 'button';
  btn.textContent = isSaved(id, mediaType) ? '− My List' : '+ My List';
  btn.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    const added = toggleSave({ id, media_type: mediaType, title, poster_path: item.poster_path });
    btn.textContent = added ? '− My List' : '+ My List';
    toast(added ? 'Added to My List' : 'Removed from My List');
  });
  actions.appendChild(btn);

  card.appendChild(img);
  card.appendChild(meta);
  card.appendChild(actions);

  return card;
}

export function lazyLoadImages(root = document) {
  const imgs = root.querySelectorAll('img[data-src]');
  const io = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      if (el.dataset.src) {
        el.src = el.dataset.src; delete el.dataset.src;
      }
      obs.unobserve(el);
    }
  }, { rootMargin: '200px 0px' });
  imgs.forEach(img => io.observe(img));
}

export function toast(text) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'toast';
    t.style.position = 'fixed'; t.style.bottom = '20px'; t.style.left = '50%'; t.style.transform = 'translateX(-50%)';
    t.style.padding = '10px 14px'; t.style.borderRadius = '14px'; t.style.border = '1px solid var(--glass-border)';
    t.style.background = 'rgba(0,0,0,.6)'; t.style.backdropFilter = 'blur(10px)';
    t.style.zIndex = '70'; t.style.boxShadow = 'var(--shadow)';
    document.body.appendChild(t);
  }
  t.textContent = text; t.style.opacity = '1';
  clearTimeout(t._hide);
  t._hide = setTimeout(() => { t.style.opacity = '0'; }, 1600);
}

export function showModal(html) {
  let backdrop = document.querySelector('.modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `<div class="modal glass anim-pop"><div class="content" style="padding:1rem"></div><div style="display:flex;justify-content:flex-end;padding:.6rem"><button class="btn" id="modal-close">Close</button></div></div>`;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) hideModal(); });
    backdrop.querySelector('#modal-close').addEventListener('click', hideModal);
  }
  backdrop.querySelector('.content').innerHTML = html;
  backdrop.classList.add('show');
}
export function hideModal() {
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) backdrop.classList.remove('show');
}

export function confirmExternal(url) {
  return new Promise((resolve) => {
    const dom = `
      <div style="display:flex; align-items:center; gap:.8rem; margin-bottom:.6rem">
        <div class="badge">!</div>
        <div>
          <div style="font-weight:700; font-size:1.1rem">You’re leaving GlassFlix</div>
          <div style="color:var(--muted); font-size:.95rem">We’ll open: <span class="link-underline">${url}</span></div>
        </div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:.5rem">
        <button class="btn" id="ext-cancel">Cancel</button>
        <button class="btn btn-primary" id="ext-continue">Continue</button>
      </div>`;
    showModal(dom);
    const b = document.querySelector('.modal-backdrop');
    const done = (val) => { hideModal(); resolve(val); };
    b.querySelector('#ext-cancel').addEventListener('click', () => done(false));
    b.querySelector('#ext-continue').addEventListener('click', () => done(true));
  });
}