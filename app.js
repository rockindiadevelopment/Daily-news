// ==================== STATE & CONFIG ====================
const ADMIN_CREDS = { username: 'admin', password: 'akola@123' };
const THEME_KEY = 'apnaAkolaTheme';

let newsData = [];
let currentCategory = 'All';
let isAdmin = false;

// ==================== SUPABASE CONFIG ====================
// ⚠️ YOU NEED THE "anon public" KEY (starts with "eyJ...")
// Go to: Supabase Dashboard → Settings (gear icon) → API → Project API Keys
// Copy the key under "anon" "public" — it's a long token starting with eyJ
const SUPABASE_URL = 'https://xdydpbrrjhqfuzbtcggp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkeWRwYnJyamhxZnV6YnRjZ2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1Nzg2OTgsImV4cCI6MjA5NDE1NDY5OH0.c5VX5dkj5viVpj8PoWgdT2A5SQYjNW7SaF6RxaLozGY';
// ⬆️ REPLACE the key above with your anon key (eyJ...)

let sb = null;
try {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
    console.error('❌ Failed to create Supabase client:', e);
}

// ==================== SUPABASE CRUD ====================

// Load all news from Supabase
async function loadNewsFromDB() {
    if (!sb) { console.error('Supabase not initialized'); return; }
    try {
        const { data, error } = await sb
            .from('news')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('❌ Supabase load error:', error.message, error.details, error.hint);
            showToast('DB Error: ' + error.message, 'error');
            return;
        }

        newsData = data || [];
        renderUserNews();
        updateTicker();
        if (isAdmin) renderAdminTable();
        console.log('✅ Loaded', newsData.length, 'news items from Supabase');
    } catch (err) {
        console.error('❌ Load failed:', err);
        showToast('Failed to connect to database', 'error');
    }
}

// Add a new post to Supabase
async function addNewsToDB(post) {
    if (!sb) return false;
    try {
        const { data, error } = await sb.from('news').insert([post]).select();
        if (error) {
            console.error('❌ Insert error:', error.message, error.details, error.hint);
            showToast('Save failed: ' + error.message, 'error');
            return false;
        }
        console.log('✅ Post added:', data);
        return true;
    } catch (err) {
        console.error('❌ Insert failed:', err);
        showToast('Failed to save post', 'error');
        return false;
    }
}

// Update a post in Supabase
async function updateNewsInDB(id, updates) {
    if (!sb) return false;
    try {
        const { data, error } = await sb.from('news').update(updates).eq('id', id).select();
        if (error) {
            console.error('❌ Update error:', error.message, error.details, error.hint);
            showToast('Update failed: ' + error.message, 'error');
            return false;
        }
        console.log('✅ Post updated:', data);
        return true;
    } catch (err) {
        console.error('❌ Update failed:', err);
        return false;
    }
}

// Delete a post from Supabase
async function deleteNewsFromDB(id) {
    if (!sb) return false;
    try {
        const { error } = await sb.from('news').delete().eq('id', id);
        if (error) {
            console.error('❌ Delete error:', error.message, error.details, error.hint);
            showToast('Delete failed: ' + error.message, 'error');
            return false;
        }
        console.log('✅ Post deleted');
        return true;
    } catch (err) {
        console.error('❌ Delete failed:', err);
        return false;
    }
}

// ==================== REAL-TIME SUBSCRIPTION ====================
// Any change from ANY device instantly updates ALL other devices
function subscribeToRealtime() {
    sb.channel('news-realtime')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'news'
        }, (payload) => {
            console.log('📡 Real-time update:', payload.eventType);
            // Reload all news on any change
            loadNewsFromDB();
            if (payload.eventType === 'INSERT') {
                showToast('🔔 New Update in Apna Akola!', 'info');
            }
        })
        .subscribe();
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    renderUserNews(); // Show empty state immediately

    // Load from Supabase
    await loadNewsFromDB();

    // Subscribe to real-time changes
    subscribeToRealtime();
});

// ==================== THEME ====================
function loadTheme() {
    // ALWAYS force dark mode on all devices
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    updateThemeIcons();
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    if (!isDark) {
        document.documentElement.classList.add('light');
    } else {
        document.documentElement.classList.remove('light');
    }
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    updateThemeIcons();
}

