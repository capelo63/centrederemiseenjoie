// Admin panel functionality
let currentUser = null;
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

// === AUTHENTICATION via Supabase ===

async function checkAuthStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        showAdminPanel();
    } else {
        showLoginScreen();
    }
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        errorDiv.textContent = 'Email ou mot de passe incorrect.';
        errorDiv.style.display = 'block';
    } else {
        currentUser = data.user;
        showAdminPanel();
        errorDiv.style.display = 'none';
    }
}

async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
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

// === NEWS MANAGEMENT via Supabase ===

async function loadNewsData() {
    const tbody = document.getElementById('newsTableBody');
    tbody.innerHTML = '<tr><td colspan="4">Chargement...</td></tr>';

    const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('Erreur chargement actualités:', error.message);
        tbody.innerHTML = '<tr><td colspan="4">Erreur de chargement</td></tr>';
        return;
    }

    newsData = data || [];
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

    let error;

    if (newsId) {
        // Update existing
        ({ error } = await supabase
            .from('news')
            .update(newsItem)
            .eq('id', newsId));
    } else {
        // Insert new
        ({ error } = await supabase
            .from('news')
            .insert(newsItem));
    }

    if (error) {
        alert('Erreur lors de l\'enregistrement : ' + error.message);
        return;
    }

    hideNewsForm();
    await loadNewsData();
    showSuccessMessage('Actualité enregistrée avec succès !');
}

async function deleteNews(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')) {
        const { error } = await supabase
            .from('news')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Erreur lors de la suppression : ' + error.message);
            return;
        }

        await loadNewsData();
        showSuccessMessage('Actualité supprimée avec succès !');
    }
}

function hideNewsForm() {
    document.getElementById('newsForm').style.display = 'none';
}

// === SAMPLE DATA for reservations/contacts (localStorage, inchangé) ===

function loadSampleData() {
    // Sample reservations data
    reservationsData = [
        {
            id: 1,
            dateArrivee: "2024-02-15",
            dateDepart: "2024-02-18",
            nombrePersonnes: "2",
            typeSejourReservation: "weekend",
            messageReservation: "Première visite, nous sommes très excités !",
            status: "pending",
            dateDemande: "2024-01-20"
        },
        {
            id: 2,
            dateArrivee: "2024-03-01",
            dateDepart: "2024-03-08",
            nombrePersonnes: "1",
            typeSejourReservation: "solo",
            messageReservation: "Je cherche un moment de ressourcement après une période difficile.",
            status: "confirmed",
            dateDemande: "2024-01-18"
        }
    ];

    // Sample contacts data
    contactsData = [
        {
            id: 1,
            nomPrenom: "Marie Dupont",
            email: "marie.dupont@email.com",
            message: "Bonjour, j'aimerais avoir des informations sur vos programmes de méditation. Merci !",
            date: "2024-01-22",
            status: "unread"
        },
        {
            id: 2,
            nomPrenom: "Jean Martin",
            email: "jean.martin@email.com",
            message: "Excellent séjour la semaine dernière ! Merci pour votre accueil chaleureux.",
            date: "2024-01-20",
            status: "read"
        }
    ];

    loadReservationsData();
    loadContactsData();
}

// Reservations management
function loadReservationsData() {
    const tbody = document.getElementById('reservationsTableBody');
    tbody.innerHTML = '';

    reservationsData.forEach(reservation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(reservation.dateDemande)}</td>
            <td>${formatDate(reservation.dateArrivee)}</td>
            <td>${formatDate(reservation.dateDepart)}</td>
            <td>${reservation.nombrePersonnes}</td>
            <td>${getSejourTypeText(reservation.typeSejourReservation)}</td>
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
    // Update filter buttons
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

function updateReservationStatus(id, newStatus) {
    const index = reservationsData.findIndex(r => r.id === id);
    if (index !== -1) {
        reservationsData[index].status = newStatus;
        loadReservationsData();
        showSuccessMessage(`Réservation ${newStatus === 'confirmed' ? 'confirmée' : 'annulée'} !`);
    }
}

// Contacts management
function loadContactsData() {
    const tbody = document.getElementById('contactsTableBody');
    tbody.innerHTML = '';

    contactsData.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(contact.date)}</td>
            <td>${contact.nomPrenom}</td>
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
    // Update filter buttons
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
        alert(`Message de ${contact.nomPrenom} (${contact.email}):\n\n${contact.message}`);
        markAsRead(id);
    }
}

function markAsRead(id) {
    const index = contactsData.findIndex(c => c.id === id);
    if (index !== -1) {
        contactsData[index].status = 'read';
        loadContactsData();
    }
}

// === EXPORT / IMPORT ===

async function exportData() {
    // Récupérer les news depuis Supabase pour l'export
    const { data: newsFromDb } = await supabase
        .from('news')
        .select('*')
        .order('date', { ascending: false });

    const data = {
        news: newsFromDb || newsData,
        reservations: reservationsData,
        contacts: contactsData,
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

                    // Importer les news dans Supabase
                    if (data.news && data.news.length > 0) {
                        // Nettoyer les IDs pour laisser Supabase les générer
                        const newsToImport = data.news.map(n => ({
                            titre: n.titre,
                            date: n.date,
                            resume: n.resume,
                            contenu: n.contenu,
                            image: n.image,
                            status: n.status || 'published'
                        }));

                        const { error } = await supabase
                            .from('news')
                            .insert(newsToImport);

                        if (error) {
                            alert('Erreur lors de l\'importation des actualités : ' + error.message);
                            return;
                        }
                    }

                    if (data.reservations) reservationsData = data.reservations;
                    if (data.contacts) contactsData = data.contacts;

                    await loadNewsData();
                    loadReservationsData();
                    loadContactsData();
                    showSuccessMessage('Données importées avec succès !');
                } catch (error) {
                    alert('Erreur lors de l\'importation des données.');
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
        case 'solo': return 'Retraite solo';
        case 'groupe': return 'Séjour en groupe';
        case 'weekend': return 'Weekend ressourcement';
        case 'semaine': return 'Semaine bien-être';
        default: return type;
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
    const accessToken = document.getElementById('facebookToken').value.trim();

    if (!pageId || !accessToken) {
        showSuccessMessage('Veuillez renseigner l\'ID de la page et le token d\'accès.');
        return;
    }

    const testUrl = `https://graph.facebook.com/v18.0/${pageId}?access_token=${accessToken}&fields=name,id`;

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
