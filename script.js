/* 0. Firebase Configuration & Initialization */
const firebaseConfig = {
    apiKey: "AIzaSyATUGxf9y8OSK7Gk4RQ0mLG-bAz4lU5U58",
    authDomain: "godly-stories-a68b6.firebaseapp.com",
    databaseURL: "https://godly-stories-a68b6-default-rtdb.firebaseio.com", 
    projectId: "godly-stories-a68b6",
    storageBucket: "godly-stories-a68b6.firebasestorage.app",
    messagingSenderId: "449706168588",
    appId: "1:449706168588:web:071adae87804bc5da27929"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const ADMIN_CODE = "Faith2026"; 

/* 1. Story Filtering Logic */
function filterStories(category) {
    const cards = document.querySelectorAll('.story-card');
    const buttons = document.querySelectorAll('.chip');
    const searchBar = document.getElementById('storySearch');

    if (searchBar) searchBar.value = "";

    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (category === 'all' && (btn.textContent.includes('All'))) {
            btn.classList.add('active');
        } else if (btn.textContent === category) {
            btn.classList.add('active');
        }
    });

    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            card.style.opacity = '0';
            setTimeout(() => card.style.opacity = '1', 10);
        } else {
            card.style.display = 'none';
        }
    });
}

/* 2. Reading Progress Bar & Scroll to Top Visibility */
window.onscroll = function() {
    // Progress Bar
    const progressBar = document.getElementById("progress-bar");
    if (progressBar) {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";
    }

    // Scroll to Top Button
    const scrollBtn = document.getElementById("scrollToTop");
    if (scrollBtn) {
        if (window.pageYOffset > 300) {
            scrollBtn.style.display = "block";
        } else {
            scrollBtn.style.display = "none";
        }
    }
};

/* 3. Updated "Amen" Interaction with Database Sync */
function sayAmen() {
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('id');
    const btn = document.querySelector('.amen-btn');

    if (storyId && btn && !btn.disabled) {
        const amenRef = database.ref('stories/' + storyId + '/amenCount');
        amenRef.transaction((currentCount) => {
            return (currentCount || 0) + 1;
        }).then(() => {
            btn.innerHTML = "🙏 Amen Recorded";
            btn.style.background = "#b08d57";
            btn.style.color = "white";
            btn.disabled = true; 
        }).catch((error) => {
            console.error("Amen failed: ", error);
        });
    } else if (!storyId) {
        alert("Amen! May this narrative strengthen your faith.");
    }
}

/* 4. Form Handlers (Story Submission & Newsletter) */
document.addEventListener('submit', function(e) {
    // Publish Story
    if (e.target.id === 'publishForm') {
        e.preventDefault();
        const author = document.getElementById('author-name').value;
        const storyData = {
            title: document.getElementById('story-title').value,
            category: document.getElementById('category').value,
            author: author,
            content: document.getElementById('narrative-content').value,
            image: document.getElementById('image-url').value || 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94',
            amenCount: 0,
            approved: true, // Default to true for instant publishing
            timestamp: Date.now()
        };

        database.ref('stories').push(storyData)
            .then(() => {
                const formContainer = document.querySelector('.form-container');
                if (formContainer) {
                    formContainer.innerHTML = `
                        <div style="text-align: center; padding: 60px 20px;">
                            <div style="font-size: 4rem; margin-bottom: 20px;">🕊️</div>
                            <h2 style="font-family: 'Lora', serif; margin-bottom: 10px;">Narrative Live in Library</h2>
                            <p style="color: #7f8c8d; margin-bottom: 30px;">Thank you for contributing, ${author}. Your journey has been indexed.</p>
                            <a href="index.html" class="btn-primary" style="background: #b08d57; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px;">Return to Library</a>
                        </div>`;
                }
            })
            .catch((error) => alert("Error saving story: " + error.message));
    }

    // Newsletter Signup
    if (e.target.id === 'newsletterForm') {
        e.preventDefault();
        const emailInput = document.getElementById('subscriberEmail');
        if (emailInput) {
            database.ref('subscribers').push({
                email: emailInput.value,
                signedUpAt: Date.now()
            }).then(() => {
                const container = document.querySelector('.newsletter-content');
                if (container) {
                    container.innerHTML = `<h2>Welcome to the Community</h2><p>You've successfully joined our mailing list.</p>`;
                }
            });
        }
    }
});