function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    document.getElementById('icon-sun').classList.toggle('hidden', !isDark);
    document.getElementById('icon-moon').classList.toggle('hidden', isDark);
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const colors = {
        success: 'from-green-500 to-emerald-600',
        error: 'from-red-500 to-rose-600',
        info: 'from-brand-500 to-brand-600'
    };
    const icons = {
        success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>',
        error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>',
        info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
    };

    const toast = document.createElement('div');
    toast.className = `toast-enter flex items-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r ${colors[type]} text-white shadow-2xl min-w-[280px] max-w-sm`;
    toast.innerHTML = `
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons[type]}</svg>
        <p class="text-sm font-semibold flex-1">${message}</p>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ==================== VIEW SWITCHING ====================
function showView(view) {
    const views = ['view-user', 'view-login', 'view-admin'];
    views.forEach(v => {
        const el = document.getElementById(v);
        el.classList.add('hidden');
        if (v === 'view-login') el.classList.remove('flex');
    });

    if (view === 'user') {
        document.getElementById('view-user').classList.remove('hidden');
        document.getElementById('btn-admin-login').classList.remove('hidden');
        document.getElementById('btn-admin-logout').classList.add('hidden');
        document.getElementById('ticker-bar').classList.remove('hidden');
        isAdmin = false;
        loadNewsFromDB();
    } else if (view === 'login') {
        const loginView = document.getElementById('view-login');
        loginView.classList.remove('hidden');
        loginView.classList.add('flex');
        document.getElementById('ticker-bar').classList.add('hidden');
    } else if (view === 'admin') {
        document.getElementById('view-admin').classList.remove('hidden');
        document.getElementById('btn-admin-login').classList.add('hidden');
        document.getElementById('btn-admin-logout').classList.remove('hidden');
        document.getElementById('ticker-bar').classList.add('hidden');
        isAdmin = true;
        renderAdminTable();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== AUTH ====================
function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const errorEl = document.getElementById('login-error');

    if (user === ADMIN_CREDS.username && pass === ADMIN_CREDS.password) {
        errorEl.classList.add('hidden');
        document.getElementById('login-form').reset();
        showView('admin');
        showToast('Welcome back, Admin!', 'success');
    } else {
        errorEl.classList.remove('hidden');
        showToast('Invalid credentials!', 'error');
    }
}

function logoutAdmin() {
    isAdmin = false;
    showView('user');
    showToast('Logged out successfully', 'info');
}

// ==================== TICKER ====================
function updateTicker() {
    const ticker = document.getElementById('ticker-text');
    const breakingNews = newsData.filter(n => n.breaking);
    if (breakingNews.length === 0) {
        ticker.textContent = '🔴 Welcome to Apna Akola – Your trusted local news source. Stay tuned for updates!';
    } else {
        ticker.textContent = breakingNews.map(n => `🔴 ${n.title}`).join('   •   ');
    }
}

// ==================== CATEGORY FILTER ====================
function filterCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.toggle('active-cat', btn.dataset.cat === cat);
    });
    renderUserNews();
}

// ==================== RENDER USER NEWS ====================
function renderUserNews() {
    const grid = document.getElementById('news-grid');
    const empty = document.getElementById('empty-state');
    const filtered = currentCategory === 'All' ? [...newsData] : newsData.filter(n => n.category === currentCategory);

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');
    grid.innerHTML = filtered.map((news, i) => {
        const date = new Date(news.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const catColors = {
            Local: 'bg-emerald-500', Politics: 'bg-violet-500', Sports: 'bg-orange-500',
            Education: 'bg-blue-500', Business: 'bg-amber-500', Entertainment: 'bg-pink-500'
        };
        const fallbackImg = `https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=600&q=80`;
        return `
            <article class="news-card animate-card-in bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-700/40 overflow-hidden cursor-pointer group"
                     style="animation-delay: ${i * 80}ms" onclick="openReadModal(${news.id})">
                <div class="relative overflow-hidden h-48">
                    <img src="${news.image || fallbackImg}" alt="${news.title}" class="card-image w-full h-full object-cover"
                         onerror="this.src='${fallbackImg}'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${catColors[news.category] || 'bg-slate-500'}">
                        ${news.category}
                    </span>
                    ${news.breaking ? '<span class="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-red-500 text-white animate-pulse">Breaking</span>' : ''}
                </div>
                <div class="p-5">
                    <p class="text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium">${date}</p>
                    <h3 class="text-lg font-bold leading-snug mb-3 line-clamp-2 group-hover:text-brand-500 transition-colors duration-300">${news.title}</h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">${news.content.substring(0, 120)}...</p>
                    <span class="inline-flex items-center gap-1.5 text-brand-500 text-sm font-semibold group-hover:gap-3 transition-all duration-300">
                        Read More
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                    </span>
                </div>
            </article>`;
    }).join('');
}

// ==================== READ MORE MODAL ====================
function openReadModal(id) {
    const news = newsData.find(n => n.id === id);
    if (!news) return;

    const fallbackImg = `https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=600&q=80`;
    document.getElementById('modal-img').src = news.image || fallbackImg;
    document.getElementById('modal-img').onerror = function () { this.src = fallbackImg; };
    document.getElementById('modal-cat').textContent = news.category;
    document.getElementById('modal-title').textContent = news.title;
    document.getElementById('modal-body').textContent = news.content;
    document.getElementById('modal-date').textContent = new Date(news.date).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const modal = document.getElementById('modal-read');
    const content = document.getElementById('modal-content');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    requestAnimationFrame(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('modal-animate-in');
    });
    document.body.style.overflow = 'hidden';
}

function closeReadModal() {
    const modal = document.getElementById('modal-read');
    const content = document.getElementById('modal-content');
    content.classList.add('scale-95', 'opacity-0');
    content.classList.remove('modal-animate-in');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
    document.body.style.overflow = '';
}

function closeModalOutside(e) {
    if (e.target === document.getElementById('modal-read')) {
        closeReadModal();
    }
}

// ==================== ADMIN: POST FORM ====================
function openPostForm(editId = null) {
    const wrapper = document.getElementById('post-form-wrapper');
    const heading = document.getElementById('form-heading');
    const form = document.getElementById('post-form');

    wrapper.classList.remove('hidden');
    document.getElementById('image-preview-box').classList.add('hidden');

    if (editId) {
        const news = newsData.find(n => n.id === editId);
        if (!news) return;
        heading.textContent = 'Edit Post';
        document.getElementById('edit-id').value = editId;
        document.getElementById('post-title').value = news.title;
        document.getElementById('post-category').value = news.category;
        document.getElementById('post-image').value = news.image || '';
        document.getElementById('post-content').value = news.content;
        if (news.image) previewImage(news.image);
    } else {
        heading.textContent = 'Add New Post';
        form.reset();
        document.getElementById('edit-id').value = '';
    }
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closePostForm() {
    document.getElementById('post-form-wrapper').classList.add('hidden');
    document.getElementById('post-form').reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('image-preview-box').classList.add('hidden');
}

function previewImage(url) {
    const box = document.getElementById('image-preview-box');
    const img = document.getElementById('image-preview');
    if (url && url.trim()) {
        img.src = url;
        img.onerror = () => box.classList.add('hidden');
        img.onload = () => box.classList.remove('hidden');
    } else {
        box.classList.add('hidden');
    }
}

async function handlePostSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-id').value;
    const title = document.getElementById('post-title').value.trim();
    const category = document.getElementById('post-category').value;
    const image = document.getElementById('post-image').value.trim();
    const content = document.getElementById('post-content').value.trim();

    if (editId) {
        // Edit existing post in Supabase
        const ok = await updateNewsInDB(parseInt(editId), { title, category, image, content });
        if (ok) showToast('Post updated successfully!', 'success');
    } else {
        // Add new post to Supabase
        const newPost = {
            id: Date.now(),
            title, category, image, content,
            date: new Date().toISOString(),
            breaking: false
        };
        const ok = await addNewsToDB(newPost);
        if (ok) showToast('🎉 New Update in Apna Akola!', 'info');
    }

    closePostForm();
    await loadNewsFromDB();
    renderAdminTable();
}

// ==================== ADMIN: TABLE ====================
function renderAdminTable() {
    const tbody = document.getElementById('admin-table-body');
    const emptyEl = document.getElementById('admin-empty');

    if (newsData.length === 0) {
        tbody.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }

    emptyEl.classList.add('hidden');
    const sorted = [...newsData].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sorted.map(news => {
        const date = new Date(news.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const catColors = {
            Local: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
            Politics: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10',
            Sports: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10',
            Education: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
            Business: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10',
            Entertainment: 'text-pink-500 bg-pink-50 dark:bg-pink-500/10'
        };
        return `
            <tr class="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        ${news.image ? `<img src="${news.image}" class="w-10 h-10 rounded-xl object-cover flex-shrink-0 hidden sm:block" onerror="this.style.display='none'">` : ''}
                        <span class="font-semibold line-clamp-1">${news.title}</span>
                    </div>
                </td>
                <td class="px-6 py-4 hidden sm:table-cell">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${catColors[news.category] || 'text-slate-500 bg-slate-100 dark:bg-slate-800'}">${news.category}</span>
                </td>
                <td class="px-6 py-4 text-slate-400 text-xs hidden md:table-cell">${date}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center justify-end gap-2">
                        <button onclick="toggleBreaking(${news.id})" class="action-btn p-2 rounded-xl ${news.breaking ? 'bg-red-100 dark:bg-red-500/20 text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'} hover:scale-110" title="${news.breaking ? 'Remove Breaking' : 'Mark Breaking'}">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/></svg>
                        </button>
                        <button onclick="openPostForm(${news.id})" class="action-btn p-2 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 hover:scale-110" title="Edit">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button onclick="deletePost(${news.id})" class="action-btn p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:scale-110" title="Delete">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

// ==================== ADMIN: ACTIONS ====================
async function deletePost(id) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    const ok = await deleteNewsFromDB(id);
    if (ok) {
        showToast('Post deleted', 'error');
        await loadNewsFromDB();
        renderAdminTable();
    }
}

async function toggleBreaking(id) {
    const news = newsData.find(n => n.id === id);
    if (news) {
        const newVal = !news.breaking;
        const ok = await updateNewsInDB(id, { breaking: newVal });
        if (ok) {
            showToast(newVal ? 'Marked as Breaking News!' : 'Removed from Breaking', 'info');
            await loadNewsFromDB();
            renderAdminTable();
        }
    }
}

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeReadModal();
});
