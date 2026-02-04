// Slideshow functionality
let currentSlideIndex = 0;
let previousSlideIndex = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.remove('active', 'prev-slide');
        if (i === index) {
            slide.classList.add('active');
        } else if (i === previousSlideIndex) {
            slide.classList.add('prev-slide');
        }
    });
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    previousSlideIndex = index;
}

function changeSlide(direction) {
    currentSlideIndex += direction;
    if (currentSlideIndex >= slides.length) {
        currentSlideIndex = 0;
    } else if (currentSlideIndex < 0) {
        currentSlideIndex = slides.length - 1;
    }
    showSlide(currentSlideIndex);
}

function currentSlide(index) {
    currentSlideIndex = index - 1;
    showSlide(currentSlideIndex);
}

// Auto-advance slideshow every 5 seconds
setInterval(() => {
    changeSlide(1);
}, 5000);


// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupFormHandlers();
    createPlaceholderImages();
    setupVideoBackground();
    setupMobileMenu();
    loadTestimonials();
    loadProgrammeData();
    initializeCalendar();
    initializeAvailabilitySystem();
});

function setupFormHandlers() {
    // Reservation form handler
    const reservationForm = document.getElementById('reservationForm');
    reservationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleReservation();
    });
    
    // Contact form handler
    const contactForm = document.getElementById('contactForm');
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleContact();
    });
    
    // Set minimum date to today for reservation dates
    const today = new Date().toISOString().split('T')[0];
    const dateArriveeSimple = document.getElementById('dateArriveeSimple');
    const dateDepartSimple = document.getElementById('dateDepartSimple');
    
    if (dateArriveeSimple && dateDepartSimple) {
        dateArriveeSimple.min = today;
        dateDepartSimple.min = today;
        
        // Update departure date minimum when arrival date changes
        dateArriveeSimple.addEventListener('change', function() {
            const arrivalDate = this.value;
            dateDepartSimple.min = arrivalDate;
            
            if (dateDepartSimple.value && dateDepartSimple.value <= arrivalDate) {
                dateDepartSimple.value = '';
            }
            
            // Sync with hidden fields
            document.getElementById('dateArrivee').value = arrivalDate;
            syncCalendarFromSimpleInputs();
        });
        
        dateDepartSimple.addEventListener('change', function() {
            // Sync with hidden fields
            document.getElementById('dateDepart').value = this.value;
            syncCalendarFromSimpleInputs();
            
            // Update accommodation availability if both dates are selected
            if (dateArriveeSimple.value && this.value) {
                updateAccommodationAvailability();
            }
        });
    }
    
    // Calendar toggle buttons
    const showCalendarBtn = document.getElementById('showCalendarBtn');
    const hideCalendarBtn = document.getElementById('hideCalendarBtn');
    const detailedCalendar = document.getElementById('detailedCalendar');
    const simpleSelection = document.querySelector('.simple-date-selection');
    
    if (showCalendarBtn && hideCalendarBtn && detailedCalendar) {
        showCalendarBtn.addEventListener('click', function() {
            simpleSelection.style.display = 'none';
            detailedCalendar.style.display = 'block';
            // Sync calendar with simple inputs if dates are already selected
            syncCalendarFromSimpleInputs();
        });
        
        hideCalendarBtn.addEventListener('click', function() {
            detailedCalendar.style.display = 'none';
            simpleSelection.style.display = 'block';
        });
    }
    
    // Handle dynamic form sections based on reservation type
    const typeReservationInputs = document.querySelectorAll('input[name="typeReservation"]');
    typeReservationInputs.forEach(input => {
        input.addEventListener('change', function() {
            toggleReservationSections(this.value);
        });
    });
}

function toggleReservationSections(selectedType) {
    const hebergementSection = document.getElementById('hebergementSection');
    const activitesSection = document.getElementById('activitesSection');
    const repasSection = document.getElementById('repasSection');
    
    // Hide all sections first
    hebergementSection.style.display = 'none';
    activitesSection.style.display = 'none';
    repasSection.style.display = 'none';
    
    // Show sections based on selection
    switch(selectedType) {
        case 'activites':
            activitesSection.style.display = 'block';
            break;
        case 'hebergement':
            hebergementSection.style.display = 'block';
            repasSection.style.display = 'block';
            break;
        case 'hebergement_activites':
            hebergementSection.style.display = 'block';
            activitesSection.style.display = 'block';
            repasSection.style.display = 'block';
            break;
        case 'entreprise':
            // For company events, show activities section
            activitesSection.style.display = 'block';
            repasSection.style.display = 'block';
            break;
    }
}

