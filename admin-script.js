// Admin panel functionality
let currentUser = null;
let newsData = [];
let reservationsData = [];
let contactsData = [];

// Authentication
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'CentreRemiseJoie2024!' // In production, this would be hashed and stored securely
};

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
    loadSampleData();
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

function checkAuthStatus() {
    const stored = localStorage.getItem('adminAuth');
    if (stored) {
        const authData = JSON.parse(stored);
        if (authData.expires > Date.now()) {
            currentUser = authData.user;
            showAdminPanel();
            return;
        } else {
            localStorage.removeItem('adminAuth');
        }
    }
    showLoginScreen();
}

function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    // Simple authentication (in production, this would be server-side)
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        currentUser = { username: username };
        
        // Store authentication (expires in 8 hours)
        const authData = {
            user: currentUser,
            expires: Date.now() + (8 * 60 * 60 * 1000)
        };
        localStorage.setItem('adminAuth', JSON.stringify(authData));
        
        showAdminPanel();
        errorDiv.style.display = 'none';
    } else {
        errorDiv.textContent = 'Nom d\'utilisateur ou mot de passe incorrect.';
        errorDiv.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('adminAuth');
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
    document.getElementById('welcomeUser').textContent = `Bienvenue, ${currentUser.username}`;
    
    // Load data
    loadNewsData();
    loadReservationsData();
    loadContactsData();
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

// News management
function saveNewsToLocalStorage() {
    localStorage.setItem('adminNewsData', JSON.stringify(newsData));
}

function loadSampleData() {
    // Charger les actualités depuis le localStorage si disponibles
    const savedNews = localStorage.getItem('adminNewsData');
    if (savedNews) {
        try {
            newsData = JSON.parse(savedNews);
        } catch (e) {
            console.error('Erreur lors du chargement des actualités sauvegardées:', e);
            newsData = [];
        }
    } else {
        // Données d'exemple par défaut (première utilisation uniquement)
        newsData = [
            {
                id: 1,
                titre: "Nouveau programme de méditation",
                date: "2024-01-15",
                resume: "Découvrez notre nouveau programme de méditation en pleine conscience, adapté à tous les niveaux.",
                contenu: "Nous sommes ravis de vous présenter notre nouveau programme de méditation...",
                image: "images/meditation.jpg",
                status: "published"
            },
            {
                id: 2,
                titre: "Ateliers yoga printaniers",
                date: "2024-01-10",
                resume: "Rejoignez-nous pour nos ateliers de yoga spécialement conçus pour accueillir le printemps.",
                contenu: "Le printemps approche et avec lui, l'éveil de la nature qui nous entoure...",
                image: "images/yoga.jpg",
                status: "published"
            }
        ];
        // Sauvegarder les données d'exemple dans le localStorage
        saveNewsToLocalStorage();
    }
    
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
}

function loadNewsData() {
    const tbody = document.getElementById('newsTableBody');
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

function handleNewsSave() {
    const formData = new FormData(document.getElementById('actualiteForm'));
    const newsId = document.getElementById('newsId').value;
    
    const newsItem = {
        titre: formData.get('titre'),
        date: formData.get('date'),
        resume: formData.get('resume'),
        contenu: formData.get('contenu'),
        image: formData.get('image') || 'images/placeholder.jpg',
        status: 'published'
    };
    
    if (newsId) {
        // Edit existing
        const index = newsData.findIndex(n => n.id == newsId);
        if (index !== -1) {
            newsData[index] = { ...newsData[index], ...newsItem };
        }
    } else {
        // Add new
        const newId = Math.max(...newsData.map(n => n.id), 0) + 1;
        newsData.push({ id: newId, ...newsItem });
    }

    saveNewsToLocalStorage();
    hideNewsForm();
    loadNewsData();
    showSuccessMessage('Actualité enregistrée avec succès !');
}

function deleteNews(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')) {
        newsData = newsData.filter(n => n.id !== id);
        saveNewsToLocalStorage();
        loadNewsData();
        showSuccessMessage('Actualité supprimée avec succès !');
    }
}

function hideNewsForm() {
    document.getElementById('newsForm').style.display = 'none';
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

// Settings management
function saveSettings() {
    // In a real application, this would save to a database
    showSuccessMessage('Paramètres enregistrés avec succès !');
}

function exportData() {
    const data = {
        news: newsData,
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

function importData() {
    document.getElementById('importFile').click();
    document.getElementById('importFile').onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.news) newsData = data.news;
                    if (data.reservations) reservationsData = data.reservations;
                    if (data.contacts) contactsData = data.contacts;

                    saveNewsToLocalStorage();
                    loadNewsData();
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

// Utility functions
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
    // Create and show success message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    
    // Add to current section
    const activeSection = document.querySelector('.admin-section.active');
    activeSection.insertBefore(messageDiv, activeSection.firstChild);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Security: Clear sensitive data on page unload
window.addEventListener('beforeunload', function() {
    // In production, you might want to log out automatically after a period of inactivity
});

// Auto-logout after 8 hours of inactivity
let lastActivity = Date.now();
setInterval(() => {
    if (currentUser && Date.now() - lastActivity > 8 * 60 * 60 * 1000) {
        logout();
    }
}, 60000); // Check every minute

// Update last activity on user interaction
document.addEventListener('click', () => lastActivity = Date.now());
document.addEventListener('keypress', () => lastActivity = Date.now());

// Facebook Integration Management
function saveSettings() {
    const facebookConfig = {
        enabled: document.getElementById('facebookIntegration').value === 'enabled',
        pageId: document.getElementById('facebookPageId').value.trim(),
        accessToken: document.getElementById('facebookToken').value.trim()
    };
    
    // Sauvegarder la configuration Facebook
    saveFacebookConfig(facebookConfig);
    
    // Sauvegarder les autres paramètres du site
    const siteSettings = {
        name: document.getElementById('siteName').value,
        email: document.getElementById('siteEmail').value,
        phone: document.getElementById('sitePhone').value,
        address: document.getElementById('siteAddress').value,
        facebookUrl: document.getElementById('facebookUrl').value
    };
    
    localStorage.setItem('siteSettings', JSON.stringify(siteSettings));
    
    showMessage('Paramètres sauvegardés avec succès !', 'success');
    
    // Recharger les actualités pour prendre en compte la nouvelle configuration
    if (typeof loadNews === 'function') {
        loadNews();
    }
}

function testFacebookConnection() {
    const pageId = document.getElementById('facebookPageId').value.trim();
    const accessToken = document.getElementById('facebookToken').value.trim();
    
    if (!pageId || !accessToken) {
        showMessage('Veuillez renseigner l\'ID de la page et le token d\'accès.', 'error');
        return;
    }
    
    // Test de connexion à l'API Facebook
    const testUrl = `https://graph.facebook.com/v18.0/${pageId}?access_token=${accessToken}&fields=name,id`;
    
    fetch(testUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur de connexion');
            }
            return response.json();
        })
        .then(data => {
            showMessage(`Connexion réussie ! Page trouvée : ${data.name}`, 'success');
            document.getElementById('facebookPageName').textContent = data.name;
        })
        .catch(error => {
            console.error('Erreur de test Facebook:', error);
            showMessage('Erreur de connexion à Facebook. Vérifiez vos identifiants.', 'error');
        });
}

function refreshFacebookPosts() {
    showMessage('Actualisation des posts Facebook en cours...', 'info');
    
    // Forcer le rechargement des actualités
    if (typeof loadNews === 'function') {
        loadNews().then(() => {
            showMessage('Posts Facebook actualisés avec succès !', 'success');
        }).catch(error => {
            showMessage('Erreur lors de l\'actualisation des posts Facebook.', 'error');
        });
    }
}

function loadFacebookSettings() {
    // Charger la configuration Facebook sauvegardée
    const savedFacebookConfig = localStorage.getItem('facebookConfig');
    if (savedFacebookConfig) {
        const config = JSON.parse(savedFacebookConfig);
        document.getElementById('facebookIntegration').value = config.enabled ? 'enabled' : 'disabled';
        document.getElementById('facebookPageId').value = config.pageId || '';
        document.getElementById('facebookToken').value = config.accessToken || '';
    }
    
    // Charger les paramètres du site
    const savedSiteSettings = localStorage.getItem('siteSettings');
    if (savedSiteSettings) {
        const settings = JSON.parse(savedSiteSettings);
        document.getElementById('siteName').value = settings.name || 'Le Centre de Remise en Joie';
        document.getElementById('siteEmail').value = settings.email || 'contact@chaletananda.fr';
        document.getElementById('sitePhone').value = settings.phone || '06 21 39 72 24';
        document.getElementById('siteAddress').value = settings.address || 'Le balcon d\'Augère\n63210 Vernines France';
        document.getElementById('facebookUrl').value = settings.facebookUrl || 'https://facebook.com/chaletananda';
    }
}

// Fonction pour importer saveFacebookConfig depuis script.js
function saveFacebookConfig(config) {
    const facebookConfig = { 
        pageId: config.pageId || '', 
        accessToken: config.accessToken || '', 
        enabled: config.enabled || false 
    };
    localStorage.setItem('facebookConfig', JSON.stringify(facebookConfig));
}