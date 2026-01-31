# 📘 Guide d'Intégration Facebook - Centre de Remise en Joie

## 🎯 Objectif
Ce guide vous explique comment connecter votre page Facebook au site web pour afficher automatiquement vos posts Facebook mélangés avec les actualités locales.

## 📋 Prérequis

### 1. Page Facebook Business
- Vous devez avoir une **page Facebook Business** (pas un profil personnel)
- Vous devez être **administrateur** de cette page

### 2. Compte Facebook Developers
- Créer un compte sur [developers.facebook.com](https://developers.facebook.com)
- Créer une nouvelle application

## 🔧 Configuration Étape par Étape

### Étape 1 : Créer une Application Facebook

1. Allez sur [developers.facebook.com](https://developers.facebook.com)
2. Cliquez sur "Mes Apps" > "Créer une App"
3. Choisissez "Consumer" ou "Business" selon votre cas
4. Donnez un nom à votre app (ex: "Centre Remise en Joie Website")
5. Ajoutez votre email de contact

### Étape 2 : Configurer l'App

1. Dans le tableau de bord de votre app, ajoutez le produit **"Facebook Login"**
2. Dans les paramètres de Facebook Login :
   - Ajoutez votre domaine dans "Valid OAuth Redirect URIs"
   - Ex: `https://votre-domaine.com/admin.html`

### Étape 3 : Obtenir l'ID de Votre Page

**Méthode 1 - Via l'URL de votre page :**
- Si votre page est `facebook.com/chaletananda`, l'ID personnalisé est `chaletananda`
- Pour l'ID numérique, allez dans les paramètres de votre page Facebook

**Méthode 2 - Via Facebook :**
1. Allez sur votre page Facebook
2. Cliquez sur "Paramètres de la page"
3. Dans l'onglet "Général", vous trouverez l'ID de la page

### Étape 4 : Générer un Token d'Accès

1. Dans votre app Facebook Developers, allez dans "Outils" > "Explorateur d'API Graph"
2. Sélectionnez votre application
3. Cliquez sur "Générer un token d'accès"
4. Sélectionnez votre page
5. Accordez les permissions :
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_read_user_content`
6. **Important**: Générez un token **permanent** :
   - Copiez le token temporaire
   - Utilisez l'outil "Débogueur de token d'accès"
   - Étendez le token pour qu'il ne expire jamais

### Étape 5 : Configuration dans l'Admin du Site

1. Connectez-vous à l'administration : `votre-site.com/admin.html`
2. Allez dans "Paramètres"
3. Dans la section "Intégration Facebook" :
   - **Intégration Facebook** : Sélectionnez "Activée"
   - **ID de votre page Facebook** : Collez l'ID de votre page
   - **Token d'accès Facebook** : Collez votre token permanent
4. Cliquez sur "🔍 Tester la connexion Facebook"
5. Si le test réussit, cliquez sur "Enregistrer les paramètres"

## ✅ Vérification

### Test de Connexion
- Le bouton "Tester la connexion" doit afficher : "Connexion réussie ! Page trouvée : [Nom de votre page]"
- Les actualités de votre site doivent maintenant inclure vos posts Facebook récents

### Actualisation Manuelle
- Utilisez le bouton "🔄 Actualiser les posts Facebook" pour forcer le rechargement

## 🔍 Dépannage

### Erreur "Token invalide"
- Vérifiez que le token est bien permanent
- Régénérez un nouveau token si nécessaire
- Vérifiez les permissions accordées

### Erreur "Page introuvable"
- Vérifiez l'ID de la page (numérique, pas le nom personnalisé)
- Assurez-vous que votre page est publique

### Aucun post n'apparaît
- Vérifiez que votre page a des posts récents (moins de 30 jours)
- Les posts doivent être publics
- Certains types de posts peuvent être filtrés par Facebook

### CORS / Problèmes de Domaine
- L'intégration fonctionne côté client, votre site doit être en HTTPS
- Ajoutez votre domaine dans les paramètres de l'app Facebook

## 📊 Fonctionnement

### Affichage des Posts
- Les posts Facebook sont mélangés avec les actualités locales
- Tri par date (plus récents en premier)
- Maximum 6 actualités affichées sur la page d'accueil
- Badge "📘 Facebook" pour identifier les posts Facebook

### Données Récupérées
- Texte du post (titre et résumé automatiques)
- Image du post
- Date de publication
- Nombre de réactions (likes)
- Nombre de partages
- Lien vers le post original

## 🔐 Sécurité

- Les tokens sont stockés localement dans le navigateur
- Jamais exposés côté serveur
- Accès en lecture seule à votre page
- Possibilité de désactiver l'intégration à tout moment

## 💡 Conseils

1. **Posts avec Images** : Les posts avec images s'affichent mieux
2. **Longueur des Textes** : Les messages longs sont automatiquement tronqués
3. **Fréquence** : Les posts sont rafraîchis à chaque visite de la page
4. **Backup** : Gardez toujours des actualités locales en cas de problème Facebook

---

## 📞 Support

Si vous rencontrez des difficultés :
1. Vérifiez d'abord les messages d'erreur dans la console du navigateur (F12)
2. Testez la connexion Facebook dans l'admin
3. Vérifiez que tous les champs sont correctement remplis

L'intégration Facebook enrichira automatiquement votre site avec vos dernières actualités ! ✨