/**
 * News Ticker - Shows the latest articles from multiple epilepsy journals in the header
 * Sources: Epilepsia, Epilepsy Currents, and Neurology
 */

class NewsTicker {
  constructor(selector, options = {}) {
    this.container = document.querySelector(selector);
    if (!this.container) {
      console.error('News ticker container not found:', selector);
      return;
    }

    this.options = {
      sources: [
        {
          name: 'Epilepsia',
          url: 'https://onlinelibrary.wiley.com/journal/15281167',
          rssUrl: 'https://onlinelibrary.wiley.com/feed/15281167/most-recent'
        },
        {
          name: 'Epilepsy Currents',
          url: 'https://journals.sagepub.com/home/EPI',
          rssUrl: 'https://journals.sagepub.com/action/showFeed?ui=0&mi=ehikzz&ai=2b4&jc=epicy&type=etoc&feed=rss'
        },
        {
          name: 'Neurology',
          url: 'https://www.neurology.org/collection/epilepsy-seizures',
          rssUrl: 'https://www.neurology.org/rss/current.xml'
        }
      ],
      articleCount: options.articleCount || 10,
      autoRotate: options.autoRotate !== false,
      rotationInterval: options.rotationInterval || 5000, // 5 seconds
      ...options
    };

    this.articles = [];
    this.currentIndex = 0;
    this.rotationTimer = null;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.isMobile = window.innerWidth <= 768;
    
    // Listen for window resize events to update mobile status
    window.addEventListener('resize', this.handleResize.bind(this));
    
    this.init();
  }
  
  handleResize() {
    this.isMobile = window.innerWidth <= 768;
    // Re-render current article to apply mobile-specific changes
    if (this.articles.length) {
      this.displayArticle(this.currentIndex);
    }
  }

  async init() {
    try {
      // Start with static data to show something immediately
      this.useStaticData();
      this.renderTicker();
      this.displayArticle(0);
      
      // Start rotation with static data immediately
      if (this.options.autoRotate) {
        this.startRotation();
      }
      
      // Attempt to fetch articles from all sources in background
      await this.fetchAllArticles();
      
      // Only update UI if we actually got articles
      if (this.articles.length > 0) {
        // Reset to first article with fresh data
        this.displayArticle(0);
      }
    } catch (error) {
      console.error('Failed to initialize news ticker:', error);
      // Already showing static data, so just continue
    }
  }

