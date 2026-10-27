const icons = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="8" height="7" rx="1.5"/></svg>',
  fields: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 20 20 4M6 4h14v14M4 10l10 10"/></svg>',
  plans: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18m-13 5 2 2 5-5"/></svg>',
  growth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21V11m0 5c-5 0-8-3-8-8 5 0 8 3 8 8Zm0-3c0-5 3-8 8-8 0 5-3 8-8 8Z"/><path d="M5 21h14"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.4-3.6 2.5-5.5 6.5-5.5s6.1 1.9 6.5 5.5M16 4.8a3.4 3.4 0 0 1 0 6.4m2 3.5c2.1.5 3.3 2.2 3.5 5.3"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 4C10 4 4 7 4 14a6 6 0 0 0 6 6c7 0 10-6 10-16Z"/><path d="M4 20c3-5 7-8 12-11"/></svg>',
  water: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12Z"/><path d="M9 16a3 3 0 0 0 3 3"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 4v3"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></svg>',
  tractor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 16h10l2 3h6v-6h-4l-2-4h-5v7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M10 9h4M7 12V7h5"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
};

const pages = {
  dashboard: { label: 'Overblik', icon: 'dashboard' },
  fields: { label: 'Marker', icon: 'fields' },
  plans: { label: 'Gødningsplan', icon: 'plans' },
  growth: { label: 'Vækst & tilsyn', icon: 'growth' },
  machinery: { label: 'Maskinpakke', icon: 'tractor' },
  users: { label: 'Medarbejdere', icon: 'users', directorOnly: true },
};

const state = { user: null, page: 'dashboard', fields: [], plans: [], observations: [], users: [], search: '', filter: 'Alle' };
const app = document.querySelector('#app');
const cloudConfig = window.MARKSTYRING_SUPABASE || {};
const cloudEnabled = Boolean(cloudConfig.url && cloudConfig.anonKey && window.supabase?.createClient);
const supabaseClient = cloudEnabled
  ? window.supabase.createClient(cloudConfig.url, cloudConfig.anonKey)
  : null;
const today = new Date();
const dateISO = (d = today) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const initials = name => name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
const fmtDate = value => value ? new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : '–';
const fmtNumber = value => new Intl.NumberFormat('da-DK', { maximumFractionDigits: 1 }).format(Number(value) || 0);
const todayText = new Intl.DateTimeFormat('da-DK', { weekday: 'long', day: 'numeric', month: 'long' }).format(today);

async function api(path, options = {}) {
  if (cloudEnabled) {
    try {
      return await cloudApi(path, options);
    } catch (error) {
      if (state.user && /du skal logge ind|konto er ikke aktiveret/i.test(error.message)) {
        await supabaseClient.auth.signOut();
        state.user = null;
        document.querySelector('.modal-backdrop')?.remove();
        renderLogin(false);
      }
      throw error;
    }
  }
  if (window.location.hostname.endsWith('.github.io')) {
    throw new Error('GitHub Pages mangler forbindelsen til den gratis database. Kontrollér SUPABASE_URL og SUPABASE_ANON_KEY i GitHub Actions secrets, og kør workflowet igen.');
  }
  const headers = { ...(options.body ? { 'Content-Type': 'application/json', 'X-Requested-With': 'EgebjerggaardApp' } : {}), ...options.headers };
  let response;
  try {
    response = await fetch(path, { ...options, headers, credentials: 'same-origin' });
  } catch {
    throw new Error('Kan ikke få forbindelse til markstyringens server. Kontrollér, at serveren er startet, og prøv igen.');
  }
  let body = {};
  if (response.status !== 204) {
    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();
    if (!contentType.toLowerCase().includes('application/json')) {
      if (window.location.hostname.endsWith('.github.io')) {
        throw new Error('GitHub Pages kan ikke køre appens database og Python-server. Kontrollér GitHub Actions secrets til Supabase.');
      }
      throw new Error(`Serveren returnerede ikke et API-svar (HTTP ${response.status}). Kontrollér, at appens server er startet korrekt.`);
    }
    try {
      body = JSON.parse(responseText);
    } catch {
      throw new Error(`Serveren sendte et ugyldigt API-svar (HTTP ${response.status}). Prøv igen, eller kontrollér serverloggen.`);
    }
  }
  if (!response.ok) {
    if (response.status === 401 && state.user) {
      state.user = null;
      document.querySelector('.modal-backdrop')?.remove();
      renderLogin(false);
    }
    throw new Error(body.error || `Noget gik galt (${response.status}).`);
  }
  return body;
}

function cloudError(error) {
  const message = error?.message || 'Ukendt databasefejl.';
  if (/email not confirmed/i.test(message)) {
    return new Error('E-mailbekræftelse er slået til i Supabase. Slå Email confirmations fra under Authentication → Providers → Email, og prøv igen.');
  }
  if (/invalid login credentials/i.test(message)) {
    return new Error('E-mail eller adgangskode er forkert.');
  }
  if (/user already registered/i.test(message)) {
    return new Error('E-mailadressen er allerede i brug.');
  }
  if (/profiles_username_lower_unique|duplicate key/i.test(message)) {
    return new Error('Brugernavnet findes allerede, eller medarbejderprofilen kunne ikke oprettes.');
  }
  return new Error(message);
}

async function cloudResult(result) {
  if (result.error) throw cloudError(result.error);
  return result.data;
}

async function getCloudProfile(userId) {
  const profile = await cloudResult(
    await supabaseClient.from('profiles')
      .select('id, email, username, display_name, role, active, created_at')
      .eq('id', userId)
      .maybeSingle(),
  );
  if (!profile) throw new Error('Brugerprofilen blev ikke fundet. Kontakt direktøren.');
  if (!profile.active) throw new Error('Din konto er ikke aktiveret. Bed direktøren om at aktivere den.');
  return profile;
}

