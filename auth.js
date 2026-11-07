/* auth.js (Runde 195, Ryan, 03.11.2026: Sammlungen mit dem Konto über die eigene Tabelle public.sammlungen, Michael 5j / Weg 2;
   baut auf Runde 193, Ryan, 03.11.2026, und R186 vom 02.11.): echte Anmeldung der Seite mit E-Mail und Passwort. Eigener kleiner Client,
   keine fremde Bibliothek, kein CDN. Spricht die GoTrue-Schnittstelle von Supabase mit fetch an (credentials: 'omit', referrerPolicy: 'no-referrer').
   Header: apikey (öffentlicher Schlüssel, darf im Code stehen), mit Sitzung zusätzlich Authorization: Bearer <access_token>.
   Wege: signup, token?grant_type=password, resend (type signup), recover, PUT /user {password}. Der Magic Link (/otp) wird nicht mehr aufgerufen.
   Ohne Sitzung schickt dieses Skript beim Laden keine einzige Anfrage. Google: nur nach Klick ein Seitenwechsel zur
   Anmeldeadresse des Projekts, kein Google-Skript, kein One Tap, kein von Google gezeichneter Knopf.
   Sätze: alle sichtbaren Sätze kommen aus window.R193_SAETZE (= saetze.json, vom Rundenskript in die Seite geschrieben; {min} dort schon ersetzt); nur die Sätze aus R186c/d
   (Abmelden bricht ab, Herunterladen) stehen als Rückfall hier. Das Markup und das Umschalten von „Anzeigen“ und das Nachladen von haeufige-passwoerter.js erledigt das Rundenskript, nicht dieses Skript (Selektoren: tests/selektoren.md).
   Das Passwort wird nie gespeichert und nie in eine Adresse geschrieben; es geht nur im Body von signup, token und PUT /user an den Server und
   wird beim Schließen des Fensters aus den Feldern gelöscht. Abfrage-Markierungen (?willkommen, ?passwort) sind nur Merker, nie ein Ziel.
   Gespeichert wird im Browser nur: ki-sitzung (access_token, refresh_token, expires_at, email, vorname, pw = ob das Konto ein Passwort hat (ja/nein), seit 186b basis und
   weg: Kennungen der Ideen, die zuletzt mit dem Konto abgeglichen bzw. seitdem hier entfernt wurden) und, solange man
   angemeldet ist, ki-entdecken-konto = {name, anmeldung:true}, damit Kopf und Mein Bereich den Vornamen zeigen.
   Ins Konto (user_metadata) geht: vorname, herzen (seit R206 je Idee nur am, ohne Titel), willkommen, passwort (true, sobald hier ein Passwort gesetzt wurde). messung.js und messpunkte.js lesen nichts davon.
   R195: Sammlungen liegen in der Tabelle public.sammlungen (Zeilen id, name, emoji, items, am; Zeilenschutz, höchstens 30 je Konto, S7 in der Abhakliste).
   Wege: GET /rest/v1/sammlungen, POST …?on_conflict=user_id,id (Prefer: resolution=merge-duplicates), DELETE …?id=in.(…), nur mit Sitzung.
   In ki-sitzung zusätzlich: sbasis (Stand der Sammlungen beim letzten Abgleich), sweg (hier gelöschte Sammlungen), iweg (hier aus Sammlungen
   entfernte Ideen), soffen (Sammlungen noch nicht im Konto). Alles, was aus dem Konto kommt, wird beim Lesen geprüft (sammlungenPruefen, alsKarte). */
