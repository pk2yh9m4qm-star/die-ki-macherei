/*
 * Messung über Umami Cloud – Stand 05.11.2026
 *
 * Yannis, 05.11.2026: Umami Cloud (Hobby, EU) mit vollem Umfang, alte Zählung (Google-Tabelle) aus, „keine Altlasten“.
 * Diese Datei ersetzt die alte messung.js unter demselben Namen. Sie zählt selbst nichts mehr, sondern reicht
 * window.Messung.senden(ereignis, angaben) an umami.track weiter, damit messpunkte.js und die Inline-Skripte unverändert bleiben.
 *
 * Einbinden (vor dem Umami-Tag, beide mit defer, damit diese Datei zuerst läuft):
 *   <script src="/messung.js" data-endpunkt="…" defer></script>
 *   <script defer src="https://cloud.umami.is/script.js" data-website-id="…" data-domains="die-ki-macherei.de"
 *     data-exclude-hash="true" data-before-send="__messungVorSenden" data-performance="true" data-errors="true"></script>
 *   data-endpunkt bleibt nur für Umfrage (R64) und Feedback-Kasten (R187), die damit weiter in die Google-Tabelle schreiben.
 *
 * Seitenaufrufe, Verweildauer, Gerät, Browser, Land, Herkunft und Ladezeiten zählt Umami selbst.
 * Dazu kommen hier:
 * - Ereignisse aus messpunkte.js und den Seiten (start_klick, prompt_kopiert, gemerkt, anmeldung_begonnen, frage_geschickt,
 *   abfrage_beantwortet, will_ich_haben …) mit fall, anbieter, einstieg, abfrage; Klicks auf [data-messung] wie bisher.
 * - scrolltiefe mit prozent 50 und 90, je Seite einmal.
 * - Angemeldete: Supabase-Kennung (id aus localStorage „ki-sitzung“) als distinct-id, damit Umami eine Person über Geräte
 *   und Monate wiedererkennt. Keine E-Mail, kein Name.
 * - Ausschalter: ?messung=aus legt „umami.disabled“ an (das liest Umami selbst), ?messung=an entfernt es, kurze Bestätigung.
 *   Der alte Schlüssel „kiosk-zaehlung-aus“ wird übernommen und gelöscht.
 * - Testmodus (file://, localhost, ?messung=test): nichts geht an Umami, alles landet in window.__messungTest.
 * - Zugangsdaten aus der Anmeldung (access_token, code …) werden vor dem Versand aus der Adresse entfernt, das #-Stück nie gesendet.
 */
