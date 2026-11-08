/*
 * Messung über Umami Cloud, Fassung 2 – Stand 08.11.2026 (Claude, Yannis' eigene Sitzung)
 *
 * Yannis, 08.11.2026: „dass alles, möglichst alles, über Umami läuft … ich will einen Ort, wo ich alles auch selbst verstehe“.
 * Konzept: 02 Projekte/KI-Plattform/System/Messkonzept Umami (2026-11-08).md. Ersetzt messung-umami.js (Fassung 1, 05.11.)
 * unter dem Namen /messung.js; eingebaut durch Designvorschauen/version25_messung2.py. Alles aus Fassung 1 bleibt
 * (window.Messung.senden → umami.track, Ausschalter ?messung=aus|an, Testmodus, Zugangsdaten raus, Scrolltiefe,
 * Kennung der Angemeldeten). Neu:
 *
 * 1. Menschen: bei der ersten echten Bedienung (Tippen, Klicken, Taste, Scrollen) einmal je Seitenaufruf
 *    umami.identify({mensch:'ja', herkunft, zweig, generation}) (so trägt jede Umami-Sitzung das Merkmal, auch nach
 *    Netzwechsel oder Anmeldung). In Umami (lesbare Namen, Punkt 7): Sitzungseigenschaft „Mensch“ = „ja“ (Segment „Menschen“).
 * 2. Herkunft und Empfehlung: Erstkontakt je Browser in localStorage „ki-herkunft“ {herkunft, zweig, generation}.
 *    zweig = utm_content oder utm_source des ersten Links (z. B. wa-01), sonst google, social, direkt …
 *    Eigener Weitergabe-Code „<zweig>.<generation+1>“ steht als ?von=… in der Adresszeile (gesetzt, bevor Umami startet)
 *    und hängt an jedem geteilten oder kopierten Seitenlink. Kommt jemand mit fremdem ?von=…, ist er Empfehlung Stufe n.
 *    An Umami geht die ursprüngliche Adresse; ein eingehender Code wird als utm_* übersetzt (utm_source=empfehlung,
 *    utm_medium=referral, utm_campaign=live-start, utm_content=<zweig>, utm_term=stufe-<n>) → Bericht UTM.
 *    Ereignis „erstkontakt“ {herkunft, zweig, generation} einmal je Browser, bei der ersten echten Bedienung.
 *    Ereignis „geteilt“ {fall, weg: menue|kopiert} nach erfolgreichem Teilen oder Kopieren eines Seitenlinks.
 * 3. Anmeldung: auth.js meldet über window.__mvVorab bzw. Messung.senden. Bei Rückkehr aus Bestätigungslink oder Google
 *    (Hash mit access_token) wartet die Kennung, bis konto_bestaetigt bzw. angemeldet noch in der bisherigen Sitzung
 *    gesendet ist; Referrer von Supabase oder Google-Anmeldung zählt nicht als Herkunft.
 * 4. Keller-Film: film_start bzw. film_nochmal, film_sekunde {sekunde: 3, 6 … 30} nach tatsächlich abgespielter Zeit,
 *    film_ende; je {fassung: computer|handy-hoch|handy-quer|ruhig}.
 * 5. Use Cases: start_knopf {anbieter, weg} beim Tippen auf einen Start-Knopf, start_hilfe wenn danach das Hilfefenster
 *    kommt, start_klick (messpunkte.js) wenn die KI wirklich aufgeht, weiterer_fall {anzahl} ab dem zweiten Fall.
 * 6. Rückmeldung: rueckmeldung_geoeffnet und rueckmeldung_abgeschickt {abfrage, antwort: klappt-nicht|wunsch|idee} am
 *    Rückmeldefenster (R187). Rückkehrkarte nach dem Chat (R64): umfrage_antwort {abfrage: rm-entwuerfe|rm-leicht|rm-wieder,
 *    antwort} je angetippter Antwort, umfrage_text {abfrage: rm-text}, wenn ein Freitext abgeschickt wird. Freitexte selbst
 *    gehen nie an Umami, nur wie bisher in die Google-Tabelle.
 * 7. Lesbare Namen (08.11.2026, Yannis): Unmittelbar vor dem Versand übersetzt fuerUmami() jede Kennung in einen deutschen
 *    Namen, den Yannis in Umami ohne Erklärung versteht (z. B. film_ende → „Keller-Film: zu Ende gesehen“, Angabe
 *    fassung → „Film-Fassung“, rm-leicht → „2. War es leicht, loszulegen?“, Ideen-Kürzel r49 → „Idee: Wenn Eltern älter
 *    werden“). Ereignisnamen höchstens 50 Zeichen und ohne Komma (Umamis Filter trennt an Kommas). Intern und im Testmodus
 *    (__messungTest, Ereignis „messung-test“) bleiben die Kennungen. Die übersetzte Fassung steht im Testmodus unter
 *    art 'event'/'identify', aber nur dort, wo Umami sendet: auf die-ki-macherei.de mit ?messung=test oder lokal, wenn
 *    localhost in data-domains steht (sonst hält Umami schon vor data-before-send an).
 */
