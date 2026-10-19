# Egebjerggaard Markstyring

Dansk markstyringsapp til marker, gødningsplaner, væksttilsyn og medarbejderadgang.

## Gratis onlinehosting

Appens hjemmeside hostes gratis på GitHub Pages fra et **offentligt GitHub-repository**. GitHub Pages kan ikke køre databasen eller loginserveren, så løsningen bruger Supabase Free til delt database og personlige logins. Opret én Supabase-konto til gården; medarbejderne får almindelige konti i appen, ikke Supabase-konti. Repositoryets kildekode og hjemmeside er offentlig; adgangskoder og markdata ligger ikke i repositoryet.

**Vigtigt om gratisplaner:** Supabase Free har brugsgrænser, kan sætte inaktive projekter på pause og giver ikke en garanti for backup eller konstant tilgængelighed. En GitHub Pages-app med Supabase kræver ikke betaling, så længe begge tjenester holder sig inden for deres aktuelle gratisplaner. Kontrollér altid deres aktuelle vilkår. Gem selv regelmæssige sikkerhedskopier af data, som gården er afhængig af.

### Engangsopsætning

1. **Push projektet til GitHub.** Brug branch `main` eller `master`, og kontrollér, at `data/markstyring.sqlite3`, adgangskoder og andre private data ikke er i repositoryet. `.gitignore` udelukker lokale SQLite-databaser.
2. **Opret et gratis Supabase-projekt** på [supabase.com/dashboard](https://supabase.com/dashboard). Vælg en stærk databaseadgangskode, og gem den privat.
3. I Supabase skal du åbne **SQL Editor → New query**, kopiere hele filen `supabase/schema.sql` ind i editoren og vælge **Run**. Kontrollér, at scriptet er kørt uden fejl.
4. Under **Authentication → Providers → Email** skal **Confirm email** slås fra. Appen opretter brugere direkte uden invitation via e-mail; e-mailbekræftelse skal derfor være slået fra, for at første direktøropsætning og medarbejderkonti kan aktiveres.
5. Under **Authentication → URL Configuration** sættes **Site URL** til GitHub Pages-adressen, fx `https://BRUGERNAVN.github.io/REPOSITORY/`. Tilføj samme adresse til **Redirect URLs**.
6. Hent Supabase-projektets **Project URL** og den offentlige **publishable/anon key** fra projektets API-indstillinger. I GitHub åbnes **repository → Settings → Secrets and variables → Actions**. Opret repository secrets med navnene `SUPABASE_URL` og `SUPABASE_ANON_KEY`. Den offentlige anon/publishable key indgår i den publicerede hjemmeside; databasen beskyttes af RLS-reglerne. Brug aldrig Supabase `service_role`-nøglen i GitHub, browseren eller appen.
7. I GitHub åbnes **Settings → Pages**, og **Source** sættes til **GitHub Actions**. Workflowet `Deploy markstyring to GitHub Pages` deployer derefter ved push til `main` eller `master`; det kan også startes manuelt under **Actions**. GitHub Actions er gratis inden for GitHubs gældende kvoter.
8. Når workflowet er gennemført, åbnes sidens adresse `https://BRUGERNAVN.github.io/REPOSITORY/`. Den første person, der opretter en konto, bliver direktør. Brug en e-mailadresse, du har adgang til; medarbejderne logger derefter ind med hver deres e-mail og adgangskode.

Medarbejdere oprettes under **Medarbejdere → Opret medarbejder**. Giv adgangskoden sikkert til den pågældende medarbejder. Direktøren kan aktivere/deaktivere konti; kun direktøren kan slette mark-, gødnings- og tilsynsdata.

### Hvis siden viser en fejl om databaseopsætning

- Kontrollér, at GitHub Actions secrets hedder præcist `SUPABASE_URL` og `SUPABASE_ANON_KEY`.
- Kontrollér, at `supabase/schema.sql` er kørt i det Supabase-projekt, hvis URL og nøgle bruges i GitHub.
- Kontrollér, at seneste Pages-workflow er gennemført. Kør **Actions → Deploy markstyring to GitHub Pages → Run workflow** igen efter ændringer af secrets.
- Hvis login siger, at e-mailen ikke er bekræftet, slå **Confirm email** fra i Supabase, og prøv igen.

## Lokal Windows-udgave

Installér Python 3.10 eller nyere, og dobbeltklik på `start-markstyring.bat`. Alternativt køres `py server.py` i projektmappen. Åbn derefter [http://127.0.0.1:8000](http://127.0.0.1:8000). Den lokale udgave gemmer data i `data/markstyring.sqlite3`; denne database deles ikke automatisk med GitHub Pages eller Supabase.

## Test

Kør backend- og adgangstests med `py -m unittest test_server.py`. Pages-workflowet kontrollerer JavaScript-buildet, genererer den offentlige Supabase-konfiguration fra GitHub Secrets og publicerer kun statiske appfiler.

Gødningsmål og agronomiske beslutninger skal kontrolleres mod gældende regler, jordprøver og faglig rådgivning.
