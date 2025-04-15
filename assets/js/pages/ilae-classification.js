/**
 * ILAE Classification Page JavaScript
 * This module handles all functionality related to the ILAE classification cards
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the ILAE cards when the page loads
  initILAEClassification();
});

/**
 * Initialize the ILAE classification page functionality
 */
function initILAEClassification() {
  // Get all ILAE cards
  const cards = document.querySelectorAll('#ilae-classification-content .ilae-card');
  
  // Add click event listeners to each card
  cards.forEach(card => {
    card.addEventListener('click', function() {
      // Get data from card attributes
      const title = this.getAttribute('data-title');
      const summary = this.getAttribute('data-summary');
      const eeg = this.getAttribute('data-eeg');
      
      // Populate modal with card data
      document.getElementById('modal-title').textContent = title;
      document.getElementById('modal-overview').innerHTML = summary;
      document.getElementById('modal-eeg').innerHTML = eeg || 'No specific EEG findings documented.';
      
      // Show the modal
      const modal = document.getElementById('ilae-modal');
      modal.style.display = 'flex';
    });
  });
  
  // Close modal when clicking the close button
  const closeButton = document.querySelector('#ilae-classification-content .modal-close');
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      document.getElementById('ilae-modal').style.display = 'none';
    });
  }
  
  // Close modal when clicking outside the content
  const modal = document.getElementById('ilae-modal');
  if (modal) {
    modal.addEventListener('click', function(event) {
      if (event.target === this) {
        this.style.display = 'none';
      }
    });
  }
  
  // Handle filter changes
  setupFilters();
  
  // Initialize search functionality
  if (typeof EEGSearch !== 'undefined') {
    EEGSearch.init('ilae');
  }
}

/**
 * Setup the filtering functionality for ILAE cards
 */
function setupFilters() {
  const typeFilter = document.getElementById('ilae-filter-type');
  const ageFilter = document.getElementById('ilae-filter-age');
  const resetButton = document.querySelector('#ilae-classification-content .reset-filters');
  
  if (typeFilter) {
    typeFilter.addEventListener('change', applyFilters);
  }
  
  if (ageFilter) {
    ageFilter.addEventListener('change', applyFilters);
  }
  
  if (resetButton) {
    resetButton.addEventListener('click', resetFilters);
  }
}

/**
 * Apply filters to ILAE cards
 */
function applyFilters() {
  const typeFilter = document.getElementById('ilae-filter-type').value;
  const ageFilter = document.getElementById('ilae-filter-age').value;
  const cards = document.querySelectorAll('#ilae-classification-content .ilae-card');
  let visibleCount = 0;
  
  cards.forEach(card => {
    const cardType = card.getAttribute('data-type');
    const cardAge = card.getAttribute('data-age');
    
    const typeMatch = typeFilter === 'all' || cardType === typeFilter;
    const ageMatch = ageFilter === 'all' || cardAge === ageFilter;
    
    if (typeMatch && ageMatch) {
      card.style.display = '';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
  
  // Show/hide no results message
  const noResults = document.getElementById('no-results');
  if (noResults) {
    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
  }
}

/**
 * Reset all filters
 */
function resetFilters() {
  const typeFilter = document.getElementById('ilae-filter-type');
  const ageFilter = document.getElementById('ilae-filter-age');
  
  if (typeFilter) typeFilter.value = 'all';
  if (ageFilter) ageFilter.value = 'all';
  
  const cards = document.querySelectorAll('#ilae-classification-content .ilae-card');
  cards.forEach(card => {
    card.style.display = '';
  });
  
  // Hide no results message
  const noResults = document.getElementById('no-results');
  if (noResults) {
    noResults.style.display = 'none';
  }
} 