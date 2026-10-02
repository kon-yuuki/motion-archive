import { motionCategories, referencesFor, motionReferenceCount } from '../src/data/ui-motion.js';
const grid = document.querySelector('[data-motion-categories]');
if (grid) {
  grid.innerHTML = motionCategories.map((category,index) => `<a class="component-card component-card--available" href="./${category.slug}/"${category.slug === 'buttons' ? ' data-no-swup' : ''}><span class="component-card__index">${String(index+1).padStart(3,'0')}</span><div><h3>${category.title}</h3><p>${category.description}</p></div><span class="component-card__status">${String(referencesFor(category.slug).length).padStart(2,'0')} studies ↗</span></a>`).join('');
  document.querySelector('[data-motion-total]').textContent = `${motionReferenceCount} reference studies / 5 categories`;
}