async function cloudSignup(email, password, metadata) {
  let response;
  try {
    response = await fetch(`${cloudConfig.url.replace(/\/+$/, '')}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cloudConfig.anonKey },
      body: JSON.stringify({ email, password, data: metadata }),
    });
  } catch {
    throw new Error('Forbindelsen til den gratis database kunne ikke oprettes. Kontrollér Supabase-konfigurationen.');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw cloudError(result);
  if (!result.user?.id) throw new Error('Supabase oprettede ikke en brugerkonto. Kontrollér e-mailbekræftelse og Supabase-loggen.');
  return result.user;
}

async function cloudApi(path, options = {}) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : {};
  const resource = path.split('/').pop();

  if (path === '/api/setup/status') {
    return { setupRequired: await cloudResult(await supabaseClient.rpc('setup_required')) };
  }

  if (path === '/api/setup' && method === 'POST') {
    const { data, error } = await supabaseClient.auth.signUp({
      email: body.email,
      password: body.password,
      options: { data: { username: body.username, display_name: body.display_name } },
    });
    if (error) throw cloudError(error);
    if (!data.session) {
      throw new Error('Supabase kræver e-mailbekræftelse. Slå Email confirmations fra under Authentication → Providers → Email, og opret direktørkontoen igen med en anden e-mail.');
    }
    const { error: claimError } = await supabaseClient.rpc('claim_initial_director');
    if (claimError) {
      await supabaseClient.auth.signOut();
      throw cloudError(claimError);
    }
    return { user: await getCloudProfile(data.user.id) };
  }

  if (path === '/api/login' && method === 'POST') {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error) throw cloudError(error);
    try {
      return { user: await getCloudProfile(data.user.id) };
    } catch (error) {
      await supabaseClient.auth.signOut();
      throw error;
    }
  }

  if (state.user && path !== '/api/setup' && path !== '/api/login') {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error || !data.user) throw new Error('Du skal logge ind for at fortsætte.');
    state.user = await getCloudProfile(data.user.id);
  }

  if (path === '/api/logout' && method === 'POST') {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw cloudError(error);
    return { ok: true };
  }

  if (path === '/api/me') {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error || !data.user) throw new Error('Du skal logge ind for at fortsætte.');
    return { user: await getCloudProfile(data.user.id) };
  }

  if (path === '/api/change-password' && method === 'POST') {
    const { data, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !data.user) throw new Error('Du skal logge ind for at fortsætte.');
    const { error: verifyError } = await supabaseClient.auth.signInWithPassword({
      email: data.user.email,
      password: body.current_password,
    });
    if (verifyError) throw new Error('Den nuværende adgangskode er forkert.');
    const { error } = await supabaseClient.auth.updateUser({ password: body.new_password });
    if (error) throw cloudError(error);
    return { ok: true };
  }

  if (path === '/api/users' && method === 'POST') {
    const authUser = await cloudSignup(body.email, body.password, {
      username: body.username,
      display_name: body.display_name,
    });
    const { error } = await supabaseClient.from('profiles')
      .update({ active: true })
      .eq('id', authUser.id);
    if (error) throw cloudError(error);
    return { id: authUser.id };
  }

  if (path === '/api/users' && method === 'PATCH') {
    const { error } = await supabaseClient.from('profiles')
      .update({ active: body.active })
      .eq('id', body.id);
    if (error) throw cloudError(error);
    return { ok: true };
  }

  if (method === 'DELETE') {
    const { error } = await supabaseClient.from(resource)
      .delete()
      .eq('id', body.id);
    if (error) throw cloudError(error);
    return { ok: true };
  }

  if (resource === 'fields') {
    if (method === 'GET') {
      return {
        fields: await cloudResult(await supabaseClient.from('fields').select('*').order('name')),
      };
    }
    const query = method === 'PATCH'
      ? supabaseClient.from('fields').update(body).eq('id', body.id)
      : supabaseClient.from('fields').insert(body);
    const { error } = await query;
    if (error) throw cloudError(error);
    return { id: body.id };
  }

  if (resource === 'plans' || resource === 'observations') {
    const table = resource;
    if (method === 'GET') {
      return { [table]: await cloudResult(await supabaseClient.from(table).select('*').order('date', { ascending: false })) };
    }
    const payload = {
      ...body,
      ...(method === 'POST'
        ? { created_by: state.user.id, created_by_name: state.user.display_name }
        : {}),
    };
    const query = method === 'PATCH'
      ? supabaseClient.from(table).update(payload).eq('id', body.id)
      : supabaseClient.from(table).insert(payload);
    const { error } = await query;
    if (error) throw cloudError(error);
    return { id: body.id };
  }

  if (resource === 'users' && method === 'GET') {
    return {
      users: await cloudResult(
        await supabaseClient.from('profiles')
          .select('id, email, username, display_name, role, active, created_at')
          .order('role')
          .order('display_name'),
      ),
    };
  }

  throw new Error('Funktionen findes ikke på den valgte database.');
}

function notify(message, error = false) {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');
  toast.className = `toast${error ? ' error' : ''}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 3600);
}

function formatDateForInput() { return dateISO(); }

async function start() {
  if (window.location.protocol === 'file:') {
    app.innerHTML = `
      <main class="launch-help">
        <div class="launch-card">
          <img class="launch-logo" src="./Logo.png" alt="Egebjerggaard">
          <div class="eyebrow">Sådan åbner du markstyring</div>
          <h1>Appen skal startes først</h1>
          <p>Du har åbnet selve HTML-filen. Markstyring kræver også, at den lokale server kører, så dine data kan gemmes.</p>
          <ol>
            <li>Gå til mappen <strong>Egebjerggaard_FS25</strong>.</li>
            <li>Dobbeltklik på <strong>start-markstyring.bat</strong>.</li>
            <li>Vent på, at markstyring åbner i browseren. Lad det sorte server-vindue være åbent.</li>
          </ol>
          <p class="launch-footnote">Hvis Windows ikke kan starte filen, skal Python 3.10 eller nyere installeres først.</p>
          <a class="button launch-link" href="http://127.0.0.1:8000">Åbn markstyring</a>
          <p class="launch-footnote">Knappen virker, når serveren er startet.</p>
        </div>
      </main>`;
    return;
  }

  if (window.location.hostname.endsWith('.github.io') && !cloudEnabled) {
    app.innerHTML = `
      <main class="boot">
        <strong>GitHub Pages mangler databaseopsætningen</strong>
        <span>Tilføj SUPABASE_URL og SUPABASE_ANON_KEY i GitHub → Settings → Secrets and variables → Actions, og kør derefter workflowet Deploy markstyring to GitHub Pages igen.</span>
      </main>`;
    return;
  }

  try {
    const setup = await api('/api/setup/status');
    if (setup.setupRequired) {
      renderLogin(true);
      return;
    }
    try {
      const response = await api('/api/me');
      state.user = response.user;
      await loadData();
      renderApp();
    } catch (error) {
      if (error.message !== 'Du skal logge ind for at fortsætte.') notify(error.message, true);
      renderLogin(false);
    }
  } catch (error) {
    app.innerHTML = `<main class="boot"><strong>Forbindelsen kunne ikke oprettes</strong><span>${esc(error.message)}</span><button class="button" id="retry">Prøv igen</button></main>`;
    document.querySelector('#retry').addEventListener('click', () => location.reload());
  }
}

function renderLogin(setup) {
  const cloudMode = cloudEnabled;
  app.innerHTML = `
    <main class="login-page">
      <section class="login-aside">
        <div class="login-brand"><img src="Logo.png" alt=""><span>Egebjerggaard<br><small class="login-brand-label">MARKSTYRING</small></span></div>
        <div class="login-message"><div class="eyebrow">Sammen om en sund sæson</div><h1>Marken under kontrol.<br>Hele vejen rundt.</h1><p>Ét samlet overblik over marker, gødning og vækst – så alle på gården kan arbejde ud fra de samme, opdaterede oplysninger.</p></div>
        <div class="login-foot">Egebjerggaard · Markstyring</div>
      </section>
      <section class="login-main"><div class="login-box">
        <div class="eyebrow">${setup ? 'Velkommen til' : 'Medarbejderadgang'}</div>
        <h2>${setup ? 'Opret direktørkonto' : 'Log ind på gården'}</h2>
        <p>${setup ? 'Start med at oprette den første direktørkonto. Direktøren kan derefter oprette medarbejdere og styre adgangen.' : cloudMode ? 'Log ind med den e-mailadresse og adgangskode, som direktøren har givet dig.' : 'Brug dit personlige brugernavn og din adgangskode for at fortsætte.'}</p>
        <form class="login-form" id="login-form">
          ${setup ? `<div class="form-field"><label for="display_name">Dit navn</label><input id="display_name" name="display_name" autocomplete="name" required maxlength="80" placeholder="Fx Anders Jensen"></div>` : ''}
          ${cloudMode && setup ? `<div class="form-field"><label for="username">Brugernavn</label><input id="username" name="username" autocomplete="username" required maxlength="40" placeholder="Fx anders.jensen"></div>` : ''}
          <div class="form-field"><label for="${cloudMode ? 'email' : 'username'}">${cloudMode ? 'E-mail' : 'Brugernavn'}</label><input id="${cloudMode ? 'email' : 'username'}" name="${cloudMode ? 'email' : 'username'}" type="${cloudMode ? 'email' : 'text'}" autocomplete="${cloudMode ? 'email' : 'username'}" required maxlength="254" placeholder="${cloudMode ? 'navn@eksempel.dk' : 'Brugernavn'}"></div>
          <div class="form-field"><label for="password">${setup ? 'Vælg adgangskode' : 'Adgangskode'}</label><input id="password" name="password" type="password" autocomplete="${setup ? 'new-password' : 'current-password'}" required minlength="${setup ? 12 : 1}" maxlength="128" placeholder="${setup ? 'Mindst 12 tegn' : 'Din adgangskode'}"></div>
          ${setup ? `<div class="form-field"><label for="password_confirm">Gentag adgangskode</label><input id="password_confirm" name="password_confirm" type="password" autocomplete="new-password" required minlength="12" maxlength="128" placeholder="Gentag adgangskoden"></div>` : ''}
          <p class="login-error" id="login-error" role="alert"></p>
          <button class="button" type="submit">${setup ? 'Opret konto og fortsæt' : 'Log ind'} <span aria-hidden="true">→</span></button>
        </form>
        <div class="first-use">${icons.shield}<span>${setup ? cloudMode ? 'Brug en e-mailadresse, du har adgang til. Brugeren og medarbejderdata gemmes i gårdens private database.' : 'Din adgangskode gemmes kun som en sikker hash på denne server.' : 'Har du ikke en konto? Bed direktøren om at oprette din medarbejderadgang.'}</span></div>
      </div></section>
    </main>`;
  document.querySelector('#login-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const error = document.querySelector('#login-error');
    const button = event.currentTarget.querySelector('button');
    button.disabled = true;
    error.textContent = '';
    try {
      const password = form.get('password');
      if (setup && password !== form.get('password_confirm')) throw new Error('Adgangskoderne er ikke ens.');
      const result = await api(setup ? '/api/setup' : '/api/login', {
        method: 'POST',
        body: JSON.stringify({
          ...(cloudMode ? { email: form.get('email') } : { username: form.get('username') }),
          password,
          ...(setup ? {
            display_name: form.get('display_name'),
            ...(cloudMode ? { username: form.get('username') } : {}),
          } : {}),
        }),
      });
      state.user = result.user;
      await loadData();
      renderApp();
    } catch (reason) {
      error.textContent = reason.message;
      button.disabled = false;
    }
  });
}

