// Admin panel functionality
let currentUser = null;
let accessToken = null;
let newsData = [];
let reservationsData = [];
let contactsData = [];
let temoignagesData = [];

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
    loadTemoignagesData();
    loadAvailabilitySection();
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
    tbody.innerHTML = '<tr><td colspan="9">Chargement...</td></tr>';

    try {
        const data = await supabaseRest.select('reservations', 'select=*&order=created_at.desc', accessToken);
        reservationsData = data || [];
    } catch (error) {
        console.error('Erreur chargement réservations:', error.message);
        tbody.innerHTML = '<tr><td colspan="9">Erreur de chargement</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    reservationsData.forEach(reservation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(reservation.created_at)}</td>
            <td>${reservation.nom_prenom || '—'}</td>
            <td>${reservation.email || '—'}</td>
            <td>${formatDate(reservation.date_arrivee)} → ${formatDate(reservation.date_depart)}</td>
            <td>${reservation.nombre_personnes}</td>
            <td>${getSejourTypeText(reservation.type_reservation)}</td>
            <td><span class="status-badge status-${reservation.status}">${getReservationStatusText(reservation.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-primary btn-sm" onclick="viewReservationDetail(${reservation.id})">Détail</button>
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

function viewReservationDetail(id) {
    const r = reservationsData.find(res => res.id === id);
    if (!r) return;
    const detail = [
        `Nom : ${r.nom_prenom || '—'}`,
        `Email : ${r.email || '—'}`,
        `Téléphone : ${r.telephone || '—'}`,
        `Type : ${getSejourTypeText(r.type_reservation)}`,
        `Du ${formatDate(r.date_arrivee)} au ${formatDate(r.date_depart)}`,
        `Personnes : ${r.nombre_personnes}`,
        `Hébergement : ${r.hebergement_type || '—'}`,
        `Activités : ${r.activites || '—'}`,
        `Repas : ${r.repas || '—'}`,
        `Message : ${r.message || '—'}`,
        `Statut : ${getReservationStatusText(r.status)}`,
        `Demande reçue le : ${formatDate(r.created_at)}`
    ].join('\n');
    alert(detail);
}

async function updateReservationStatus(id, newStatus) {
    try {
        await supabaseRest.update('reservations', { status: newStatus }, `id=eq.${id}`, accessToken);

        // Envoyer email au client si la réservation est confirmée
        if (newStatus === 'confirmed' && typeof emailjs !== 'undefined') {
            const r = reservationsData.find(res => res.id === id);
            if (r && r.email) {
                try {
                    const messageContent = `Nous avons le plaisir de vous confirmer votre réservation :\n\n` +
                        `- Type : ${getSejourTypeText(r.type_reservation)}\n` +
                        `- Du ${formatDate(r.date_arrivee)} au ${formatDate(r.date_depart)}\n` +
                        `- Personnes : ${r.nombre_personnes}\n` +
                        `- Hébergement : ${r.hebergement_type || '—'}\n` +
                        `- Activités : ${r.activites || '—'}\n\n` +
                        `À très bientôt au Centre de Remise en Joie !`;
                    await emailjs.send('service_zjkkwye', 'template_blv5ohi', {
                        email: r.email,
                        nom_prenom: r.nom_prenom || '',
                        subject: 'Votre réservation est confirmée ! - Centre de Remise en Joie',
                        message_content: messageContent
                    });
                    showSuccessMessage('Réservation confirmée et email envoyé au client !');
                } catch (e) {
                    console.error('Erreur envoi email:', e);
                    showSuccessMessage('Réservation confirmée (email non envoyé).');
                }
            } else {
                showSuccessMessage('Réservation confirmée !');
            }
        } else {
            showSuccessMessage(`Réservation ${newStatus === 'confirmed' ? 'confirmée' : 'annulée'} !`);
        }

        await loadReservationsData();
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
                    <button class="btn-success btn-sm" onclick="openReplyModal(${contact.id})">Répondre</button>
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

// === RÉPONSE AUX CONTACTS ===

let currentReplyContactId = null;

function openReplyModal(id) {
    const contact = contactsData.find(c => c.id === id);
    if (!contact) return;

    currentReplyContactId = id;

    document.getElementById('replyOriginalMessage').innerHTML =
        `<strong>${contact.nom_prenom}</strong> (${contact.email})<br>` +
        `<em>${formatDate(contact.created_at)}</em><br><br>` +
        contact.message;
    document.getElementById('replyText').value = '';

    const modal = document.getElementById('replyModal');
    modal.style.display = 'flex';

    // Fermer en cliquant en dehors
    modal.onclick = function(e) {
        if (e.target === modal) closeReplyModal();
    };
}

function closeReplyModal() {
    document.getElementById('replyModal').style.display = 'none';
    currentReplyContactId = null;
}

async function sendReply() {
    const replyText = document.getElementById('replyText').value.trim();
    if (!replyText) {
        alert('Veuillez écrire votre réponse.');
        return;
    }

    const contact = contactsData.find(c => c.id === currentReplyContactId);
    if (!contact) return;

    const btn = document.getElementById('sendReplyBtn');
    btn.textContent = 'Envoi en cours...';
    btn.disabled = true;

    try {
        await emailjs.send('service_zjkkwye', 'template_blv5ohi', {
            email: contact.email,
            nom_prenom: contact.nom_prenom,
            subject: 'Re: Votre message - Centre de Remise en Joie',
            message_content: replyText
        });

        // Marquer comme lu
        await supabaseRest.update('contacts', { status: 'read' }, `id=eq.${contact.id}`, accessToken);
        await loadContactsData();

        closeReplyModal();
        showSuccessMessage('Réponse envoyée avec succès !');
    } catch (error) {
        console.error('Erreur envoi réponse:', error);
        alert('Erreur lors de l\'envoi : ' + (error.text || error.message || 'Erreur inconnue'));
    } finally {
        btn.textContent = 'Envoyer la réponse';
        btn.disabled = false;
    }
}

// === TÉMOIGNAGES via Supabase REST ===

async function loadTemoignagesData() {
    const tbody = document.getElementById('temoignagesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4">Chargement...</td></tr>';

    try {
        const data = await supabaseRest.select('temoignages', 'select=*&order=created_at.desc', accessToken);
        temoignagesData = data || [];
    } catch (error) {
        console.error('Erreur chargement témoignages:', error.message);
        tbody.innerHTML = '<tr><td colspan="4">Erreur de chargement</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    temoignagesData.forEach(t => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${t.auteur}</strong><br><small>${t.role || ''}</small></td>
            <td class="message-cell">${truncateText(t.texte, 80)}</td>
            <td><span class="status-badge status-${t.status}">${t.status === 'published' ? 'Publié' : 'Brouillon'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-primary btn-sm" onclick="editTemoignage(${t.id})">Modifier</button>
                    <button class="btn-sm" onclick="toggleTemoignageStatus(${t.id})">${t.status === 'published' ? 'Masquer' : 'Publier'}</button>
                    <button class="btn-danger btn-sm" onclick="deleteTemoignage(${t.id})">Supprimer</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddTestimonialForm() {
    document.getElementById('testimonialFormTitle').textContent = 'Nouveau témoignage';
    document.getElementById('temoignageForm').reset();
    document.getElementById('temoignageId').value = '';
    document.getElementById('testimonialForm').style.display = 'block';
}

function hideTestimonialForm() {
    document.getElementById('testimonialForm').style.display = 'none';
}

function editTemoignage(id) {
    const t = temoignagesData.find(item => item.id === id);
    if (!t) return;
    document.getElementById('testimonialFormTitle').textContent = 'Modifier le témoignage';
    document.getElementById('temoignageId').value = t.id;
    document.getElementById('temoignageAuteur').value = t.auteur;
    document.getElementById('temoignageRole').value = t.role || '';
    document.getElementById('temoignageTexte').value = t.texte;
    document.getElementById('testimonialForm').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('temoignageForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleTemoignageSave();
        });
    }
});

async function handleTemoignageSave() {
    const id = document.getElementById('temoignageId').value;
    const item = {
        auteur: document.getElementById('temoignageAuteur').value,
        role: document.getElementById('temoignageRole').value || null,
        texte: document.getElementById('temoignageTexte').value,
        status: 'published'
    };

    try {
        if (id) {
            await supabaseRest.update('temoignages', item, `id=eq.${id}`, accessToken);
        } else {
            await supabaseRest.insert('temoignages', item, accessToken);
        }
        hideTestimonialForm();
        await loadTemoignagesData();
        showSuccessMessage('Témoignage enregistré !');
    } catch (error) {
        alert('Erreur : ' + error.message);
    }
}

async function toggleTemoignageStatus(id) {
    const t = temoignagesData.find(item => item.id === id);
    if (!t) return;
    const newStatus = t.status === 'published' ? 'draft' : 'published';
    try {
        await supabaseRest.update('temoignages', { status: newStatus }, `id=eq.${id}`, accessToken);
        await loadTemoignagesData();
        showSuccessMessage(`Témoignage ${newStatus === 'published' ? 'publié' : 'masqué'} !`);
    } catch (error) {
        alert('Erreur : ' + error.message);
    }
}

async function deleteTemoignage(id) {
    if (!confirm('Supprimer ce témoignage ?')) return;
    try {
        await supabaseRest.remove('temoignages', `id=eq.${id}`, accessToken);
        await loadTemoignagesData();
        showSuccessMessage('Témoignage supprimé !');
    } catch (error) {
        alert('Erreur : ' + error.message);
    }
}

// === DISPONIBILITÉS (basées sur les réservations confirmées Supabase) ===

let adminCalendarDate = new Date();
let confirmedReservations = [];

const accommodationTypes = {
    tipi: { name: 'Le Tipi', capacity: 4 },
    caravane: { name: 'La Caravane', capacity: 2 },
    dortoir: { name: 'Le Dortoir du Chalet', capacity: 8 }
};

async function loadAvailabilitySection() {
    try {
        confirmedReservations = await supabaseRest.select('reservations', 'select=*&status=eq.confirmed', accessToken);
    } catch (e) {
        console.error('Erreur chargement réservations confirmées:', e.message);
        confirmedReservations = [];
    }
    updateAvailabilityStats();
    renderAdminCalendar();
    renderAccommodationStatus();
}

function updateAvailabilityStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Réservations ce mois
    const reservationsThisMonth = confirmedReservations.filter(r => {
        const start = new Date(r.date_arrivee);
        const end = new Date(r.date_depart);
        return (start.getMonth() === currentMonth && start.getFullYear() === currentYear) ||
               (end.getMonth() === currentMonth && end.getFullYear() === currentYear) ||
               (start < new Date(currentYear, currentMonth, 1) && end > new Date(currentYear, currentMonth + 1, 0));
    });

    document.getElementById('statReservationsMois').textContent = reservationsThisMonth.length;

    // Taux d'occupation moyen sur les 3 prochains mois
    const daysToCheck = 90;
    let occupiedDays = 0;
    const totalSlots = daysToCheck * 3; // 3 hébergements
    for (let d = 0; d < daysToCheck; d++) {
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + d);
        const dateStr = formatDateISO(checkDate);
        Object.keys(accommodationTypes).forEach(accType => {
            if (isAccommodationOccupied(dateStr, accType)) occupiedDays++;
        });
    }
    const occupationRate = totalSlots > 0 ? Math.round((occupiedDays / totalSlots) * 100) : 0;
    document.getElementById('statOccupation').textContent = occupationRate + '%';

    // Hébergement le plus demandé
    const counts = { tipi: 0, caravane: 0, dortoir: 0 };
    confirmedReservations.forEach(r => {
        if (r.hebergement_type && counts[r.hebergement_type] !== undefined) {
            counts[r.hebergement_type]++;
        }
    });
    const topType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('statTopHebergement').textContent =
        topType[1] > 0 ? accommodationTypes[topType[0]].name : 'Aucune donnée';
}

function isAccommodationOccupied(dateStr, accType) {
    return confirmedReservations.some(r => {
        if (r.hebergement_type !== accType) return false;
        return dateStr >= r.date_arrivee && dateStr < r.date_depart;
    });
}

function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function renderAdminCalendar() {
    const grid = document.getElementById('adminCalendarGrid');
    const monthDisplay = document.getElementById('adminCalendarMonth');
    if (!grid || !monthDisplay) return;

    const months = ['Janvier','Février','Mars','Avril','Mai','Juin',
                    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    monthDisplay.textContent = `${months[adminCalendarDate.getMonth()]} ${adminCalendarDate.getFullYear()}`;

    grid.innerHTML = '';

    // En-têtes jours
    ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'].forEach(day => {
        const el = document.createElement('div');
        el.className = 'calendar-day day-header';
        el.textContent = day;
        grid.appendChild(el);
    });

    const firstDay = new Date(adminCalendarDate.getFullYear(), adminCalendarDate.getMonth(), 1);
    const lastDay = new Date(adminCalendarDate.getFullYear(), adminCalendarDate.getMonth() + 1, 0);
    const startingDay = firstDay.getDay();

    // Jours vides avant
    for (let i = 0; i < startingDay; i++) {
        const el = document.createElement('div');
        el.className = 'calendar-day other-month';
        grid.appendChild(el);
    }

    // Jours du mois
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateStr = `${adminCalendarDate.getFullYear()}-${String(adminCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const el = document.createElement('div');
        el.className = 'calendar-day';
        el.textContent = day;

        // Compter les hébergements occupés ce jour
        let occupiedCount = 0;
        const totalAccommodations = Object.keys(accommodationTypes).length;
        Object.keys(accommodationTypes).forEach(accType => {
            if (isAccommodationOccupied(dateStr, accType)) occupiedCount++;
        });

        if (occupiedCount === 0) {
            el.classList.add('admin-available');
        } else if (occupiedCount < totalAccommodations) {
            el.classList.add('admin-partial');
        } else {
            el.classList.add('admin-occupied');
        }

        // Click pour voir le détail du jour
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => showDayDetail(dateStr));
        grid.appendChild(el);
    }
}

function changeAdminMonth(direction) {
    adminCalendarDate.setMonth(adminCalendarDate.getMonth() + direction);
    renderAdminCalendar();
}

function showDayDetail(dateStr) {
    const reservationsForDay = confirmedReservations.filter(r =>
        dateStr >= r.date_arrivee && dateStr < r.date_depart
    );

    const dateDisplay = new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    if (reservationsForDay.length === 0) {
        alert(`${dateDisplay}\n\nTous les hébergements sont disponibles.`);
        return;
    }

    let detail = `${dateDisplay}\n\nRéservations confirmées :\n`;
    reservationsForDay.forEach(r => {
        const accName = accommodationTypes[r.hebergement_type]
            ? accommodationTypes[r.hebergement_type].name
            : (r.hebergement_type || 'Activités seules');
        detail += `\n• ${r.nom_prenom || '—'} — ${accName}`;
        detail += `\n  Du ${formatDate(r.date_arrivee)} au ${formatDate(r.date_depart)}`;
        detail += `\n  ${r.nombre_personnes} personne(s)\n`;
    });

    // Hébergements encore disponibles
    const occupiedTypes = reservationsForDay
        .map(r => r.hebergement_type)
        .filter(Boolean);
    const availableTypes = Object.entries(accommodationTypes)
        .filter(([key]) => !occupiedTypes.includes(key))
        .map(([, val]) => val.name);

    if (availableTypes.length > 0) {
        detail += `\nEncore disponible(s) : ${availableTypes.join(', ')}`;
    } else {
        detail += '\nComplet ce jour.';
    }

    alert(detail);
}

function renderAccommodationStatus() {
    const grid = document.getElementById('accommodationStatusGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const daysToCheck = 90;
    const now = new Date();

    Object.entries(accommodationTypes).forEach(([key, acc]) => {
        // Calculer le taux de disponibilité sur 3 mois
        let availableDays = 0;
        for (let d = 0; d < daysToCheck; d++) {
            const checkDate = new Date(now);
            checkDate.setDate(checkDate.getDate() + d);
            const dateStr = formatDateISO(checkDate);
            if (!isAccommodationOccupied(dateStr, key)) availableDays++;
        }
        const availabilityRate = Math.round((availableDays / daysToCheck) * 100);

        // Prochaine réservation
        const upcoming = confirmedReservations
            .filter(r => r.hebergement_type === key && r.date_arrivee >= formatDateISO(now))
            .sort((a, b) => a.date_arrivee.localeCompare(b.date_arrivee));
        const nextResa = upcoming.length > 0
            ? `Prochaine : ${formatDate(upcoming[0].date_arrivee)}`
            : 'Aucune réservation à venir';

        const card = document.createElement('div');
        card.className = 'accommodation-status-card';
        card.innerHTML = `
            <h4>${acc.name}</h4>
            <div class="status-info">
                <span class="capacity">${acc.capacity} personnes max</span>
                <span class="availability-rate">Disponible à ${availabilityRate}%</span>
            </div>
            <div class="status-info" style="margin-top:4px;">
                <span style="font-size:0.85em;color:#666;">${nextResa}</span>
            </div>
            <div class="status-actions">
                <button class="btn-small" onclick="manageAccommodationAvailability('${key}')">Détail</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function manageAccommodationAvailability(accType) {
    const acc = accommodationTypes[accType];
    const now = new Date();
    const reservations = confirmedReservations
        .filter(r => r.hebergement_type === accType && r.date_depart >= formatDateISO(now))
        .sort((a, b) => a.date_arrivee.localeCompare(b.date_arrivee));

    let detail = `${acc.name} (${acc.capacity} pers. max)\n\n`;

    if (reservations.length === 0) {
        detail += 'Aucune réservation confirmée à venir.';
    } else {
        detail += `${reservations.length} réservation(s) à venir :\n`;
        reservations.forEach(r => {
            detail += `\n• ${r.nom_prenom || '—'}`;
            detail += `\n  Du ${formatDate(r.date_arrivee)} au ${formatDate(r.date_depart)}`;
            detail += `\n  ${r.nombre_personnes} personne(s)\n`;
        });
    }

    alert(detail);
}

function showAvailabilityForm() {
    alert('Pour modifier les disponibilités, confirmez ou annulez les réservations dans l\'onglet Réservations.\n\nLes disponibilités se mettent à jour automatiquement en fonction des réservations confirmées.');
}

function exportAvailability() {
    const data = {
        generatedAt: new Date().toISOString(),
        confirmedReservations: confirmedReservations,
        accommodations: accommodationTypes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disponibilites-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