(function (fenster) {
  'use strict';
  var doc = fenster.document;
  if (!doc) return;
  var nav = fenster.navigator || {};
  var ort = fenster.location || {};
  var MARKE = 'Messung über Umami Cloud, Fassung 2';
  var UMLAUTE = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
  var ZAHLEN = ['prozent', 'sekunde', 'generation', 'anzahl'];
  var ANGABEN = ['fall', 'einstieg', 'anbieter', 'abfrage', 'antwort', 'herkunft', 'zweig', 'fassung', 'weg', 'grund', 'ort']
    .concat(ZAHLEN);
  var GEHEIM = /^(access_token|refresh_token|provider_token|provider_refresh_token|code|token|token_hash|error_description)$/i;
  var AUS = 'umami.disabled', ALT_AUS = 'kiosk-zaehlung-aus', SITZUNG = 'ki-sitzung';
  var HERKUNFT = 'ki-herkunft', ERSTKONTAKT = 'ki-erstkontakt', GESTARTET = 'ki-gestartet';
  var PARAM = 'von';
  var KI = [[/(^|\.)chatgpt\.com$/, 'chatgpt'], [/(^|\.)claude\.ai$/, 'claude'], [/(^|\.)gemini\.google\.com$/, 'gemini']];
  var ANMELDE_HOSTS = /(^|\.)supabase\.co$|^accounts\.google\.|^accounts\.youtube\.|(^|\.)googleusercontent\.com$/;

  var speicher = null, tabSpeicher = null;
  try { speicher = fenster.localStorage; } catch (f) { /* privates Fenster, gesperrte Websitedaten */ }
  try { tabSpeicher = fenster.sessionStorage; } catch (f) { /* dito */ }
  // Ohne dauerhaften Speicher (privates Fenster mancher Browser) kein Weitergabe-Code und kein Erstkontakt: der Code wäre
  // auf der nächsten Seite ein anderer, der Erstkontakt käme bei jedem Aufruf neu.
  var dauerhaft = false;
  try { speicher.setItem('ki-probe', '1'); speicher.removeItem('ki-probe'); dauerhaft = true; } catch (f) { /* bleibt false */ }
  function lies(k, s) { try { s = s || speicher; return s ? s.getItem(k) : null; } catch (f) { return null; } }
  function schreib(k, v, s) { try { s = s || speicher; if (s) s.setItem(k, v); } catch (f) { /* voll oder gesperrt */ } }
  function liesJson(k, s) { try { return JSON.parse(lies(k, s) || 'null'); } catch (f) { return null; } }

  /** Kennung: a–z, 0–9, Bindestrich, höchstens 60 Zeichen. */
  function kennung(wert) {
    return String(wert == null ? '' : wert).trim().toLowerCase()
      .replace(/[äöüß]/g, function (z) { return UMLAUTE[z]; })
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[\s_.]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').slice(0, 60).replace(/^-+|-+$/g, '');
  }

  /** Kurze Bestätigung oben in der Mitte, unter dem Seitenkopf; verschwindet nach 3,5 Sekunden (wie Fassung 1). */
  function bestaetigen(text) {
    function zeigen() {
      if (!doc.body) return;
      var el = doc.createElement('div');
      el.setAttribute('role', 'status');
      el.textContent = text;
      var oben = 16, kanten = ['.site-nav', '.live-aufbau'];
      for (var i = 0; i < kanten.length; i++) {
        var k = doc.querySelector(kanten[i]);
        var unten = k && k.getBoundingClientRect ? k.getBoundingClientRect().bottom : 0;
        if (unten > 0) { oben = Math.round(unten) + 8; break; }
      }
      el.style.cssText = 'position:fixed;left:50%;top:calc(' + oben + 'px + env(safe-area-inset-top, 0px));transform:translateX(-50%);z-index:2147483647;width:max-content;max-width:calc(100% - 32px);box-sizing:border-box;' +
        'padding:10px 18px;border-radius:999px;background:#2b2420;color:#fff;font:600 15px/1.4 system-ui,sans-serif;' +
        'box-shadow:0 6px 18px rgba(0,0,0,.18);text-align:center';
      doc.body.appendChild(el);
      fenster.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3500);
    }
    if (doc.body) zeigen(); else doc.addEventListener('DOMContentLoaded', zeigen);
  }

  /** Ausschalter: ?messung=aus|an, gemerkt unter „umami.disabled“. Läuft vor dem Umami-Skript. */
  function ausschalter() {
    var wunsch = (/[?&]messung=(aus|an)(?:&|$)/.exec(ort.search || '') || [])[1];
    var aus = false;
    try {
      if (speicher && speicher.getItem(ALT_AUS)) { speicher.setItem(AUS, '1'); speicher.removeItem(ALT_AUS); }
      if (wunsch === 'aus' && speicher) speicher.setItem(AUS, '1');
      if (wunsch === 'an' && speicher) speicher.removeItem(AUS);
      aus = speicher ? !!speicher.getItem(AUS) : wunsch === 'aus';
    } catch (f) {
      aus = wunsch === 'aus';
    }
    if (wunsch) {
      bestaetigen(aus ? 'Zählung auf diesem Gerät aus' : 'Zählung auf diesem Gerät an');
      try {
        var rest = (ort.search || '').replace(/^\?/, '').split('&').filter(function (t) { return t && !/^messung=(aus|an)$/.test(t); });
        fenster.history.replaceState(fenster.history.state, '', (ort.pathname || '') + (rest.length ? '?' + rest.join('&') : '') + (ort.hash || ''));
      } catch (f) { /* Adresse bleibt dann, schadet nicht */ }
    }
    return aus;
  }

  var test = ort.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\]|.*\.localhost)$/.test(ort.hostname || '') ||
    /[?&]messung=test\b/.test(ort.search || '');
  var abgeschaltet = ausschalter();
  var roboter = nav.webdriver === true;
  if (test) fenster.__messungTest = fenster.__messungTest || [];
  var aus = abgeschaltet || roboter;

  // ---------- Herkunft und Empfehlung (vor dem Start von Umami) ----------

  function hostVon(url) { try { return new URL(url).hostname.toLowerCase(); } catch (f) { return ''; } }
  var eigenerHost = (ort.hostname || '').toLowerCase().replace(/^www\./, '');
  var HAUPTHOST = 'die-ki-macherei.de';   // og:url der Seiten zeigt immer hierhin, auch in der Vorschau
  function istEigen(host) { host = String(host || '').toLowerCase().replace(/^www\./, ''); return !!host && (host === eigenerHost || host === HAUPTHOST); }
  var referrerHost = hostVon(doc.referrer || '').replace(/^www\./, '');
  var intern = !!referrerHost && referrerHost === eigenerHost;
  var hashMitAnmeldung = /(^#|&)(access_token|error)=/.test(ort.hash || '');
  var frisch = /(^#|&)access_token=/.test(ort.hash || '') && !/type=recovery/.test(ort.hash || '');
  var anmeldeRueckkehr = hashMitAnmeldung || ANMELDE_HOSTS.test(referrerHost);

  function suchParameter(name) {
    try { return new URL(ort.href).searchParams.get(name); } catch (f) { return null; }
  }
  /** „wa-01.2“ → {zweig: 'wa-01', generation: 2}; ungültig → null. */
  function codeLesen(code) {
    var m = /^([a-z0-9-]{1,40})\.([1-9][0-9]?)$/.exec(String(code || '').toLowerCase());
    return m ? { zweig: m[1], generation: Number(m[2]) } : null;
  }
  function herkunftAusReferrer(h) {
    if (!h) return 'direkt';
    // Android-Apps melden sich als android-app://<paket>; spezielle Google-Apps vor der allgemeinen Google-Regel
    if (/^com\.google\.android\.youtube/.test(h)) return 'social';
    if (/^com\.google\.android\.gm/.test(h) || /^mail\.google\./.test(h) || /(^|\.)(outlook\.live\.com|mail\.yahoo\.com|web\.de|gmx\.net)$/.test(h)) return 'mail';
    if (/^com\.google\.android/.test(h)) return 'google';
    if (/^com\.whatsapp/.test(h)) return 'whatsapp';
    if (/^(com\.instagram|com\.facebook|com\.linkedin|com\.zhiliaoapp|com\.ss\.android|com\.twitter|com\.reddit)/.test(h)) return 'social';
    // KI-Assistenten vor Google (gemini.google.com)
    if (/(^|\.)(chatgpt\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/.test(h)) return 'ki-assistent';
    if (/(^|\.)google\.[a-z.]+$/.test(h) && !/^(accounts|mail|docs|drive)\./.test(h)) return 'google';
    if (/(^|\.)(bing\.com|duckduckgo\.com|ecosia\.org|search\.brave\.com|startpage\.com|qwant\.com|yahoo\.com)$/.test(h)) return 'suche';
    if (/(^|\.)(facebook\.com|instagram\.com|t\.co|x\.com|twitter\.com|linkedin\.com|lnkd\.in|tiktok\.com|youtube\.com|reddit\.com|threads\.net|bsky\.app)$/.test(h)) return 'social';
    if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(h)) return 'whatsapp';
    return 'andere-seite';
  }
  function herkunftAusUtm(q) {
    if (q === 'empfehlung') return 'empfehlung';
    if (/^(wa|whatsapp)/.test(q)) return 'whatsapp';
    if (/^(instagram|ig|tiktok|facebook|fb|linkedin|youtube|x|threads|social)/.test(q)) return 'social';
    return q;
  }

  var eingang = codeLesen(suchParameter(PARAM));
  var utmQuelle = kennung(suchParameter('utm_source') || '');
  var utmInhalt = kennung(suchParameter('utm_content') || '');
  var erstkontakt = liesJson(HERKUNFT);
  var neuerKontakt = false;
  if (!erstkontakt || !erstkontakt.zweig) {
    var h, z, g = 1;
    if (eingang) { h = 'empfehlung'; z = eingang.zweig; g = eingang.generation; }
    else if (utmQuelle) { h = herkunftAusUtm(utmQuelle); z = utmInhalt || utmQuelle; }
    else if (anmeldeRueckkehr) { h = 'anmeldelink'; z = 'anmeldelink'; }
    else if (intern) { h = 'direkt'; z = 'direkt'; }
    else { h = herkunftAusReferrer(referrerHost); z = h === 'andere-seite' ? (kennung(referrerHost).slice(0, 40) || 'andere-seite') : h; }
    erstkontakt = { herkunft: kennung(h) || 'direkt', zweig: kennung(z).slice(0, 40) || 'direkt', generation: g };
    neuerKontakt = true;
    if (!aus) schreib(HERKUNFT, JSON.stringify(erstkontakt));
  }
  var eigenerCode = erstkontakt.zweig + '.' + Math.min(99, (Number(erstkontakt.generation) || 1) + 1);

  /** Adresse ohne Zugangsdaten aus der Anmeldung; #-Stück nie. */
  function adresseOhneGeheimes(url) {
    if (!url) return url;
    try {
      var u = new URL(url, ort.href);
      var weg = [];
      u.searchParams.forEach(function (w, k) { if (GEHEIM.test(k)) weg.push(k); });
      weg.forEach(function (k) { u.searchParams.delete(k); });
      u.hash = '';
      return u.toString();
    } catch (f) { return String(url).split('#')[0]; }
  }
  /** Adresse für Umami: fremder ?von=… wird zu utm_*, der eigene Code fällt weg. */
  function adresseFuerUmami(url) {
    try {
      var u = new URL(adresseOhneGeheimes(url));
      var roh = u.searchParams.get(PARAM), code = codeLesen(roh);
      u.searchParams.delete(PARAM);
      if (code && roh !== eigenerCode && !u.searchParams.get('utm_source')) {
        u.searchParams.set('utm_source', 'empfehlung');
        u.searchParams.set('utm_medium', 'referral');
        u.searchParams.set('utm_campaign', 'live-start');
        u.searchParams.set('utm_content', code.zweig);
        u.searchParams.set('utm_term', 'stufe-' + code.generation);
      }
      return u.toString();
    } catch (f) { return adresseOhneGeheimes(url); }
  }
  /** Referrer: ohne Zugangsdaten und ohne ?von=… (die Herkunft steht schon in der Adresse). */
  function ohneCode(url) {
    try { var u = new URL(adresseOhneGeheimes(url)); u.searchParams.delete(PARAM); return u.toString(); } catch (f) { return adresseOhneGeheimes(url); }
  }
  var URSPRUNG = adresseFuerUmami(ort.href);
  /** Seitenlink mit eigenem Weitergabe-Code, ohne utm_*, Zugangsdaten und Hash; „messung“ nur beim Weitergeben raus. */
  function mitEigenemCode(url, adresszeile) {
    try {
      var u = new URL(url, ort.href);
      if (!istEigen(u.hostname) || !dauerhaft) return url;
      var weg = [];
      u.searchParams.forEach(function (w, k) { if (/^utm_/i.test(k) || GEHEIM.test(k) || (k === 'messung' && !adresszeile) || k === PARAM) weg.push(k); });
      weg.forEach(function (k) { u.searchParams.delete(k); });
      u.searchParams.set(PARAM, eigenerCode);
      u.hash = '';
      return u.toString();
    } catch (f) { return url; }
  }
  // Adresszeile umschreiben, bevor Umami startet: so trägt auch „Teilen“ im Browser und eine kopierte Adresse den Code.
  // Nicht bei Rückkehr aus der Anmeldung (Hash gehört auth.js) und nicht in Mein Bereich.
  var ANGEZEIGT = '';
  if (!aus && dauerhaft && !hashMitAnmeldung && /^https?:$/.test(ort.protocol || '') && !/^\/mein-bereich/.test(ort.pathname || '')) {
    try {
      var neu = mitEigenemCode(ort.href, true);
      if (neu !== ort.href.split('#')[0]) fenster.history.replaceState(fenster.history.state, '', neu + (ort.hash || ''));
      ANGEZEIGT = adresseOhneGeheimes(ort.href);
    } catch (f) { /* Adresse bleibt, schadet nicht */ }
  }

  // ---------- Kennung der Angemeldeten ----------

  function personKennung() {
    var s = liesJson(SITZUNG);
    return s && s.access_token && s.id ? String(s.id).slice(0, 50) : '';
  }
  var person = frisch ? '' : personKennung(), erkannt = false;
  var umamiTag = doc.querySelector('script[data-website-id]');
  if (person && umamiTag) { umamiTag.setAttribute('data-distinct-id', person); erkannt = true; }

  // ---------- Letzte Prüfung vor jedem Versand durch Umami (data-before-send="__messungVorSenden") ----------

  fenster.__messungVorSenden = function (art, nutzlast) {
    if (!nutzlast || roboter) return null;
    if (nutzlast.url) {
      var ohne = adresseOhneGeheimes(nutzlast.url);
      nutzlast.url = (ANGEZEIGT && ohne === ANGEZEIGT) ? URSPRUNG : adresseFuerUmami(ohne);
    }
    if (nutzlast.referrer) {
      var rh = hostVon(nutzlast.referrer);
      if (ANMELDE_HOSTS.test(rh) || (anmeldeRueckkehr && rh && rh.replace(/^www\./, '') !== eigenerHost)) delete nutzlast.referrer;
      else nutzlast.referrer = ohneCode(nutzlast.referrer);
    }
    if (test) { fenster.__messungTest.push({ art: art, nutzlast: nutzlast }); return null; }
    return nutzlast;
  };

  // ---------- Lesbare Namen in Umami (Yannis, 08.11.2026: „die Namen so machen, dass ich verstehe, was gemeint ist“) ----------
  // Intern (Seite, Tests, auth.js, messpunkte.js) bleiben die kurzen Kennungen. Erst unmittelbar vor umami.track bzw.
  // umami.identify werden Name, Angaben und Werte übersetzt. Unbekanntes geht unverändert durch.

  var NAMEN = {
    "scrolltiefe": "Seite: gescrollt", "erstkontakt": "Besuch: zum ersten Mal da", "geteilt": "Seite: Link geteilt",
    "start_knopf": "Use Case: Start-Knopf getippt", "start_hilfe": "Use Case: Rückfrage vor dem Start erschienen",
    "start_anmelden": "Use Case: „Erst anmelden“ bei der KI getippt",
    "start_klick": "KI geöffnet (Start-Knopf oder KI-Link)",
    "start_kopiert": "Use Case: Anleitung kopiert (andere KI)",
    "prompt_kopiert": "Use Case: Anleitung als Text kopiert", "gemerkt": "Use Case: gemerkt (Herz)",
    "weiterer_fall": "Use Case: weiteren Use Case gestartet", "frage_geschickt": "Mein Bereich: Frage geschickt",
    "film_start": "Keller-Film: gestartet", "film_nochmal": "Keller-Film: nochmal gestartet",
    "film_sekunde": "Keller-Film: gesehen bis Sekunde", "film_ende": "Keller-Film: zu Ende gesehen",
    "anmeldung_geoeffnet": "Anmeldung: Fenster geöffnet",
    "anmeldung_begonnen": "Anmeldung: Konto anlegen oder Google getippt",
    "konto_angelegt": "Anmeldung: Konto angelegt (Bestätigung fehlt)",
    "konto_bestaetigt": "Anmeldung: neues Konto fertig (Mail oder Google)",
    "angemeldet": "Anmeldung: eingeloggt (Konto gab es schon)", "anmeldung_fehler": "Anmeldung: Fehler",
    "passwort_vergessen": "Anmeldung: Passwort vergessen",
    "abfrage_beantwortet": "Rückkehr: „Hat alles geklappt?“ beantwortet",
    "umfrage_antwort": "Umfrage: Frage beantwortet", "umfrage_text": "Umfrage: Freitext abgeschickt",
    "rueckmeldung_geoeffnet": "Rückmeldung: Fenster geöffnet",
    "rueckmeldung_abgeschickt": "Rückmeldung: abgeschickt"
  };
  // Name der Angabe in Umami; „ereignis:angabe“ geht vor „angabe“; leerer Name = Angabe weglassen
  var SCHLUESSEL = {
    fall: 'Use Case', anbieter: 'KI', einstieg: 'Anmeldeweg', grund: 'Grund', fassung: 'Film-Fassung', sekunde: 'Sekunde',
    prozent: 'Prozent', anzahl: 'Anzahl Use Cases', herkunft: 'Herkunft', zweig: 'Link-Kennung', generation: 'Weitergabe-Stufe',
    mensch: 'Mensch', abfrage: 'Frage', antwort: 'Antwort', ort: 'Geöffnet über', weg: 'Wo getippt',
    'geteilt:weg': 'Wie geteilt',
    'abfrage_beantwortet:abfrage': 'Antwort',
    'rueckmeldung_geoeffnet:abfrage': 'Geöffnet über',
    'rueckmeldung_abgeschickt:abfrage': 'Geöffnet über',
    'rueckmeldung_abgeschickt:antwort': 'Art',
    'umfrage_text:abfrage': ''
  };
  var HERKUNFT_NAMEN = {"whatsapp": "WhatsApp", "google": "Google", "social": "Soziale Medien", "mail": "E-Mail", "ki-assistent": "KI-Assistent", "suche": "andere Suchmaschine", "andere-seite": "andere Website", "direkt": "direkt (ohne Link)", "empfehlung": "Empfehlung", "anmeldelink": "Link aus Anmelde-Mail oder Google"};
  var OEFFNER_NAMEN = {"rueckmeldung": "„Rückmeldung geben“ / „Gestalte mit“", "idee": "„Eigene Idee teilen“", "wunsch": "„Frage stellen“ / „Schreib sie uns“"};
  // Werte je Angabe; „ereignis:angabe“ geht vor „angabe“
  var WERTE = {
    fall: {
      "brief-verstehen": "Brief vom Amt verstehen", "ungewollter-vertrag": "Ungewollt einen Vertrag am Hals?",
      "vorsorgemappe-anlegen": "Vorsorgemappe anlegen", "wohnzimmer-neu-denken": "Wohnzimmer neu denken",
      "zahlst-du-zu-viel-miete": "Zahlst du zu viel Miete?", "keller-ausmisten": "Keller ausmisten",
      "betrug-oder-echt": "Betrug oder echt?", "gekuendigt-und-jetzt": "Gekündigt, und jetzt?",
      "wochenende-planen": "Was mach ich am Wochenende?", "zuschuesse-finden": "Zuschüsse finden",
      "geld-nach-betrug-zurueckholen": "Geld nach Betrug zurückholen",
      "grosse-anschaffung-planen": "Große Anschaffung planen",
      "gehaltsgespraech-vorbereiten": "Gehaltsgespräch vorbereiten", "therapieplatz-finden": "Therapieplatz finden",
      "kontoauszug-abos": "Vergessene Abos finden", "startseite": "Startseite", "mein-bereich": "Mein Bereich",
      "ideen": "Ideen-Seite", "wissen": "Wissen-Seite", "n01": "Idee: Betrug oder echt?",
      "brief": "Idee: Brief vom Amt verstehen", "abo": "Idee: Vergessene Abos finden",
      "i10": "Idee: Vorsorgemappe anlegen", "keller": "Idee: Keller ausmisten",
      "y4": "Idee: Was mach ich am Wochenende?", "wohnzimmer": "Idee: Wohnzimmer neu denken",
      "r17": "Idee: Gehaltsgespräch vorbereiten", "r07": "Idee: Zahlst du zu viel Miete?",
      "r45": "Idee: Große Anschaffung planen", "n05": "Idee: Gekündigt, und jetzt?",
      "f-foerderung": "Idee: Zuschüsse finden", "n02": "Idee: Geld nach Betrug zurückholen",
      "n10": "Idee: Ungewollt einen Vertrag am Hals?", "r50": "Idee: Therapieplatz finden",
      "kind": "Idee: Eine Geschichte, die deinem Kind etwas Schweres erklärt",
      "stellen": "Idee: Den perfekten Job finden lassen", "facharzt": "Idee: Schneller zum Facharzt",
      "stadtrat": "Idee: Was plant der Stadtrat?", "todesfall": "Idee: Wenn ein Elternteil stirbt",
      "netz": "Idee: Daten über mich löschen", "versicherung": "Idee: Versicherungen durchleuchten",
      "auto": "Idee: Gebrauchtwagen prüfen",
      "kaufen": "Idee: Kaufen oder weiter mieten? Ein Rechner mit deinen Zahlen",
      "garten": "Idee: Garten neu bepflanzen", "gewerbe": "Idee: Nebengewerbe starten",
      "schatz": "Idee: Den Kindergeburtstag planen: Schatzkarte, Rätsel und Einladung",
      "foto": "Idee: Altes Familienfoto retten", "suetterlin": "Idee: Uralte Briefe entziffern",
      "f-konto": "Idee: Konto durchleuchten", "k06": "Idee: Nebenkosten prüfen",
      "r47": "Idee: Rente netto ausrechnen", "y3": "Idee: Ein Einkauf, sechs Gerichte",
      "y2": "Idee: Kfz-Versicherung prüfen", "y1": "Idee: Strom und Gas günstiger",
      "n07": "Idee: Lücken im Rentenkonto finden", "r20": "Idee: Neue Regeln für dich",
      "d1": "Idee: Daten bei Firmen abfragen", "d6": "Idee: Fake-Shop oder seriös?",
      "d5": "Idee: Wer sieht meine Fotos?", "d7": "Idee: Gehacktes Konto retten",
      "d3": "Idee: Passwort-Chaos aufräumen", "d4": "Idee: Privatsphäre-Check fürs Handy",
      "d2": "Idee: Datenleck prüfen", "s03": "Idee: Kochen mit dem, was da ist",
      "r48": "Idee: Vereinsfest organisieren", "i13": "Idee: Flugentschädigung fordern",
      "k09": "Idee: Befund verstehen", "i01": "Idee: Zahnarzt-Kostenplan verstehen",
      "r46": "Idee: Klinik für die OP finden", "n15": "Idee: Selbst zahlen beim Arzt?",
      "r39": "Idee: Diagnose gemeinsam verstehen", "n12": "Idee: Krank im Urlaub",
      "r16": "Idee: Umzug komplett planen", "n11": "Idee: Möbel nach Maß planen", "y5": "Idee: Mietvertrag prüfen",
      "r05": "Idee: Streichen beim Auszug?", "i02": "Idee: Wohnungsmängel melden",
      "r15": "Idee: Welcher Stadtteil passt zu uns?", "n08": "Idee: Abstimmen als Eigentümer",
      "r14": "Idee: Kostenfallen beim Wohnungskauf", "f-job": "Idee: Jobs finden lassen",
      "f-website": "Idee: Alte Website auffrischen", "r28": "Idee: Arbeitszeugnis entschlüsseln",
      "k02": "Idee: Schwieriges Gespräch üben", "r49": "Idee: Wenn Eltern älter werden",
      "n03": "Idee: Pflegeleistungen voll nutzen", "n04": "Idee: Stolperfallen finden",
      "n13": "Idee: Erbstücke fair aufteilen", "n14": "Idee: Demenz im Alltag",
      "k10": "Idee: Pflegebegutachtung vorbereiten", "i11": "Idee: Medikamente der Eltern ordnen"
    },
    anbieter: { chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini', copilot: 'Copilot', grok: 'Grok', perplexity: 'Perplexity',
      mistral: 'Mistral Le Chat', meta: 'Meta AI', deepseek: 'DeepSeek', andere: 'andere KI' },
    einstieg: { mail: 'E-Mail (Konto anlegen oder Mail-Link)', google: 'Google', passwort: 'Einloggen mit Passwort' },
    grund: { 'schon-vorhanden': 'Konto gibt es schon', 'passwort-schwach': 'Passwort zu schwach', netz: 'keine Internetverbindung',
      'falsches-passwort': 'falsches Passwort', 'nicht-bestaetigt': 'Mail noch nicht bestätigt', 'zu-viele': 'zu viele Versuche',
      'google-abgebrochen': 'Google abgebrochen', 'link-abgelaufen': 'Link in der Mail abgelaufen', stoerung: 'Störung' },
    fassung: { computer: 'Computer', 'handy-hoch': 'Handy hochkant', 'handy-quer': 'Handy quer (oder schmales Fenster)',
      ruhig: 'ruhige Fassung (ohne Bewegung)' },
    herkunft: HERKUNFT_NAMEN,
    zweig: HERKUNFT_NAMEN,
    mensch: { ja: 'ja' },
    weg: { knopf: 'Start-Knopf auf der Seite', leiste: 'Leiste unten', rueckkehr: 'Karte nach der Rückkehr', browser: '„Im Browser öffnen“' },
    'geteilt:weg': { menue: 'Teilen-Menü', kopiert: 'Link kopiert' },
    ort: { kopf: 'Kopfzeile (Mein Bereich)', knopf: 'Menü „Anmelden“', 'mein-bereich': 'Knopf „Anmelden“ in Mein Bereich',
      seite: 'von der Seite aus (z. B. Merken)' },
    'abfrage_beantwortet:abfrage': { 'rueckkehr-laeuft': 'Ja, hat alles geklappt', 'rueckkehr-leer': 'Problem: Eingabefeld leer',
      'rueckkehr-angemeldet': 'Problem: bei der KI nicht angemeldet', 'rueckkehr-nichts': 'Problem: nichts geöffnet',
      'rueckkehr-klappt-leer': 'Nach Hilfe (Feld leer): hat geklappt',
      'rueckkehr-klappt-angemeldet': 'Nach Hilfe (bei der KI nicht angemeldet): hat geklappt',
      'rueckkehr-klappt-nichts': 'Nach Hilfe (nichts geöffnet): hat geklappt' },
    'umfrage_antwort:abfrage': { 'rm-entwuerfe': '1. Wie gefiel dir die Idee?', 'rm-leicht': '2. War es leicht, loszulegen?',
      'rm-wieder': '3. Hast du etwas über KI gelernt?' },
    'umfrage_antwort:antwort': { 'gar-nicht': 'Idee: Nicht hilfreich', gut: 'Idee: Okay', 'richtig-gut': 'Idee: Sehr gut',
      'ganz-leicht': 'Loslegen: Ja, es war leicht', 'ging-so': 'Loslegen: Etwas hakte', schwierig: 'Loslegen: Es hat nicht funktioniert',
      ja: 'Gelernt: Habe etwas gelernt', vielleicht: 'Gelernt: Ich weiß nicht', 'eher-nicht': 'Gelernt: Nein' },
    'rueckmeldung_geoeffnet:abfrage': OEFFNER_NAMEN,
    'rueckmeldung_abgeschickt:abfrage': OEFFNER_NAMEN,
    'rueckmeldung_abgeschickt:antwort': { 'klappt-nicht': 'Etwas klappt nicht', wunsch: 'Ein Wunsch', idee: 'Eine eigene Idee',
      'ohne-auswahl': 'ohne Auswahl' }
  };
  function hat(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
  function lesbarerWert(ereignis, k, w) {
    var tafel = hat(WERTE, ereignis + ':' + k) ? WERTE[ereignis + ':' + k] : (hat(WERTE, k) ? WERTE[k] : null);
    if (typeof w !== 'string') return w;
    if (hat(tafel, w)) return tafel[w];
    if (k === 'grund' && /^stoerung-\d+$/.test(w)) return 'Störung ' + w.slice(9);
    return w;
  }
  function lesbareAngaben(ereignis, daten) {
    var ergebnis = {};
    Object.keys(daten || {}).forEach(function (k) {
      var vor = ereignis + ':' + k;
      var name = hat(SCHLUESSEL, vor) ? SCHLUESSEL[vor] : (hat(SCHLUESSEL, k) ? SCHLUESSEL[k] : k);
      if (name) ergebnis[name] = lesbarerWert(ereignis, k, daten[k]);
    });
    return ergebnis;
  }
  function fuerUmami(name, daten) {
    try { return [hat(NAMEN, name) ? NAMEN[name] : name, lesbareAngaben(name, daten)]; }
    catch (f) { return [name, daten]; }
  }
  function merkmaleFuerUmami(daten) {
    try { return lesbareAngaben('', daten); } catch (f) { return daten; }
  }

  // ---------- Versand ----------

  var warteschlange = [], identSchlange = [];
  var wartetAufAnmeldung = frisch;
  var menschDaten = null;
  function ausliefern() {
    var u = fenster.umami;
    if (!u || typeof u.track !== 'function') return false;
    while (warteschlange.length) {
      var e = warteschlange.shift();
      try { var lesbar = fuerUmami(e[0], e[1]); u.track(lesbar[0], lesbar[1]); } catch (f) { /* Umami-Fehler bremsen die Seite nicht */ }
    }
    while (identSchlange.length) {
      try { u.identify(merkmaleFuerUmami(identSchlange.shift())); } catch (f) { /* dito */ }
    }
    if (!erkannt && !wartetAufAnmeldung) {
      person = personKennung();
      if (person && typeof u.identify === 'function') {
        erkannt = true;
        try { u.identify(person, menschDaten ? merkmaleFuerUmami(menschDaten) : undefined); } catch (f) { /* dito */ }
        if (test) fenster.__messungTest.push({ art: 'kennung', person: person });
      }
    }
    return true;
  }
  if (umamiTag) umamiTag.addEventListener('load', ausliefern);
  if (frisch) fenster.setTimeout(function () { wartetAufAnmeldung = false; ausliefern(); }, 15000);

  function senden(ereignis, angaben) {
    if (aus) return false;
    var name = kennung(ereignis).replace(/-/g, '_').slice(0, 50);
    if (!name || name === 'seitenaufruf') return false;   // Seitenaufrufe zählt Umami selbst
    angaben = angaben || {};
    var daten = {};
    var seitenFall = doc.body ? doc.body.getAttribute('data-fall') : '';
    ANGABEN.forEach(function (k) {
      var roh = angaben[k] != null ? angaben[k] : (k === 'fall' ? seitenFall : '');
      var wert = ZAHLEN.indexOf(k) !== -1 ? (Number(roh) || 0) : kennung(roh);
      if (wert) daten[k] = wert;
    });
    if (test) {
      fenster.__messungTest.push({ art: 'ereignis', name: name, daten: daten });
      if (typeof fenster.CustomEvent === 'function') doc.dispatchEvent(new fenster.CustomEvent('messung-test', { detail: { name: name, daten: daten } }));
    }
    warteschlange.push([name, daten]);
    if (warteschlange.length > 60) warteschlange.shift();
    if (name === 'konto_bestaetigt' || name === 'angemeldet') wartetAufAnmeldung = false;   // erst das Ereignis, dann die Kennung
    if (name === 'start_klick') weitererFall(daten.fall || fallDerSeite());
    ausliefern();
    return true;
  }

  function fallDerSeite() {
    return kennung((ort.pathname || '').replace(/^\/|\.html$|\/$/g, '')) || 'startseite';
  }

  /** weiterer_fall {anzahl}: ab dem zweiten verschiedenen gestarteten Fall in diesem Browser. */
  function weitererFall(fall) {
    if (!fall) return;
    var liste = liesJson(GESTARTET);
    if (!Array.isArray(liste)) liste = [];
    if (liste.indexOf(fall) !== -1) return;
    liste.push(fall);
    schreib(GESTARTET, JSON.stringify(liste.slice(-40)));
    if (liste.length < 2) return;
    var daten = { fall: fall, anzahl: liste.length };
    warteschlange.push(['weiterer_fall', daten]);
    if (test) fenster.__messungTest.push({ art: 'ereignis', name: 'weiterer_fall', daten: daten });
  }

  // ---------- Mensch und Erstkontakt: bei der ersten echten Bedienung ----------

  var menschGemeldet = false;
  var BEDIENUNG = ['pointerdown', 'keydown', 'touchstart', 'wheel'];
  function alsMensch() {
    if (menschGemeldet || aus) return;
    menschGemeldet = true;
    BEDIENUNG.forEach(function (t) { fenster.removeEventListener(t, alsMensch, true); });
    fenster.removeEventListener('scroll', beiErstemScroll, true);
    menschDaten = { mensch: 'ja', herkunft: erstkontakt.herkunft, zweig: erstkontakt.zweig, generation: Number(erstkontakt.generation) || 1 };
    if (test) fenster.__messungTest.push({ art: 'merkmal', daten: menschDaten });
    identSchlange.push(menschDaten);
    if (dauerhaft && lies(ERSTKONTAKT) !== '1') {
      schreib(ERSTKONTAKT, '1');
      senden('erstkontakt', { herkunft: erstkontakt.herkunft, zweig: erstkontakt.zweig, generation: menschDaten.generation });
    } else ausliefern();
  }
  function beiErstemScroll() { if ((fenster.scrollY || 0) > 40) alsMensch(); }

  // ---------- Klicks auf [data-messung] wie bisher ----------

  function beiKlick(ereignis) {
    if (ereignis.type === 'auxclick' && ereignis.button !== 1) return;
    var t = ereignis.target, ziel = t && t.closest ? t.closest('[data-messung]') : null;
    if (!ziel) return;
    var angaben = {};
    ['fall', 'einstieg', 'anbieter', 'abfrage', 'ort'].forEach(function (k) {
      var traeger = ziel.closest('[data-' + k + ']');
      if (traeger) angaben[k] = traeger.getAttribute('data-' + k);
    });
    senden(ziel.getAttribute('data-messung'), angaben);
  }

  // ---------- Scrolltiefe 50 und 90 Prozent, je Seite einmal ----------

  var stufen = [50, 90], geschickt = {};
  function beiScroll() {
    var e = doc.documentElement, hoehe = Math.max(e.scrollHeight, doc.body ? doc.body.scrollHeight : 0) - fenster.innerHeight;
    if (hoehe < 200) return;
    var prozent = (fenster.scrollY || e.scrollTop || 0) / hoehe * 100;
    stufen.forEach(function (s) {
      if (prozent >= s && !geschickt[s]) { geschickt[s] = true; senden('scrolltiefe', { prozent: s }); }
    });
    if (geschickt[90]) fenster.removeEventListener('scroll', beiScroll);
  }

  // ---------- Teilen und Kopieren von Seitenlinks: eigener Code dran, Ereignis „geteilt“ ----------

  function istSeitenlink(text) {
    if (typeof text !== 'string' || text.length > 600 || /\s/.test(text.trim())) return false;
    return istEigen(hostVon(text.trim()));
  }
  function fallVonLink(text) {
    try { return kennung(new URL(text).pathname.replace(/^\/|\.html$|\/$/g, '')) || 'startseite'; } catch (f) { return ''; }
  }
  function teilenUmhuellen() {
    try {
      if (typeof nav.share === 'function') {
        var teilen = nav.share;
        nav.share = function (daten) {
          var d = daten, seite = false;
          try {
            if (daten && istSeitenlink(daten.url)) {
              d = {}; for (var k in daten) d[k] = daten[k];
              d.url = mitEigenemCode(daten.url); seite = true;
            }
          } catch (f) { d = daten; }
          var p = teilen.call(nav, d);
          if (seite && p && typeof p.then === 'function') {
            p.then(function () { senden('geteilt', { fall: fallVonLink(d.url), weg: 'menue' }); }, function () { /* abgebrochen */ });
          }
          return p;
        };
      }
    } catch (f) { /* navigator.share nicht überschreibbar */ }
    try {
      var cb = nav.clipboard;
      if (cb && typeof cb.writeText === 'function') {
        var schreiben = cb.writeText;
        cb.writeText = function (text) {
          var seite = istSeitenlink(text);
          var t = seite ? mitEigenemCode(String(text).trim()) : text;
          var p = schreiben.call(cb, t);
          if (seite && p && typeof p.then === 'function') {
            p.then(function () { senden('geteilt', { fall: fallVonLink(t), weg: 'kopiert' }); }, function () {});
          }
          return p;
        };
      }
    } catch (f) { /* clipboard nicht überschreibbar */ }
    // Ersatzweg execCommand('copy') mit einer Textarea: Wert vorher anpassen
    doc.addEventListener('copy', function () {
      var a = doc.activeElement;
      // nur die versteckte, schreibgeschützte Hilfs-Textarea des Teilen-Knopfs, nie ein Feld, in dem jemand schreibt
      if (a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT') && (a.readOnly || a.hasAttribute('readonly')) && istSeitenlink(a.value)) {
        a.value = mitEigenemCode(a.value.trim());
        try { a.select(); } catch (f) { /* bleibt */ }
        senden('geteilt', { fall: fallVonLink(a.value), weg: 'kopiert' });
      }
    }, true);
  }

  // ---------- Start-Knöpfe (Absicht, auch wenn danach erst das Hilfefenster kommt) ----------
  // Das Hilfefenster hält den ersten Klick an (stopImmediatePropagation am window). pointerup und Enter kommen trotzdem an.

  function anbieter(href) {
    var u;
    try { u = new URL(href, ort.href); } catch (f) { return ''; }
    if (u.protocol === 'claude:') return 'claude';
    if (u.protocol !== 'https:') return '';
    for (var i = 0; i < KI.length; i++) if (KI[i][0].test(u.hostname)) return KI[i][1];
    return '';
  }
  var letzterStart = 0;
  function beiStartKnopf(ereignis) {
    if (ereignis.type === 'keydown' && ereignis.key !== 'Enter') return;
    if (ereignis.type === 'pointerup' && ereignis.button !== 0) return;
    var t = ereignis.target, k = t && t.closest ? t.closest('a[data-start], a[data-start-web]') : null;
    if (!k) return;
    var jetzt = Date.now();
    if (jetzt - letzterStart < 800) return;
    letzterStart = jetzt;
    var web = k.hasAttribute('data-start-web');
    var ki = web ? (anbieter(k.getAttribute('data-web') || k.getAttribute('href') || '') || 'chatgpt')
      : (k.getAttribute('data-start-ki') === 'claude' ? 'claude' : 'chatgpt');
    var weg = web ? 'browser' : (k.closest('.ra-leiste') ? 'leiste' : (k.closest('#r64-rk') ? 'rueckkehr' : 'knopf'));
    // Gewählte KI ohne direkten Start (Gemini, Copilot, Grok …): der Knopf kopiert nur die Anleitung
    var wahl = kennung(lies('ki-wahl') || '');
    if (!web && wahl && wahl !== 'chatgpt' && wahl !== 'claude') ki = wahl;
    senden('start_knopf', { anbieter: ki, weg: weg });
    fenster.setTimeout(function () {
      var hw = doc.querySelector('.r240-hw');
      if (hw && hw.getClientRects().length) senden('start_hilfe', { anbieter: ki, weg: weg });
    }, 500);
  }

  // ---------- Rückmeldefenster (R187) ----------

  var rueckmeldungArt = '';
  function beiRueckmeldungKlick(ereignis) {
    var t = ereignis.target, o = t && t.closest ? t.closest('[data-r187-oeffnen]') : null;
    if (!o) return;
    rueckmeldungArt = o.getAttribute('data-r187-oeffnen') || 'rueckmeldung';
    senden('rueckmeldung_geoeffnet', { abfrage: rueckmeldungArt });
  }
  function beiAbschicken(ereignis) {
    var f = ereignis.target;
    if (!f || f.id !== 'r187-form') return;
    var t = doc.getElementById('r187-text');
    if (t && !String(t.value || '').trim()) return;   // ohne Text schickt das Fenster nichts ab
    var w = f.querySelector('input[name="r187-art"]:checked');
    senden('rueckmeldung_abgeschickt', { abfrage: rueckmeldungArt || 'rueckmeldung', antwort: w ? w.value : 'ohne-auswahl' });
  }

  // ---------- Rückkehrkarte nach dem Chat (R64): Antworten der drei Fragen, ohne Freitext ----------

  function beiUmfrage(ereignis) {
    var t = ereignis.target, c = t && t.closest ? t.closest('.r64-chip') : null;
    if (c) {
      var frage = c.closest('[data-frage]');
      if (!frage || frage.dataset.fertig || frage.__mvGezaehlt) return;   // die Seite nimmt je Frage nur die erste Antwort
      frage.__mvGezaehlt = true;
      senden('umfrage_antwort', { abfrage: frage.getAttribute('data-frage'), antwort: c.getAttribute('data-wert') });
      return;
    }
    var b = t && t.closest ? t.closest('[data-feld="absenden"]') : null;
    if (b) {
      var feld = doc.getElementById('r64-text');
      if (feld && String(feld.value || '').trim()) senden('umfrage_text', { abfrage: 'rm-text' });
    }
  }

  // ---------- Keller-Film ----------
  // Jeder Start und „Nochmal“ setzt den Film auf 0 und spielt (Klick). Fortsetzen nach Pause oder Fenster: currentTime > 0.
  var FILM = '.r79-film, .v22z-k-video, .v22z-kp-video';
  var MARKEN = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];
  function fassungVon(v) {
    if (!v || !v.matches || !v.matches(FILM)) return '';
    if (v.classList.contains('r79-film')) return 'ruhig';
    if (v.classList.contains('v22z-k-video')) return 'computer';
    return /hoch/.test(v.currentSrc || v.getAttribute('src') || '') ? 'handy-hoch' : 'handy-quer';
  }
  function beiFilm(ereignis) {
    var v = ereignis.target, fassung = fassungVon(v);
    if (!fassung) return;
    var z = v.__mvFilm || (v.__mvFilm = { laeuft: false, gespielt: 0, letzte: 0, marken: {}, starts: 0 });
    var jetzt = v.currentTime || 0;
    if (ereignis.type === 'playing') {
      if (jetzt < 1 && (!z.laeuft || z.gespielt > 2)) {
        z.laeuft = true; z.gespielt = 0; z.marken = {}; z.starts++;
        senden(z.starts === 1 ? 'film_start' : 'film_nochmal', { fassung: fassung });
      }
      z.letzte = jetzt;
    } else if (ereignis.type === 'timeupdate') {
      if (!z.laeuft) return;
      var d = jetzt - z.letzte;
      if (d > 0 && d < 2.5) z.gespielt += d;   // Sprünge (Vorspulen) zählen nicht
      z.letzte = jetzt;
      MARKEN.forEach(function (m) {
        if (z.gespielt >= m && !z.marken[m]) { z.marken[m] = true; senden('film_sekunde', { fassung: fassung, sekunde: m }); }
      });
    } else if (ereignis.type === 'seeking' || ereignis.type === 'seeked') {
      z.letzte = jetzt;
    } else if (ereignis.type === 'ended') {
      if (z.laeuft && z.gespielt >= Math.min(20, (v.duration || 30) * 0.7)) senden('film_ende', { fassung: fassung, sekunde: Math.round(z.gespielt) });
      z.laeuft = false;
    }
  }

  // ---------- Öffentliche Brücke und Vorab-Meldungen aus auth.js ----------

  var vorab = fenster.__mvVorab || [];
  fenster.Messung = { senden: senden, aktiv: !aus, testmodus: test, abgeschaltet: abgeschaltet, umami: true, fassung: 2,
    eigenerCode: eigenerCode, erstkontakt: erstkontakt, marke: MARKE };
  fenster.__mvVorab = { push: function (e) { try { senden(e[0], e[1]); } catch (f) { /* nie die Seite stören */ } } };
  if (vorab && vorab.length) for (var i = 0; i < vorab.length; i++) { try { senden(vorab[i][0], vorab[i][1]); } catch (f) { /* dito */ } }
  if (test && neuerKontakt) fenster.__messungTest.push({ art: 'herkunft', daten: erstkontakt, code: eigenerCode });
  if (aus) return;

  doc.addEventListener('click', beiKlick, true);
  doc.addEventListener('auxclick', beiKlick, true);
  doc.addEventListener('click', beiRueckmeldungKlick, true);
  doc.addEventListener('submit', beiAbschicken, true);
  doc.addEventListener('click', beiUmfrage, true);
  fenster.addEventListener('scroll', beiScroll, { passive: true });
  BEDIENUNG.forEach(function (t) { fenster.addEventListener(t, alsMensch, { capture: true, passive: true }); });
  fenster.addEventListener('scroll', beiErstemScroll, { capture: true, passive: true });
  fenster.addEventListener('pointerup', beiStartKnopf, true);
  fenster.addEventListener('keydown', beiStartKnopf, true);
  ['playing', 'timeupdate', 'seeking', 'seeked', 'ended'].forEach(function (t) { doc.addEventListener(t, beiFilm, true); });
  teilenUmhuellen();
})(typeof window !== 'undefined' ? window : this);