async function loadData() {
  const endpoints = ['/api/fields', '/api/plans', '/api/observations'];
  if (state.user.role === 'director') endpoints.push('/api/users');
  const results = await Promise.all(endpoints.map(path => api(path)));
  state.fields = results[0].fields;
  const fieldsById = new Map(state.fields.map(field => [field.id, field]));
  state.plans = results[1].plans.map(plan => ({
    ...plan,
    field_name: plan.field_name || fieldsById.get(plan.field_id)?.name || '',
  }));
  state.observations = results[2].observations.map(item => ({
    ...item,
    field_name: item.field_name || fieldsById.get(item.field_id)?.name || '',
  }));
  state.users = results[3]?.users || [];
}

function renderApp() {
  if (!state.user) return;
  const visiblePages = Object.entries(pages).filter(([, page]) => !page.directorOnly || state.user.role === 'director');
  if (!visiblePages.some(([key]) => key === state.page)) state.page = 'dashboard';
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><img src="Logo.png" alt="Egebjerggaard"><div><div class="brand-name">Egebjerggaard</div><div class="brand-label">Markstyring</div></div></div>
        <div class="nav-label">Arbejdsplads</div>
        <nav class="nav" aria-label="Hovednavigation">
          ${visiblePages.map(([key, page]) => `<button class="nav-button ${state.page === key ? 'active' : ''}" data-page="${key}"><span class="nav-icon">${icons[page.icon]}</span><span>${page.label}</span></button>`).join('')}
        </nav>
        <div class="sidebar-bottom">
          <div class="season-card"><div class="season-kicker">Aktuel sæson</div><strong>Vækstsæson ${today.getFullYear()}</strong><p>${state.fields.length ? `${state.fields.length} marker · ${fmtNumber(state.fields.reduce((sum, field) => sum + Number(field.area), 0))} ha registreret` : 'Tilføj marker for at komme i gang'}</p></div>
          <div class="profile"><div class="avatar">${esc(initials(state.user.display_name))}</div><div class="profile-copy"><strong>${esc(state.user.display_name)}</strong><span>${state.user.role === 'director' ? 'Direktør' : 'Medarbejder'}</span></div><button class="icon-button" id="logout" aria-label="Log ud" title="Log ud">${icons.logout}</button></div>
        </div>
      </aside>
      <main class="main">
        <header class="topbar"><div class="breadcrumb">Markstyring <span class="breadcrumb-separator">/</span><strong>${pages[state.page].label}</strong></div><div class="top-actions"><span class="today">${esc(todayText)}</span><button class="button small" data-action="quick-add">${icons.plus}<span>Ny registrering</span></button></div></header>
        <section id="page-content"></section>
      </main>
    </div>`;
  renderPage();
  app.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => { state.page = button.dataset.page; state.search = ''; renderApp(); }));
  app.querySelector('#logout').addEventListener('click', logout);
  app.querySelector('[data-action="quick-add"]').addEventListener('click', () => {
    if (state.page === 'fields') openForm('field');
    else if (state.page === 'plans') openForm('plan');
    else if (state.page === 'growth') openForm('observation');
    else openForm(state.fields.length ? 'plan' : 'field');
  });
}

function heading(kicker, title, subtitle, action = '') {
  return `<div class="heading-row"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${action ? `<div class="heading-actions">${action}</div>` : ''}</div>`;
}

function actionButton(action, label, icon = 'plus', secondary = false) {
  return `<button class="button ${secondary ? 'secondary' : ''}" data-action="${action}">${icons[icon]}<span>${label}</span></button>`;
}

function renderPage() {
  const target = document.querySelector('#page-content');
  if (!target) return;
  if (state.page === 'dashboard') target.innerHTML = renderDashboard();
  if (state.page === 'fields') target.innerHTML = renderFields();
  if (state.page === 'plans') target.innerHTML = renderPlans();
  if (state.page === 'growth') target.innerHTML = renderGrowth();
  if (state.page === 'users') target.innerHTML = renderUsers();
  if (state.page === 'machinery') target.innerHTML = renderMachinery();
  bindPageEvents(target);
}

function renderDashboard() {
  const activeFields = state.fields.filter(field => field.status === 'Aktiv');
  const totalArea = activeFields.reduce((sum, field) => sum + Number(field.area), 0);
  const pending = state.plans.filter(plan => plan.status === 'Planlagt');
  const doneCount = state.plans.filter(plan => plan.status === 'Udført').length;
  const upcoming = [...pending].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const latest = [...state.observations].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const demo = state.fields.some(field => field.name.toLowerCase().includes('(eksempel)'));
  return `${heading('Godt overblik giver en god sæson', `God ${greeting()}, ${esc(state.user.display_name.split(' ')[0])}`, 'Her er det vigtigste fra markerne – samlet ét sted.', actionButton('new-field', 'Tilføj mark', 'plus', true))}
    ${demo ? `<div class="demo-note"><strong>Eksempeldata:</strong> De viste marker er eksempler, så du kan se funktionerne. Redigér dem eller fjern dem, og opret dine egne marker, når du er klar.</div>` : ''}
    <div class="grid stats-grid">
      ${statCard('Aktivt areal', `${fmtNumber(totalArea)} <small class="stat-unit">ha</small>`, `${activeFields.length} aktive marker`, 'fields', '')}
      ${statCard('Planlagte opgaver', pending.length, pending.length ? 'Afventer udførelse' : 'Alt er ajour', 'calendar', 'amber')}
      ${statCard('Gødning udført', doneCount, 'Registreret denne sæson', 'water', 'lime')}
      ${statCard('Vækstregistreringer', state.observations.length, 'Tilsyn dokumenteret', 'growth', '')}
    </div>
    <div class="grid dashboard-grid">
      <section class="card panel"><div class="panel-head"><div><h2 class="panel-title">Markernes status</h2><p class="panel-subtitle">Hurtigt overblik over afgrøder og N-mål</p></div><button class="link-button" data-page="fields">Alle marker →</button></div>
      ${state.fields.length ? `<div class="table-wrap"><table><thead><tr><th>Mark</th><th>Afgrøde</th><th>Areal</th><th>N-mål</th><th>Status</th></tr></thead><tbody>${state.fields.slice(0, 6).map(field => `<tr><td><div class="primary-cell">${esc(field.name)}</div><div class="secondary-cell">${esc(field.soil_type || 'Jordtype ikke angivet')}</div></td><td>${esc(field.crop)}</td><td>${fmtNumber(field.area)} ha</td><td>${fmtNumber(field.nitrogen_target)} kg N/ha</td><td>${fieldStatus(field.status)}</td></tr>`).join('')}</tbody></table></div>` : emptyState('Ingen marker endnu', 'Opret den første mark, så dukker areal og afgrøder op her.', 'new-field')}
      </section>
      <section class="card panel"><div class="panel-head"><div><h2 class="panel-title">Næste opgaver</h2><p class="panel-subtitle">Planlagt markarbejde</p></div><button class="link-button" data-page="plans">Se plan →</button></div>
      ${upcoming.length ? `<div class="activity-list">${upcoming.map(plan => activity(plan)).join('')}</div>` : emptyState('Ingen opgaver planlagt', 'Tilføj en gødningsplan for at holde styr på næste arbejdsgang.', 'new-plan')}
      </section>
    </div>
    <section class="card panel dashboard-observations"><div class="panel-head"><div><h2 class="panel-title">Seneste marktilsyn</h2><p class="panel-subtitle">De nyeste vækst- og sundhedsnotater</p></div><button class="link-button" data-page="growth">Alle registreringer →</button></div>
      ${latest.length ? `<div class="activity-list">${latest.map(item => `<div class="activity-item"><div class="activity-date">${dateTile(item.date)}</div><div class="activity-copy"><strong>${esc(item.field_name)} · ${esc(item.stage)}</strong><span>${esc(item.health)}${item.notes ? ` · ${esc(item.notes)}` : ''}</span></div></div>`).join('')}</div>` : emptyState('Ingen tilsyn registreret', 'Notér vækststadie og sundhed for at følge udviklingen.', 'new-observation')}
    </section>`;
}

function greeting() {
  const hour = today.getHours();
  return hour < 10 ? 'morgen' : hour < 18 ? 'dag' : 'aften';
}

function statCard(label, value, note, icon, color) {
  return `<div class="card stat-card"><div class="stat-head"><span class="stat-label">${label}</span><span class="stat-icon ${color}">${icons[icon]}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></div>`;
}

function dateTile(date) {
  const d = new Date(`${date}T12:00:00`);
  return `<span>${new Intl.DateTimeFormat('da-DK', { month: 'short' }).format(d)}</span><strong>${d.getDate()}</strong>`;
}

function activity(plan) {
  return `<div class="activity-item"><div class="activity-date">${dateTile(plan.date)}</div><div class="activity-copy"><strong>${esc(plan.product)} · ${fmtNumber(plan.amount)} ${esc(plan.unit)}</strong><span>${esc(plan.field_name)} · ${esc(plan.method || 'Metode ikke angivet')}</span></div></div>`;
}

function fieldStatus(status) {
  const klass = status === 'Hvile' ? 'muted' : status === 'Høstet' ? 'pending' : '';
  return `<span class="status ${klass}">${esc(status)}</span>`;
}

function healthStatus(status) {
  const klass = status === 'Kræver opmærksomhed' ? 'alert' : status === 'Middel' ? 'pending' : '';
  return `<span class="status ${klass}">${esc(status)}</span>`;
}

function emptyState(title, message, action) {
  const actions = {
    'new-field': ['fields', 'Opret mark'],
    'new-plan': ['plans', 'Opret gødningsplan'],
    'new-observation': ['growth', 'Registrér tilsyn'],
  };
  const [page, label] = actions[action];
  return `<div class="empty"><div class="empty-icon">✳</div><strong>${title}</strong><div>${message}</div><button class="link-button empty-action" data-open="${action}" data-page="${page}">${label} →</button></div>`;
}

function renderFields() {
  const query = state.search.toLowerCase();
  const fields = state.fields.filter(field => `${field.name} ${field.crop} ${field.soil_type}`.toLowerCase().includes(query) && (state.filter === 'Alle' || field.status === state.filter));
  return `${heading('Gårdens arealer', 'Marker', 'Samlet register med afgrøde, areal, jordtype og gødningsmål.', actionButton('new-field', 'Tilføj mark'))}
    <div class="card table-card">
      <div class="toolbar"><label class="search-wrap">${icons.search}<input id="search-fields" value="${esc(state.search)}" placeholder="Søg efter mark eller afgrøde…" aria-label="Søg marker"></label><select id="filter-fields" class="filter-select" aria-label="Filtrér markstatus">${['Alle', ...new Set(state.fields.map(field => field.status))].map(value => `<option ${state.filter === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select></div>
      ${fields.length ? `<div class="table-wrap"><table><thead><tr><th>Mark</th><th>Afgrøde / sort</th><th>Areal</th><th>Jord / forfrugt</th><th>N-mål</th><th>Status</th><th></th></tr></thead><tbody>${fields.map(field => `<tr>
        <td><div class="primary-cell">${esc(field.name)}</div>${field.notes ? `<div class="secondary-cell">${esc(field.notes)}</div>` : ''}</td>
        <td><div class="primary-cell">${esc(field.crop)}</div><div class="secondary-cell">${esc(field.variety || 'Sort ikke angivet')}</div></td>
        <td>${fmtNumber(field.area)} ha</td><td>${esc(field.soil_type || '–')}<div class="secondary-cell">${field.last_crop ? `Forfrugt: ${esc(field.last_crop)}` : ''}</div></td>
        <td>${fmtNumber(field.nitrogen_target)} kg N/ha</td><td>${fieldStatus(field.status)}</td>
        <td><div class="table-actions"><button class="icon-button" data-edit="field" data-id="${field.id}" aria-label="Redigér ${esc(field.name)}">${icons.edit}</button>${state.user.role === 'director' ? `<button class="icon-button delete" data-delete="fields" data-id="${field.id}" data-name="${esc(field.name)}" aria-label="Slet ${esc(field.name)}">${icons.trash}</button>` : ''}</div></td>
      </tr>`).join('')}</tbody></table></div>` : emptyState(state.fields.length ? 'Ingen marker matcher søgningen' : 'Dit markregister er tomt', state.fields.length ? 'Prøv et andet søgeord eller en anden status.' : 'Opret markerne for at lægge gødningsplaner og følge væksten.', 'new-field')}
    </div>`;
}

function renderPlans() {
  const sorted = [...state.plans].sort((a, b) => a.date.localeCompare(b.date));
  return `${heading('Næring til rette tid', 'Gødningsplan', 'Planlæg og dokumentér tildeling af gødning pr. mark.', actionButton('new-plan', 'Ny gødningsplan'))}
    <div class="yield-banner"><div><strong>Planlagt og udført – samlet ét sted</strong><p>Registrér produkt, mængde, metode og dato. Ændringer gemmes automatisk på gårdens server.</p></div><div class="yield-mark">${sorted.filter(plan => plan.status === 'Planlagt').length} afventer</div></div>
    <div class="card table-card">
      ${sorted.length ? `<div class="table-wrap"><table><thead><tr><th>Dato</th><th>Mark</th><th>Produkt</th><th>Mængde</th><th>Metode</th><th>Oprettet af</th><th>Status</th><th></th></tr></thead><tbody>${sorted.map(plan => `<tr>
        <td>${fmtDate(plan.date)}</td><td><div class="primary-cell">${esc(plan.field_name)}</div></td><td><div class="primary-cell">${esc(plan.product)}</div>${plan.notes ? `<div class="secondary-cell">${esc(plan.notes)}</div>` : ''}</td>
        <td>${fmtNumber(plan.amount)} ${esc(plan.unit)}</td><td>${esc(plan.method || '–')}</td><td>${esc(plan.created_by_name || '–')}</td>
        <td><span class="status ${plan.status === 'Udført' ? '' : 'pending'}">${esc(plan.status)}</span></td>
        <td><div class="table-actions"><button class="icon-button" data-edit="plan" data-id="${plan.id}" aria-label="Redigér gødningsplan">${icons.edit}</button>${state.user.role === 'director' ? `<button class="icon-button delete" data-delete="plans" data-id="${plan.id}" data-name="${esc(plan.product)}" aria-label="Slet plan">${icons.trash}</button>` : ''}</div></td>
      </tr>`).join('')}</tbody></table></div>` : emptyState('Ingen planer endnu', 'Opret en gødningsplan og tilknyt den til en af gårdens marker.', 'new-plan')}
    </div>`;
}

function renderGrowth() {
  const observations = [...state.observations].sort((a, b) => b.date.localeCompare(a.date));
  return `${heading('Følg udviklingen', 'Vækst & tilsyn', 'Dokumentér vækststadier, markens sundhed og observationer.', actionButton('new-observation', 'Registrér tilsyn'))}
    <div class="grid stats-grid growth-stats">
      ${statCard('Registreringer', observations.length, 'Alle tilsyn i systemet', 'growth', '')}
      ${statCard('God tilstand', observations.filter(item => item.health === 'God').length, 'Seneste registreringer', 'leaf', 'lime')}
      ${statCard('Kræver opmærksomhed', observations.filter(item => item.health === 'Kræver opmærksomhed').length, 'Følg op på disse marker', 'water', 'amber')}
    </div>
    ${observations.length ? `<div class="growth-grid">${observations.map(item => `<article class="card growth-card">
      <div class="growth-card-head"><div><h3>${esc(item.field_name)}</h3><div class="crop-label">${esc(fieldCrop(item.field_id))} · ${fmtDate(item.date)}</div></div>${healthStatus(item.health)}</div>
      <div class="growth-meta"><strong>Vækststadie:</strong> ${esc(item.stage)}<br><strong>Noter:</strong> ${esc(item.notes || 'Ingen supplerende bemærkninger.')}<br><strong>Registreret af:</strong> ${esc(item.created_by_name || '–')}</div>
      <div class="table-actions growth-actions"><button class="icon-button" data-edit="observation" data-id="${item.id}" aria-label="Redigér tilsyn">${icons.edit}</button>${state.user.role === 'director' ? `<button class="icon-button delete" data-delete="observations" data-id="${item.id}" data-name="${esc(item.field_name)}" aria-label="Slet tilsyn">${icons.trash}</button>` : ''}</div>
    </article>`).join('')}</div>` : `<div class="card">${emptyState('Ingen marktilsyn endnu', 'Registrér vækststadie og sundhed – så får teamet den samme aktuelle viden.', 'new-observation')}</div>`}`;
}

function fieldCrop(id) { return state.fields.find(field => field.id === id)?.crop || 'Afgrøde ikke angivet'; }

function renderUsers() {
  const employees = state.users;
  return `${heading('Adgang og ansvar', 'Medarbejdere', 'Opret personlige konti og slå adgang til eller fra. Kun direktøren kan administrere brugere.', actionButton('new-user', 'Opret medarbejder'))}
    <div class="demo-note">Medarbejdere kan oprette og redigere marker, planer og tilsyn. Kun direktøren kan slette registreringer, deaktivere konti og se medarbejderlisten.</div>
    <div class="card table-card"><div class="table-wrap"><table><thead><tr><th>Medarbejder</th><th>Brugernavn</th><th>E-mail</th><th>Rolle</th><th>Oprettet</th><th>Adgang</th><th></th></tr></thead><tbody>
      ${employees.map(person => `<tr><td><div class="user-ident"><div class="avatar user-avatar">${esc(initials(person.display_name))}</div><div class="primary-cell">${esc(person.display_name)}</div></div></td>
        <td>${esc(person.username)}</td><td>${esc(person.email || '–')}</td><td>${person.role === 'director' ? 'Direktør' : 'Medarbejder'}</td><td>${fmtDate(person.created_at?.slice(0, 10))}</td>
        <td><span class="status ${person.active ? '' : 'muted'}">${person.active ? 'Aktiv' : 'Deaktiveret'}</span></td>
        <td>${person.id === state.user.id ? '<span class="secondary-cell">Din konto</span>' : `<button class="button small ${person.active ? 'secondary' : ''}" data-toggle-user="${person.id}" data-active="${person.active ? 'false' : 'true'}">${person.active ? 'Deaktivér' : 'Aktivér'}</button>`}</td>
      </tr>`).join('')}
    </tbody></table></div></div>
    <div class="card panel users-security"><div class="panel-head"><div><h2 class="panel-title">Sikkerhed</h2><p class="panel-subtitle">Brug personlige logins, og skift adgangskode med jævne mellemrum.</p></div></div><button class="button secondary" data-action="change-password">${icons.lock}<span>Skift min adgangskode</span></button></div>`;
}

function renderMachinery() {
  return `${heading('Maskiner og udstyr', 'Maskinpakke', 'Samlet oversigt over gårdens maskiner og udstyr.')}
    <section class="card panel">
      <h2 class="panel-title">Kom godt i gang</h2>
      <p class="panel-subtitle">Maskinpakke-siden er oprettet. Her kan du senere tilføje oplysninger om gårdens maskiner og udstyr.</p>
    </section>`;
}

function bindPageEvents(target) {
  target.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'new-field') openForm('field');
    if (action === 'new-plan') openForm('plan');
    if (action === 'new-observation') openForm('observation');
    if (action === 'new-user') openForm('user');
    if (action === 'change-password') openForm('password');
  }));
  target.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => { state.page = button.dataset.page; renderApp(); }));
  target.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openForm(button.dataset.open.replace('new-', ''))));
  target.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => openForm(button.dataset.edit, button.dataset.id)));
  target.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => deleteItem(button.dataset.delete, button.dataset.id, button.dataset.name)));
  target.querySelectorAll('[data-toggle-user]').forEach(button => button.addEventListener('click', () => toggleUser(button.dataset.toggleUser, button.dataset.active === 'true')));
  const search = target.querySelector('#search-fields');
  if (search) search.addEventListener('input', () => { state.search = search.value; const position = search.selectionStart; renderPage(); const next = document.querySelector('#search-fields'); next.focus(); next.setSelectionRange(position, position); });
  const filter = target.querySelector('#filter-fields');
  if (filter) filter.addEventListener('change', () => { state.filter = filter.value; renderPage(); });
}

