/**
 * Includes Loader
 * Handles loading of common includes (header, footer, disclaimer) across all pages
 */

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Includes loader initializing...');
  
  // Load header
  loadInclude('header');
  
  // Load footer
  loadInclude('footer');
  
  // Load disclaimer
  loadInclude('disclaimer');
  
  // Remove any existing duplicate code load listeners
  // (These could be present from old implementations)
  cleanupDuplicateCodeLoader();
});

/**
 * Loads an include file and injects it into the page
 * @param {string} includeName - Name of the include file (without .html extension)
 */
function loadInclude(includeName) {
  fetch(`includes/${includeName}.html`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load ${includeName}.html: ${response.status} ${response.statusText}`);
      }
      return response.text();
    })
    .then(data => {
      // Handle different includes
      switch (includeName) {
        case 'header':
          if (document.getElementById('header-container')) {
            document.getElementById('header-container').innerHTML = data;
          }
          break;
          
        case 'footer':
          if (document.getElementById('footer-container')) {
            document.getElementById('footer-container').innerHTML = data;
          }
          break;
          
        case 'disclaimer':
          // Create a container if it doesn't exist
          let disclaimerContainer = document.getElementById('disclaimer-container');
          if (!disclaimerContainer) {
            disclaimerContainer = document.createElement('div');
            disclaimerContainer.id = 'disclaimer-container';
            document.body.appendChild(disclaimerContainer);
          }
          disclaimerContainer.innerHTML = data;
          break;
      }
      
      // Log success
      console.log(`Loaded ${includeName}.html`);
    })
    .catch(error => {
      console.error(`Error loading ${includeName}.html:`, error);
    });
}

/**
 * Cleans up any duplicate code load intervals that might exist on the page
 * This prevents conflicts with old code
 */
function cleanupDuplicateCodeLoader() {
  // Find any existing intervals that load footer functionality
  const existingIntervals = [];
  for (let i = 1; i < 1000; i++) {
    if (window['waitForFooter' + i]) {
      clearInterval(window['waitForFooter' + i]);
      existingIntervals.push(i);
    }
  }
  
  if (existingIntervals.length > 0) {
    console.log('Cleaned up duplicate loaders:', existingIntervals);
  }
} 