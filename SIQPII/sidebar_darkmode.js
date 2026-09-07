// Org Mode compatible theme toggle and sidebar
(function() {
    'use strict';
    
    // Wait for both DOM and MathJax to be ready
    function initialize() {
        console.log('Initializing Yaw documentation features...');
        
        // Initialize theme first
        initializeTheme();

	// Create navigation buttons
	createNavigationButtons();
	
        // Wait a bit for MathJax to settle, then create sidebar
        setTimeout(function() {
            createSidebar();
            setupSidebarToggle();
            setupScrollSpy();
            console.log('Yaw documentation features initialized successfully');
        }, 1000);
    }

    function initializeTheme() {
        // Initialize theme
        const savedTheme = localStorage.getItem('yaw-theme') || 
                          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', savedTheme);
        console.log('Theme initialized:', savedTheme);

        // Create theme toggle button
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.setAttribute('aria-label', 'Toggle dark mode');
        themeToggle.innerHTML = `
            <div class="theme-toggle-track">
                <div class="theme-toggle-thumb">
                    ${savedTheme === 'dark' ? '⏾' : '☼️'}
                </div>
            </div>
        `;
        document.body.appendChild(themeToggle);

        // Theme toggle event listener
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('yaw-theme', newTheme);
            
            // Update toggle button icon
            const thumb = themeToggle.querySelector('.theme-toggle-thumb');
            thumb.textContent = newTheme === 'dark' ? '⏾' : '☼️';
            console.log('Theme switched to:', newTheme);
        });
    }

    function createSidebar() {
        // Create sidebar structure
        const sidebar = document.createElement('div');
        sidebar.className = 'sidebar';
        sidebar.innerHTML = `
            <h3>Contents</h3>
            <nav>
                <ul class="toc" id="toc"></ul>
            </nav>
        `;
        document.body.appendChild(sidebar);

        // Create sidebar toggle button
        const sidebarToggle = document.createElement('button');
        sidebarToggle.className = 'sidebar-toggle';
        sidebarToggle.textContent = '§';
        sidebarToggle.setAttribute('aria-label', 'Toggle sidebar');
        document.body.appendChild(sidebarToggle);

        // Generate table of contents
        generateTOC();

        // Check if sidebar should be open by default (desktop)
        if (window.innerWidth > 1024) {
            sidebar.classList.add('open');
            document.body.classList.remove('sidebar-closed');
        } else {
            document.body.classList.add('sidebar-closed');
        }
        
        console.log('Sidebar created');
    }

    function setupSidebarToggle() {
        const sidebar = document.querySelector('.sidebar');
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        
        if (!sidebar || !sidebarToggle) {
            console.error('Sidebar elements not found');
            return;
        }
        
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            
            if (window.innerWidth > 1024) {
                document.body.classList.toggle('sidebar-closed');
            }
            console.log('Sidebar toggled');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 1024 && 
                sidebar.classList.contains('open') && 
                !sidebar.contains(e.target) && 
                !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });

        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 1024) {
                sidebar.classList.add('open');
                document.body.classList.remove('sidebar-closed');
            } else {
                sidebar.classList.remove('open');
                document.body.classList.add('sidebar-closed');
            }
        });
    }

    function generateTOC() {
        const toc = document.getElementById('toc');
        if (!toc) {
            console.error('TOC element not found');
            return;
        }

        // Look for headings in org mode structure - try both content div and body
        const contentDiv = document.getElementById('content') || document.body;
        const headings = contentDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        console.log(`Found ${headings.length} headings for TOC`);
        
        if (headings.length === 0) {
            console.warn('No headings found - TOC will be empty');
            return;
        }
        
        headings.forEach(function(heading, index) {
            // Skip if heading already has an ID, otherwise create one
            if (!heading.id) {
                // Create a clean ID from the heading text
                const cleanText = heading.textContent
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, '') // Remove special chars
                    .replace(/\s+/g, '-')     // Replace spaces with hyphens
                    .trim();
                heading.id = cleanText || `heading-${index}`;
            }

            const li = document.createElement('li');
            const a = document.createElement('a');
            
            a.href = `#${heading.id}`;
            a.textContent = heading.textContent;
            a.className = `toc-${heading.tagName.toLowerCase()}`;
            
            // Smooth scroll functionality
            a.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.getElementById(heading.id);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Update URL hash
                    history.pushState(null, null, `#${heading.id}`);
                    
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth <= 1024) {
                        document.querySelector('.sidebar').classList.remove('open');
                    }
                }
            });
            
            li.appendChild(a);
            toc.appendChild(li);
        });
        
        console.log('TOC generated successfully');
    }

    function setupScrollSpy() {
        const tocLinks = document.querySelectorAll('.toc a');
        const contentDiv = document.getElementById('content') || document.body;
        const headings = contentDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        if (headings.length === 0) {
            console.warn('No headings found for scroll spy');
            return;
        }

        function updateActiveLink() {
            let current = '';
            
            headings.forEach(function(heading) {
                const rect = heading.getBoundingClientRect();
                if (rect.top <= 100) {
                    current = heading.id;
                }
            });

            tocLinks.forEach(function(link) {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        }

        // Throttled scroll listener for performance
        let ticking = false;
        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    updateActiveLink();
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScroll);
        
        // Initial call to set active link
        updateActiveLink();
        
        console.log('Scroll spy initialized');
    }

    // Multiple initialization strategies to handle different loading scenarios
    
    // Strategy 1: DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } 
    // Strategy 2: Document already loaded
    else if (document.readyState === 'interactive' || document.readyState === 'complete') {
        initialize();
    }
    
    // Strategy 3: Fallback - window load event
    window.addEventListener('load', function() {
        // Only initialize if not already done
        if (!document.querySelector('.theme-toggle')) {
            console.log('Fallback initialization triggered');
            initialize();
        }
    });

// Add this to your initialization function
function fixCodeBlockSpacing() {
    const codeBlocks = document.querySelectorAll('pre');
    codeBlocks.forEach(function(pre) {
        // Remove empty text nodes and paragraphs
        const children = Array.from(pre.childNodes);
        children.forEach(function(child) {
            if (child.tagName === 'P' && child.textContent.trim() === '') {
                child.remove();
            }
        });
        
        // Force minimum height
        pre.style.minHeight = 'auto';
        pre.style.height = 'fit-content';
    });
}

// Call it after a short delay
setTimeout(fixCodeBlockSpacing, 2000);

    // Export for debugging
    window.YawDocs = {
        initialize: initialize,
        generateTOC: generateTOC
    };

function createNavigationButtons() {
    // Create HOME button
    const homeButton = document.createElement('a');
    homeButton.className = 'nav-home';
    homeButton.textContent = '▣';
    homeButton.setAttribute('aria-label', 'Go to home');
    homeButton.title = 'Home';
    
    // Create UP button
    const upButton = document.createElement('a');
    upButton.className = 'nav-up';
    upButton.textContent = '▲';
    upButton.setAttribute('aria-label', 'Go up one level');
    upButton.title = 'Up';
    
    // Try to find org-mode generated navigation links
    const orgNav = document.querySelector('#org-div-home-and-up');
    
    if (orgNav) {
        // If org-mode navigation exists, use those links
        const homeLink = orgNav.querySelector('a[href$="index.html"], a[href="./"], a[href="/"]');
        const upLink = orgNav.querySelector('a[accesskey="u"]');
        
        if (homeLink) {
            homeButton.href = homeLink.href;
        } else {
            // Fallback to root
            homeButton.href = '/';
        }
        
        if (upLink) {
            upButton.href = upLink.href;
        } else {
            // Hide UP button if no parent
            upButton.classList.add('hidden');
        }
        
        // Hide the original org-mode navigation
        orgNav.style.display = 'none';
    } else {
        // Fallback navigation logic
        const path = window.location.pathname;
        homeButton.href = '/';
        
        // Simple UP logic - go to parent directory
        if (path !== '/' && path !== '/index.html') {
            const parentPath = path.substring(0, path.lastIndexOf('/'));
            upButton.href = parentPath || '/';
        } else {
            upButton.classList.add('hidden');
        }
    }
    
    document.body.appendChild(homeButton);
    document.body.appendChild(upButton);
    
    console.log('Navigation buttons created');
}

})();