/* 5. Initialize Page & Load Firebase Content */
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Mobile Menu Logic
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.innerHTML = navLinks.classList.contains('active') ? '✕' : '☰';
        });
    }

    // Scroll to Top Logic
    const scrollBtn = document.getElementById("scrollToTop");
    if (scrollBtn) {
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Admin Session Check
    if (document.querySelector('.admin-page')) {
        if (sessionStorage.getItem('isAdmin') === 'true') {
            const overlay = document.getElementById('admin-login-overlay');
            const content = document.getElementById('dashboard-content');
            if(overlay) overlay.style.display = "none";
            if(content) content.style.display = "block";
            loadAdminDashboard();
        }
    }

    if (document.querySelector('.grid-layout')) loadStoriesFromDB();
    if (document.getElementById('trending-grid')) loadTrendingStories();
    if (document.querySelector('.story-content')) loadSingleStory();

    const activeFilter = urlParams.get('filter');
    if (activeFilter) setTimeout(() => filterStories(activeFilter), 800);

    // Dark Mode Logic
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.body.classList.add(currentTheme + '-theme');
        if (currentTheme === 'dark' && toggleSwitch) toggleSwitch.checked = true;
    }

    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.replace('light-theme', 'dark-theme') || document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.replace('dark-theme', 'light-theme') || document.body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }
});

/* 6. Live Search */
function searchStories() {
    const input = document.getElementById('storySearch');
    if (!input) return;
    const filter = input.value.toLowerCase();
    const cards = document.querySelectorAll('.story-card');
    
    cards.forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        const author = card.querySelector('.card-footer strong').textContent.toLowerCase();
        card.style.display = (title.includes(filter) || author.includes(filter)) ? "block" : "none";
    });
}

/* 7. Firebase Data Fetchers (Public) */

function loadStoriesFromDB() {
    const grid = document.querySelector('.grid-layout');
    database.ref('stories').orderByChild('timestamp').on('value', (snapshot) => {
        grid.innerHTML = "";
        const data = snapshot.val();
        if (!data) {
            grid.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>No narratives found.</p>";
            return;
        }
        const entries = Object.entries(data).reverse();
        entries.forEach(([id, story]) => {
            if (story.approved === false) return; // Moderation Filter
            
            const amens = story.amenCount || 0;
            grid.innerHTML += `
                <article class="story-card" data-category="${story.category}">
                    <div class="card-image" style="background-image: url('${story.image}')"></div>
                    <div class="card-content">
                        <div class="card-meta">
                            <span class="tag">${story.category}</span>
                            <span class="amen-badge">🙏 ${amens}</span>
                        </div>
                        <h4>${story.title}</h4>
                        <p>${story.content.substring(0, 100)}...</p>
                        <div class="card-footer">
                            <span>By <strong>${story.author}</strong></span>
                            <a href="story.html?id=${id}" class="arrow-link">Read More →</a>
                        </div>
                    </div>
                </article>`;
        });
    });
}

function loadSingleStory() {
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('id');

    if (storyId) {
        database.ref('stories/' + storyId).on('value', (snapshot) => {
            const story = snapshot.val();
            if (story) {
                const titleEl = document.querySelector('.story-header h1');
                const authorEl = document.querySelector('.author-name');
                const tagEl = document.querySelector('.tag');
                const contentDiv = document.querySelector('.story-content');
                const imgEl = document.querySelector('.main-story-image img');
                const totalAmensEl = document.getElementById('total-amens');

                if(titleEl) titleEl.textContent = story.title;
                if(authorEl) authorEl.textContent = "Authored by " + story.author;
                if(tagEl) tagEl.textContent = story.category;
                if(imgEl) imgEl.src = story.image;
                if(totalAmensEl) totalAmensEl.textContent = (story.amenCount || 0) + " Amens";
                
                if(contentDiv) {
                    const firstLetter = story.content.charAt(0);
                    const remainingText = story.content.slice(1);
                    contentDiv.innerHTML = `<p><span class="drop-cap">${firstLetter}</span>${remainingText.replace(/\n/g, '<br><br>')}</p>`;
                }
                document.title = `${story.title} | Godly Stories`;
            }
        });
    }
}