function openForm(type, editId) {
  if (!state.fields.length && ['plan', 'observation'].includes(type)) {
    notify('Opret først en mark, før du kan tilføje denne registrering.', true);
    state.page = 'fields';
    renderApp();
    return;
  }
  const collections = { field: state.fields, plan: state.plans, observation: state.observations, user: [], password: [] };
  const record = editId ? collections[type]?.find(item => item.id === editId) : undefined;
  const forms = {
    field: fieldForm(record),
    plan: planForm(record),
    observation: observationForm(record),
    user: userForm(),
    password: passwordForm(),
  };
  const titles = { field: record ? 'Redigér mark' : 'Opret mark', plan: record ? 'Redigér gødningsplan' : 'Ny gødningsplan', observation: record ? 'Redigér marktilsyn' : 'Registrér marktilsyn', user: 'Opret medarbejder', password: 'Skift adgangskode' };
  const subtitles = { field: 'Oplysningerne gemmes på gårdens database.', plan: 'Planen bliver synlig for alle med adgang til markstyringen.', observation: 'Et opdateret tilsyn gør det lettere at følge markens udvikling.', user: 'Medarbejderen kan logge ind med oplysningerne herunder.', password: 'Vælg en stærk adgangskode med mindst 12 tegn.' };
  document.querySelector('.modal-backdrop')?.remove();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><h2 id="modal-title">${titles[type]}</h2><p>${subtitles[type]}</p></div><button class="icon-button" data-close aria-label="Luk">${icons.close}</button></header><div class="modal-body"><form id="data-form" data-type="${type}" ${editId ? `data-id="${editId}"` : ''}>${forms[type]}<p class="login-error" id="form-error" role="alert"></p><div class="modal-actions"><button type="button" class="button secondary" data-close>Annullér</button><button type="submit" class="button">Gem ændringer</button></div></form></div></section>`;
  document.body.append(backdrop);
  backdrop.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => backdrop.remove()));
  backdrop.addEventListener('click', event => { if (event.target === backdrop) backdrop.remove(); });
  backdrop.querySelector('#data-form').addEventListener('submit', submitForm);
  backdrop.querySelector('input, select')?.focus();
}

function fieldForm(record = {}) {
  return `<div class="form-grid">
    ${formInput('name', 'Marknavn', record.name, 'Fx Nordmarken', { required: true, full: true })}
    ${formInput('area', 'Areal (ha)', record.area, 'Fx 18,5', { type: 'number', required: true, min: '.01', step: '.01' })}
    ${formSelect('status', 'Status', ['Aktiv', 'Høstet', 'Hvile'], record.status || 'Aktiv')}
    ${formInput('crop', 'Afgrøde', record.crop, 'Fx Vinterhvede', { required: true })}
    ${formInput('variety', 'Sort', record.variety, 'Fx KWS Extase')}
    ${formInput('soil_type', 'Jordtype', record.soil_type, 'Fx Lerjord')}
    ${formInput('last_crop', 'Forfrugt', record.last_crop, 'Fx Vårbyg')}
    ${formInput('nitrogen_target', 'N-mål (kg N/ha)', record.nitrogen_target ?? '', 'Fx 160', { type: 'number', min: '0', step: '.1' })}
    ${formTextarea('notes', 'Noter', record.notes, 'Supplerende oplysninger om marken…')}
  </div>`;
}

function fieldOptions(selected) {
  return state.fields.map(field => `<option value="${field.id}" ${selected === field.id ? 'selected' : ''}>${esc(field.name)} · ${esc(field.crop)} (${fmtNumber(field.area)} ha)</option>`).join('');
}

function planForm(record = {}) {
  const defaults = { date: formatDateForInput(), amount: '', unit: 'kg/ha', status: 'Planlagt' };
  return `<div class="form-grid">
    ${formSelect('field_id', 'Mark', [], record.field_id, true, fieldOptions(record.field_id))}
    ${formInput('date', 'Dato', record.date || defaults.date, '', { type: 'date', required: true })}
    ${formInput('product', 'Gødningsprodukt', record.product, 'Fx NPK 21-3-10', { required: true })}
    ${formInput('amount', 'Mængde', record.amount ?? defaults.amount, 'Fx 250', { type: 'number', required: true, min: '.01', step: '.1' })}
    ${formSelect('unit', 'Enhed', ['kg/ha', 'l/ha', 'ton/ha'], record.unit || defaults.unit)}
    ${formInput('method', 'Udbringningsmetode', record.method, 'Fx Gødningsspreder')}
    ${formSelect('status', 'Status', ['Planlagt', 'Udført'], record.status || defaults.status)}
    ${formTextarea('notes', 'Noter', record.notes, 'Evt. særlige instruktioner…')}
  </div>`;
}

function observationForm(record = {}) {
  return `<div class="form-grid">
    ${formSelect('field_id', 'Mark', [], record.field_id, true, fieldOptions(record.field_id))}
    ${formInput('date', 'Dato', record.date || formatDateForInput(), '', { type: 'date', required: true })}
    ${formInput('stage', 'Vækststadie', record.stage, 'Fx BBCH 31 · Begyndende strækning', { required: true, full: true })}
    ${formSelect('health', 'Markens tilstand', ['God', 'Middel', 'Kræver opmærksomhed'], record.health || 'God', true)}
    ${formTextarea('notes', 'Observationer', record.notes, 'Beskriv udvikling, ukrudt, skadedyr eller andet…')}
  </div>`;
}

function userForm() {
  return `<div class="form-grid">${formInput('display_name', 'Medarbejderens navn', '', 'Fx Mette Jensen', { required: true, full: true })}
    ${formInput('username', 'Brugernavn', '', 'Fx mette.jensen', { required: true })}
    ${cloudEnabled ? formInput('email', 'E-mail til login', '', 'medarbejder@eksempel.dk', { type: 'email', required: true, full: true }) : ''}
    ${formInput('password', 'Startadgangskode', '', 'Mindst 12 tegn', { type: 'password', required: true, minLength: 12 })}
    <div class="form-field full"><span class="form-hint">${cloudEnabled ? 'Brugeren logger ind med sin e-mail og denne adgangskode. Giv adgangskoden sikkert til medarbejderen; vedkommende kan derefter ændre den. Kontoen oprettes aktiv.' : 'Giv medarbejderen startadgangskoden personligt. Den kan ændres efter første login. Adgang kan altid deaktiveres her.'}</span></div>
  </div>`;
}

function passwordForm() {
  return `<div class="form-grid">
    ${formInput('current_password', 'Nuværende adgangskode', '', 'Nuværende adgangskode', { type: 'password', required: true, full: true })}
    ${formInput('new_password', 'Ny adgangskode', '', 'Mindst 12 tegn', { type: 'password', required: true, minLength: 12 })}
    ${formInput('confirm_password', 'Gentag ny adgangskode', '', 'Gentag adgangskoden', { type: 'password', required: true, minLength: 12 })}
  </div>`;
}

function formInput(name, label, value = '', placeholder = '', opts = {}) {
  const required = opts.required ? '<span class="required">*</span>' : '';
  return `<div class="form-field ${opts.full ? 'full' : ''}"><label for="f-${name}">${label} ${required}</label><input id="f-${name}" name="${name}" value="${esc(value ?? '')}" placeholder="${esc(placeholder)}" type="${opts.type || 'text'}" ${opts.required ? 'required' : ''} ${opts.min ? `min="${opts.min}"` : ''} ${opts.step ? `step="${opts.step}"` : ''} ${opts.minLength ? `minlength="${opts.minLength}"` : ''} ${opts.type === 'number' ? 'max="1000000"' : ''} ${opts.type === 'password' ? 'autocomplete="new-password"' : ''}></div>`;
}

function formSelect(name, label, options, selected, required = false, rawOptions = null) {
  const content = rawOptions || options.map(value => `<option ${value === selected ? 'selected' : ''}>${esc(value)}</option>`).join('');
  return `<div class="form-field"><label for="f-${name}">${label} ${required ? '<span class="required">*</span>' : ''}</label><select id="f-${name}" name="${name}" ${required ? 'required' : ''}>${content}</select></div>`;
}

function formTextarea(name, label, value, placeholder) {
  return `<div class="form-field full"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}" placeholder="${esc(placeholder)}">${esc(value || '')}</textarea></div>`;
}

