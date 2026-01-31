# Site Web - Le Centre de Remise en Joie

Un site web complet pour présenter et gérer un centre de bien-être situé au cœur du Parc naturel régional des volcans d'Auvergne.

## Fonctionnalités

### Page d'accueil (index.html)
- Présentation du centre avec texte d'accueil
- Slideshow automatique avec photos du centre et du paysage
- Système de réservation intégré
- Affichage des 4 dernières actualités
- Section contact avec formulaire

### Page actualités (actualites.html)
- Liste complète des actualités avec pagination
- Articles détaillés avec dates et images
- Lien vers la page Facebook du centre
- Navigation fluide

### Interface d'administration (admin.html)
- Authentification sécurisée
- Gestion des actualités (création, modification, suppression)
- Gestion des réservations (consultation, confirmation, annulation)
- Gestion des messages de contact
- Paramètres du site
- Sauvegarde/restauration des données

## Sécurité

### Authentification
- Identifiants par défaut : `admin` / `CentreRemiseJoie2024!`
- Session automatique de 8 heures
- Déconnexion automatique en cas d'inactivité
- Stockage sécurisé des données d'authentification

### Protection des données
- Validation côté client pour tous les formulaires
- Nettoyage automatique des données sensibles
- Sauvegarde et restauration sécurisées

## Technologies utilisées
- HTML5 semantic
- CSS3 avec responsive design
- JavaScript vanilla (ES6+)
- LocalStorage pour la persistance des données
- Design mobile-first

## Installation

1. Téléchargez tous les fichiers dans un dossier
2. Créez un dossier `images/` et ajoutez vos photos :
   - centre1.jpg, centre2.jpg (photos du centre)
   - paysage1.jpg, paysage2.jpg (paysages des volcans)
   - meditation.jpg, yoga.jpg, centre-ouvert.jpg, randonnee.jpg (actualités)
   - placeholder.jpg (image par défaut)

3. Ouvrez `index.html` dans un navigateur web

## Administration

1. Accédez à `admin.html`
2. Connectez-vous avec :
   - Utilisateur : `admin`
   - Mot de passe : `CentreRemiseJoie2024!`
3. Gérez votre contenu via l'interface intuitive

## Personnalisation

### Couleurs
La couleur principale (vert foncé #2c5530) peut être modifiée dans `styles.css` et `admin-styles.css`.

### Contenu
- Modifiez les textes directement dans les fichiers HTML
- Ajoutez vos images dans le dossier `images/`
- Personnalisez les informations de contact

### Fonctionnalités
- Le code JavaScript est modulaire et facilement extensible
- Ajoutez de nouvelles sections en suivant les patterns existants

## Structure des fichiers

```
├── index.html              # Page d'accueil
├── actualites.html         # Page des actualités
├── admin.html             # Interface d'administration
├── styles.css             # Styles de la page publique
├── admin-styles.css       # Styles de l'administration
├── script.js              # JavaScript de la page publique
├── admin-script.js        # JavaScript de l'administration
├── description.txt        # Description du projet
├── README.md              # Documentation
└── images/                # Dossier des images
    ├── centre1.jpg
    ├── centre2.jpg
    ├── paysage1.jpg
    ├── paysage2.jpg
    ├── meditation.jpg
    ├── yoga.jpg
    ├── centre-ouvert.jpg
    ├── randonnee.jpg
    └── placeholder.jpg
```

## Support

Pour toute question ou problème, référez-vous à cette documentation ou modifiez le code selon vos besoins spécifiques.

## Mise en production

Pour déployer le site en production :
1. Changez le mot de passe administrateur dans `admin-script.js`
2. Ajoutez un certificat SSL (HTTPS)
3. Configurez un backend pour la persistance des données (optionnel)
4. Ajoutez vos vraies images dans le dossier `images/`