import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(SplitText);

const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // Entrance: the orb wakes, the headline settles out of a soft blur, the rest follows.
  const tl = gsap.timeline({ defaults: { ease: 'power3.out', lazy: false } });
  const orb = document.getElementById('orb');
  if (orb) {
    tl.from(orb, { scale: 0.7, autoAlpha: 0, duration: 0.9, clearProps: 'transform,opacity,visibility' }, 0);
  }
  const eyebrow = document.querySelector('.eyebrow[data-animate="hero"]');
  if (eyebrow) tl.from(eyebrow, { y: 10, autoAlpha: 0, duration: 0.6 }, 0.25);
  const title = document.querySelector('[data-animate="split"]');
  if (title) {
    tl.from(title, { filter: 'blur(10px)', y: 14, autoAlpha: 0, duration: 0.9, clearProps: 'filter' }, 0.3);
  }
  const form = document.getElementById('ask-form');
  if (form) tl.from(form, { y: 18, autoAlpha: 0, duration: 0.7 }, 0.55);
  const chips = document.querySelectorAll('.chips > *');
  if (chips.length) tl.from(chips, { y: 12, autoAlpha: 0, duration: 0.5, stagger: 0.06 }, 0.75);

  // Orb: a slow breathing glow and a gentle drift of the icon (transform of the orb itself stays free for hover).
  if (orb) {
    gsap.to(orb, { boxShadow: '0 0 0 1px rgba(139,92,246,0.8), 0 0 64px rgba(139,92,246,0.5)', duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    const icon = orb.querySelector('svg');
    if (icon) gsap.to(icon, { y: -3, rotation: 6, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  // Answer reveal: question, card, then each paragraph in turn.
  const q = document.getElementById('answer-q');
  const card = document.getElementById('answer-body');
  const note = document.querySelector('.answer-note');
  const actions = document.querySelector('.answer-actions');
  const home = document.getElementById('home-view');

  const onView = () => {
    gsap.fromTo(q, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.out', overwrite: 'auto', clearProps: 'transform' });
    gsap.fromTo(card, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, delay: 0.12, ease: 'power2.out', overwrite: 'auto', clearProps: 'transform' });
    gsap.set([note, actions], { autoAlpha: 0 });
  };
  const onAnswer = () => {
    gsap.fromTo(card.children, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.14, ease: 'power2.out', overwrite: 'auto' });
    gsap.to([note, actions], { autoAlpha: 1, duration: 0.6, delay: 0.3, stagger: 0.1, overwrite: 'auto' });
  };
  const onHome = () => {
    gsap.fromTo(home, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.out', clearProps: 'all' });
  };
  document.addEventListener('synswer:view', onView);
  document.addEventListener('synswer:answer', onAnswer);
  document.addEventListener('synswer:home', onHome);
  return () => {
    document.removeEventListener('synswer:view', onView);
    document.removeEventListener('synswer:answer', onAnswer);
    document.removeEventListener('synswer:home', onHome);
  };
});