  async fetchAllArticles() {
    try {
      // Create array to hold all articles
      let allArticles = [];
      
      // Log which sources we're attempting to fetch
      console.log(`Attempting to fetch from ${this.options.sources.length} sources:`, 
        this.options.sources.map(s => s.name).join(', '));
      
      // Try to fetch from each source, with debugging
      for (const source of this.options.sources) {
        try {
          console.log(`Fetching from ${source.name}...`);
          const articles = await this.fetchArticlesFromSource(source);
          
          if (articles && articles.length) {
            console.log(`✅ Success: Got ${articles.length} articles from ${source.name}`);
            // Add source information to each article
            articles.forEach(article => {
              article.source = source.name;
              article.sourceUrl = source.url;
            });
            
            allArticles = [...allArticles, ...articles];
          } else {
            console.warn(`⚠️ No articles found from ${source.name}`);
          }
        } catch (e) {
          console.warn(`❌ Error fetching from ${source.name}:`, e);
        }
      }
      
      // Log overall results
      console.log(`Retrieved ${allArticles.length} total articles from all sources`);
      
      // If we got any articles, use them
      if (allArticles.length > 0) {
        // Sort by date (newest first) and take most recent ones
        this.sortAndFilterArticles(allArticles);
        
        // Randomly shuffle the articles for display
        this.randomizeArticles(allArticles);
        
        // Use the new articles
        this.articles = allArticles;
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      // Continue with static data (already loaded)
    }
  }
  
  async fetchArticlesFromSource(source) {
    try {
      // Use a more reliable CORS proxy
      const proxyUrl = 'https://corsproxy.io/?';
      console.log(`Fetching RSS from: ${source.rssUrl} via proxy`);
      
      const response = await fetch(proxyUrl + encodeURIComponent(source.rssUrl), {
        headers: {
          'Accept': 'application/xml, text/xml, application/rss+xml'
        },
        timeout: 8000
      });
      
      if (!response.ok) {
        console.warn(`HTTP error ${response.status} for ${source.name}`);
        return [];
      }
      
      const xmlText = await response.text();
      console.log(`Got ${xmlText.length} bytes of XML data for ${source.name}`);
      
      // For debugging: Show a short sample of the XML
      const xmlSample = xmlText.substring(0, 200).replace(/[\n\r]+/g, ' ').trim();
      console.log(`XML sample for ${source.name}: ${xmlSample}...`);
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        console.warn(`XML parsing error for ${source.name}:`, parserError.textContent);
        return [];
      }
      
      // Try different XML feed structures - some feeds use 'item', others use 'entry'
      let items = xmlDoc.querySelectorAll('item');
      
      // If no items found, try to find entries (Atom format vs RSS)
      if (items.length === 0) {
        console.log(`No 'item' elements found for ${source.name}, trying 'entry' elements`);
        items = xmlDoc.querySelectorAll('entry');
      }
      
      if (items.length === 0) {
        console.warn(`No items or entries found in feed for ${source.name}`);
        return [];
      }
      
      console.log(`Found ${items.length} items in feed for ${source.name}`);
      
      return Array.from(items).map(item => {
        // Try different element names for different feed formats
        const title = 
          item.querySelector('title')?.textContent || 
          item.querySelector('h1')?.textContent || 
          'No title';
          
        // Try different ways links might be formatted
        let link = '';
        const linkElement = item.querySelector('link');
        if (linkElement) {
          // Some feeds have link as text content, others as an href attribute
          link = linkElement.textContent || linkElement.getAttribute('href') || '';
        }
        
        // If no direct link, try alternate approaches based on feed format
        if (!link) {
          const guidElement = item.querySelector('guid');
          if (guidElement) {
            link = guidElement.textContent || '';
          }
        }
        
        // Backup if we still have no link
        if (!link) {
          link = source.url; // At least link to the journal homepage
        }
        
        // Try various date formats
        let pubDate = 
          item.querySelector('pubDate')?.textContent || 
          item.querySelector('published')?.textContent ||
          item.querySelector('updated')?.textContent || 
          '';
        
        // Parse the date
        let date = new Date();
        try {
          if (pubDate) {
            date = new Date(pubDate);
          }
        } catch (e) {
          console.warn(`Error parsing date for ${source.name}:`, e);
        }
        
        return {
          title: title,
          link: link,
          date: date, // Store as Date object for sorting
          formattedDate: date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        };
      });
    } catch (e) {
      console.warn(`Error fetching from ${source.name}:`, e);
      return [];
    }
  }
  
