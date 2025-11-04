/**
 * Sidebar Category Toggle Functionality
 */

(function() {
  'use strict';

  // Initialize category toggles
  function initCategoryToggles() {
    // Get all dropdown toggle links
    const dropdownToggles = document.querySelectorAll('[data-toggle="collapse"]');

    dropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', function(e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);

        if (!target) return;

        // Toggle aria-expanded
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !isExpanded);

        // Toggle collapse class
        if (target.classList.contains('show')) {
          target.classList.remove('show');
        } else {
          target.classList.add('show');
        }
      });
    });

    // Check current page and expand relevant categories
    expandCurrentCategory();
  }

  // Expand category if current page is within that category
  function expandCurrentCategory() {
    const currentPath = window.location.pathname;

    // Check if we're on a category page
    if (currentPath.includes('/categories/')) {
      const categoryPath = currentPath.split('/categories/')[1];

      // Expand main categories submenu
      const categoriesSubmenu = document.getElementById('categoriesSubmenu');
      if (categoriesSubmenu) {
        categoriesSubmenu.classList.add('show');
        const categoriesToggle = document.querySelector('[href="#categoriesSubmenu"]');
        if (categoriesToggle) {
          categoriesToggle.setAttribute('aria-expanded', 'true');
        }
      }

      // Expand mentoring submenu if needed
      if (categoryPath.startsWith('mentoring')) {
        const mentoringSubmenu = document.getElementById('mentoringSubmenu');
        if (mentoringSubmenu) {
          mentoringSubmenu.classList.add('show');
          const mentoringToggle = document.querySelector('[href="#mentoringSubmenu"]');
          if (mentoringToggle) {
            mentoringToggle.setAttribute('aria-expanded', 'true');
          }
        }
      }

      // Expand tech submenu if needed
      if (categoryPath.startsWith('tech')) {
        const techSubmenu = document.getElementById('techSubmenu');
        if (techSubmenu) {
          techSubmenu.classList.add('show');
          const techToggle = document.querySelector('[href="#techSubmenu"]');
          if (techToggle) {
            techToggle.setAttribute('aria-expanded', 'true');
          }
        }
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCategoryToggles);
  } else {
    initCategoryToggles();
  }
})();