async function submitForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const type = form.dataset.type;
  const id = form.dataset.id;
  const fields = new FormData(form);
  const body = Object.fromEntries(fields.entries());
  if (type === 'password') {
    if (body.new_password !== body.confirm_password) {
      document.querySelector('#form-error').textContent = 'De nye adgangskoder er ikke ens.';
      return;
    }
    delete body.confirm_password;
  }
  if (type === 'field' && body.area) body.area = Number(body.area.replace(',', '.'));
  if (type === 'field') body.nitrogen_target = body.nitrogen_target ? Number(body.nitrogen_target.replace(',', '.')) : 0;
  if (type === 'plan') body.amount = Number(body.amount.replace(',', '.'));
  const endpoints = { field: '/api/fields', plan: '/api/plans', observation: '/api/observations', user: '/api/users', password: '/api/change-password' };
  if (id) body.id = id;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  document.querySelector('#form-error').textContent = '';
  try {
    await api(endpoints[type], { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) });
    document.querySelector('.modal-backdrop')?.remove();
    if (type === 'password') {
      notify('Din adgangskode er ændret.');
      return;
    }
    await loadData();
    renderApp();
    notify(id ? 'Ændringerne er gemt.' : 'Registreringen er oprettet og gemt.');
  } catch (error) {
    const errorElement = document.querySelector('#form-error');
    if (errorElement) errorElement.textContent = error.message;
    else notify(error.message, true);
    if (button.isConnected) button.disabled = false;
  }
}