async function handleReservation() {
    const formData = new FormData(document.getElementById('reservationForm'));
    const data = {};
    
    // Process all form data including multiple checkboxes
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            // If key already exists, make it an array
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }
    
    // Validation
    if (data.dateDepart <= data.dateArrivee) {
        alert('La date de départ doit être postérieure à la date d\'arrivée.');
        return;
    }
    
    // Validate required sections based on type
    const typeReservation = data.typeReservation;
    let validationMessage = '';
    
    // Vérifier que les dates sont sélectionnées
    if (!selectedArrivalDate || !selectedDepartureDate) {
        validationMessage = 'Veuillez sélectionner vos dates d\'arrivée et de départ sur le calendrier.';
    } else if ((typeReservation === 'hebergement' || typeReservation === 'hebergement_activites') && !data.hebergementType) {
        validationMessage = 'Veuillez sélectionner un hébergement disponible pour vos dates.';
    } else if ((typeReservation === 'activites' || typeReservation === 'hebergement_activites' || typeReservation === 'entreprise') && !data.activites) {
        validationMessage = 'Veuillez sélectionner au moins une activité.';
    }
    
    if (validationMessage) {
        alert(validationMessage);
        return;
    }
    
    // Préparer les activités en texte
    const activites = Array.isArray(data.activites) ? data.activites.join(', ') : (data.activites || '');
    const repas = Array.isArray(data.repas) ? data.repas.join(', ') : (data.repas || '');

    // Envoyer à Supabase
    if (typeof supabaseRest !== 'undefined') {
        try {
            await supabaseRest.insert('reservations', {
                nom_prenom: data.resaNomPrenom,
                email: data.resaEmail,
                telephone: data.resaTelephone || null,
                type_reservation: typeReservation,
                date_arrivee: data.dateArrivee,
                date_depart: data.dateDepart,
                nombre_personnes: parseInt(data.nombrePersonnes) || 1,
                hebergement_type: data.hebergementType || null,
                activites: activites || null,
                repas: repas || null,
                message: data.messageReservation || null,
                status: 'pending'
            });
        } catch (error) {
            console.error('Erreur envoi réservation:', error);
            alert('Erreur lors de l\'envoi de votre demande. Veuillez réessayer.\n\nDétail : ' + error.message);
            return;
        }
    }

    // Envoyer email de confirmation au client
    if (typeof emailjs !== 'undefined') {
        try {
            const typeLabels = {
                activites: 'Activités à la journée',
                hebergement: 'Hébergement',
                hebergement_activites: 'Hébergement + Activités',
                entreprise: 'Animation entreprise'
            };
            await emailjs.send('service_zjkkwye', 'template_t6h9q3c', {
                email: data.resaEmail,
                nom_prenom: data.resaNomPrenom,
                type_reservation: typeLabels[typeReservation] || typeReservation,
                date_arrivee: new Date(data.dateArrivee + 'T00:00:00').toLocaleDateString('fr-FR'),
                date_depart: new Date(data.dateDepart + 'T00:00:00').toLocaleDateString('fr-FR'),
                nombre_personnes: data.nombrePersonnes,
                hebergement_type: data.hebergementType || '—',
                activites: activites || '—',
                repas: repas || '—',
                message: data.messageReservation || '—',
                telephone: data.resaTelephone || '—'
            });
        } catch (e) {
            console.error('Erreur envoi email confirmation:', e);
        }
    }

    // Show confirmation message
    alert('Votre demande de réservation a été envoyée avec succès !\nUn email de confirmation vous a été envoyé.');
    
    // Reset form and hide all sections
    document.getElementById('reservationForm').reset();
    toggleReservationSections('');
    
    // Reset calendar selection
    selectedArrivalDate = null;
    selectedDepartureDate = null;
    updateSelectedDateDisplay('arrival', null);
    updateSelectedDateDisplay('departure', null);
    clearAccommodationSelection();
    renderCalendar();
    
    // Show simple selection and hide detailed calendar
    const simpleSelection = document.querySelector('.simple-date-selection');
    const detailedCalendar = document.getElementById('detailedCalendar');
    if (simpleSelection && detailedCalendar) {
        simpleSelection.style.display = 'block';
        detailedCalendar.style.display = 'none';
    }
}

