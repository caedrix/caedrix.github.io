// Org Mode compatible theme toggle and sidebar
(function() {
    'use strict';

    // Guard against the script being included twice. Org gathers #+HTML_HEAD
    // keywords from the whole buffer, including COMMENT subtrees, so a stray
    // duplicate is easy to introduce; without this, two sidebars are built and
    // the second (empty) one covers the first.
    if (window.__yawDocsLoaded) {
        console.warn('sidebar_darkmode.js loaded twice; ignoring the second copy');
        return;
    }
    window.__yawDocsLoaded = true;
    
    // Wait for both DOM and MathJax to be ready
    function initialize() {
        // Belt and braces: never build a second sidebar, whatever fires us.
        if (document.querySelector('.sidebar') || document.querySelector('.theme-toggle')) {
            console.log('Already initialized; skipping');
            return;
        }
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
        // Remove any sidebar left by an earlier run before building a new one
        document.querySelectorAll('.sidebar, .sidebar-toggle')
                .forEach(function(el) { el.remove(); });

        // Create sidebar structure: book contents on top, page headings below
        const sidebar = document.createElement('div');
        sidebar.className = 'sidebar';
        sidebar.innerHTML = `
            <nav class="book-nav" id="book-nav"></nav>
            <div class="page-nav">
                <h3>On this page</h3>
                <nav>
                    <ul class="toc" id="toc"></ul>
                </nav>
            </div>
        `;
        document.body.appendChild(sidebar);

        // Create sidebar toggle button
        const sidebarToggle = document.createElement('button');
        sidebarToggle.className = 'sidebar-toggle';
        sidebarToggle.textContent = '\u00a7';
        sidebarToggle.setAttribute('aria-label', 'Toggle sidebar');
        document.body.appendChild(sidebarToggle);

        // Book contents (from contents.js), then this page's headings
        renderBookNav();
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

    function currentPage() {
        const path = window.location.pathname;
        const file = path.substring(path.lastIndexOf('/') + 1);
        return file || 'index.html';
    }

    // Which parts are collapsed, remembered between pages
    function navState() {
        try { return JSON.parse(localStorage.getItem('yaw-nav') || '{}'); }
        catch (e) { return {}; }
    }
    function saveNavState(state) {
        try { localStorage.setItem('yaw-nav', JSON.stringify(state)); } catch (e) {}
    }

    function makeItem(item, here) {
        const li = document.createElement('li');
        li.className = 'book-item';

        const num = document.createElement('span');
        num.className = 'book-n';
        num.textContent = item.n || '';

        const label = document.createElement('span');
        label.className = 'book-label';
        label.textContent = item.label;

        if (item.href) {
            const a = document.createElement('a');
            a.href = item.href;
            a.appendChild(num);
            a.appendChild(label);
            li.appendChild(a);
            if (item.href === here) li.classList.add('active');
        } else {
            li.classList.add('pending');
            li.appendChild(num);
            li.appendChild(label);
        }

        if (item.status && item.status !== 'live') {
            const st = document.createElement('span');
            st.className = 'book-status';
            st.textContent = item.status;
            li.appendChild(st);
        }
        return li;
    }

    function renderBookNav() {
        const host = document.getElementById('book-nav');
        const book = window.YAW_CONTENTS;

        // No contents.js on this page: drop the section, relabel the other
        if (!host || !book || !Array.isArray(book.parts)) {
            if (host) host.remove();
            const pageNav = document.querySelector('.page-nav h3');
            if (pageNav) pageNav.textContent = 'Contents';
            console.log('No YAW_CONTENTS found; using page headings only');
            return;
        }

        const here  = currentPage();
        const state = navState();

        // Outer collapsible: the whole book
        const outer = document.createElement('details');
        outer.className = 'book-outer';
        outer.open = state.book !== false;

	const title = document.createElement('summary');
	title.className = 'book-title';

	const titleLink = document.createElement('a');
	titleLink.href = book.href || 'index.html';
	titleLink.textContent = book.title || 'Contents';

	title.appendChild(titleLink);
	outer.appendChild(title);

        outer.addEventListener('toggle', function() {
            const s = navState(); s.book = outer.open; saveNavState(s);
        });

        book.parts.forEach(function(part, pi) {
            const items = part.items || [];
            const key = 'part-' + (part.name || pi);
            // always open the part containing the current page
            const hasHere = items.some(it => it.href && it.href === here);

            const det = document.createElement('details');
            det.className = 'book-part-group';
            det.open = hasHere || state[key] !== false;

            const sum = document.createElement('summary');
            sum.className = 'book-part';
            sum.textContent = part.name || '';
            det.appendChild(sum);

            const ul = document.createElement('ul');
            ul.className = 'book-list';
            items.forEach(it => ul.appendChild(makeItem(it, here)));
            det.appendChild(ul);

            det.addEventListener('toggle', function() {
                const s = navState(); s[key] = det.open; saveNavState(s);
            });

            outer.appendChild(det);
        });

        host.innerHTML = '';
        host.appendChild(outer);
        console.log('Book navigation rendered');
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

        // Handle window resize. Only force a state when crossing the
        // breakpoint, so a deliberate toggle isn't undone by a stray resize.
        let wasWide = window.innerWidth > 1024;
        window.addEventListener('resize', function() {
            const isWide = window.innerWidth > 1024;
            if (isWide === wasWide) return;
            wasWide = isWide;
            if (isWide) {
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

        // Page headings only: skip the title, and anything in the sidebar
        const contentDiv = document.getElementById('content') || document.body;
        const headings = Array.from(
            contentDiv.querySelectorAll('h2, h3, h4')
        ).filter(h => !h.closest('.sidebar'));

        console.log(`Found ${headings.length} headings for TOC`);

        if (headings.length === 0) {
            const section = document.querySelector('.page-nav');
            if (section) section.style.display = 'none';
            return;
        }

        // Match the book list: number in its own column, label beside it
        toc.classList.add('book-list');

        headings.forEach(function(heading, index) {
            // Pull org's section number out of the heading text
            const clone = heading.cloneNode(true);
            const numEl = clone.querySelector('[class^="section-number"]');
            let num = '';
            if (numEl) { num = numEl.textContent.trim(); numEl.remove(); }
            const label = clone.textContent.trim();

            if (!heading.id) {
                const cleanText = label
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .trim();
                heading.id = cleanText || `heading-${index}`;
            }

            const li = document.createElement('li');
            li.className = 'book-item toc-' + heading.tagName.toLowerCase();

            const a = document.createElement('a');
            a.href = `#${heading.id}`;

            const n = document.createElement('span');
            n.className = 'book-n';
            n.textContent = num;

            const l = document.createElement('span');
            l.className = 'book-label';
            l.textContent = label;

            a.appendChild(n);
            a.appendChild(l);

            a.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.getElementById(heading.id);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    history.pushState(null, null, `#${heading.id}`);
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
        const tocLinks = document.querySelectorAll('#toc a');
        const contentDiv = document.getElementById('content') || document.body;
        const headings = Array.from(
            contentDiv.querySelectorAll('h2, h3, h4')
        ).filter(h => !h.closest('.sidebar'));
        
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
                const li = link.closest('li') || link;
                li.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    li.classList.add('active');
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
        generateTOC: generateTOC,
        renderBookNav: renderBookNav
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