  sortAndFilterArticles(articles) {
    if (!articles || !articles.length) return articles;
    
    // Sort by date (newest first)
    articles.sort((a, b) => {
      // If we have actual dates, use them
      if (a.date && b.date) {
        return b.date - a.date;
      }
      return 0; // Keep original order if no dates
    });
    
    // Filter to only include articles from the current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const recentArticles = articles.filter(article => {
      if (article.date) {
        const articleMonth = article.date.getMonth();
        const articleYear = article.date.getFullYear();
        return (articleMonth === currentMonth && articleYear === currentYear) || 
               // Also include articles from last month if we're in the first week of the month
               (now.getDate() <= 7 && 
                ((articleMonth === currentMonth - 1 && articleYear === currentYear) || 
                 (currentMonth === 0 && articleMonth === 11 && articleYear === currentYear - 1)));
      }
      return true; // Include articles without dates
    });
    
    // If we have enough recent articles, use only those
    if (recentArticles.length >= 5) {
      return recentArticles.slice(0, this.options.articleCount);
    }
    
    // Otherwise use all articles but still limit to the requested count
    return articles.slice(0, this.options.articleCount);
  }
  
  randomizeArticles(articles) {
    // Shuffle the articles for random display
    for (let i = articles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [articles[i], articles[j]] = [articles[j], articles[i]];
    }
    return articles;
  }
  
  useStaticData() {
    // Fallback to static data if API fetch fails
    this.articles = [
      {
        title: "Adult-onset focal early-onset genetic epilepsy: A multicenter cohort study",
        link: "https://onlinelibrary.wiley.com/doi/10.1111/epi.17893",
        source: "Epilepsia",
        formattedDate: "May 2024"
      },
      {
        title: "Epilepsy surgery for tuberous sclerosis complex: An international retrospective study",
        link: "https://onlinelibrary.wiley.com/doi/10.1111/epi.17897",
        source: "Epilepsia",
        formattedDate: "May 2024"
      },
      {
        title: "Identifying Barriers to Antiseizure Medication Adherence Among Adults With Epilepsy",
        link: "https://journals.sagepub.com/doi/full/10.1177/15357597231168505",
        source: "Epilepsy Currents",
        formattedDate: "April 2024"
      },
      {
        title: "The role of EEG in the diagnosis and classification of epilepsy syndromes",
        link: "https://journals.sagepub.com/doi/full/10.1177/15357597231167419",
        source: "Epilepsy Currents",
        formattedDate: "April 2024"
      },
      {
        title: "Evaluation of Nonmotor Seizures With Stereo-EEG",
        link: "https://www.neurology.org/doi/10.1212/WNL.0000000000207426",
        source: "Neurology",
        formattedDate: "May 2024"
      },
      {
        title: "Treatment Response of Childhood Absence Epilepsy in a High-Resolution EEG Study",
        link: "https://www.neurology.org/doi/10.1212/WNL.0000000000207306",
        source: "Neurology",
        formattedDate: "April 2024"
      }
    ];
  }

  renderTicker() {
    // Create the ticker layout
    this.container.innerHTML = `
      <div class="news-ticker">
        <div class="news-ticker__label">Latest</div>
        <div class="news-ticker__content"></div>
        <div class="news-ticker__controls">
          <button class="news-ticker__prev" aria-label="Previous article">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="news-ticker__next" aria-label="Next article">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    `;

    // Set up event listeners
    const prevBtn = this.container.querySelector('.news-ticker__prev');
    const nextBtn = this.container.querySelector('.news-ticker__next');
    const contentContainer = this.container.querySelector('.news-ticker__content');
    
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showPreviousArticle();
    });
    
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showNextArticle();
    });
    
    // Touch events for mobile swiping
    contentContainer.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      // Pause rotation during touch
      this.pauseRotation();
    }, {passive: true});
    
    contentContainer.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
      // Resume rotation after touch
      this.resumeRotation();
    }, {passive: true});
    
    // Pause rotation on hover (desktop)
    this.container.addEventListener('mouseenter', () => this.pauseRotation());
    this.container.addEventListener('mouseleave', () => this.resumeRotation());
  }
  
  handleSwipe() {
    const threshold = 50; // Minimum swipe distance in pixels
    
    if (this.touchStartX - this.touchEndX > threshold) {
      // Swiped left, go to next article
      this.showNextArticle();
    } else if (this.touchEndX - this.touchStartX > threshold) {
      // Swiped right, go to previous article
      this.showPreviousArticle();
    }
  }

  displayArticle(index) {
    if (!this.articles.length) return;
    
    this.currentIndex = index;
    const article = this.articles[index];
    const contentContainer = this.container.querySelector('.news-ticker__content');
    
    // Clear previous articles
    const oldArticles = this.container.querySelectorAll('.news-ticker__article');
    oldArticles.forEach(oldArticle => {
      if (oldArticle.classList.contains('active')) {
        oldArticle.classList.remove('active');
        setTimeout(() => {
          oldArticle.remove();
        }, 500); // Remove after transition ends
      } else {
        oldArticle.remove();
      }
    });
    
    // Create new article element
    const articleEl = document.createElement('div');
    articleEl.className = 'news-ticker__article';
    
    // Create title element with proper markup
    const titleEl = document.createElement('h4');
    titleEl.className = 'news-ticker__title';
    titleEl.setAttribute('data-source', article.source || '');
    
    // Create link element
    const linkEl = document.createElement('a');
    linkEl.href = article.link;
    linkEl.target = '_blank';
    linkEl.rel = 'noopener';
    linkEl.textContent = article.title;
    linkEl.title = `${article.source}: ${article.title}`;
    
    // Check if we need horizontal scrolling on mobile
    if (this.isMobile && article.title.length > 30) {
      articleEl.setAttribute('data-needs-scroll', 'true');
    }
    
    // Build the DOM structure
    titleEl.appendChild(linkEl);
    articleEl.appendChild(titleEl);
    
    // Add to DOM
    contentContainer.appendChild(articleEl);
    
    // Trigger animation
    setTimeout(() => {
      articleEl.classList.add('active');
    }, 50);
  }

  showNextArticle() {
    const nextIndex = (this.currentIndex + 1) % this.articles.length;
    this.displayArticle(nextIndex);
  }

  showPreviousArticle() {
    const prevIndex = (this.currentIndex - 1 + this.articles.length) % this.articles.length;
    this.displayArticle(prevIndex);
  }

  startRotation() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
    
    this.rotationTimer = setInterval(() => {
      this.showNextArticle();
    }, this.options.rotationInterval);
  }

  pauseRotation() {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }

  resumeRotation() {
    if (this.options.autoRotate && !this.rotationTimer) {
      this.startRotation();
    }
  }
}

// Initialize the news ticker when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    // Initialize with a slight delay to ensure the container is ready
    new NewsTicker('#news-ticker-container', {
      articleCount: 10,
      autoRotate: true,
      rotationInterval: 7000
    });
  }, 500);
}); 