(function (fenster) {
  'use strict';
  var doc = fenster.document;
  if (!doc) return;
  var nav = fenster.navigator || {};
  var ort = fenster.location || {};
  var UMLAUTE = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
  var ANGABEN = ['fall', 'einstieg', 'anbieter', 'abfrage', 'prozent'];
  var GEHEIM = /^(access_token|refresh_token|provider_token|provider_refresh_token|code|token|token_hash|error_description)$/i;
  var AUS = 'umami.disabled', ALT_AUS = 'kiosk-zaehlung-aus', SITZUNG = 'ki-sitzung';

  var speicher = null;
  try { speicher = fenster.localStorage; } catch (f) { /* privates Fenster, gesperrte Websitedaten */ }
  function lies(k) { try { return speicher ? speicher.getItem(k) : null; } catch (f) { return null; } }

  /** Kennung: a–z, 0–9, Bindestrich, höchstens 60 Zeichen. */
  function kennung(wert) {
    return String(wert == null ? '' : wert).trim().toLowerCase()
      .replace(/[äöüß]/g, function (z) { return UMLAUTE[z]; })
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').slice(0, 60).replace(/^-+|-+$/g, '');
  }

  /** Kurze Bestätigung oben in der Mitte, unter dem Seitenkopf; verschwindet nach 3,5 Sekunden (wie bisher). */
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

  /** Supabase-Kennung der Angemeldeten, sonst ''. */
  function personKennung() {
    try {
      var s = JSON.parse(lies(SITZUNG) || 'null');
      return s && s.access_token && s.id ? String(s.id).slice(0, 50) : '';
    } catch (f) { return ''; }
  }
  var person = personKennung(), erkannt = false;
  // Vor dem Start von Umami: distinct-id ans Umami-Tag, dann gilt schon der erste Seitenaufruf der Person
  var umamiTag = doc.querySelector('script[data-website-id]');
  if (person && umamiTag) { umamiTag.setAttribute('data-distinct-id', person); erkannt = true; }

  /** Adresse ohne Zugangsdaten aus der Anmeldung. */
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

  // Letzte Prüfung vor jedem Versand durch Umami (data-before-send="__messungVorSenden")
  fenster.__messungVorSenden = function (art, nutzlast) {
    if (!nutzlast || roboter) return null;
    if (nutzlast.url) nutzlast.url = adresseOhneGeheimes(nutzlast.url);
    if (nutzlast.referrer) nutzlast.referrer = adresseOhneGeheimes(nutzlast.referrer);
    if (test) { fenster.__messungTest.push({ art: art, nutzlast: nutzlast }); return null; }
    return nutzlast;
  };

  var warteschlange = [];
  function ausliefern() {
    var u = fenster.umami;
    if (!u || typeof u.track !== 'function') return false;
    if (!erkannt) {
      person = personKennung();
      if (person && typeof u.identify === 'function') { u.identify(person); erkannt = true; }
    }
    while (warteschlange.length) {
      var e = warteschlange.shift();
      try { u.track(e[0], e[1]); } catch (f) { /* Umami-Fehler bremsen die Seite nicht */ }
    }
    return true;
  }
  if (umamiTag) umamiTag.addEventListener('load', ausliefern);

  function senden(ereignis, angaben) {
    if (abgeschaltet || roboter) return false;
    var name = kennung(ereignis).replace(/-/g, '_').slice(0, 50);
    if (!name || name === 'seitenaufruf') return false;   // Seitenaufrufe zählt Umami selbst
    angaben = angaben || {};
    var daten = {};
    var seitenFall = doc.body ? doc.body.getAttribute('data-fall') : '';
    ANGABEN.forEach(function (k) {
      var roh = angaben[k] != null ? angaben[k] : (k === 'fall' ? seitenFall : '');
      var wert = k === 'prozent' ? (Number(roh) || 0) : kennung(roh);
      if (wert) daten[k] = wert;
    });
    if (test) {
      fenster.__messungTest.push({ art: 'ereignis', name: name, daten: daten });
      if (typeof fenster.CustomEvent === 'function') doc.dispatchEvent(new fenster.CustomEvent('messung-test', { detail: { name: name, daten: daten } }));
    }
    warteschlange.push([name, daten]);
    if (warteschlange.length > 50) warteschlange.shift();
    ausliefern();
    return true;
  }

  /** Klicks auf [data-messung] wie bisher: Angaben vom Element oder dem nächsten Vorfahren mit dem Attribut. */
  function beiKlick(ereignis) {
    if (ereignis.type === 'auxclick' && ereignis.button !== 1) return;
    var t = ereignis.target, ziel = t && t.closest ? t.closest('[data-messung]') : null;
    if (!ziel) return;
    var angaben = {};
    ['fall', 'einstieg', 'anbieter', 'abfrage'].forEach(function (k) {
      var traeger = ziel.closest('[data-' + k + ']');
      if (traeger) angaben[k] = traeger.getAttribute('data-' + k);
    });
    senden(ziel.getAttribute('data-messung'), angaben);
  }

  /** Scrolltiefe 50 und 90 Prozent, je Seite einmal. */
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

  var aus = abgeschaltet || roboter;
  // aktiv und testmodus lesen Umfrage (R64) und Feedback-Kasten; abgeschaltet wie bisher
  fenster.Messung = { senden: senden, aktiv: !aus, testmodus: test, abgeschaltet: abgeschaltet, umami: true };
  if (aus) return;
  doc.addEventListener('click', beiKlick, true);
  doc.addEventListener('auxclick', beiKlick, true);
  fenster.addEventListener('scroll', beiScroll, { passive: true });
})(typeof window !== 'undefined' ? window : this);