async function deleteItem(resource, id, name) {
  const relatedWarning = resource === 'fields' ? ' Tilknyttede gødningsplaner og tilsyn slettes også.' : '';
  if (!window.confirm(`Vil du slette "${name}"? Handlingen kan ikke fortrydes.${relatedWarning}`)) return;
  try {
    await api(`/api/${resource}`, { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'EgebjerggaardApp' } });
    await loadData();
    renderApp();
    notify('Registreringen er slettet.');
  } catch (error) {
    notify(error.message, true);
  }
}

async function toggleUser(id, active) {
  const person = state.users.find(user => user.id === id);
  if (!person || !window.confirm(`${active ? 'Aktivér' : 'Deaktivér'} adgangen for ${person.display_name}?`)) return;
  try {
    await api('/api/users', { method: 'PATCH', body: JSON.stringify({ id, active }) });
    await loadData();
    renderApp();
    notify(`Adgangen er ${active ? 'aktiveret' : 'deaktiveret'}.`);
  } catch (error) {
    notify(error.message, true);
  }
}

async function logout() {
  try {
    await api('/api/logout', { method: 'POST', body: '{}' });
    state.user = null;
    state.fields = [];
    state.plans = [];
    state.observations = [];
    state.users = [];
    renderLogin(false);
  } catch (error) {
    notify(error.message, true);
  }
}

start();