function loadTrendingStories() {
    const trendingGrid = document.getElementById('trending-grid');
    database.ref('stories').orderByChild('amenCount').limitToLast(3).on('value', (snapshot) => {
        if (!trendingGrid) return;
        trendingGrid.innerHTML = "";
        const data = snapshot.val();
        if (!data) return;

        const entries = Object.entries(data).reverse();
        entries.forEach(([id, story]) => {
            if (story.approved === false) return; // Moderation Filter
            trendingGrid.innerHTML += `
                <article class="story-card trending-card">
                    <div class="card-image" style="background-image: url('${story.image}')"></div>
                    <div class="card-content">
                        <div class="card-meta">
                            <span class="tag trending-tag">Trending</span>
                            <span class="amen-badge">🙏 ${story.amenCount || 0}</span>
                        </div>
                        <h4>${story.title}</h4>
                        <div class="card-footer">
                            <span>By <strong>${story.author}</strong></span>
                            <a href="story.html?id=${id}" class="arrow-link">Read Now →</a>
                        </div>
                    </div>
                </article>`;
        });
    });
}

/* 8. MASTER ADMIN FUNCTIONS */
function checkAdminPassword() {
    const entered = document.getElementById('adminPassword').value;
    if (entered === ADMIN_CODE) {
        document.getElementById('admin-login-overlay').style.display = "none";
        document.getElementById('dashboard-content').style.display = "block";
        sessionStorage.setItem('isAdmin', 'true');
        loadAdminDashboard();
    } else {
        document.getElementById('login-error').style.display = "block";
    }
}

function loadAdminDashboard() {
    // Admin Story List
    database.ref('stories').on('value', (snapshot) => {
        const list = document.getElementById('admin-story-list');
        const countDisplay = document.getElementById('total-stories-count');
        if (!list) return;
        list.innerHTML = "";
        const data = snapshot.val();
        if (data) {
            const entries = Object.entries(data).reverse();
            if(countDisplay) countDisplay.innerText = entries.length;
            entries.forEach(([id, story]) => {
                const isApproved = story.approved !== false;
                list.innerHTML += `
                    <tr>
                        <td><span class="status-dot ${isApproved ? 'active' : 'pending'}"></span></td>
                        <td><strong>${story.title}</strong></td>
                        <td>${story.author}</td>
                        <td>🙏 ${story.amenCount || 0}</td>
                        <td>
                            <button class="btn-action" onclick="toggleApproval('${id}', ${isApproved})">${isApproved ? 'Hide' : 'Approve'}</button>
                            <button class="btn-delete" onclick="deleteStory('${id}')">Delete</button>
                        </td>
                    </tr>`;
            });
        }
    });

    // Admin Subscriber List
    database.ref('subscribers').on('value', (snapshot) => {
        const list = document.getElementById('admin-sub-list');
        const countDisplay = document.getElementById('total-subs-count');
        if (!list) return;
        list.innerHTML = "";
        const data = snapshot.val();
        if (data) {
            const entries = Object.values(data).reverse();
            if(countDisplay) countDisplay.innerText = entries.length;
            entries.forEach(sub => {
                list.innerHTML += `<div class="sub-card"><strong>${sub.email}</strong><br><small>${new Date(sub.signedUpAt).toLocaleDateString()}</small></div>`;
            });
        }
    });
}

function toggleApproval(id, currentStatus) {
    database.ref('stories/' + id).update({ approved: !currentStatus });
}

function deleteStory(id) {
    if (confirm("Permanently delete this narrative?")) database.ref('stories/' + id).remove();
}

function logoutAdmin() {
    sessionStorage.removeItem('isAdmin');
    window.location.reload();
}