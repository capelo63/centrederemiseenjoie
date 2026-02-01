// Configuration Supabase
const SUPABASE_URL = 'https://tgbwvmggamojfdlqewzb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BOjy0pg5JS9pZCGImTCyQw_0jxUWdfJ';

// Helper pour les appels REST Supabase
const supabaseRest = {
    headers(accessToken) {
        const h = {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + (accessToken || SUPABASE_ANON_KEY)
        };
        return h;
    },

    // Lire des données (GET)
    async select(table, params = '', accessToken = null) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
            headers: this.headers(accessToken)
        });
        if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        return res.json();
    },

    // Insérer des données (POST)
    async insert(table, data, accessToken) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: { ...this.headers(accessToken), 'Prefer': 'return=representation' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || `Erreur ${res.status}`);
        }
        return res.json();
    },

    // Mettre à jour (PATCH)
    async update(table, data, filter, accessToken) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
            method: 'PATCH',
            headers: { ...this.headers(accessToken), 'Prefer': 'return=representation' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || `Erreur ${res.status}`);
        }
        return res.json();
    },

    // Supprimer (DELETE)
    async remove(table, filter, accessToken) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
            method: 'DELETE',
            headers: this.headers(accessToken)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || `Erreur ${res.status}`);
        }
        return true;
    },

    // Authentification
    async signIn(email, password) {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error_description || err.msg || 'Identifiants incorrects');
        }
        return res.json();
    }
};