async function handleContact() {
    const formData = new FormData(document.getElementById('contactForm'));
    const data = Object.fromEntries(formData.entries());

    // Envoyer à Supabase
    if (typeof supabaseRest !== 'undefined') {
        try {
            await supabaseRest.insert('contacts', {
                nom_prenom: data.nomPrenom,
                email: data.email,
                message: data.message,
                status: 'unread'
            });
        } catch (error) {
            console.error('Erreur envoi contact:', error);
            alert('Erreur lors de l\'envoi de votre message. Veuillez réessayer.');
            return;
        }
    }

    // Show confirmation message
    alert('Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.');

    // Reset form
    document.getElementById('contactForm').reset();
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Create placeholder images for slideshow (in a real scenario, you'd replace these with actual images)
function createPlaceholderImages() {
    const imageFolder = 'images';
    const imageNames = ['centre1.jpg', 'centre2.jpg', 'paysage1.jpg', 'paysage2.jpg', 
                       'meditation.jpg', 'yoga.jpg', 'centre-ouvert.jpg', 'randonnee.jpg', 'placeholder.jpg'];
    
    // Create images directory if it doesn't exist and add placeholder images
    // This is just for demonstration - in reality, you'd have actual images
    console.log('Pour un fonctionnement complet, ajoutez les images suivantes dans le dossier images/ :');
    imageNames.forEach(name => {
        console.log(`- ${name}`);
    });
}

// Mobile menu functionality
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const navLinksItems = navLinks.querySelectorAll('a');
    
    if (!menuToggle || !navLinks) return;
    
    menuToggle.addEventListener('click', function() {
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (navLinks.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });
    
    // Close menu when clicking on a link
    navLinksItems.forEach(link => {
        link.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Testimonials functionality
let currentTestimonialIndex = 0;
let testimonialsData = [];

const defaultTestimonials = [
    {
        texte: "La méditation active proposée et enseignée par Nelly est pour moi un vrai voyage intérieur. Nelly est un bon guide, douce, très à l'écoute, elle sait poser les bonnes questions pour nous aider à débloquer certains de nos fonctionnements qui nous créent des tensions. Elle sait nous mettre à l'aise. Le fait d'être en groupe et de pouvoir parler de nos difficultés sans gêne et sans jugement est déculpabilisant. On se sent moins seule. Au fil du temps, on devient observateur de nos pensées, on se sent plus légère, libérée et avec un regain d'énergie. Merci !",
        auteur: "Anne-Marie",
        role: "Participante aux ateliers de méditation"
    }
];

async function loadTestimonials() {
    testimonialsData = defaultTestimonials;

    if (typeof supabaseRest !== 'undefined') {
        try {
            const data = await supabaseRest.select('temoignages', 'select=*&status=eq.published&order=created_at.desc');
            if (data && data.length > 0) {
                testimonialsData = data;
            }
        } catch (e) {
            console.error('Erreur chargement témoignages:', e.message);
        }
    }

    renderTestimonials();
}

function renderTestimonials() {
    const slideshow = document.getElementById('testimonialsSlideshow');
    const nav = document.getElementById('testimonialsNav');
    const dotsContainer = document.getElementById('testimonialsDots');
    if (!slideshow) return;

    slideshow.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';

    testimonialsData.forEach((t, i) => {
        const div = document.createElement('div');
        div.className = 'testimonial' + (i === 0 ? ' active' : '');
        div.innerHTML = `
            <div class="testimonial-content">
                <div class="quote-icon">&#10077;</div>
                <p class="testimonial-text">${t.texte}</p>
                <div class="testimonial-author">
                    <div class="author-name">${t.auteur}</div>
                    <div class="author-role">${t.role || ''}</div>
                </div>
            </div>
        `;
        slideshow.appendChild(div);

        if (dotsContainer) {
            const dot = document.createElement('span');
            dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
            dot.onclick = () => currentTestimonial(i + 1);
            dotsContainer.appendChild(dot);
        }
    });

    if (nav) {
        nav.style.display = testimonialsData.length > 1 ? 'flex' : 'none';
    }
    currentTestimonialIndex = 0;
}

function changeTestimonial(direction) {
    if (testimonialsData.length <= 1) return;

    const testimonialElements = document.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.testimonial-dot');

    if (testimonialElements[currentTestimonialIndex]) {
        testimonialElements[currentTestimonialIndex].classList.remove('active');
    }
    if (dots[currentTestimonialIndex]) {
        dots[currentTestimonialIndex].classList.remove('active');
    }

    currentTestimonialIndex += direction;
    if (currentTestimonialIndex >= testimonialsData.length) {
        currentTestimonialIndex = 0;
    } else if (currentTestimonialIndex < 0) {
        currentTestimonialIndex = testimonialsData.length - 1;
    }
    
    // Add active class to new testimonial
    if (testimonialElements[currentTestimonialIndex]) {
        testimonialElements[currentTestimonialIndex].classList.add('active');
    }
    if (dots[currentTestimonialIndex]) {
        dots[currentTestimonialIndex].classList.add('active');
    }
}

function currentTestimonial(index) {
    if (testimonialsData.length <= 1) return;
    
    const testimonialElements = document.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.testimonial-dot');
    
    // Remove active class from current testimonial
    if (testimonialElements[currentTestimonialIndex]) {
        testimonialElements[currentTestimonialIndex].classList.remove('active');
    }
    if (dots[currentTestimonialIndex]) {
        dots[currentTestimonialIndex].classList.remove('active');
    }
    
    // Set new index
    currentTestimonialIndex = index - 1;
    
    // Add active class to new testimonial
    if (testimonialElements[currentTestimonialIndex]) {
        testimonialElements[currentTestimonialIndex].classList.add('active');
    }
    if (dots[currentTestimonialIndex]) {
        dots[currentTestimonialIndex].classList.add('active');
    }
}

// Video background functionality
function setupVideoBackground() {
    const video = document.querySelector('.video-background video');
    const toggleButton = document.getElementById('videoToggle');
    
    if (!video || !toggleButton) return;
    
    let isPlaying = true;
    
    toggleButton.addEventListener('click', function() {
        if (isPlaying) {
            video.pause();
            toggleButton.textContent = '▶️';
            toggleButton.title = 'Reprendre la vidéo';
            isPlaying = false;
        } else {
            video.play();
            toggleButton.textContent = '⏸️';
            toggleButton.title = 'Mettre en pause la vidéo';
            isPlaying = true;
        }
    });
    
    // Handle video load errors gracefully
    video.addEventListener('error', function() {
        console.log('Vidéo de fond non disponible');
        toggleButton.style.display = 'none';
        // Fallback to original background
        document.querySelector('.video-background').style.display = 'none';
    });
    
    // Ensure video plays on user interaction if autoplay is blocked
    video.addEventListener('canplay', function() {
        if (video.paused) {
            video.play().catch(() => {
                console.log('Autoplay bloqué, cliquez sur le bouton pour démarrer');
                toggleButton.textContent = '▶️';
                toggleButton.title = 'Démarrer la vidéo';
                isPlaying = false;
            });
        }
    });
}

// Calendar and Availability System
let currentCalendarDate = new Date();
let selectedArrivalDate = null;
let selectedDepartureDate = null;
let availabilityData = {};
let accommodationData = {};

// Hébergements disponibles
const accommodationTypes = {
    tipi: {
        name: "Le Tipi",
        capacity: 4,
        description: "Hébergement authentique en pleine nature, idéal pour une expérience unique.",
        baseAvailability: true
    },
    caravane: {
        name: "La Caravane",
        capacity: 2,
        description: "Hébergement cosy et confortable avec tous les équipements nécessaires.",
        baseAvailability: true
    },
    dortoir: {
        name: "Le Dortoir du Chalet",
        capacity: 8,
        description: "Espace convivial et chaleureux parfait pour les groupes.",
        baseAvailability: true
    }
};

async function initializeAvailabilitySystem() {
    // Charger les disponibilités depuis Supabase
    await loadAvailabilityFromSupabase();
    // Écouter les changements du nombre de personnes
    const nombrePersonnesSelect = document.getElementById('nombrePersonnes');
    if (nombrePersonnesSelect) {
        nombrePersonnesSelect.addEventListener('change', updateAccommodationAvailability);
    }
}

async function loadAvailabilityFromSupabase() {
    // Initialiser toutes les dates des 6 prochains mois comme disponibles
    const today = new Date();
    for (let month = 0; month < 6; month++) {
        const currentMonth = new Date(today.getFullYear(), today.getMonth() + month, 1);
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            availabilityData[dateStr] = {
                available: true,
                accommodations: {
                    tipi: true,
                    caravane: true,
                    dortoir: true
                }
            };
        }
    }

    // Charger les réservations confirmées depuis Supabase
    if (typeof supabaseRest !== 'undefined') {
        try {
            const reservations = await supabaseRest.select('reservations', 'select=*&status=eq.confirmed');
            reservations.forEach(reservation => {
                if (!reservation.hebergement_type || !reservation.date_arrivee || !reservation.date_depart) return;

                const start = new Date(reservation.date_arrivee + 'T00:00:00');
                const end = new Date(reservation.date_depart + 'T00:00:00');
                const accType = reservation.hebergement_type;

                // Marquer l'hébergement comme indisponible pour chaque jour de la réservation
                const current = new Date(start);
                while (current < end) {
                    const dateStr = formatDateForAPI(current);
                    if (availabilityData[dateStr] && availabilityData[dateStr].accommodations[accType] !== undefined) {
                        availabilityData[dateStr].accommodations[accType] = false;

                        // Si tous les hébergements sont indisponibles, marquer la date comme indisponible
                        const accs = availabilityData[dateStr].accommodations;
                        availabilityData[dateStr].available = Object.values(accs).some(v => v);
                    }
                    current.setDate(current.getDate() + 1);
                }
            });
        } catch (e) {
            console.error('Erreur chargement disponibilités:', e.message);
            // En cas d'erreur, tout reste disponible par défaut
        }
    }
}

function initializeCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    renderCalendar();
    
    // Navigation du calendrier
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearDisplay = document.getElementById('currentMonthYear');
    
    if (!calendarGrid || !monthYearDisplay) return;
    
    // Effacer le calendrier précédent
    calendarGrid.innerHTML = '';
    
    // Afficher le mois et l'année
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    monthYearDisplay.textContent = `${months[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;
    
    // Jours de la semaine
    const dayHeaders = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    dayHeaders.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day day-header';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    });
    
    // Premier jour du mois et nombre de jours
    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const lastDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    // Jours du mois précédent
    const prevMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    for (let i = startingDay - 1; i >= 0; i--) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = daysInPrevMonth - i;
        calendarGrid.appendChild(dayElement);
    }
    
    // Jours du mois actuel
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        const currentDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
        const dateStr = formatDateForAPI(currentDate);
        
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        dayElement.dataset.date = dateStr;
        
        // Vérifier si c'est dans le passé
        if (currentDate < today) {
            dayElement.className += ' other-month';
        } else {
            // Vérifier la disponibilité
            const availability = availabilityData[dateStr];
            if (availability && availability.available) {
                dayElement.className += ' available';
                dayElement.addEventListener('click', () => selectDate(currentDate, dateStr));
            } else {
                dayElement.className += ' occupied';
            }
        }
        
        // Marquer les dates sélectionnées
        if (selectedArrivalDate && dateStr === formatDateForAPI(selectedArrivalDate)) {
            dayElement.className += ' selected';
        } else if (selectedDepartureDate && dateStr === formatDateForAPI(selectedDepartureDate)) {
            dayElement.className += ' selected';
        } else if (selectedArrivalDate && selectedDepartureDate) {
            if (currentDate > selectedArrivalDate && currentDate < selectedDepartureDate) {
                dayElement.className += ' selected-range';
            }
        }
        
        calendarGrid.appendChild(dayElement);
    }
    
    // Jours du mois suivant pour compléter la grille
    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells; // 6 semaines * 7 jours
    
    for (let day = 1; day <= remainingCells && day <= 14; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = day;
        calendarGrid.appendChild(dayElement);
    }
}

function selectDate(date, dateStr) {
    if (!selectedArrivalDate) {
        // Sélectionner la date d'arrivée
        selectedArrivalDate = new Date(date);
        updateSelectedDateDisplay('arrival', date);
        document.getElementById('dateArrivee').value = dateStr;
        // Sync with simple inputs
        syncSimpleInputsFromCalendar();
    } else if (!selectedDepartureDate) {
        // Sélectionner la date de départ
        if (date <= selectedArrivalDate) {
            // Si la nouvelle date est avant ou égale à l'arrivée, recommencer
            selectedArrivalDate = new Date(date);
            selectedDepartureDate = null;
            updateSelectedDateDisplay('arrival', date);
            updateSelectedDateDisplay('departure', null);
            document.getElementById('dateArrivee').value = dateStr;
            document.getElementById('dateDepart').value = '';
            syncSimpleInputsFromCalendar();
        } else {
            selectedDepartureDate = new Date(date);
            updateSelectedDateDisplay('departure', date);
            document.getElementById('dateDepart').value = dateStr;
            syncSimpleInputsFromCalendar();
            // Mettre à jour les hébergements disponibles
            updateAccommodationAvailability();
        }
    } else {
        // Recommencer la sélection
        selectedArrivalDate = new Date(date);
        selectedDepartureDate = null;
        updateSelectedDateDisplay('arrival', date);
        updateSelectedDateDisplay('departure', null);
        document.getElementById('dateArrivee').value = dateStr;
        document.getElementById('dateDepart').value = '';
        syncSimpleInputsFromCalendar();
        clearAccommodationSelection();
    }
    
    renderCalendar();
}

function syncSimpleInputsFromCalendar() {
    const dateArriveeSimple = document.getElementById('dateArriveeSimple');
    const dateDepartSimple = document.getElementById('dateDepartSimple');
    
    if (dateArriveeSimple && selectedArrivalDate) {
        dateArriveeSimple.value = formatDateForAPI(selectedArrivalDate);
    }
    
    if (dateDepartSimple && selectedDepartureDate) {
        dateDepartSimple.value = formatDateForAPI(selectedDepartureDate);
    }
}

function syncCalendarFromSimpleInputs() {
    const dateArriveeSimple = document.getElementById('dateArriveeSimple');
    const dateDepartSimple = document.getElementById('dateDepartSimple');
    
    if (dateArriveeSimple && dateArriveeSimple.value) {
        selectedArrivalDate = new Date(dateArriveeSimple.value + 'T00:00:00');
        updateSelectedDateDisplay('arrival', selectedArrivalDate);
    }
    
    if (dateDepartSimple && dateDepartSimple.value) {
        selectedDepartureDate = new Date(dateDepartSimple.value + 'T00:00:00');
        updateSelectedDateDisplay('departure', selectedDepartureDate);
    }
    
    // Re-render calendar to show selected dates
    renderCalendar();
}

function updateSelectedDateDisplay(type, date) {
    const element = document.getElementById(type === 'arrival' ? 'selectedArrival' : 'selectedDeparture');
    if (element) {
        if (date) {
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            element.textContent = date.toLocaleDateString('fr-FR', options);
            element.style.color = '#2c3e50';
            element.style.fontStyle = 'normal';
            element.style.fontWeight = 'bold';
        } else {
            element.textContent = 'Non sélectionnée';
            element.style.color = '#7f8c8d';
            element.style.fontStyle = 'italic';
            element.style.fontWeight = 'normal';
        }
    }
}

function formatDateForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function updateAccommodationAvailability() {
    const hebergementGrid = document.getElementById('hebergementGrid');
    const nombrePersonnes = document.getElementById('nombrePersonnes').value;
    
    if (!hebergementGrid || !selectedArrivalDate || !selectedDepartureDate || !nombrePersonnes) {
        return;
    }
    
    hebergementGrid.innerHTML = '';
    
    // Vérifier la disponibilité pour chaque hébergement sur la période sélectionnée
    Object.keys(accommodationTypes).forEach(accommodationId => {
        const accommodation = accommodationTypes[accommodationId];
        const isAvailable = checkAccommodationAvailability(accommodationId, selectedArrivalDate, selectedDepartureDate);
        const canAccommodateGuests = canAccommodateGuestCount(accommodation, nombrePersonnes);
        
        const card = createAccommodationCard(accommodationId, accommodation, isAvailable && canAccommodateGuests);
        hebergementGrid.appendChild(card);
    });
}

function checkAccommodationAvailability(accommodationId, startDate, endDate) {
    const currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
        const dateStr = formatDateForAPI(currentDate);
        const dayAvailability = availabilityData[dateStr];
        
        if (!dayAvailability || !dayAvailability.accommodations[accommodationId]) {
            return false;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return true;
}

function canAccommodateGuestCount(accommodation, guestCount) {
    if (guestCount === '6+') {
        return accommodation.capacity >= 6;
    }
    return accommodation.capacity >= parseInt(guestCount);
}

function createAccommodationCard(id, accommodation, isAvailable) {
    const card = document.createElement('div');
    card.className = `hebergement-card ${!isAvailable ? 'unavailable' : ''}`;
    card.dataset.accommodationId = id;
    
    card.innerHTML = `
        <div class="hebergement-header">
            <h4 class="hebergement-name">${accommodation.name}</h4>
            <span class="hebergement-capacity">${accommodation.capacity} pers. max</span>
        </div>
        <p class="hebergement-description">${accommodation.description}</p>
        <div class="hebergement-status ${isAvailable ? 'available' : 'unavailable'}">
            ${isAvailable ? 'Disponible' : 'Non disponible'}
        </div>
    `;
    
    if (isAvailable) {
        card.addEventListener('click', () => selectAccommodation(id, card));
    }
    
    return card;
}

function selectAccommodation(accommodationId, cardElement) {
    // Désélectionner les autres cartes
    document.querySelectorAll('.hebergement-card.selected').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Sélectionner cette carte
    cardElement.classList.add('selected');
    
    // Mettre à jour le champ caché pour le formulaire
    updateAccommodationFormField(accommodationId);
}

function updateAccommodationFormField(accommodationId) {
    // Supprimer les anciens inputs cachés d'hébergement
    document.querySelectorAll('input[name="hebergementType"]').forEach(input => input.remove());
    
    // Créer un nouveau champ caché
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'hebergementType';
    hiddenInput.value = accommodationId;
    
    document.getElementById('hebergementSection').appendChild(hiddenInput);
}

function clearAccommodationSelection() {
    const hebergementGrid = document.getElementById('hebergementGrid');
    if (hebergementGrid) {
        hebergementGrid.innerHTML = '';
    }

    // Supprimer les champs cachés d'hébergement
    document.querySelectorAll('input[name="hebergementType"]').forEach(input => input.remove());
}

// === PROGRAMME : Chargement dynamique ===

let programmeActivites = [];
let programmeEvenements = [];
let programmePratiques = [];

async function loadProgrammeData() {
    try {
        const [activites, evenements, pratiques] = await Promise.all([
            supabaseRest.select('programme_activites', 'select=*&status=eq.published&order=ordre.asc'),
            supabaseRest.select('programme_evenements', 'select=*&status=eq.published&order=date_debut.asc'),
            supabaseRest.select('programme_pratiques', 'select=*&status=eq.published&order=ordre.asc')
        ]);
        programmeActivites = activites || [];
        programmeEvenements = evenements || [];
        programmePratiques = pratiques || [];
    } catch (e) {
        console.error('Erreur chargement programme:', e.message);
    }
    renderActivites();
    renderEvenements();
    renderPratiques();
}

function renderActivites() {
    const grid = document.getElementById('activitesGrid');
    if (!grid) return;

    if (programmeActivites.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#888;">Aucune activité pour le moment.</p>';
        return;
    }

    grid.innerHTML = programmeActivites.map(a => `
        <div class="activite-item activite-clickable" onclick="openProgrammeDetail('activite', ${a.id})">
            <span class="activite-icon">${a.icone || ''}</span>
            <span>${a.titre}</span>
        </div>
    `).join('');
}

function renderEvenements() {
    const grid = document.getElementById('eventsGrid');
    if (!grid) return;

    // Filtrer pour ne garder que les événements futurs ou du jour
    const today = new Date().toISOString().split('T')[0];
    const futurs = programmeEvenements.filter(e => e.date_debut >= today);

    if (futurs.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#888;">Aucun événement à venir pour le moment.</p>';
        return;
    }

    grid.innerHTML = futurs.map(e => {
        const d = new Date(e.date_debut + 'T00:00:00');
        const mois = d.toLocaleDateString('fr-FR', { month: 'long' });
        const moisCap = mois.charAt(0).toUpperCase() + mois.slice(1);
        let jourLabel = d.getDate().toString();
        if (e.date_fin && e.date_fin !== e.date_debut) {
            const df = new Date(e.date_fin + 'T00:00:00');
            jourLabel = d.getDate() + '-' + df.getDate();
        }

        return `
        <div class="event-card event-clickable" onclick="openProgrammeDetail('evenement', ${e.id})">
            <div class="event-date">
                <span class="event-day">${jourLabel}</span>
                <span class="event-month">${moisCap}</span>
            </div>
            <div class="event-details">
                <h5>${e.titre}</h5>
                ${e.horaires ? `<p class="event-time">${e.horaires}</p>` : ''}
                ${e.intervenant ? `<p class="event-host">Avec <strong>${e.intervenant}</strong></p>` : ''}
                ${e.resume ? `<p class="event-desc">${e.resume}</p>` : ''}
                <a href="#reservation" class="event-reserve" onclick="event.stopPropagation()">Réserver</a>
            </div>
        </div>`;
    }).join('');
}

function openProgrammeDetail(type, id) {
    let item;
    if (type === 'activite') {
        item = programmeActivites.find(a => a.id === id);
    } else if (type === 'pratique') {
        item = programmePratiques.find(p => p.id === id);
    } else {
        item = programmeEvenements.find(e => e.id === id);
    }
    if (!item) return;

    const modal = document.getElementById('programmeModal');
    const body = document.getElementById('programmeModalBody');

    let html = '';
    if (type === 'activite') {
        html = `
            <div class="programme-detail">
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.titre}" class="programme-detail-img">` : ''}
                <h3>${item.icone || ''} ${item.titre}</h3>
                <div class="programme-detail-text">${item.description || ''}</div>
            </div>`;
    } else if (type === 'pratique') {
        let mediaHtml = '';
        if (item.video_url) {
            mediaHtml = `<video autoplay muted loop playsinline style="width:100%;border-radius:12px;margin-bottom:20px;max-height:350px;object-fit:cover;"><source src="${item.video_url}" type="video/webm"></video>`;
        } else if (item.image_url) {
            mediaHtml = `<img src="${item.image_url}" alt="${item.titre}" class="programme-detail-img">`;
        }
        html = `
            <div class="programme-detail">
                ${mediaHtml}
                <h3>${item.titre}</h3>
                <div class="programme-detail-text">${item.description || ''}</div>
            </div>`;
    } else {
        const d = new Date(item.date_debut + 'T00:00:00');
        let dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        if (item.date_fin && item.date_fin !== item.date_debut) {
            const df = new Date(item.date_fin + 'T00:00:00');
            dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric' }) + ' - ' + df.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }
        html = `
            <div class="programme-detail">
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.titre}" class="programme-detail-img">` : ''}
                <h3>${item.titre}</h3>
                <p class="programme-detail-date">${dateStr}</p>
                ${item.horaires ? `<p class="programme-detail-time">${item.horaires}</p>` : ''}
                ${item.intervenant ? `<p class="programme-detail-host">Avec <strong>${item.intervenant}</strong></p>` : ''}
                <div class="programme-detail-text">${item.description || ''}</div>
                <a href="#reservation" class="event-reserve" onclick="closeProgrammeModal()" style="display:inline-block;margin-top:20px;">Réserver</a>
            </div>`;
    }

    body.innerHTML = html;
    modal.style.display = 'flex';
    modal.onclick = function(ev) { if (ev.target === modal) closeProgrammeModal(); };
}

function closeProgrammeModal() {
    document.getElementById('programmeModal').style.display = 'none';
}

function renderPratiques() {
    const grid = document.getElementById('pratiquesGrid');
    if (!grid) return;

    if (programmePratiques.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#888;">Aucun lieu de pratique pour le moment.</p>';
        return;
    }

    grid.innerHTML = programmePratiques.map(p => {
        let mediaHtml = '';
        if (p.video_url) {
            mediaHtml = `<video autoplay muted loop playsinline><source src="${p.video_url}" type="video/webm"></video>`;
        } else if (p.image_url) {
            mediaHtml = `<img src="${p.image_url}" alt="${p.titre}" loading="lazy">`;
        }
        return `
        <div class="pratique-card" onclick="openProgrammeDetail('pratique', ${p.id})">
            <div class="pratique-media">${mediaHtml}</div>
            <div class="pratique-content">
                <h5>${p.titre}</h5>
                <p>${p.resume || ''}</p>
            </div>
        </div>`;
    }).join('');
}