(function () {
  'use strict';
  var URL_ = 'https://fcjadwdzcuqgzddwrrzl.supabase.co';
  var KEY = 'sb_publishable_CLIEw8HDRbsdMfMLOPCSvw_64EmxycT';
  var SK = 'ki-sitzung';
  var MIN = Number(window.R193_MIN) || 8;   // Mindestlänge (Yannis, 03.11.): im Browser und bei Supabase gleich (S2); die Seite setzt window.R193_MIN
  var MAX_BYTES = 72;   // bcrypt, wie bei Supabase
  // Sätze aus R186c/d, mit R195 nach Oscars Wortlaut (03.11.) um die Sammlungen ergänzt; ein Eintrag unter R193_SAETZE.konto186 überschreibt sie
  var R186 = {
    abgemeldet: 'Du bist abgemeldet. Deine gemerkten Ideen und Sammlungen sind in deinem Konto sicher.',
    // 186c (Dwights R8, Satz Pam 03.11.): Abmelden bricht ab, solange gemerkte Ideen nicht ins Konto kamen
    ohneVerbindung: 'Abmelden geht gerade nicht, weil die Internetverbindung fehlt. Deine letzten Änderungen an gemerkten Ideen und Sammlungen sind noch nicht in deinem Konto. Versuch es gleich noch einmal.',
    // 186d (Dwights H2, Sätze Pam 03.11., „wähl“ statt „tipp“ 06:4x): gleicher Abbruch, aber das Netz ist da und der Server hat nicht geschrieben
    serverFehler: 'Abmelden geht gerade nicht, weil es bei uns eine Störung gibt. Deine letzten Änderungen an gemerkten Ideen und Sammlungen sind noch nicht in deinem Konto. Versuch es später noch einmal.',
    serverFehlerHinweis: 'Ist das nicht dein Gerät? Dann wähl unten „Alles in diesem Browser löschen“. Diese Änderungen gehen dabei verloren.',
    heruntergeladen: 'Deine Daten wurden heruntergeladen.'
  };
  // Satz aus saetze.json holen: satz('anlegen.fehlerKurz', {n: 5}); {min} wird ersetzt, {n} und {mail} aus w.
  // Bleibt ein Platzhalter offen oder fehlt der Satz, kommt der Rückfall (oder null).
  function satz(pfad, w, rueck) {
    var x = window.R193_SAETZE || {};   // bei jedem Aufruf neu gelesen: die Reihenfolge der Skript-Tags spielt keine Rolle
    pfad.split('.').forEach(function (k) { x = x && typeof x === 'object' ? x[k] : undefined; });
    if (typeof x !== 'string') return rueck === undefined ? null : rueck;
    w = w || {};
    var t = x.replace(/\{(min|n|mail)\}/g, function (m, k) { return k === 'min' ? String(MIN) : (k in w ? String(w[k]) : m); });
    return /\{(min|n|mail)\}/.test(t) ? (rueck === undefined ? null : rueck) : t;
  }
  var KI = window.KI;
  var ersatz = {};   // wenn localStorage nicht geht: nur diese Seite

  /* ——— Sitzung im Browser ——— */
  function lsLesen(k) { try { return window.localStorage.getItem(k); } catch (e) { return k in ersatz ? ersatz[k] : null; } }
  function lsSchreiben(k, v) {
    try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); }
    catch (e) { if (v == null) delete ersatz[k]; else ersatz[k] = v; }
  }
  function sitzung() {
    var r = lsLesen(SK);
    if (!r) return null;
    try { var s = JSON.parse(r); return s && s.access_token && s.refresh_token ? s : null; } catch (e) { return null; }
  }
  function sitzungSetzen(s) { lsSchreiben(SK, s ? JSON.stringify(s) : null); }
  /* Wechsel der Sitzung (Dwight, 03.11.): vor dem Umschalten die alte Sitzung merken und ihr Offenes (s.offen) noch mit IHREM Token senden.
     Gespeichert wird dafür nichts Neues außer id in ki-sitzung (Kennung des Kontos, kommt mit dem ersten Abgleich). */
  var altSitz = null, neueSitz = null;
  function wechselnZu(neu) {
    var alt = sitzung();
    var vor = alt && (alt.offen || alt.soffen) ? allesPushen().catch(function () { return false; }) : Promise.resolve();
    return vor.then(function () { sitzungSetzen(neu); return alt; });
  }
  function gleichesKonto(alt, user) {
    if (!alt) return true;                         // vorher niemand angemeldet: wie bisher vereinen
    if (alt.id && user.id) return alt.id === user.id;
    var a = String(alt.email || '').toLowerCase(), b = String(user.email || '').toLowerCase();
    return !!a && a === b;                         // ohne Kennung: Adresse; ist keine bekannt, nicht vereinen
  }
  function jetzt() { return Math.floor(Date.now() / 1000); }

  /* ——— Anfragen ——— */
  var letzteOhneNetz = false;   // 186d (H2): ob die letzte Anfrage am fehlenden Netz scheiterte (sonst Server)
  function api(methode, pfad, body, token, bleibt, kopf) {
    var h = { apikey: KEY };
    if (kopf) Object.keys(kopf).forEach(function (k) { h[k] = kopf[k]; });   // R195: Prefer für die Tabelle
    if (token) h.Authorization = 'Bearer ' + token;
    if (body !== undefined) h['Content-Type'] = 'application/json';
    return fetch(URL_ + pfad, {
      method: methode, headers: h, body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'omit', referrerPolicy: 'no-referrer', mode: 'cors', cache: 'no-store', keepalive: !!bleibt
    }).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = null; }
        letzteOhneNetz = false;
        return { ok: r.ok, status: r.status, json: j };
      });
    }, function () { letzteOhneNetz = true; return { netz: true, ok: false, status: 0, json: null }; });
  }

  var erneuernLaeuft = null;
  function erneuern() {
    if (erneuernLaeuft) return erneuernLaeuft;
    var s0 = sitzung();
    if (!s0) return Promise.resolve(false);
    erneuernLaeuft = api('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: s0.refresh_token }).then(function (r) {
      erneuernLaeuft = null;
      if (r.ok && r.json && r.json.access_token) {
        var s = sitzung() || s0;
        s.access_token = r.json.access_token; s.refresh_token = r.json.refresh_token || s.refresh_token;
        s.expires_at = r.json.expires_at || (jetzt() + (r.json.expires_in || 3600));
        sitzungSetzen(s);
        return true;
      }
      if (r.netz || r.status >= 500) return false;   // nur kein Netz: Sitzung behalten
      var neu = sitzung();   // hat ein anderer Tab inzwischen erneuert?
      if (neu && neu.refresh_token !== s0.refresh_token) return true;
      abmeldenStill();
      return false;
    });
    return erneuernLaeuft;
  }
  function frischerToken() {
    var s = sitzung();
    if (!s) return Promise.resolve(null);
    if (s.expires_at && s.expires_at - 30 < jetzt()) return erneuern().then(function () { var n = sitzung(); return n ? n.access_token : null; });
    return Promise.resolve(s.access_token);
  }
  // Abmelden im Konto: gültigen Token sichern (abgelaufen: erst erneuern, bei 401 einmal erneuern und erneut senden).
  // Arbeitet mit einer Kopie der Sitzung, damit es auch nach dem lokalen Abmelden nachlaufen kann.
  function logoutSenden(s, bleibt) {
    var cur = { a: s.access_token, r: s.refresh_token };
    function ern() {
      return api('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: cur.r }, undefined, bleibt).then(function (r) {
        if (r.ok && r.json && r.json.access_token) { cur.a = r.json.access_token; cur.r = r.json.refresh_token || cur.r; return true; }
        return false;
      });
    }
    function senden() { return api('POST', '/auth/v1/logout?scope=local', undefined, cur.a, bleibt); }
    var alt = s.expires_at && s.expires_at - 30 < jetzt();
    return (alt ? ern() : Promise.resolve(true)).then(senden).then(function (r) {
      if (r.status !== 401) return r;
      return ern().then(function (ok) { return ok ? senden() : r; });
    });
  }
  function mitSitzung(methode, pfad, body, kopf) {
    return frischerToken().then(function (t) {
      if (!t) return { netz: false, ok: false, status: 401, json: null, keineSitzung: true };
      return api(methode, pfad, body, t, false, kopf).then(function (r) {
        if (r.status !== 401) return r;
        return erneuern().then(function (ok) {
          var n = sitzung();
          if (!ok || !n) return r;
          return api(methode, pfad, body, n.access_token, false, kopf).then(function (r2) { if (r2.status === 401) abmeldenStill(); return r2; });
        });
      });
    });
  }

  /* ——— Herzen und Konto im Browser ——— */
  function herzenLokal() { try { return KI ? KI.herzen() : {}; } catch (e) { return {}; } }
  function herzenSetzen(h) {
    if (!KI) return;
    letzteSig = sig(h);
    KI.schreib(KI.K.herzen, h || {});
    if (window.kiHerzZeichnen) { try { window.kiHerzZeichnen(); } catch (e) { /* weiter */ } }
  }
  function sig(h) { return Object.keys(h || {}).sort().join('|'); }
  var letzteSig = null, pushUhr = null;
  /* R195 (Michael 5j): alles, was aus dem Konto kommt, beim Lesen prüfen. Bekannte Ideen schreibt das Rundenskript als window.R195_IDEEN
     in die Seite; fehlt die Liste, gilt nur die Form der Kennung. */
  var IDEEN = null;
  if (Array.isArray(window.R195_IDEEN) && window.R195_IDEEN.length) { IDEEN = Object.create(null); window.R195_IDEEN.forEach(function (i) { if (typeof i === 'string') IDEEN[i] = 1; }); }
  // R206: Titel der Ideen aus dem Angebot für den Export (window.R206_TITEL, vom Rundenskript nur in Mein Bereich)
  var TITEL = Object.create(null), RT = window.R206_TITEL;
  if (RT && typeof RT === 'object') Object.keys(RT).forEach(function (i) { if (typeof RT[i] === 'string' && ideeOk(i)) TITEL[i] = RT[i]; });
  var EMO = KI && Array.isArray(KI.EMOJIS) && KI.EMOJIS.length ? KI.EMOJIS : ['⭐'];
  var MAX_S = 30, MAX_I = 71, MAX_N = 40;
  var STEUER = /[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;   // Steuer- und Richtungszeichen
  function ideeOk(id) { return typeof id === 'string' && (IDEEN ? IDEEN[id] === 1 : /^[a-z][a-z0-9-]{0,30}$/.test(id)); }
  function textRein(x, max, leer) {
    var t = (typeof x === 'string' ? x : '').replace(STEUER, '').trim();
    t = Array.from(t).slice(0, max).join('').trim();   // Zeichen wie char_length in der Tabelle
    return t || leer;
  }
  // Herzen: nur bekannte Ideen, am als Zahl; Unbekanntes wird nicht gezeigt, aber im Konto nicht gelöscht (herzenUnbekannt)
  // R208 (Dwights N1): Zeitstempel nur zwischen 0 und 01.01.2100, sonst 0; so wirft new Date(am).toISOString() im Export nie
  var AM_MAX = 4102444800000;
  function amOk(v) { var n = Number(v); return n > 0 && n < AM_MAX ? n : 0; }
  function alsKarte(x) {
    var roh = x, o = {};
    if (Array.isArray(x)) { roh = {}; x.forEach(function (i) { if (i && typeof i.id === 'string') roh[i.id] = i; }); }
    if (!roh || typeof roh !== 'object') return o;
    Object.keys(roh).forEach(function (id) {
      if (!ideeOk(id)) return;
      var v = roh[id] && typeof roh[id] === 'object' ? roh[id] : {};
      o[id] = { titel: textRein(v.titel, 120, id), am: amOk(v.am) };
    });
    return o;
  }
  // R206 (Dwights E1): ins Konto je Herz nur { am }, nie den Titel, auch nicht den Ersatz aus alsKarte; der Export holt ihn aus dem Angebot
  function ohneTitel(h) { var o = {}; Object.keys(h || {}).forEach(function (id) { o[id] = { am: amOk(h[id] && h[id].am) }; }); return o; }
  function herzenUnbekannt(x) {
    var o = {};
    if (x && typeof x === 'object' && !Array.isArray(x)) Object.keys(x).forEach(function (id) { if (!ideeOk(id)) o[id] = x[id]; });
    return o;
  }
  // Sammlungen: Kennung nach Form, Emoji aus der Liste, Name gesäubert (höchstens 40 Zeichen), nur bekannte Ideen ohne Doppelte (höchstens 71)
  function sammlungenPruefen(x) {
    var aus = [], ids = Object.create(null);
    (Array.isArray(x) ? x : []).forEach(function (s) {
      if (!s || typeof s !== 'object' || typeof s.id !== 'string' || !/^s[0-9a-z]{1,12}$/.test(s.id) || ids[s.id]) return;
      ids[s.id] = 1;
      var it = [], da = Object.create(null);
      (Array.isArray(s.items) ? s.items : []).forEach(function (i) { if (ideeOk(i) && !da[i] && it.length < MAX_I) { da[i] = 1; it.push(i); } });
      aus.push({ id: s.id, name: textRein(s.name, MAX_N, 'Sammlung'), emoji: EMO.indexOf(s.emoji) >= 0 ? s.emoji : EMO[0], items: it, am: amOk(s.am) });
    });
    return aus.sort(function (a, b) { return a.am - b.am || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
  }
  function kontoLokalSetzen(vorname) {
    if (!KI) return;
    var k = null; try { k = KI.konto(); } catch (e) { /* weiter */ }
    if (k && !k.anmeldung) return;   // Konto aus anderer Quelle bleibt unberührt
    if (k && k.name === vorname) return;
    KI.schreib(KI.K.konto, { name: vorname, anmeldung: true });
  }
  function kontoLokalWeg() {
    if (!KI) return;
    var k = null; try { k = KI.konto(); } catch (e) { /* weiter */ }
    if (k && k.anmeldung) KI.schreib(KI.K.konto, null);
  }
  // Sitzung und Vorname aus diesem Browser entfernen (geteilte Geräte), auch direkt aus beiden Speichern
  function lokalAbmelden() {
    sitzungSetzen(null);
    try { if (KI) KI.schreib(KI.K.konto, null); } catch (e) { /* direkt weiter */ }
    ['localStorage', 'sessionStorage'].forEach(function (n) { try { window[n].removeItem('ki-entdecken-konto'); window[n].removeItem(SK); } catch (e) { /* weiter */ } });
    delete ersatz['ki-entdecken-konto'];
  }
  function abmeldenStill() {
    lokalAbmelden();
    anzeigen();
  }

  /* ——— Namen ——— */
  function vornameVon(user, vorlaeufig) {
    var m = (user && user.user_metadata) || {};
    var n = m.vorname || m.given_name || ((m.full_name || m.name || '').split(/\s+/)[0]) || vorlaeufig || '';
    if (!n && user && user.email) n = user.email.split('@')[0];
    n = String(n).trim();
    return n ? n.charAt(0).toUpperCase() + n.slice(1) : 'du';
  }

  /* ——— Konto-Daten abgleichen ——— */
  function userHolen() {
    return mitSitzung('GET', '/auth/v1/user').then(function (r) {
      if (r.ok && r.json && r.json.id) return r.json;
      return null;
    });
  }
  function metaSchreiben(daten) {
    return mitSitzung('PUT', '/auth/v1/user', { data: daten }).then(function (r) { return r.ok && r.json ? r.json : null; });
  }
  /* 186b (B7, Dwight 03.11.): zusammenführen statt überschreiben. Basis = Stand des letzten Abgleichs mit dem Konto.
     Geschrieben wird: Konto + was dieser Browser seit der Basis dazugemerkt hat − was er seitdem wirklich entfernt hat
     (nur hier beobachtete Abgänge in s.weg). So löscht kein Gerät, was es nie gesehen hat, und ein leerer Speicher leert nie das Konto. */
  function zusammen(konto, lokal, s) {
    var basis = {}; (s.basis || Object.keys(konto)).forEach(function (id) { basis[id] = 1; });
    var voll = Object.assign({}, konto);
    Object.keys(lokal).forEach(function (id) { if (!basis[id]) voll[id] = lokal[id]; });
    (s.weg || []).forEach(function (id) { if (basis[id] && !(id in lokal)) delete voll[id]; });
    return voll;
  }
  function zusammenSchreiben(u, extra, vereinen) {
    var s = sitzung();
    if (!s) return Promise.resolve(false);
    var konto = alsKarte((u.user_metadata || {}).herzen), lokal = herzenLokal();
    var voll = zusammen(konto, lokal, vereinen ? { basis: [] } : s);
    var schreiben = sig(voll) !== sig(konto) ? metaSchreiben(Object.assign({ herzen: Object.assign(herzenUnbekannt((u.user_metadata || {}).herzen), ohneTitel(voll)) }, extra || {})) : Promise.resolve(u);
    return schreiben.then(function (ok) {
      var s2 = sitzung();
      if (!ok || !s2) return false;   // offen bleibt: beim nächsten Laden oder Abmelden nachholen
      var jetztH = herzenLokal(), neu = voll;
      if (sig(jetztH) === sig(lokal)) { delete s2.offen; s2.weg = []; }
      else {   // während der Anfrage geändert: diese Änderung auf den neuen Stand legen, der nächste Lauf schreibt sie
        s2.weg = (s2.weg || []).filter(function (id) { return id in lokal; });
        neu = zusammen(voll, jetztH, { basis: Object.keys(lokal), weg: s2.weg });
      }
      s2.basis = Object.keys(voll).sort();
      sitzungSetzen(s2);
      if (sig(neu) !== sig(jetztH)) herzenSetzen(neu);
      return true;
    });
  }
  var kette = Promise.resolve();
  // Herzen (s.offen) und Sammlungen (s.soffen, R195) gemeinsam senden, nacheinander in einer Kette; wahr nur, wenn beides ankam
  function allesPushen() {
    clearTimeout(pushUhr); pushUhr = null;
    kette = kette.then(function () {
      var s = sitzung();
      if (!s) return false;
      var h = s.offen ? userHolen().then(function (u) { return u && sitzung() ? zusammenSchreiben(u) : false; }) : Promise.resolve(true);
      return h.then(function (ok) {
        var s2 = sitzung();
        if (!s2 || !s2.soffen) return ok;
        return sammlungenAbgleichen('normal').then(function (ok2) { return ok && ok2; });
      });
    }).catch(function () { return false; });
    return kette;
  }
  function herzGeaendert() {
    var h = herzenLokal(), s = sig(h);
    if (s === letzteSig) return;
    var vorher = letzteSig ? letzteSig.split('|') : [];
    letzteSig = s;
    var sz = sitzung();
    if (!sz) return;
    // Abgänge merken, die hier wirklich passiert sind: nur sie dürfen im Konto etwas entfernen
    var weg = (sz.weg || []).filter(function (id) { return !(id in h); });
    vorher.forEach(function (id) { if (id && !(id in h) && weg.indexOf(id) < 0) weg.push(id); });
    sz.weg = weg;
    sz.offen = 1; sitzungSetzen(sz);   // beim nächsten Laden nachholen, falls das Senden scheitert
    clearTimeout(pushUhr);
    pushUhr = setTimeout(function () { allesPushen(); }, 1000);
  }
  function abgleichen(user, vereinen, alt) {
    var s = sitzung();
    if (!s || !user) return Promise.resolve();
    var meta = user.user_metadata || {};
    var konto = alsKarte(meta.herzen);
    s.email = user.email || s.email; s.vorname = vornameVon(user, s.vorname);
    kontoLokalSetzen(s.vorname);
    var s1 = Object.assign(sitzung() || s, { email: s.email, vorname: s.vorname, pw: hatPasswort(user) });
    if (user.id) s1.id = user.id;
    sitzungSetzen(s1);
    var weiter = Promise.resolve();
    if (vereinen && !gleichesKonto(alt, user)) {
      // anderes Konto als vorher in diesem Browser: nichts vereinen, die Herzen kommen aus dem neuen Konto
      delete s1.offen; delete s1.soffen; s1.sweg = []; s1.iweg = {}; delete s1.sbasis;
      if (sig(konto) !== sig(herzenLokal())) herzenSetzen(konto);
      s1.basis = Object.keys(konto).sort(); s1.weg = []; sitzungSetzen(s1);
    } else if (vereinen || s1.offen) {
      // frische Anmeldung: Konto und Browser vereinen; offenes Schreiben: zusammenführen nach Basis
      weiter = zusammenSchreiben(user, vereinen ? { vorname: s.vorname } : null, vereinen);
    } else {
      if (sig(konto) !== sig(herzenLokal())) herzenSetzen(konto);
      s1.basis = Object.keys(konto).sort(); s1.weg = []; sitzungSetzen(s1);
    }
    var fremd = vereinen && !gleichesKonto(alt, user);
    return weiter.then(function () { letzteSig = sig(herzenLokal()); wartendUebernehmen(); return sammlungenAbgleichen(fremd ? 'fremd' : vereinen ? 'vereinen' : 'normal'); });
  }

  /* ——— R195: Sammlungen mit dem Konto (Tabelle public.sammlungen) ———
     Wie bei den Herzen (B7): zusammenführen statt überschreiben, je Sammlung. Basis = Stand beim letzten Abgleich (s.sbasis).
     Name und Emoji: hier seit der Basis geändert → von hier, sonst aus dem Konto. Ideen: Konto + hier dazu − hier entfernt (s.iweg).
     Nur im Konto: bleibt, außer hier wirklich gelöscht (s.sweg). Nur hier: neu, außer sie war in der Basis (anderswo gelöscht).
     Ins Konto gehen höchstens 30; was darüber liegt, bleibt nur in diesem Browser. Gelöscht wird im Konto nur, was dieser Abgleich gesehen hat. */
  function karte(l) { var m = Object.create(null); l.forEach(function (x) { m[x.id] = x; }); return m; }
  function sBasis(l) { var b = {}; l.forEach(function (x) { b[x.id] = { name: x.name, emoji: x.emoji, items: x.items.slice() }; }); return b; }
  function sLokal() { try { return sammlungenPruefen(KI ? KI.sammlungen() : []); } catch (e) { return []; } }
  var sLetzt = null;   // zuletzt gesehener Stand der Sammlungen in diesem Browser (JSON)
  function sSetzen(l) {
    if (!KI) return;
    sLetzt = JSON.stringify(sammlungenPruefen(l));
    KI.schreib(KI.K.sammlungen, l);
  }
  function sEins(b, k, l, iw) {
    var basisIt = b ? b.items : [], aus = [];
    var dazu = l.items.filter(function (i) { return basisIt.indexOf(i) < 0; });
    k.items.concat(dazu).forEach(function (i) { if (aus.indexOf(i) < 0 && iw.indexOf(i) < 0 && aus.length < MAX_I) aus.push(i); });
    return {
      id: k.id,
      name: b && l.name !== b.name ? l.name : k.name,
      emoji: b && l.emoji !== b.emoji ? l.emoji : k.emoji,
      items: aus,
      am: k.am
    };
  }
  function sZusammen(K, L, s) {
    var B = (s && s.sbasis) || {}, weg = (s && s.sweg) || [], iw = (s && s.iweg) || {}, km = karte(K), lm = karte(L), aus = [];
    K.forEach(function (k) {
      var l = lm[k.id];
      if (l) aus.push(sEins(B[k.id], k, l, iw[k.id] || []));
      else if (!(B[k.id] && weg.indexOf(k.id) >= 0)) aus.push(k);
    });
    L.forEach(function (l) { if (!km[l.id] && !B[l.id]) aus.push(l); });
    return sammlungenPruefen(aus);
  }
  function sHolen() {
    return mitSitzung('GET', '/rest/v1/sammlungen?select=id,name,emoji,items,am&order=am.asc').then(function (r) {
      return r.ok && Array.isArray(r.json) ? sammlungenPruefen(r.json).slice(0, MAX_S) : null;
    });
  }
  function sSchreiben(K, vereinen) {
    var s = sitzung();
    if (!s) return Promise.resolve(false);
    var L0 = sLokal(), j0 = JSON.stringify(L0);
    var R = sZusammen(K, L0, vereinen ? {} : s), km = karte(K), rm = karte(R);
    var weg = K.filter(function (k) { return !rm[k.id]; }).map(function (k) { return k.id; });
    var bleibt = R.filter(function (x) { return km[x.id]; });
    var neu = R.filter(function (x) { return !km[x.id]; }).slice(0, Math.max(0, MAX_S - bleibt.length));
    var hoch = bleibt.filter(function (x) { return JSON.stringify(x) !== JSON.stringify(km[x.id]); }).concat(neu);
    var p = weg.length ? mitSitzung('DELETE', '/rest/v1/sammlungen?id=in.(' + weg.join(',') + ')') : Promise.resolve({ ok: true });
    return p.then(function (r) {
      if (!r.ok) return null;
      if (!hoch.length) return r;
      var uid = (sitzung() || {}).id;
      return mitSitzung('POST', '/rest/v1/sammlungen?on_conflict=user_id,id', hoch.map(function (x) {
        var z = { id: x.id, name: x.name, emoji: x.emoji, items: x.items, am: x.am };
        if (uid) z.user_id = uid;
        return z;
      }), { Prefer: 'resolution=merge-duplicates,return=minimal' });
    }).then(function (r) {
      var s2 = sitzung();
      if (!r || !r.ok || !s2) return false;   // soffen bleibt: beim nächsten Laden oder Abmelden nachholen
      s2.sbasis = sBasis(bleibt.concat(neu));
      var L1 = sLokal();
      if (JSON.stringify(L1) === j0) {
        delete s2.soffen; s2.sweg = []; s2.iweg = {};
        sitzungSetzen(s2);
        if (JSON.stringify(R) !== j0) sSetzen(R);
      } else {   // während der Anfrage geändert: diese Änderung auf den neuen Stand legen, der nächste Lauf schreibt sie
        sitzungSetzen(s2);
        sSetzen(sZusammen(R, L1, { sbasis: sBasis(L0), sweg: s2.sweg, iweg: s2.iweg }));
      }
      return true;
    });
  }
  // modus: 'normal' (Laden, Senden), 'vereinen' (frische Anmeldung, leere Basis), 'fremd' (anderes Konto: Sammlungen kommen nur aus dem Konto)
  function sammlungenAbgleichen(modus) {
    return sHolen().then(function (K) {
      var s = sitzung();
      if (!K || !s) return false;
      if (modus === 'fremd') {
        s.sbasis = sBasis(K); s.sweg = []; s.iweg = {}; delete s.soffen; sitzungSetzen(s);
        sSetzen(K);
        return true;
      }
      return sSchreiben(K, modus === 'vereinen');
    });
  }
  // Änderungen an den Sammlungen in diesem Browser bemerken (wie herzGeaendert): Abgänge merken, nach 1 s senden
  function sammlungGeaendert() {
    if (!KI) return;
    var jetztL = sLokal(), j = JSON.stringify(jetztL);
    if (sLetzt === null) { sLetzt = j; return; }
    if (j === sLetzt) return;
    var vorher = JSON.parse(sLetzt);
    sLetzt = j;
    var sz = sitzung();
    if (!sz) return;
    var jm = karte(jetztL), weg = sz.sweg || [], iw = sz.iweg || {};
    vorher.forEach(function (a) {
      var n = jm[a.id];
      if (!n) { if (weg.indexOf(a.id) < 0) weg.push(a.id); return; }
      var raus = (iw[a.id] || []).concat(a.items.filter(function (i) { return n.items.indexOf(i) < 0; }));
      raus = raus.filter(function (i, k) { return raus.indexOf(i) === k && n.items.indexOf(i) < 0; });
      if (raus.length) iw[a.id] = raus; else delete iw[a.id];
    });
    Object.keys(iw).forEach(function (id) { if (jm[id]) iw[id] = iw[id].filter(function (i) { return jm[id].items.indexOf(i) < 0; }); if (!iw[id].length) delete iw[id]; });
    sz.sweg = weg; sz.iweg = iw; sz.soffen = 1; sitzungSetzen(sz);
    clearTimeout(pushUhr);
    pushUhr = setTimeout(function () { allesPushen(); }, 1000);
  }

  /* ——— Passwort: Hilfen ——— */
  function hatPasswort(user) {
    var a = (user && user.app_metadata) || {}, m = (user && user.user_metadata) || {};
    var prov = Array.isArray(a.providers) ? a.providers : (a.provider ? [a.provider] : []);
    return prov.indexOf('email') >= 0 || m.passwort === true;   // GoTrue sagt nicht, ob ein Passwort gesetzt ist (selektoren.md, W4)
  }
  function zeichen(t) { return Array.from(t).length; }
  function bytes(t) { try { return new TextEncoder().encode(t).length; } catch (e) { return unescape(encodeURIComponent(t)).length; } }
  function haeufig(pw) {
    var h = window.R193_HAEUFIG, k = pw.toLowerCase();
    if (!h) return false;
    if (typeof h.has === 'function') return h.has(k);
    return Object.prototype.hasOwnProperty.call(h, k);
  }
  // Prüfung vor dem Senden: Satz oder null. ansicht = 'anlegen' | 'neu' (nur der Satz „zu lang“ liegt in beiden Ansichten)
  function passwortFehler(pw, ansicht) {
    if (!pw) return satz('anlegen.fehlerPwLeer');
    if (bytes(pw) > MAX_BYTES) return satz(ansicht + '.fehlerLang');
    if (zeichen(pw) < MIN) return satz('anlegen.fehlerKurz', { n: zeichen(pw) });
    if (haeufig(pw)) return satz('anlegen.fehlerHaeufig');
    return null;
  }

  /* ——— Rückkehr von Mail-Link oder Google ———
     Nur Hash-Werte mit Anmeldedaten oder Anmeldefehler anfassen; andere Sprungmarken bleiben.
     Die Abfrage (?willkommen, ?passwort) sagt nur, welche Mail es war (Fall bei abgelaufenem Link); sie ist nie ein Ziel. */
  var rec = null;   // Sitzung aus dem Passwort-Link: nur im Speicher der Seite, gespeichert wird sie erst nach „Passwort speichern“
  function marke(n) { try { return new URLSearchParams(location.search).has(n); } catch (e) { return false; } }
  function ohneMarken(namen) {
    try { var p = new URLSearchParams(location.search); namen.forEach(function (n) { p.delete(n); }); var q = p.toString(); return location.pathname + (q ? '?' + q : ''); }
    catch (e) { return location.pathname; }
  }
  function hashLesen() {
    var h = location.hash || '';
    if (h.length < 2) return null;
    var p;
    try { p = new URLSearchParams(h.slice(1)); } catch (e) { return null; }
    var ergebnis = null, neuerPfad = null;
    if (p.get('access_token') && p.get('refresh_token')) {
      var ein = parseInt(p.get('expires_in'), 10) || 3600;
      var t = { access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expires_at: jetzt() + ein };
      if (p.get('type') === 'recovery') { rec = t; ergebnis = { recovery: true }; neuerPfad = ohneMarken(['passwort']); }
      else { neueSitz = Object.assign(t, { email: '', vorname: '' }); ergebnis = { tokens: true }; neuerPfad = ohneMarken(['willkommen']); }   // ?willkommen hat seinen Dienst getan (Adresse sauber); Hash fällt wie bisher weg
    } else if (p.get('error') && (p.get('error_code') || p.get('error_description'))) {
      var abgelaufen = p.get('error_code') === 'otp_expired';
      ergebnis = { fehler: abgelaufen ? 'abgelaufen' : (p.get('error') === 'access_denied' ? 'google' : 'stoerung') };
      if (abgelaufen) ergebnis.fall = marke('willkommen') ? 'bestaetigen' : (marke('passwort') ? 'passwort' : 'rueckfall');
      neuerPfad = ohneMarken(['willkommen', 'passwort']);
    }
    if (ergebnis) { try { history.replaceState(null, '', neuerPfad); } catch (e) { /* bleibt */ } }
    return ergebnis;
  }

  /* ——— Fenster ——— */
  var ANSICHTEN = ['anlegen', 'anmelden', 'postfach', 'vergessen', 'neu', 'abgelaufen', 'willkommen'];
  var dlg, beobachter, schritte = {}, aktuell = '', eigenesOeffnen = false, zaehlerUhr = null, sperreBis = 0;
  var merk = { mail: '' }, abgFall = 'rueckfall', neuMail = '';
  function el(s, w) { return (w || dlg).querySelector(s); }
  function feld(ansicht, name) { return schritte[ansicht] ? schritte[ansicht].querySelector('input[name="' + name + '"]') : null; }
  function wertVon(ansicht, name) { var i = feld(ansicht, name); return i ? i.value : ''; }
  function eineId(e, vorsatz) { if (!e.id) e.id = vorsatz + Math.random().toString(36).slice(2, 7); return e.id; }
  function erfolgSchalten(name, an) {
    var v = schritte[name]; if (!v) return;
    var e = v.querySelector('[data-erfolg]'), f = v.querySelector('form');
    if (e) e.hidden = !an;
    if (f) f.hidden = an;
  }
  function zeigeSchritt(name) {
    if (!schritte[name]) name = 'anlegen';
    aktuell = name;
    Object.keys(schritte).forEach(function (k) { schritte[k].hidden = k !== name; });
    var h = schritte[name].querySelector('h2');
    if (h) dlg.setAttribute('aria-labelledby', eineId(h, 'r193-h-'));
    dlg.scrollTop = 0;
    meldungWeg();
    erfolgSchalten('vergessen', false); erfolgSchalten('neu', false);
    var nk = schritte.anmelden && schritte.anmelden.querySelector('[data-nochmal]'); if (nk) nk.hidden = true;   // nur im Fehler „nicht bestätigt“
  }
  function fokus(name) {
    var ziel = null;
    if (name === 'anlegen') ziel = feld('anlegen', 'vorname');
    else if (name === 'anmelden' || name === 'vergessen' || name === 'abgelaufen') ziel = feld(name, 'email');
    else if (name === 'neu') ziel = feld('neu', 'passwort');
    else if (schritte[name]) ziel = schritte[name].querySelector('h2');
    if (!ziel && schritte[name]) ziel = schritte[name].querySelector('h2');
    if (ziel) { if (!ziel.matches('input,button,a')) ziel.setAttribute('tabindex', '-1'); ziel.focus({ preventScroll: true }); }
  }
  // Hilfe-Fenster (R185) schließen, bevor die Anmeldung aufgeht; Fokus danach zum Öffner der Anmeldung zurück
  var zurueck = null;
  function hilfeZu() { var hh = document.getElementById('hh-sheet'); if (hh && !hh.hidden) { var hx = hh.querySelector('.hh-x'); if (hx) hx.click(); } }
  function zurueckMerken() {
    if (!dlg || dlg.open) return;
    var a = document.activeElement;
    if (a && a.closest && a.closest('#hh-sheet')) a = document.querySelector('.hh-oeffner');
    zurueck = a && a !== document.body ? a : null;
  }
  function oeffnen(name, meldung, google) {
    if (!dlg) return;
    zurueckMerken(); hilfeZu();
    document.querySelectorAll('dialog[open]').forEach(function (d) { if (d !== dlg) d.close(); });
    eigenesOeffnen = true;
    if (!dlg.open) dlg.showModal();
    if (beobachter) beobachter.takeRecords();   // eigenes Öffnen nicht als Öffnen durch die Seite werten (der Beobachter läuft erst nach dem Befehl)
    eigenesOeffnen = false;
    zeigeSchritt(name);
    if (meldung) meldungZeigen(aktuell, meldung, null, google);
    var gk = google && schritte[aktuell] && schritte[aktuell].querySelector('[data-google]');   // R199: nach dem Google-Abbruch auf „Weiter mit Google“ (Pam, WCAG 2.4.3)
    if (gk) gk.focus({ preventScroll: true }); else fokus(aktuell);
  }
  // Meldung der Ansicht (role=alert); zusatz = zweiter Absatz in derselben Meldung (reiner Text, 8 px Abstand)
  function meldungZeigen(name, text, zusatz, google) {
    var v = schritte[name || aktuell]; if (!v) return;
    var m = (google && v.querySelector('[data-google-meldung]')) || v.querySelector('[data-meldung]:not([data-google-meldung])');
    if (!m) return;
    m.setAttribute('role', 'alert'); eineId(m, 'r193-m-');
    m.textContent = text || satz('meldungen.stoerung', null, '') || '!';   // nie eine leere Meldung (etwa wenn saetze.json fehlt)
    if (zusatz) {
      var z = document.createElement('span');
      z.setAttribute('data-meldung-zusatz', '');
      z.style.display = 'block'; z.style.marginTop = '8px';
      z.textContent = zusatz;
      m.appendChild(z);
    }
    m.hidden = false;
  }
  function meldungWeg() {
    if (!dlg) return;
    dlg.querySelectorAll('[data-meldung]').forEach(function (m) { m.hidden = true; m.textContent = ''; });
    dlg.querySelectorAll('input').forEach(function (i) {
      i.removeAttribute('aria-invalid');
      if (i.hasAttribute('data-hinweis')) i.setAttribute('aria-describedby', i.getAttribute('data-hinweis')); else i.removeAttribute('aria-describedby');
    });
  }
  // Hinweis unter dem Passwortfeld („Neues Passwort“): ✓ vor dem Satz, sobald die Länge reicht (Mindestlänge nur aus MIN)
  function hakenAktualisieren(i) {
    var h = i && i.hasAttribute('data-hinweis') ? document.getElementById(i.getAttribute('data-hinweis')) : null;
    var k = h && h.querySelector('[data-haken]'); if (!k) return;
    var ok = zeichen(i.value) >= MIN;
    k.textContent = ok ? '\u2713\u00a0' : '';
    h.toggleAttribute('data-ok', ok);
  }
  // Fehler am Feld: Meldung der Ansicht, Feld als ungültig markiert, Fokus ins Feld
  function feldFehler(ansicht, name, text) {
    meldungZeigen(ansicht, text);
    var i = feld(ansicht, name), m = schritte[ansicht].querySelector('[data-meldung]:not([data-google-meldung])');
    if (i) {
      i.setAttribute('aria-invalid', 'true');
      if (m) i.setAttribute('aria-describedby', eineId(m, 'r193-m-') + (i.hasAttribute('data-hinweis') ? ' ' + i.getAttribute('data-hinweis') : ''));
      i.focus();
    }
  }
  // Fehler vom Server oder Netz, die in jeder Ansicht gleich sind. mitHinweis: zweiter Absatz zur Mail-Grenze (nicht in „abgelaufen“)
  function sonstFehler(ansicht, r, mitHinweis) {
    if (r.netz) meldungZeigen(ansicht, satz('meldungen.netz'));
    else if (r.status === 429) meldungZeigen(ansicht, satz('meldungen.mailGrenze'), mitHinweis ? satz('meldungen.mailGrenzeHinweis') : null);
    else meldungZeigen(ansicht, satz('meldungen.stoerung'));   // 500 und höher und jeder unbekannte Status
  }
  // Sätze mit Adresse in die Ansicht schreiben: [data-mail] (nur die Adresse) und [data-satz="gruppe.name"] (ganzer Satz mit {mail})
  function fuellen(ansicht, mail) {
    var v = schritte[ansicht]; if (!v) return;
    v.querySelectorAll('[data-mail]').forEach(function (x) { x.textContent = mail; });
    v.querySelectorAll('[data-satz]').forEach(function (x) { var t = satz(x.getAttribute('data-satz'), { mail: mail }); if (t !== null) { x.textContent = t; x.hidden = false; } });
  }
  var MAILFORM = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
  function redirectZiel() { return location.origin + '/mein-bereich'; }                      // Google; R248: immer „Mein Bereich“
  function redirectWillkommen() { return location.origin + '/mein-bereich?willkommen'; }     // Bestätigung nach „Konto anlegen“
  function redirectPasswort() { return location.origin + '/mein-bereich?passwort'; }        // Link für ein neues Passwort; R248: auf „Mein Bereich“

  /* ——— Aufrufe an Supabase ——— */
  function registrieren(vorname, mail, pw) {
    return api('POST', '/auth/v1/signup?redirect_to=' + encodeURIComponent(redirectWillkommen()), { email: mail, password: pw, data: { vorname: vorname } });
  }
  function anmeldenSenden(mail, pw) { return api('POST', '/auth/v1/token?grant_type=password', { email: mail, password: pw }); }
  function vergessenSenden(mail) { return api('POST', '/auth/v1/recover?redirect_to=' + encodeURIComponent(redirectPasswort()), { email: mail }); }
  function nochmalSenden(mail) { return api('POST', '/auth/v1/resend', { type: 'signup', email: mail }); }
  function passwortSetzen(pw) {
    return api('PUT', '/auth/v1/user', { password: pw, data: { passwort: true } }, rec && rec.access_token);
  }
  function mailPruefen(ansicht) {
    var m = wertVon(ansicht, 'email').trim();
    if (!MAILFORM.test(m)) { feldFehler(ansicht, 'email', satz(ansicht === 'anmelden' ? 'anmelden.fehlerMailLeer' : 'anlegen.fehlerMailLeer')); return null; }
    return m;
  }

  /* ——— Konto anlegen ——— */
  function absendenAnlegen(e) {
    e.preventDefault();
    var f = e.currentTarget, v = wertVon('anlegen', 'vorname').trim(), pw = wertVon('anlegen', 'passwort');
    meldungWeg();
    if (!v) { feldFehler('anlegen', 'vorname', satz('anlegen.fehlerVorname')); return; }
    var m = mailPruefen('anlegen'); if (!m) return;
    var pf = passwortFehler(pw, 'anlegen');
    if (pf) { feldFehler('anlegen', 'passwort', pf); return; }
    var knopf = f.querySelector('button[type="submit"]');
    knopf.disabled = true;
    registrieren(v, m, pw).then(function (r) {
      knopf.disabled = false;
      var c = r.json && r.json.error_code;
      if (r.ok || (r.status === 422 && c === 'user_already_exists')) {   // auch „schon bestätigt“ führt hierher: die Seite verrät nichts
        merk.mail = m; feld('anlegen', 'passwort').value = ''; mailSchritt(); return;
      }
      if (r.status === 422 && c === 'weak_password') {
        var gruende = (r.json.weak_password && r.json.weak_password.reasons) || [];
        feldFehler('anlegen', 'passwort', gruende.length && gruende.indexOf('length') < 0 ? satz('anlegen.fehlerHaeufig') : satz('anlegen.fehlerKurz', { n: zeichen(pw) })); return;
      }
      if (r.status === 422 && c === 'password_too_long') { feldFehler('anlegen', 'passwort', satz('anlegen.fehlerLang')); return; }
      if ((r.status === 400 || r.status === 422) && (c === 'email_address_invalid' || c === 'validation_failed')) { feldFehler('anlegen', 'email', satz('anlegen.fehlerMailLeer')); return; }
      sonstFehler('anlegen', r, true);
    });
  }
  function mailSchritt() {
    fuellen('postfach', merk.mail);
    zeigeSchritt('postfach');
    sperreStarten();
    fokus('postfach');
  }
  // Zähler in der Ansicht „postfach“: [data-zaehler] zeigt nur die Sekunden (59 bis 1), [data-nochmal] ist bis 0 gesperrt
  function sperreStarten() {
    sperreBis = Date.now() + 60000;
    var v = schritte.postfach; if (!v) return;
    var k = v.querySelector('[data-nochmal]'), z = v.querySelector('[data-zaehler]'), box = v.querySelector('[data-zaehler-box]');
    clearInterval(zaehlerUhr);
    function takt() {
      var rest = Math.ceil((sperreBis - Date.now()) / 1000);
      if (rest > 0) {
        if (k) { k.disabled = true; k.setAttribute('aria-disabled', 'true'); }
        if (z) z.textContent = String(Math.min(59, rest));
        if (box) box.hidden = false;
      } else {
        if (k) { k.disabled = false; k.removeAttribute('aria-disabled'); }
        if (z) z.textContent = '';
        if (box) box.hidden = true;
        clearInterval(zaehlerUhr);
      }
    }
    takt(); zaehlerUhr = setInterval(takt, 1000);
  }
  // „Noch einmal schicken“ (postfach), „Link noch einmal schicken“ (anmelden, nicht bestätigt) und der Knopf in „abgelaufen“
  function nochmalKlick(ansicht) {
    var v = schritte[ansicht], k = v && v.querySelector('[data-nochmal]');
    if (!k || k.disabled) return;
    if (ansicht === 'postfach') {
      meldungWeg(); k.disabled = true;
      nochmalSenden(merk.mail).then(function (r) {
        if (!r.netz && r.status !== 429 && r.status < 500) { sperreStarten(); return; }   // jede andere Antwort gilt als gesendet
        k.disabled = false; sonstFehler('postfach', r, true);
        if (r.status === 429) sperreStarten();
      });
    } else if (ansicht === 'anmelden') {
      var m = mailPruefen('anmelden'); if (!m) return;
      meldungWeg(); k.disabled = true;
      nochmalSenden(m).then(function (r) {
        k.disabled = false;
        if (!r.netz && r.status !== 429 && r.status < 500) { merk.mail = m; mailSchritt(); return; }
        sonstFehler('anmelden', r, true);
      });
    } else if (ansicht === 'abgelaufen') {
      var a = mailPruefen('abgelaufen'); if (!a) return;
      meldungWeg(); k.disabled = true;
      var weiter = abgFall === 'bestaetigen' ? nochmalSenden(a) : vergessenSenden(a);
      weiter.then(function (r) {
        k.disabled = false;
        var gut = abgFall === 'bestaetigen' ? (!r.netz && r.status !== 429 && r.status < 500) : r.ok;
        if (!gut) { sonstFehler('abgelaufen', r, false); return; }
        if (abgFall === 'bestaetigen') { merk.mail = a; mailSchritt(); } else vergessenErfolg(a);
      });
    }
  }

  /* ——— Anmelden ——— */
  function absendenAnmelden(e) {
    e.preventDefault();
    var f = e.currentTarget, pw = wertVon('anmelden', 'passwort');
    meldungWeg();
    var nk = schritte.anmelden.querySelector('[data-nochmal]'); if (nk) nk.hidden = true;
    var m = mailPruefen('anmelden'); if (!m) return;
    if (!pw) { feldFehler('anmelden', 'passwort', satz('anmelden.fehlerPwLeer')); return; }
    var knopf = f.querySelector('button[type="submit"]');
    knopf.disabled = true;
    anmeldenSenden(m, pw).then(function (r) {
      knopf.disabled = false;
      var j = r.json || {}, c = j.error_code || j.error;
      if (r.ok && j.access_token && j.refresh_token) {
        wechselnZu({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || (jetzt() + (j.expires_in || 3600)), email: (j.user && j.user.email) || m, vorname: '', pw: true }).then(function (alt) {
          var ab = userHolen().then(function (u) { return u && sitzung() ? abgleichen(u, true, alt) : null; }).then(anzeigen);
          if (/\/mein-bereich(\.html)?$/.test(location.pathname)) { dlg.close(); anzeigen(); }
          else {   // R248 (Yannis 07.11.2026): nach der Anmeldung „Mein Bereich“; erst abgleichen (höchstens 5 s), damit gemerkte Ideen mitkommen
            knopf.disabled = true;
            var los = function () { location.assign('/mein-bereich'); };
            Promise.race([ab, new Promise(function (r) { setTimeout(r, 5000); })]).then(los, los);
          }
        });
        return;
      }
      if (r.status === 400 && c === 'invalid_credentials') {
        feld('anmelden', 'passwort').value = '';
        feldFehler('anmelden', 'passwort', satz('anmelden.fehlerFalsch')); return;
      }
      if (r.status === 400 && c === 'email_not_confirmed') {
        meldungZeigen('anmelden', satz('anmelden.fehlerNichtBestaetigt'));
        if (nk) { nk.textContent = satz('anmelden.knopfNochmal', null, nk.textContent); nk.hidden = false; }
        return;
      }
      if (r.status === 429) { meldungZeigen('anmelden', satz('anmelden.fehlerViele')); return; }   // Anmelden: eigener Satz, nicht die Mail-Grenze
      sonstFehler('anmelden', r, false);
    });
  }

  /* ——— Passwort vergessen ——— */
  function vergessenOeffnen() {
    var m = wertVon('anmelden', 'email').trim();
    oeffnen('vergessen');
    var i = feld('vergessen', 'email'); if (i && m) i.value = m;
    fokus('vergessen');
  }
  function vergessenErfolg(mail) {
    fuellen('vergessen', mail);
    zeigeSchritt('vergessen');
    erfolgSchalten('vergessen', true);
    var e = schritte.vergessen.querySelector('[data-erfolg]');
    if (e) { e.setAttribute('tabindex', '-1'); e.focus({ preventScroll: true }); }
  }
  function absendenVergessen(e) {
    e.preventDefault();
    meldungWeg();
    var m = mailPruefen('vergessen'); if (!m) return;
    var knopf = e.currentTarget.querySelector('button[type="submit"]');
    knopf.disabled = true;
    vergessenSenden(m).then(function (r) {
      knopf.disabled = false;
      if (r.ok) { vergessenErfolg(m); return; }   // immer derselbe Satz, auch bei unbekannter Adresse
      sonstFehler('vergessen', r, true);
    });
  }

  /* ——— Neues Passwort (nach dem Link aus der Mail) ——— */
  function neuZeigen() {
    if (!dlg || !rec) return;
    neuMail = '';
    oeffnen('neu');
    var fuer = schritte.neu.querySelectorAll('[data-satz="neu.fuer"]'); fuer.forEach(function (x) { x.hidden = true; });
    api('GET', '/auth/v1/user', undefined, rec.access_token).then(function (r) {
      if (r.ok && r.json && r.json.email) { neuMail = r.json.email; fuellen('neu', neuMail); return; }
      if (r.status === 401 || r.status === 403) { rec = null; abgelaufenZeigen('passwort'); }   // Link schon benutzt oder nicht mehr gültig
    });
  }
  function absendenNeu(e) {
    e.preventDefault();
    var pw = wertVon('neu', 'passwort');
    meldungWeg();
    var pf = passwortFehler(pw, 'neu');
    if (pf) { feldFehler('neu', 'passwort', pf); return; }
    if (!rec) { abgelaufenZeigen('passwort'); return; }
    var knopf = e.currentTarget.querySelector('button[type="submit"]');
    knopf.disabled = true;
    passwortSetzen(pw).then(function (r) {
      knopf.disabled = false;
      var c = r.json && r.json.error_code;
      var fertig = r.ok || (r.status === 422 && c === 'same_password');   // gleiches Passwort wie vorher: Ziel erreicht, Satz-Frage an Pam offen
      if (fertig) {
        var t = rec; rec = null;
        wechselnZu({ access_token: t.access_token, refresh_token: t.refresh_token, expires_at: t.expires_at, email: neuMail, vorname: '', pw: true }).then(function (alt) {
          feld('neu', 'passwort').value = '';
          erfolgSchalten('neu', true);
          var ez = schritte.neu.querySelector('[data-erfolg]');
          if (ez) { ez.setAttribute('tabindex', '-1'); ez.focus({ preventScroll: true }); }
          anzeigen();
          (r.ok ? Promise.resolve() : metaSchreiben({ passwort: true })).then(userHolen).then(function (u) { return u && sitzung() ? abgleichen(u, true, alt) : null; }).then(anzeigen);
        });
        return;
      }
      if (r.status === 401 || r.status === 403) { rec = null; abgelaufenZeigen('passwort'); return; }
      if (r.status === 422 && c === 'weak_password') {
        var gruende = (r.json.weak_password && r.json.weak_password.reasons) || [];
        feldFehler('neu', 'passwort', gruende.length && gruende.indexOf('length') < 0 ? satz('anlegen.fehlerHaeufig') : satz('anlegen.fehlerKurz', { n: zeichen(pw) })); return;
      }
      if (r.status === 422 && c === 'password_too_long') { feldFehler('neu', 'passwort', satz('neu.fehlerLang')); return; }
      if (r.netz) meldungZeigen('neu', satz('meldungen.netz'));
      else meldungZeigen('neu', satz('meldungen.stoerung'));   // auch 429 und alles Unbekannte (hier wird keine Mail geschickt)
    });
  }

  /* ——— Link abgelaufen ——— */
  // fall: 'bestaetigen' (Mail zum Bestätigen), 'passwort' (Mail für ein neues Passwort), 'rueckfall' (ohne Markierung)
  function abgelaufenZeigen(fall) {
    if (!dlg) return;
    abgFall = fall;
    var v = schritte.abgelaufen; if (!v) return;
    var g = fall === 'bestaetigen' ? 'abgelaufen.bestaetigen.' : (fall === 'passwort' ? 'abgelaufen.passwort.' : 'abgelaufen.');
    oeffnen('abgelaufen');
    var t = v.querySelector('[data-abgelaufen-text]'); if (t) t.textContent = satz(g + 'text', null, '');
    var z = v.querySelector('[data-abgelaufen-zusatz]');
    if (z) { var zs = fall === 'bestaetigen' ? satz('abgelaufen.bestaetigen.zusatz') : null; z.textContent = zs || ''; z.hidden = !zs; }
    var k = v.querySelector('[data-nochmal]'); if (k) { k.textContent = satz(g + 'knopf', null, k.textContent); k.disabled = false; }
    var i = feld('abgelaufen', 'email'); if (i) i.value = '';
    fokus('abgelaufen');
  }
  function googleStarten() {
    var a = document.createElement('a');
    a.href = URL_ + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(redirectZiel());
    a.referrerPolicy = 'no-referrer'; a.rel = 'noreferrer';
    document.body.appendChild(a); a.click(); a.remove();
  }
  function umschalten(ziel) {
    var mail = wertVon(aktuell, 'email');
    zeigeSchritt(ziel);
    var i = feld(ziel, 'email'); if (i && mail && !i.value) i.value = mail;
    fokus(ziel);
  }
  function fensterBauen() {
    dlg = document.getElementById('v25r7');
    if (!dlg) return;
    ANSICHTEN.forEach(function (k) { var v = dlg.querySelector('[data-ansicht="' + k + '"]'); if (v) schritte[k] = v; });
    if (!schritte.anlegen || !schritte.anmelden) { dlg = null; return; }
    // Schließen, wenn das Fenster nicht von der Seite selbst vorbereitet wird (Mein Bereich hat den R117-Block nicht)
    if (!window.v25r7Oeffnen) {
      dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('[data-v25r7-zu]')) dlg.close(); });
    }
    [['anlegen', absendenAnlegen], ['anmelden', absendenAnmelden], ['vergessen', absendenVergessen], ['neu', absendenNeu]].forEach(function (x) {
      var f = schritte[x[0]] && schritte[x[0]].querySelector('form'); if (f) f.addEventListener('submit', x[1]);
    });
    // Alle Knöpfe im Fenster, nach Marke
    dlg.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-umschalten],[data-vergessen],[data-google],[data-v25r7-google],[data-nochmal],[data-andere],[data-r186-ideen],[data-erfolg] button') : null;
      if (!t || !dlg.contains(t)) return;
      var v = t.closest('[data-ansicht]'), name = v ? v.getAttribute('data-ansicht') : aktuell;
      if (t.hasAttribute('data-umschalten')) { e.preventDefault(); umschalten(t.getAttribute('data-umschalten')); }
      else if (t.hasAttribute('data-vergessen')) { e.preventDefault(); vergessenOeffnen(); }
      else if (t.hasAttribute('data-google') || t.hasAttribute('data-v25r7-google')) { e.preventDefault(); googleStarten(); }
      else if (t.hasAttribute('data-nochmal')) { e.preventDefault(); nochmalKlick(name); }
      else if (t.hasAttribute('data-andere')) {   // „Andere E-Mail-Adresse“ im Postfach: zurück zu „Konto anlegen“, Vorname bleibt
        e.preventDefault(); zeigeSchritt('anlegen'); var em = feld('anlegen', 'email'); if (em) { em.value = ''; em.focus(); }
      }
      else if (t.hasAttribute('data-r186-ideen')) {
        if (/\/mein-bereich(\.html)?$/.test(location.pathname)) { e.preventDefault(); dlg.close(); }
      }
      else if (t.matches('[data-erfolg] button') && !t.hasAttribute('data-umschalten')) dlg.close();   // „Zu meinen Ideen“ nach dem Speichern
    });
    // Wird das Fenster von der Seite geöffnet (zweites Herz), beginnt es in „Konto anlegen“
    beobachter = new MutationObserver(function () {
      if (!dlg.open || eigenesOeffnen) return;
      if (sitzung()) { dlg.close(); return; }
      zeigeSchritt('anlegen');
      var hh = document.getElementById('hh-sheet');
      if (!zurueck && hh && !hh.hidden) zurueck = document.querySelector('.hh-oeffner');   // Öffner ist hier nicht mehr bekannt: Hilfe-Knopf
      hilfeZu();
      fokus(aktuell);
    });
    beobachter.observe(dlg, { attributes: true, attributeFilter: ['open'] });
    dlg.addEventListener('input', function (e) { var i = e.target; if (i && i.matches && i.matches('input[name="passwort"][data-hinweis]')) hakenAktualisieren(i); });
    dlg.addEventListener('close', function () {
      clearInterval(zaehlerUhr); aktuell = 'anlegen';
      dlg.querySelectorAll('input[name="passwort"]').forEach(function (i) { i.value = ''; hakenAktualisieren(i); });   // das Passwort bleibt nicht in der Seite stehen
      var z = zurueck; zurueck = null;
      if (z && document.contains(z) && z.getClientRects().length > 0 && !z.closest('[hidden]')) z.focus();
    });
  }

  /* ——— Willkommen ——— */
  function willkommenZeigen(user) {
    if (!dlg || !schritte.willkommen) return;
    var n = vornameVon(user);
    dlg.querySelectorAll('[data-v25r7-name]').forEach(function (x) { x.textContent = n; });
    var a = (user && user.app_metadata) || {}, prov = Array.isArray(a.providers) ? a.providers : [];
    var perMail = a.provider ? a.provider === 'email' : prov.indexOf('email') >= 0;   // W2: Passwort-Satz nur nach der Registrierung per E-Mail
    var ps = satz(perMail ? 'willkommen.satzMail' : 'willkommen.satzGoogle');
    var pe = schritte.willkommen.querySelector('[data-willkommen-passwortsatz]'); if (pe && ps) pe.textContent = ps;
    oeffnen('willkommen');
    metaSchreiben({ willkommen: new Date().toISOString() });
  }

  /* ——— R228 (Ryan, 04.11.2026): Menü-Logik abgemeldet/angemeldet ———
     html.ki-angemeldet bzw. html.ki-abgemeldet; [data-nur-angemeldet] und [data-nur-abgemeldet] schalten über hidden;
     [data-ki-anmelden] öffnet die Anmeldung, [data-ki-abmelden] meldet ab, .nav-mein öffnet abgemeldet die Anmeldung statt zu navigieren. */
  function stand() {
    var an = !!sitzung(), h = document.documentElement;
    h.classList.toggle('ki-angemeldet', an); h.classList.toggle('ki-abgemeldet', !an);
    if (document.head && !document.getElementById('r228-stil')) {
      var st = document.createElement('style'); st.id = 'r228-stil';
      st.textContent = '[data-nur-angemeldet][hidden],[data-nur-abgemeldet][hidden]{display:none!important}html.ki-abgemeldet .nav-herz{display:none!important}';
      document.head.appendChild(st);
    }
    document.querySelectorAll('[data-nur-angemeldet]').forEach(function (e) { if (e.hidden !== !an) e.hidden = !an; });
    document.querySelectorAll('[data-nur-abgemeldet]').forEach(function (e) { if (e.hidden !== an) e.hidden = an; });
    if (window.kiHerzZeichnen) { try { window.kiHerzZeichnen(); } catch (e) { /* weiter */ } }
  }
  function ksKlicks() {
    document.addEventListener('click', function (e) {
      if (!e.target.closest || e.button) return;
      var ab = e.target.closest('[data-ki-abmelden]');
      if (ab) { e.preventDefault(); abmelden(); return; }
      var mein = e.target.closest('.nav-mein');
      var an = e.target.closest('[data-ki-anmelden]') || (mein && !sitzung() && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) ? mein : null);
      if (!an || !dlg) return;
      e.preventDefault(); e.stopPropagation();
      oeffnen('anmelden');
    }, true);
  }
  /* R228: Ideen, die abgemeldet angetippt wurden (Warteliste ki-herzen-wartend), nach der Anmeldung wie jedes andere Herz speichern:
     in die Herzen dieses Browsers schreiben, herzGeaendert schiebt sie ins Konto. Danach ist die Warteliste leer. */
  var WARTEND = 'ki-herzen-wartend';
  function wartendUebernehmen() {
    if (!KI || !sitzung() || lsLesen(WARTEND) == null) return;
    var w = {};
    try { w = alsKarte(JSON.parse(lsLesen(WARTEND))); } catch (e) { w = {}; }
    var ids = Object.keys(w);
    if (ids.length) {
      var h = Object.assign({}, herzenLokal());
      ids.forEach(function (id) { if (!h[id]) h[id] = { titel: w[id].titel, am: w[id].am || Date.now() }; });
      KI.schreib(KI.K.herzen, h);
    }
    lsSchreiben(WARTEND, null);
    if (window.kiHerzZeichnen) { try { window.kiHerzZeichnen(); } catch (e) { /* weiter */ } }
  }

  /* ——— Kopf ——— */
  function kopfNamen() {
    var s = sitzung();
    document.querySelectorAll('.nav-mein .nav-mein__text').forEach(function (t) {
      var soll = !s ? 'Anmelden' : 'Mein Bereich';   // R231 (Pam), über R246: angemeldet steht im Kopf immer „Mein Bereich“, der Vorname bleibt im Kreis (Anfangsbuchstabe) und in der Begrüßung   // R228: abgemeldet „Anmelden“
      if (t.textContent !== soll) t.textContent = soll;
    });
  }

  /* ——— Mein Bereich: Konto-Block ——— */
  var block = null;
  function anzeigen() {
    kopfNamen(); stand();
    if (!block) return;
    var s = sitzung();
    block.querySelector('[data-r186-aus]').hidden = !!s;
    block.querySelector('[data-r186-an]').hidden = !s;
    if (s) {
      block.querySelector('[data-name]').textContent = s.vorname || '';
      block.querySelector('[data-mail]').textContent = s.email || '';
      var kp = block.querySelector('[data-konto-passwort]');
      if (kp) { var t = satz(s.pw ? 'konto.aendern' : 'konto.festlegen'); if (t && kp.textContent !== t) kp.textContent = t; }   // W4
    }
  }

  function R186s(k) { var x = satz('konto186.' + k); return x !== null ? x : R186[k]; }
  function status(text, dringend, zusatz) {
    if (!block) return;
    var p = block.querySelector('[data-r186-status]');
    p.setAttribute('role', dringend ? 'alert' : 'status');   // 186c: Abbruch als alert, sonst wie bisher
    p.textContent = ''; setTimeout(function () {
      p.textContent = text || '';
      if (!zusatz) return;
      // 186d (Pam): zweiter Absatz mit 8 px Abstand, reiner Text, in derselben Meldung
      var z = document.createElement('span');
      z.setAttribute('data-r186-status-zusatz', '');
      z.style.display = 'block'; z.style.marginTop = '8px';
      z.textContent = zusatz;
      p.appendChild(z);
    }, 20);
  }
  function abmelden() {
    var s = sitzung();
    if (!s) return Promise.resolve();
    var vorher = s.offen || s.soffen ? allesPushen() : Promise.resolve(true);
    var hatte = Object.keys(herzenLokal()).length > 0;   // Rückfall; maßgeblich sind die Herzen im Konto (unten)
    return vorher.then(function (ok) {
      // 186c (Dwights R8): Kamen die gemerkten Ideen nicht ins Konto (etwa ohne Verbindung), nicht abmelden und nichts leeren.
      // Angemeldet bleiben, Fokus bleibt auf „Abmelden“, die Meldung bleibt stehen bis zum nächsten Versuch.
      // H2: Den Netz-Satz nur ohne Verbindung, bei Serverfehlern Pams eigener Satz.
      if (!ok && sitzung()) {
        if (letzteOhneNetz) status(R186s('ohneVerbindung'), true);
        else status(R186s('serverFehler'), true, R186s('serverFehlerHinweis'));
        return;
      }
      return userHolen().then(function (u) { if (u) hatte = Object.keys(alsKarte((u.user_metadata || {}).herzen)).length > 0; })
      .then(function () {
        var s1 = sitzung();
        return s1 && s1.access_token ? logoutSenden(s1) : null;
      }).then(function () {
        var text = hatte ? R186s('abgemeldet') : satz('konto.abgemeldet', null, 'Du bist abgemeldet.');
        lokalAbmelden();
        herzenSetzen({});   // die Herzen dieses Kontos liegen im Konto
        sSetzen([]);   // R195: die Sammlungen auch
        anzeigen();
        status(text);
        if (KI && KI.toast) KI.toast(text);
      });
    });
  }
  function loeschenFragen() {
    var d = document.getElementById('r186-loeschen');
    if (!d) return;
    d.querySelector('[data-meldung]').hidden = true;
    d.showModal();
    d.querySelector('[data-abbrechen]').focus();
  }
  function loeschen() {
    var d = document.getElementById('r186-loeschen'), knopf = d.querySelector('[data-ja]');
    knopf.disabled = true;
    mitSitzung('POST', '/rest/v1/rpc/konto_loeschen', {}).then(function (r) {
      knopf.disabled = false;
      if (r.ok || r.status === 204) {
        lokalAbmelden(); anzeigen(); d.close();
        status(satz('konto.geloescht', null, 'Dein Konto ist gelöscht. Deine gemerkten Ideen und Sammlungen bleiben in diesem Browser.'));
        if (KI && KI.toast) KI.toast(satz('konto.geloescht', null, ''));
      } else if (!r.keineSitzung) {
        var m = d.querySelector('[data-meldung]'); m.textContent = satz(r.netz ? 'meldungen.netz' : 'meldungen.stoerung', null, ''); m.hidden = false;
      } else d.close();
    });
  }
  function herunterladen() {
    Promise.all([userHolen(), sHolen()]).then(function (ab) {
      var u = ab[0], sl = ab[1], s = sitzung();
      if (!u || !sl) { status(satz(letzteOhneNetz ? 'meldungen.netz' : 'meldungen.stoerung', null, '')); return; }
      var h = alsKarte((u.user_metadata || {}).herzen);
      var daten = {
        email: u.email || (s && s.email) || '',
        vorname: vornameVon(u),
        gemerkte_ideen: Object.keys(h).map(function (id) { return { id: id, titel: TITEL[id] || h[id].titel || id, gemerkt_am: h[id].am ? new Date(h[id].am).toISOString() : null }; }),
        sammlungen: sl.map(function (x) { return { name: x.name, emoji: x.emoji, ideen: x.items, angelegt_am: x.am ? new Date(x.am).toISOString() : null }; }),
        angemeldet_seit: u.created_at || null,
        erstellt_am: new Date().toISOString()
      };
      var blob = new Blob([JSON.stringify(daten, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob); a.download = 'meine-daten-die-ki-macherei.json';
      document.body.appendChild(a); a.click();
      setTimeout(function () { window.URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      status(R186s('heruntergeladen'));
    });
  }
  // „Passwort ändern“ / „Passwort festlegen“ in Mein Bereich: schickt den Link für ein neues Passwort an die eigene Adresse
  function kontoPasswort(knopf) {
    var s = sitzung(), p = block.querySelector('[data-konto-passwort-meldung]');
    if (!s || !p) return;
    function zeigen(text, zusatz, alarm) {
      p.setAttribute('role', alarm ? 'alert' : 'status'); p.textContent = text; p.hidden = false;
      if (!alarm) { p.setAttribute('tabindex', '-1'); p.focus({ preventScroll: true }); }   // Statuszeile bekommt den Fokus (Vorleser)
      if (zusatz) { var z = document.createElement('span'); z.style.display = 'block'; z.style.marginTop = '8px'; z.textContent = zusatz; p.appendChild(z); }
    }
    knopf.disabled = true;
    (s.email ? Promise.resolve(s.email) : userHolen().then(function (u) { return u && u.email || ''; })).then(function (mail) {
      if (!mail) { knopf.disabled = false; zeigen(satz(letzteOhneNetz ? 'meldungen.netz' : 'meldungen.stoerung', null, ''), null, true); return; }
      return vergessenSenden(mail).then(function (r) {
        knopf.disabled = false;
        if (r.ok) zeigen(satz('konto.gesendet', { mail: mail }, ''), null, false);
        else if (r.netz) zeigen(satz('meldungen.netz', null, ''), null, true);
        else if (r.status === 429) zeigen(satz('meldungen.mailGrenze', null, ''), satz('meldungen.mailGrenzeHinweis'), true);
        else zeigen(satz('meldungen.stoerung', null, ''), null, true);
      });
    });
  }
  function blockBauen() {
    block = document.getElementById('r186-konto');
    if (!block) return;
    block.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-r186-abmelden')) abmelden();
      else if (b.hasAttribute('data-r186-daten')) herunterladen();
      else if (b.hasAttribute('data-r186-loeschen')) loeschenFragen();
      else if (b.hasAttribute('data-konto-passwort')) kontoPasswort(b);
    });
    var d = document.getElementById('r186-loeschen');
    if (d) {
      d.addEventListener('click', function (e) {
        if (e.target === d || e.target.closest('[data-abbrechen]')) d.close();
        else if (e.target.closest('[data-ja]')) loeschen();
      });
    }
  }

  /* ——— Start ——— */
  function start() {
    fensterBauen();
    blockBauen();
    // „Alles in diesem Browser löschen“ meldet zusätzlich lokal ab: logout?scope=local (ohne Netz trotzdem lokal löschen)
    if (window.KIMerk && window.KIMerk.alleLoeschen) {
      var alle = window.KIMerk.alleLoeschen;
      window.KIMerk.alleLoeschen = function () {
        var sz = sitzung();
        if (sz && sz.access_token) { try { logoutSenden({ access_token: sz.access_token, refresh_token: sz.refresh_token, expires_at: sz.expires_at }, true); } catch (e) { /* lokal trotzdem */ } }
        lokalAbmelden();
        var r = alle.apply(this, arguments);
        lokalAbmelden();
        try { anzeigen(); } catch (e) { /* Seite lädt gleich neu */ }
        return r;
      };
    }
    if (KI && KI.hoer) { KI.hoer(herzGeaendert); KI.hoer(sammlungGeaendert); KI.hoer(kopfNamen); }
    // Die Herz-Knöpfe der Seiten schreiben selbst in den Speicher und melden erst nach der Flugbahn; deshalb nach jedem Tipp selbst nachsehen
    document.addEventListener('click', function (e) {
      setTimeout(sammlungGeaendert, 60); setTimeout(sammlungGeaendert, 1400);   // R195: Sammlungsfenster, Umbenennen, Löschen
      if (!e.target.closest('[data-herz], [data-sammlung-fuer]')) return;
      setTimeout(herzGeaendert, 60); setTimeout(herzGeaendert, 1400);
    });
    ['submit', 'change'].forEach(function (art) { document.addEventListener(art, function () { setTimeout(sammlungGeaendert, 60); }, true); });
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-r186-anmelden]');
      if (!t || !dlg) return;
      e.preventDefault();
      oeffnen('anmelden');
    });
    ksKlicks();
    window.addEventListener('storage', function (e) {
      if (e.key !== SK) return;
      if (!sitzung()) kontoLokalWeg();
      anzeigen();
    });
    var ein = document.getElementById('v47-ein');   // Einstiegsfenster: nie gleichzeitig mit der Anmeldung (es wird nur geschlossen, es schreibt hier nichts)
    if (ein && window.MutationObserver) new MutationObserver(function () { if (ein.open && dlg && dlg.open) ein.close(); }).observe(ein, { attributes: true, attributeFilter: ['open'] });
    var h = hashLesen();
    // frische Anmeldung per Link oder Google: erst die alte Sitzung abwickeln, dann umschalten
    if (h && h.tokens && neueSitz) wechselnZu(neueSitz).then(function (alt) { altSitz = alt; startRest(h); }); else startRest(h);
  }
  function startRest(h) {
    var s = sitzung();
    letzteSig = sig(herzenLokal());
    sLetzt = JSON.stringify(sLokal());
    if (h && h.recovery) neuZeigen();
    else if (h && h.fehler === 'abgelaufen') { if (!s) abgelaufenZeigen(h.fall); }   // mit Sitzung: kein „abgelaufen“, die Seite zeigt das Konto
    else if (h && h.fehler && dlg && !s) oeffnen('anmelden', satz(h.fehler === 'google' ? 'meldungen.google' : 'meldungen.stoerung'), h.fehler === 'google');
    if (!s) { kontoLokalWeg(); anzeigen(); return; }   // ohne Sitzung: keine Anfrage
    if (s.vorname) kontoLokalSetzen(s.vorname);
    anzeigen();
    userHolen().then(function (u) {
      if (!u || !sitzung()) return;
      var frisch = !!(h && h.tokens);
      var neu = !(u.user_metadata && u.user_metadata.willkommen);
      return abgleichen(u, frisch, altSitz).then(function () {
        anzeigen();
        if (frisch && neu) willkommenZeigen(u);
      });
    });
  }
  stand();
  window.KIAuth = { eingeloggt: function () { return !!sitzung(); }, abmelden: abmelden, oeffnen: oeffnen, nutzerUrl: URL_, r193: true, r195: true };
  if (!KI) return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
