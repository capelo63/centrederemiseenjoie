// Admin panel functionality
let currentUser = null;
let accessToken = null;
let newsData = [];
let reservationsData = [];
let contactsData = [];

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
});

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });

    // News form
    document.getElementById('actualiteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleNewsSave();
    });

    // Set today's date as default for news
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('newsDate').value = today;
}

// === AUTHENTICATION via Supabase REST ===

function checkAuthStatus() {
    const stored = localStorage.getItem('supabaseAuth');
    if (stored) {
        try {
            const authData = JSON.parse(stored);
            if (authData.expires_at && authData.expires_at > Math.floor(Date.now() / 1000)) {
                currentUser = authData.user;
                accessToken = authData.access_token;
                showAdminPanel();
                return;
            } else {
                localStorage.removeItem('supabaseAuth');
            }
        } catch (e) {
            localStorage.removeItem('supabaseAuth');
        }
    }
    showLoginScreen();
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    try {
        const data = await supabaseRest.signIn(email, password);
        currentUser = data.user;
        accessToken = data.access_token;

        // Sauvegarder la session
        localStorage.setItem('supabaseAuth', JSON.stringify({
            user: data.user,
            access_token: data.access_token,
            expires_at: data.expires_at
        }));

        showAdminPanel();
        errorDiv.style.display = 'none';
    } catch (error) {
        errorDiv.textContent = 'Email ou mot de passe incorrect.';
        errorDiv.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('supabaseAuth');
    currentUser = null;
    accessToken = null;
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    document.getElementById('welcomeUser').textContent = `Bienvenue, ${currentUser.email}`;

    // Load data
    loadNewsData();
    loadSampleData();
    loadFacebookSettings();
}

// Section navigation
function showSection(sectionName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update sections
    document.querySelectorAll('.admin-section').forEach(section => section.classList.remove('active'));
    document.getElementById(sectionName + '-section').classList.add('active');
}

// === NEWS MANAGEMENT via Supabase REST ===

async function loadNewsData() {
    const tbody = document.getElementById('newsTableBody');
    tbody.innerHTML = '<tr><td colspan="4">Chargement...</td></tr>';

    try {
        const data = await supabaseRest.select('news', 'select=*&order=date.desc', accessToken);
        newsData = data || [];
    } catch (error) {
        console.error('Erreur chargement actualités:', error.message);
        tbody.innerHTML = '<tr><td colspan="4">Erreur de chargement</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    newsData.forEach(news => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${news.titre}</td>
            <td>${formatDate(news.date)}</td>
            <td><span class="status-badge status-${news.status}">${getStatusText(news.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-primary btn-sm" onclick="editNews(${news.id})">Modifier</button>
                    <button class="btn-danger btn-sm" onclick="deleteNews(${news.id})">Supprimer</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddNewsForm() {
    document.getElementById('formTitle').textContent = 'Nouvelle actualité';
    document.getElementById('actualiteForm').reset();
    document.getElementById('newsId').value = '';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('newsDate').value = today;
    document.getElementById('newsForm').style.display = 'block';
}

function editNews(id) {
    const news = newsData.find(n => n.id === id);
    if (news) {
        document.getElementById('formTitle').textContent = 'Modifier l\'actualité';
        document.getElementById('newsId').value = news.id;
        document.getElementById('newsTitre').value = news.titre;
        document.getElementById('newsDate').value = news.date;
        document.getElementById('newsResume').value = news.resume;
        document.getElementById('newsContenu').value = news.contenu;
        document.getElementById('newsImage').value = news.image;
        document.getElementById('newsForm').style.display = 'block';
    }
}

async function handleNewsSave() {
    const newsId = document.getElementById('newsId').value;

    const newsItem = {
        titre: document.getElementById('newsTitre').value,
        date: document.getElementById('newsDate').value,
        resume: document.getElementById('newsResume').value,
        contenu: document.getElementById('newsContenu').value,
        image: document.getElementById('newsImage').value || 'images/placeholder.jpg',
        status: 'published'
    };

    try {
        if (newsId) {
            await supabaseRest.update('news', newsItem, `id=eq.${newsId}`, accessToken);
        } else {
            await supabaseRest.insert('news', newsItem, accessToken);
        }

        hideNewsForm();
        await loadNewsData();
        showSuccessMessage('Actualité enregistrée avec succès !');
    } catch (error) {
        alert('Erreur lors de l\'enregistrement : ' + error.message);
    }
}

async function deleteNews(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')) {
        try {
            await supabaseRest.remove('news', `id=eq.${id}`, accessToken);
            await loadNewsData();
            showSuccessMessage('Actualité supprimée avec succès !');
        } catch (error) {
            alert('Erreur lors de la suppression : ' + error.message);
        }
    }
}

function hideNewsForm() {
    document.getElementById('newsForm').style.display = 'none';
}

// === RESERVATIONS & CONTACTS via Supabase REST ===

async function loadSampleData() {
    await Promise.all([loadReservationsData(), loadContactsData()]);
}

// Reservations management
async function loadReservationsData() {
    const tbody = document.getElementById('reservationsTableBody');
    tbody.innerHTML = '<tr><td colspan="7">Chargement...</td></tr>';

    try {
        const data = await supabaseRest.select('reservations', 'select=*&order=created_at.desc', accessToken);
        reservationsData = data || [];
    } catch (error) {
        console.error('Erreur chargement réservations:', error.message);
        tbody.innerHTML = '<tr><td colspan="7">Erreur de chargement</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    reservationsData.forEach(reservation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(reservation.created_at)}</td>
            <td>${formatDate(reservation.date_arrivee)}</td>
            <td>${formatDate(reservation.date_depart)}</td>
            <td>${reservation.nombre_personnes}</td>
            <td>${getSejourTypeText(reservation.type_reservation)}</td>
            <td><span class="status-badge status-${reservation.status}">${getReservationStatusText(reservation.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-success btn-sm" onclick="updateReservationStatus(${reservation.id}, 'confirmed')">Confirmer</button>
                    <button class="btn-danger btn-sm" onclick="updateReservationStatus(${reservation.id}, 'cancelled')">Annuler</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterReservations(status) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const tbody = document.getElementById('reservationsTableBody');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        const statusBadge = row.querySelector('.status-badge');
        const rowStatus = statusBadge.className.includes('status-pending') ? 'pending' :
                         statusBadge.className.includes('status-confirmed') ? 'confirmed' :
                         statusBadge.className.includes('status-cancelled') ? 'cancelled' : '';

        if (status === 'all' || rowStatus === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

async function updateReservationStatus(id, newStatus) {
    try {
        await supabaseRest.update('reservations', { status: newStatus }, `id=eq.${id}`, accessToken);
        await loadReservationsData();
        showSuccessMessage(`Réservation ${newStatus === 'confirmed' ? 'confirmée' : 'annulée'} !`);
    } catch (error) {
        console.error('Erreur mise à jour réservation:', error.message);
        alert('Erreur lors de la mise à jour : ' + error.message);
    }
}

// Contacts management
async function loadContactsData() {
    const tbody = document.getElementById('contactsTableBody');
    tbody.innerHTML = '<tr><td colspan="6">Chargement...</td></tr>';

    try {
        const data = await supabaseRest.select('contacts', 'select=*&order=created_at.desc', accessToken);
        contactsData = data || [];
    } catch (error) {
        console.error('Erreur chargement contacts:', error.message);
        tbody.innerHTML = '<tr><td colspan="6">Erreur de chargement</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    contactsData.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(contact.created_at)}</td>
            <td>${contact.nom_prenom}</td>
            <td>${contact.email}</td>
            <td class="message-cell">${truncateText(contact.message, 50)}</td>
            <td><span class="status-badge status-${contact.status}">${contact.status === 'read' ? 'Lu' : 'Non lu'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-primary btn-sm" onclick="viewMessage(${contact.id})">Voir</button>
                    <button class="btn-success btn-sm" onclick="markAsRead(${contact.id})">Marquer lu</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterContacts(status) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const tbody = document.getElementById('contactsTableBody');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        const statusBadge = row.querySelector('.status-badge');
        const rowStatus = statusBadge.className.includes('status-read') ? 'read' : 'unread';

        if (status === 'all' || rowStatus === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function viewMessage(id) {
    const contact = contactsData.find(c => c.id === id);
    if (contact) {
        alert(`Message de ${contact.nom_prenom} (${contact.email}):\n\n${contact.message}`);
        markAsRead(id);
    }
}

async function markAsRead(id) {
    try {
        await supabaseRest.update('contacts', { status: 'read' }, `id=eq.${id}`, accessToken);
        await loadContactsData();
    } catch (error) {
        console.error('Erreur mise à jour contact:', error.message);
    }
}

// === EXPORT / IMPORT ===

async function exportData() {
    let newsFromDb = newsData;
    let reservationsFromDb = reservationsData;
    let contactsFromDb = contactsData;

    try {
        newsFromDb = await supabaseRest.select('news', 'select=*&order=date.desc', accessToken);
    } catch (e) {
        console.error('Export news: utilisation des données en cache', e);
    }
    try {
        reservationsFromDb = await supabaseRest.select('reservations', 'select=*&order=created_at.desc', accessToken);
    } catch (e) {
        console.error('Export reservations: utilisation des données en cache', e);
    }
    try {
        contactsFromDb = await supabaseRest.select('contacts', 'select=*&order=created_at.desc', accessToken);
    } catch (e) {
        console.error('Export contacts: utilisation des données en cache', e);
    }

    const data = {
        news: newsFromDb,
        reservations: reservationsFromDb,
        contacts: contactsFromDb,
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `centre-remise-joie-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function importData() {
    document.getElementById('importFile').click();
    document.getElementById('importFile').onchange = async function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const data = JSON.parse(e.target.result);

                    if (data.news && data.news.length > 0) {
                        const newsToImport = data.news.map(n => ({
                            titre: n.titre,
                            date: n.date,
                            resume: n.resume,
                            contenu: n.contenu,
                            image: n.image,
                            status: n.status || 'published'
                        }));

                        await supabaseRest.insert('news', newsToImport, accessToken);
                    }

                    if (data.reservations && data.reservations.length > 0) {
                        const reservationsToImport = data.reservations.map(r => ({
                            type_reservation: r.type_reservation,
                            date_arrivee: r.date_arrivee,
                            date_depart: r.date_depart,
                            nombre_personnes: r.nombre_personnes,
                            hebergement_type: r.hebergement_type || null,
                            activites: r.activites || null,
                            repas: r.repas || null,
                            message: r.message || null,
                            status: r.status || 'pending'
                        }));
                        await supabaseRest.insert('reservations', reservationsToImport, accessToken);
                    }

                    if (data.contacts && data.contacts.length > 0) {
                        const contactsToImport = data.contacts.map(c => ({
                            nom_prenom: c.nom_prenom,
                            email: c.email,
                            message: c.message,
                            status: c.status || 'unread'
                        }));
                        await supabaseRest.insert('contacts', contactsToImport, accessToken);
                    }

                    await loadNewsData();
                    await loadReservationsData();
                    await loadContactsData();
                    showSuccessMessage('Données importées avec succès !');
                } catch (error) {
                    alert('Erreur lors de l\'importation : ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
}

// === UTILITY FUNCTIONS ===

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function getStatusText(status) {
    switch (status) {
        case 'published': return 'Publié';
        case 'draft': return 'Brouillon';
        default: return status;
    }
}

function getReservationStatusText(status) {
    switch (status) {
        case 'pending': return 'En attente';
        case 'confirmed': return 'Confirmée';
        case 'cancelled': return 'Annulée';
        default: return status;
    }
}

function getSejourTypeText(type) {
    switch (type) {
        case 'activites': return 'Activités à la journée';
        case 'hebergement': return 'Hébergement seul';
        case 'hebergement_activites': return 'Hébergement + activités';
        case 'entreprise': return 'Animation entreprise';
        default: return type || '—';
    }
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;

    const activeSection = document.querySelector('.admin-section.active');
    activeSection.insertBefore(messageDiv, activeSection.firstChild);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Auto-logout after 8 hours of inactivity
let lastActivity = Date.now();
setInterval(() => {
    if (currentUser && Date.now() - lastActivity > 8 * 60 * 60 * 1000) {
        logout();
    }
}, 60000);

document.addEventListener('click', () => lastActivity = Date.now());
document.addEventListener('keypress', () => lastActivity = Date.now());

// === FACEBOOK / SETTINGS ===

function saveSettings() {
    const facebookConfig = {
        enabled: document.getElementById('facebookIntegration').value === 'enabled',
        pageId: document.getElementById('facebookPageId').value.trim(),
        accessToken: document.getElementById('facebookToken').value.trim()
    };

    saveFacebookConfig(facebookConfig);

    const siteSettings = {
        name: document.getElementById('siteName').value,
        email: document.getElementById('siteEmail').value,
        phone: document.getElementById('sitePhone').value,
        address: document.getElementById('siteAddress').value,
        facebookUrl: document.getElementById('facebookUrl').value
    };

    localStorage.setItem('siteSettings', JSON.stringify(siteSettings));
    showSuccessMessage('Paramètres sauvegardés avec succès !');
}

function testFacebookConnection() {
    const pageId = document.getElementById('facebookPageId').value.trim();
    const fbAccessToken = document.getElementById('facebookToken').value.trim();

    if (!pageId || !fbAccessToken) {
        showSuccessMessage('Veuillez renseigner l\'ID de la page et le token d\'accès.');
        return;
    }

    const testUrl = `https://graph.facebook.com/v18.0/${pageId}?access_token=${fbAccessToken}&fields=name,id`;

    fetch(testUrl)
        .then(response => {
            if (!response.ok) throw new Error('Erreur de connexion');
            return response.json();
        })
        .then(data => {
            showSuccessMessage(`Connexion réussie ! Page : ${data.name}`);
            document.getElementById('facebookPageName').textContent = data.name;
        })
        .catch(error => {
            console.error('Erreur test Facebook:', error);
            showSuccessMessage('Erreur de connexion à Facebook.');
        });
}

function refreshFacebookPosts() {
    showSuccessMessage('Actualisation des posts Facebook en cours...');
}

function loadFacebookSettings() {
    const savedFacebookConfig = localStorage.getItem('facebookConfig');
    if (savedFacebookConfig) {
        const config = JSON.parse(savedFacebookConfig);
        document.getElementById('facebookIntegration').value = config.enabled ? 'enabled' : 'disabled';
        document.getElementById('facebookPageId').value = config.pageId || '';
        document.getElementById('facebookToken').value = config.accessToken || '';
    }

    const savedSiteSettings = localStorage.getItem('siteSettings');
    if (savedSiteSettings) {
        const settings = JSON.parse(savedSiteSettings);
        document.getElementById('siteName').value = settings.name || 'Le Centre de Remise en Joie';
        document.getElementById('siteEmail').value = settings.email || 'contact@centrederemiseenjoie.fr';
        document.getElementById('sitePhone').value = settings.phone || '06 99 53 49 70';
        document.getElementById('siteAddress').value = settings.address || 'Le balcon d\'Augère\n63210 Vernines France';
        document.getElementById('facebookUrl').value = settings.facebookUrl || 'https://www.facebook.com/p/Centre-de-Remise-en-Joie-61566852975357/';
    }
}

function saveFacebookConfig(config) {
    const facebookConfig = {
        pageId: config.pageId || '',
        accessToken: config.accessToken || '',
        enabled: config.enabled || false
    };
    localStorage.setItem('facebookConfig', JSON.stringify(facebookConfig));
}
