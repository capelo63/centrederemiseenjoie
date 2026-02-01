// Slideshow functionality
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');

function showSlide(index) {
    // Force layout to prevent flickering in Firefox
    document.body.offsetHeight;
    
    slides.forEach((slide, i) => {
        if (i === index) {
            slide.style.display = 'block';
            // Force reflow before adding opacity
            slide.offsetHeight;
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
            // Hide after transition
            setTimeout(() => {
                if (!slide.classList.contains('active')) {
                    slide.style.display = 'none';
                }
            }, 500);
        }
    });
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
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

// Sample news data (will be replaced with dynamic data from admin)
const sampleNews = [
    {
        id: 1,
        titre: "Nouveau programme de méditation",
        date: "2024-01-15",
        resume: "Découvrez notre nouveau programme de méditation en pleine conscience, adapté à tous les niveaux. Ce programme s'adresse aux débutants comme aux pratiquants expérimentés.",
        image: "images/boudha.jpg"
    },
    {
        id: 2,
        titre: "Ateliers yoga printaniers",
        date: "2024-01-10",
        resume: "Rejoignez-nous pour nos ateliers de yoga spécialement conçus pour accueillir le printemps. Sessions douces et énergisantes dans un cadre naturel exceptionnel.",
        image: "images/terraseboudha.jpg"
    },
    {
        id: 3,
        titre: "Journée portes ouvertes",
        date: "2024-01-05",
        resume: "Venez découvrir notre centre lors de notre journée portes ouvertes le premier samedi du mois. Visitez nos installations et rencontrez notre équipe.",
        image: "images/chalet01.jpg"
    },
    {
        id: 4,
        titre: "Randonnée bien-être dans les Puys",
        date: "2024-01-01",
        resume: "Participez à nos randonnées bien-être dans le magnifique parc des volcans d'Auvergne. Marche consciente et moments de méditation en pleine nature.",
        image: "images/puys01.jpg"
    },
    {
        id: 5,
        titre: "Hébergements uniques en pleine nature",
        date: "2023-12-20",
        resume: "Découvrez nos hébergements atypiques : tipi authentique, caravane cosy et dortoir chaleureux. Chaque option offre une expérience unique de reconnexion à la nature.",
        image: "images/tipi01.jpg"
    },
    {
        id: 6,
        titre: "Les fleurs du printemps au centre",
        date: "2023-12-15",
        resume: "Le printemps transforme notre jardin en véritable écrin de couleurs. Venez profiter de cette explosion florale pour vos séances de méditation et de yoga.",
        image: "images/fleurs01.jpg"
    }
];

// Load news on page load
document.addEventListener('DOMContentLoaded', function() {
    loadNews();
    setupFormHandlers();
    createPlaceholderImages();
    setupVideoBackground();
    setupMobileMenu();
    setupTestimonials();
    initializeCalendar();
    initializeAvailabilitySystem();
});

async function loadNews() {
    const container = document.getElementById('actualitesContainer');
    container.innerHTML = '<div class="loading-message">Chargement des actualités...</div>';

    try {
        let newsToDisplay = sampleNews;

        // Charger les actualités depuis Supabase
        if (typeof supabase !== 'undefined') {
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .eq('status', 'published')
                .order('date', { ascending: false });

            if (!error && data && data.length > 0) {
                newsToDisplay = data;
            } else if (error) {
                console.error('Erreur Supabase:', error.message);
            }
        }

        container.innerHTML = '';

        newsToDisplay.forEach(item => {
            const card = createNewsCard(item);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des actualités:', error);
        container.innerHTML = '<div class="error-message">Erreur lors du chargement des actualités. Veuillez réessayer.</div>';
    }
}

// Configuration Facebook
let facebookConfig = {
    pageId: '', // À configurer dans l'admin
    accessToken: '', // À configurer dans l'admin
    enabled: false // Par défaut désactivé si pas de page Facebook
};

// Charger la configuration Facebook depuis le localStorage
function loadFacebookConfig() {
    const savedConfig = localStorage.getItem('facebookConfig');
    if (savedConfig) {
        facebookConfig = { ...facebookConfig, ...JSON.parse(savedConfig) };
    }
}

// Sauvegarder la configuration Facebook
function saveFacebookConfig(config) {
    facebookConfig = { ...facebookConfig, ...config };
    localStorage.setItem('facebookConfig', JSON.stringify(facebookConfig));
}

async function fetchFacebookPosts() {
    // Charger la configuration
    loadFacebookConfig();
    
    // Si Facebook n'est pas configuré ou désactivé, retourner des données d'exemple
    if (!facebookConfig.enabled || !facebookConfig.accessToken || !facebookConfig.pageId) {
        console.log('Facebook integration disabled or not configured');
        return getSampleFacebookPosts();
    }
    
    try {
        // Construire l'URL de l'API Facebook Graph
        const fields = 'id,message,created_time,full_picture,attachments{media,url},reactions.summary(total_count),shares,permalink_url';
        const url = `https://graph.facebook.com/v18.0/${facebookConfig.pageId}/posts?fields=${fields}&access_token=${facebookConfig.accessToken}&limit=10`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Facebook API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Transformer les données Facebook en format de notre site
        return data.data.map(post => {
            const postDate = new Date(post.created_time);
            const message = post.message || '';
            
            // Extraire un titre du message (premiers mots jusqu'au premier point ou 50 caractères)
            let titre = message.split('.')[0].substring(0, 50);
            if (titre.length < message.length && !titre.endsWith('.')) {
                titre += '...';
            }
            if (!titre) {
                titre = 'Nouvelle publication Facebook';
            }
            
            // Résumé (message complet ou tronqué)
            let resume = message.length > 200 ? message.substring(0, 200) + '...' : message;
            if (!resume) {
                resume = 'Découvrez notre dernière publication Facebook.';
            }
            
            // Image (essayer différentes sources)
            let image = null;
            if (post.full_picture) {
                image = post.full_picture;
            } else if (post.attachments && post.attachments.data.length > 0) {
                const attachment = post.attachments.data[0];
                if (attachment.media && attachment.media.image) {
                    image = attachment.media.image.src;
                }
            }
            
            return {
                id: post.id,
                type: 'facebook',
                titre: titre,
                date: postDate.toISOString().split('T')[0],
                resume: resume,
                image: image || 'images/logo-facebook.png', // Image par défaut
                author: "Centre de Remise en Joie",
                likes: post.reactions ? post.reactions.summary.total_count : 0,
                shares: post.shares ? post.shares.count : 0,
                url: post.permalink_url
            };
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération des posts Facebook:', error);
        // En cas d'erreur, retourner des données d'exemple
        return getSampleFacebookPosts();
    }
}

function getSampleFacebookPosts() {
    return [
        {
            id: 'fb_sample_1',
            type: 'facebook',
            titre: "Magnifique coucher de soleil depuis le centre",
            date: "2024-01-18",
            resume: "Ce soir, nous avons eu la chance d'assister à un coucher de soleil absolument magique depuis notre centre. Ces moments de pure beauté nous rappellent pourquoi nous avons choisi cet endroit exceptionnel... 🌅✨",
            image: "images/soleilcouchant.jpg",
            author: "Centre de Remise en Joie",
            likes: 45,
            shares: 12
        },
        {
            id: 'fb_sample_2', 
            type: 'facebook',
            titre: "Notre magnifique yourte pour les retraites",
            date: "2024-01-12",
            resume: "Découvrez notre yourte, un espace unique dédié aux retraites et séminaires. Cet hébergement traditionnel offre une expérience authentique de reconnexion avec la nature 🏕️💚",
            image: "images/yourte02.jpg",
            author: "Centre de Remise en Joie",
            likes: 38,
            shares: 8
        },
        {
            id: 'fb_sample_3',
            type: 'facebook', 
            titre: "L'hiver au centre sous la neige",
            date: "2024-01-08",
            resume: "L'hiver transforme notre centre en véritable carte postale ! Le manteau blanc offre un spectacle à couper le souffle et une atmosphère parfaite pour des moments de méditation hivernale... ❄️🏔️",
            image: "images/neige.jpg",
            author: "Centre de Remise en Joie",
            likes: 67,
            shares: 23
        }
    ];
}

async function getCombinedContent() {
    try {
        // Récupérer les posts Facebook (vraies données ou données d'exemple)
        const facebookPosts = await fetchFacebookPosts();
        
        // Combiner les actualités locales et Facebook
        const allContent = [...sampleNews, ...facebookPosts];
        allContent.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Prendre les 6 éléments les plus récents
        return allContent.slice(0, 6);
    } catch (error) {
        console.error('Erreur lors de la récupération du contenu combiné:', error);
        // En cas d'erreur, utiliser seulement les actualités locales
        return sampleNews.slice(0, 6);
    }
}

function createNewsCard(actualite) {
    const card = document.createElement('div');
    card.className = 'actualite-card';
    
    const date = new Date(actualite.date);
    const formattedDate = date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Create simple image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    
    const img = document.createElement('img');
    img.alt = '';
    img.title = '';
    img.src = actualite.image;
    img.onerror = function() { 
        this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTllY2VmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
    };
    
    imageContainer.appendChild(img);
    
    const content = document.createElement('div');
    content.className = 'actualite-content';
    content.innerHTML = `
        <div class="actualite-date">${formattedDate}</div>
        <h4 class="actualite-titre">${actualite.titre}</h4>
        <p class="actualite-resume">${actualite.resume}</p>
    `;
    
    card.appendChild(imageContainer);
    card.appendChild(content);
    
    return card;
}

function createFacebookCard(post) {
    const card = document.createElement('div');
    card.className = 'actualite-card facebook-post';
    
    const date = new Date(post.date);
    const formattedDate = date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    
    const img = document.createElement('img');
    img.alt = '';
    img.title = '';
    img.src = post.image;
    img.onerror = function() { 
        this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTg3N2YyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5GYWNlYm9vazwvdGV4dD48L3N2Zz4=';
    };
    
    imageContainer.appendChild(img);
    
    // Facebook badge
    const facebookBadge = document.createElement('div');
    facebookBadge.className = 'facebook-badge';
    facebookBadge.innerHTML = '📘 Facebook';
    imageContainer.appendChild(facebookBadge);
    
    const content = document.createElement('div');
    content.className = 'actualite-content';
    content.innerHTML = `
        <div class="facebook-header">
            <div class="facebook-author">${post.author}</div>
            <div class="actualite-date">${formattedDate}</div>
        </div>
        <h4 class="actualite-titre">${post.titre}</h4>
        <p class="actualite-resume">${post.resume}</p>
        <div class="facebook-stats">
            <span class="facebook-likes">👍 ${post.likes}</span>
            <span class="facebook-shares">🔄 ${post.shares}</span>
        </div>
    `;
    
    card.appendChild(imageContainer);
    card.appendChild(content);
    
    return card;
}

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

function handleReservation() {
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
    
    // Here you would normally send the data to a server
    console.log('Réservation soumise:', data);
    
    // Show confirmation message based on type
    let confirmationMessage = 'Votre demande de réservation a été envoyée avec succès ! ';
    switch(typeReservation) {
        case 'activites':
            confirmationMessage += 'Nous vous contacterons pour confirmer vos activités.';
            break;
        case 'hebergement':
            confirmationMessage += 'Nous vous contacterons pour confirmer votre hébergement.';
            break;
        case 'hebergement_activites':
            confirmationMessage += 'Nous vous contacterons pour confirmer votre hébergement et vos activités.';
            break;
        case 'entreprise':
            confirmationMessage += 'Nous vous contacterons rapidement pour organiser vos animations d\'entreprise.';
            break;
    }
    
    alert(confirmationMessage);
    
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

function handleContact() {
    const formData = new FormData(document.getElementById('contactForm'));
    const data = Object.fromEntries(formData.entries());
    
    // Here you would normally send the data to a server
    console.log('Message de contact soumis:', data);
    
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
const testimonialsData = [
    {
        text: "La méditation active proposée et enseignée par Nelly est pour moi un vrai voyage intérieur. Nelly est un bon guide, douce, très à l'écoute, elle sait poser les bonnes questions pour nous aider à débloquer certains de nos fonctionnements qui nous créent des tensions. Elle sait nous mettre à l'aise. Le fait d'être en groupe et de pouvoir parler de nos difficultés sans gêne et sans jugement est déculpabilisant. On se sent moins seule. Au fil du temps, on devient observateur de nos pensées, on se sent plus légère, libérée et avec un regain d'énergie. Merci !",
        author: "Anne-Marie",
        role: "Participante aux ateliers de méditation"
    }
    // Vous pouvez ajouter plus de témoignages ici
];

function setupTestimonials() {
    // Pour l'instant, avec un seul témoignage, masquer la navigation
    const nav = document.querySelector('.testimonials-nav');
    if (testimonialsData.length <= 1 && nav) {
        nav.style.display = 'none';
    }
}

function changeTestimonial(direction) {
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
    
    // Calculate new index
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

function initializeAvailabilitySystem() {
    // Générer des données de disponibilité d'exemple
    generateSampleAvailabilityData();
    // Écouter les changements du nombre de personnes
    const nombrePersonnesSelect = document.getElementById('nombrePersonnes');
    if (nombrePersonnesSelect) {
        nombrePersonnesSelect.addEventListener('change', updateAccommodationAvailability);
    }
}

function generateSampleAvailabilityData() {
    // Générer des données pour les 6 prochains mois
    const today = new Date();
    for (let month = 0; month < 6; month++) {
        const currentMonth = new Date(today.getFullYear(), today.getMonth() + month, 1);
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Simuler des périodes occupées (environ 30% du temps)
            const isOccupied = Math.random() < 0.3;
            
            availabilityData[dateStr] = {
                available: !isOccupied,
                accommodations: {
                    tipi: !isOccupied || Math.random() < 0.7,
                    caravane: !isOccupied || Math.random() < 0.8,
                    dortoir: !isOccupied || Math.random() < 0.9
                }
            };
            
            // S'assurer qu'au moins un hébergement est disponible si la date est marquée comme disponible
            if (!isOccupied) {
                const accommodations = availabilityData[dateStr].accommodations;
                const hasAvailable = Object.values(accommodations).some(available => available);
                if (!hasAvailable) {
                    // Rendre au moins un hébergement disponible
                    const randomAccommodation = Object.keys(accommodations)[Math.floor(Math.random() * 3)];
                    accommodations[randomAccommodation] = true;
                }
            }
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