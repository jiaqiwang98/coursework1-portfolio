'use strict';
const viewer = document.querySelector('#lightbox');
const fullImage = document.querySelector('#full-image');
document.querySelectorAll('[data-image]').forEach(button => {
  button.addEventListener('click', () => {
    fullImage.src = button.dataset.image;
    fullImage.alt = button.querySelector('img').alt;
    document.querySelector('#image-caption').textContent = button.dataset.caption;
    viewer.showModal();
    document.body.classList.add('modal-open');
  });
});
document.querySelector('#close-lightbox').addEventListener('click', () => viewer.close());
viewer.addEventListener('close', () => document.body.classList.remove('modal-open'));
viewer.addEventListener('click', event => {
  const bounds = viewer.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
});
const stack = document.querySelector('#demo-stack');
const originalCards = [...stack.children];
const review = stack.querySelector('[data-card="reviews"]');
const toggle = document.querySelector('#toggle-card');
const status = document.querySelector('#demo-status');
function announce() { status.textContent = 'Current layout: ' + [...stack.children].filter(card => !card.hidden).map(card => card.dataset.card).join(', '); }
document.querySelector('#reorder').addEventListener('click', () => { stack.append(stack.firstElementChild); announce(); });
toggle.addEventListener('click', () => { review.hidden = !review.hidden; toggle.textContent = review.hidden ? 'Add reviews +' : 'Hide reviews −'; toggle.setAttribute('aria-pressed', String(review.hidden)); announce(); });
document.querySelector('#reset-demo').addEventListener('click', () => { originalCards.forEach(card => stack.append(card)); review.hidden = false; toggle.textContent = 'Hide reviews −'; toggle.setAttribute('aria-pressed', 'false'); announce(); });
if ('IntersectionObserver' in window) {
  const links = [...document.querySelectorAll('nav a')];
  const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) { links.forEach(link => { const active = link.hash === '#' + entry.target.id; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); }); } }); }, { rootMargin: '-10% 0px -65% 0px' });
  document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
}
