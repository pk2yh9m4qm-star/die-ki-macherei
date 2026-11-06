// Wissen-Texte der KI-Macherei: die eine Quelle für Startseite, Wissen und Mein Bereich (Runde 243).
window.MB_DATEN = (function () {
      const GRUPPEN = {
        loslegen: { t: 'Loslegen', q: 'Wie fange ich an?', d: 'KI-Chat öffnen, fragen, sprechen, Fotos zeigen.', icon: 'play' },
        sicher: { t: 'Daten und Sicherheit', q: 'Ist das sicher?', d: 'Was mit deinen Daten passiert und was du besser nicht teilst.', icon: 'lock' },
        verstehen: { t: 'Was KI kann und was nicht', q: 'Was kann KI, und was nicht?', d: 'Stärken, Grenzen und was wir lieber selbst machen.', icon: 'scale' },
        faq: { t: 'Häufige Fragen', q: 'Was andere oft fragen', d: 'Kurze Antworten. Die Liste wächst mit euren Fragen.', icon: 'message' },
        haltung: { t: 'Unsere Haltung', q: 'Warum gibt es diese Seite?', d: 'Wer dahintersteht und warum hier niemand für KI wirbt.', icon: 'hand-heart' }
      };
      const REIHENFOLGE = {
        neu: ['loslegen', 'sicher', 'faq', 'verstehen', 'haltung'],
        selten: ['loslegen', 'verstehen', 'faq', 'sicher', 'haltung'],
        oft: ['verstehen', 'faq', 'sicher', 'loslegen', 'haltung'],
        profi: ['verstehen', 'faq', 'sicher', 'loslegen', 'haltung'],
        skeptisch: ['sicher', 'verstehen', 'haltung', 'faq', 'loslegen'],
        offen: ['loslegen', 'sicher', 'verstehen', 'faq', 'haltung']
      };
      const LEAD = {
        neu: 'Ein paar kurze Grundlagen, dann dein erster Fall Schritt für Schritt. Mehr brauchst du nicht.',
        selten: 'Durchdachte und geprüfte Ideen. Ohne Tüftelei.',
        oft: 'Du chattest schon. Hier steht, was darüber hinausgeht, und ein Fall, der dir etwas Neues zeigt.',
        profi: 'Du bist schon weit. Hier findest du Ideen, auf die du selbst noch nicht gekommen bist.',
        skeptisch: 'Zuerst die Antworten auf das, was dich zweifeln lässt. Danach ein Fall mit wenig Aufwand, damit du selbst urteilen kannst.',
        offen: 'Die Antworten auf deine Fragen und ein erster Fall, der zu dir passt.'
      };
      // Einleitung über „Für dich“, für alle Wege gleich (Yannis, 30.09. abends; kürzer und mit Weg zu den Ideen seit 01.10.)
      const EINLEITUNG = 'Hier haben wir Informationen für dich zusammengestellt, die dir beim Einstieg helfen. Außerdem findest du unter';
      // Welcher Artikel eine Sorge oder Grundlage aus dem Kompass vertieft
      const SORGE_ARTIKEL = { daten: 'daten', kosten: 'kostenlos', falsch: 'falsch', vertrauen: 'falsch', kaputt: 'meldungen', hype: 'f-hype', abhaengig: 'f-abhaengig' };
      const GRUND_ARTIKEL = { 'ki-chat': 'erster-chat', oeffnen: 'erster-chat', kopieren: 'erster-chat', sprechen: 'sprechen', teilen: 'ampel', alltag: 'staerken', 'fragen-lassen': 'auftrag', fertig: 'erster-chat', schnell: 'erster-chat', google: 'wie-reden', sprache: 'sprechen', recherche: 'mehr', bilder: 'mehr', agenten: 'mehr', assistenten: 'mehr', grenzen: 'grenzen' };
      const ARTIKEL = {
        'karte': { g: 'loslegen', q: 'Wie lese ich eine Ideenkarte?', kw: 'karte symbole zeichen bedeuten stufe icons lesen erklären', erklaeren: true,
          kurz: 'Was Farben, Striche und Symbole auf den Karten bedeuten.',
          lead: 'An einer Beispielkarte zeigen wir dir, was die Farben, Striche und Symbole bedeuten.' },
        'erster-chat': { g: 'loslegen', q: 'Wie benutze ich einen KI-Chat?', kw: 'anfangen öffnen chatgpt app installieren konto erste mal benutzen chatbot noch nie',
          kurz: 'Website öffnen, Nachricht schreiben, Antwort bekommen. Vorher einmal kostenlos anmelden.',
          lead: 'Du öffnest die Website eines KI-Chat-Anbieters, schreibst eine Nachricht und bekommst eine Antwort. Am besten legst du dir vorher einmal ein kostenloses Konto an.',
          body: `<ol class="steps">
            <li><b>Öffnen und anmelden.</b> Öffne den Browser. Für den Einstieg empfehlen wir ChatGPT, denn damit kannst du alles entdecken und ausprobieren, was KI-Chats bieten. Geh auf chatgpt.com und leg dir ein kostenloses Konto an, mit deiner E-Mail-Adresse oder deinem Google-Konto. Das klappt am Handy und am Computer. Am Handy geht es am einfachsten, wenn du die App herunterlädst. So geht’s Schritt für Schritt: <a href="/mein-bereich#artikel-chatgpt-konto">„Wie lege ich ein ChatGPT-Konto an?“</a></li>
            <li><b>Schreiben oder sprechen.</b> Unten ist ein Eingabefeld. Schreib hinein oder sprich ein, was du wissen willst, so wie in einer Nachricht an einen Menschen. Dann schick sie ab.</li>
            <li><b>Nachfragen.</b> Schreib einfach weiter, zum Beispiel „Erklär das einfacher“ oder „Was heißt das für mich?“ Die KI behält die vorherigen Nachrichten in eurem Gespräch „im Kopf“ und antwortet darauf.</li></ol>
            <h4>Schneller: sprechen statt tippen</h4>
            <p>Tipp im Eingabefeld auf das Mikrofon und sprich einfach los. Das geht schneller als tippen und bringt meist bessere Antworten, weil du mehr erzählst. Mehr dazu: <a href="/mein-bereich#artikel-sprechen">„Kann ich mit der KI sprechen?“</a></p>
            <h4>Was dir begegnen kann</h4>
            <p>Bietet dir die KI-App ein Abo an, kannst du den Hinweis einfach wegklicken, für den Anfang brauchst du keins. Mehr dazu: <a href="/mein-bereich#artikel-kostenlos">„Kostenlos oder Abo: Was geht bei ChatGPT und Claude?“</a></p>
            <p class="note">Frag ruhig auch, wenn du dir unsicher bist.</p>`, fall: 'brief' },
        'chatgpt-konto': { g: 'loslegen', q: 'Wie lege ich ein ChatGPT-Konto an?', kw: 'konto anlegen registrieren anmelden chatgpt account erstellen kostenlos e-mail google passwort neu',
          kurz: 'Dauert etwa zwei Minuten und kostet nichts.',
          lead: 'Das dauert etwa zwei Minuten und kostet nichts. Du brauchst nur eine E-Mail-Adresse oder dein Google-Konto.',
          body: `<ol class="steps">
            <li><b>Seite öffnen.</b> Geh im Browser auf chatgpt.com und tipp auf „Registrieren“. Am Handy kannst du stattdessen auch die ChatGPT-App nehmen.</li>
            <li><b>Weg wählen.</b> Am schnellsten geht es mit „Weiter mit Google“: ein Tipp, und du brauchst kein neues Passwort. Mit deiner E-Mail-Adresse legst du ein Passwort fest und bestätigst die Adresse über eine Mail von OpenAI, der Firma hinter ChatGPT.</li>
            <li><b>Name und Geburtsdatum.</b> Danach fragt ChatGPT, wie du heißt und wann du geboren bist. Das fragt ChatGPT, weil es ein Mindestalter gibt.</li>
            <li><b>Fertig.</b> Du siehst das Eingabefeld und kannst loslegen. Geh am besten zurück zu deiner Anleitung und tipp dort auf „Mit ChatGPT starten“.</li></ol>
            <p>Wählst du Claude als deinen bevorzugten KI-Anbieter, geht es genauso, auf claude.ai.</p>
            <h4>Was sich viele vorher fragen</h4>
            <dl>
            <dt>Kostet mich das etwas?</dt><dd>Nein, das Konto ist kostenlos, und du gibst keine Zahlungsdaten an. Mehr dazu: <a href="/mein-bereich#artikel-kostenlos">„Kostenlos oder Abo: Was geht bei ChatGPT und Claude?“</a></dd>
            <dt>Was habe ich davon?</dt><dd>Ganz ohne Konto kannst du ChatGPT nur kurz ausprobieren. Fotos und Dateien hochladen geht dann nicht und genau das brauchen viele unserer Anleitungen. Mit Konto bleiben deine Gespräche gespeichert, du kannst später weitermachen, und auf Handy und Computer siehst du dasselbe.</dd>
            <dt>Bekomme ich jetzt Werbung?</dt><dd>In der kostenlosen Version von ChatGPT kann Werbung erscheinen. Die Anzeigen stehen unter der Antwort, durch eine Linie abgetrennt. An der Antwort selbst ändern sie laut OpenAI nichts. Werbefrei ist ChatGPT erst mit einem der größeren Abos.</dd>
            <dt>Was passiert mit dem, was ich schreibe?</dt><dd>Deine Gespräche liegen in deinem eigenen Konto, und ob OpenAI damit trainieren darf, entscheidest du. Mehr dazu: <a href="/mein-bereich#artikel-daten">„Was passiert mit all meinen Daten?“</a></dd>
            <dt>Muss ich eine App installieren?</dt><dd>Für den Start reicht der Browser. Die App ist praktisch, wenn du KI am Handy nutzt, denn dann musst du dich nicht jedes Mal neu anmelden. Die App am Computer hat später ihre eigenen Vorteile, die du nutzen kannst, wenn KI komplexere Aufgaben für dich übernehmen soll.</dd>
            <dt>Kann ich das Konto wieder löschen?</dt><dd>Ja, jederzeit: unter Einstellungen, Datenkontrollen, „Konto löschen“. Deine Gespräche verschwinden dann mit.</dd>
            </dl>
            <p class="note">Stand: November 2026. Wie die Seiten von ChatGPT aussehen, ändert sich manchmal, die Schritte bleiben aber dieselben. Wir bekommen nichts, wenn du dich bei ChatGPT anmeldest.</p>`, fall: 'brief' },
        'anbieter': { g: 'loslegen', q: 'Welche KI soll ich nehmen?', kw: 'anbieter chatgpt gemini claude copilot mistral welche app vergleich unterschied abo kostenlos plus pro modell bilder sprachmodus kündigen monat',
          kurz: 'Wir empfehlen ChatGPT oder Claude. Beide schneiden in unseren Tests am besten ab.',
          lead: 'Wir empfehlen ChatGPT oder Claude. In unseren Tests schneiden beide am besten ab – auch kostenlos. Mit einem Abo geht bei beiden noch deutlich mehr.',
          body: `<h4>Warum diese beiden</h4>
            <p>Für unsere Anleitungen haben ChatGPT und Claude in unseren Tests klar am besten abgeschnitten, gerade in den kostenlosen Versionen.</p>
            <p>Andere KI-Apps wie Gemini von Google kannst du natürlich auch ausprobieren. Sobald eine Aufgabe aber mehrere Denkschritte braucht, waren ChatGPT und Claude in unseren Tests deutlich besser. Daneben gibt es etwa Copilot von Microsoft und Le Chat von Mistral, einem Anbieter aus Frankreich.</p>
            <h4>Was die beiden unterscheidet</h4>
            <div class="zwei stapel"><div><h4>ChatGPT von OpenAI</h4><p>Der Allrounder. Seine Antworten schreibt ChatGPT eher sachlich und neutral. Es analysiert, bearbeitet und gestaltet auch Bilder, etwa eine Einladung zur nächsten Feier oder Einrichtungsvorschläge für deine Wohnung. ChatGPT hat einen sehr guten Sprachmodus: Du unterhältst dich mit KI wie in einem normalen Gespräch – auch in der kostenlosen Version.</p><p class="app-link"><a data-app="chatgpt" href="https://chatgpt.com/auth/login" target="_blank" rel="noopener">ChatGPT öffnen</a></p></div>
            <div><h4>Claude von Anthropic</h4><p>Seine Antworten lesen sich persönlicher, mit mehr eigenem Charakter, teils besser auf den Punkt gebracht. Bilder analysieren und Daten ausgeben kann Claude auch, Bilder erstellen allerdings nicht, und der Sprachmodus ist nicht ganz so natürlich wie bei ChatGPT.</p><p class="app-link"><a data-app="claude" href="https://claude.ai/login" target="_blank" rel="noopener">Claude öffnen</a></p></div></div>
            <p>Gut sind beide, und im Alltag sind sie sich ziemlich ähnlich. Für den Einstieg empfehlen wir eher ChatGPT, denn damit kannst du alles entdecken und ausprobieren, was KI-Chats bieten.</p>
            <h4>Kostenlos oder mit Abo?</h4>
            <p>Vieles kannst du kostenlos ausprobieren, für manche Anleitungen brauchst du aber ein Abo. Was kostenlos geht, was ein Abo dazugibt und was es kostet, steht unter <a href="/mein-bereich#artikel-kostenlos">„Kostenlos oder Abo: Was geht bei ChatGPT und Claude?“</a></p>
            <p class="note">Stand: November 2026. KI-Apps ändern sich schnell, deshalb prüfen wir diese Empfehlung regelmäßig. Keiner der Anbieter bezahlt uns, und wir bekommen nichts, wenn du dich irgendwo anmeldest.</p>` },
        'kostenlos': { g: 'loslegen', q: 'Kostenlos oder Abo: Was geht bei ChatGPT und Claude?', kw: 'kostenlos gratis free abo plus pro chatgpt claude limit grenze grenzen nachrichten fotos dateien hochladen bilder erzeugen word excel recherche quellen aufgaben hintergrund werbung gründlich denken mehr preis kosten',
          kurz: 'Für den Anfang brauchst du kein Abo.',
          lead: 'Für den Anfang brauchst du kein Abo, kostenlos kommst du schon weit. Hier steht Thema für Thema, wo du an Grenzen stößt und was ein Abo bei ChatGPT und Claude dazugibt.',
          body: `<p>Diese Seite ist vorerst kostenlos. Hier geht es um ChatGPT und Claude: Ein Abo ist dort ein bezahlter Zugang mit mehr Möglichkeiten.</p>
            <h4 id="kostenlos--hochladen">Fotos und Dateien hochladen</h4>
            <p><b>Mit Abo geht mehr:</b> Du kannst mehr Fotos, PDFs und Tabellen hochladen.</p>
            <ul><li><b>ChatGPT:</b> Kostenlos gehen nur begrenzt Fotos und Dateien. Ist die Grenze erreicht, geht es erst später wieder. Mit Abo liest die KI auch längere Dokumente auf einmal.</li>
            <li><b>Claude:</b> Auch hier ist die Menge kostenlos begrenzt. Mit Abo passt mehr hinein.</li></ul>
            <h4 id="kostenlos--bilder">Bilder erzeugen</h4>
            <p><b>Mit Abo geht mehr, aber nur bei ChatGPT.</b></p>
            <ul><li><b>ChatGPT:</b> Es erstellt und bearbeitet Bilder, etwa eine Einladung zur nächsten Feier oder Einrichtungsvorschläge für deine Wohnung. Das geht auch in der kostenlosen Version, dort aber nur wenige, mit Abo mehr.</li>
            <li><b>Claude:</b> Es erstellt keine Bilder, auch nicht mit Abo. Bilder analysieren kann Claude dagegen, etwa ein Foto, das du hochlädst. Wenn du Bilder erstellen möchtest, passt ChatGPT besser.</li></ul>
            <h4 id="kostenlos--dateien-erzeugen">Dateien erzeugen: Word und Excel</h4>
            <p><b>Mit Abo geht mehr:</b> ChatGPT und Claude bauen dir fertige Dateien zum Herunterladen, etwa ein Word-Dokument oder eine Excel-Tabelle. Das geht auch in der kostenlosen Version. Wie oft, sagen die Anbieter nicht genau. Mit Abo hast du mehr Spielraum.</p>
            <h4 id="kostenlos--recherche">Recherche mit Quellen</h4>
            <p><b>Mit Abo geht mehr:</b> Eine einfache Suche im Netz machen ChatGPT und Claude auch kostenlos. Für die gründliche Recherche, bei der die KI viele Quellen liest und dir einen Bericht mit Links schreibt, brauchst du je nach App ein Abo.</p>
            <ul><li><b>ChatGPT:</b> Kostenlos gibt es sie nur in kleinen Portionen.</li>
            <li><b>Claude:</b> Kostenlos gibt es sie gar nicht.</li></ul>
            <h4 id="kostenlos--aufgaben">Aufgaben im Hintergrund</h4>
            <p><b>Mit Abo geht mehr:</b> Die KI kann etwas selbstständig oder regelmäßig für dich erledigen, etwa jeden Morgen neue Stellenanzeigen suchen. Bei ChatGPT geht das kostenlos höchstens in kleinem Umfang, bei Claude gar nicht.</p>
            <h4 id="kostenlos--menge">Wie viele Nachrichten gehen</h4>
            <p><b>Mit Abo geht mehr:</b> Du kannst länger und mehr am Stück arbeiten. In unseren Tests mit den Anleitungen hier waren die kostenlosen Grenzen oft schnell erreicht, manchmal mitten in einer Aufgabe.</p>
            <ul><li><b>ChatGPT:</b> Normale Chatnachrichten begrenzt ChatGPT kostenlos laut Anbieter nicht. Fotos, Bilder und gründliches Nachdenken sind dagegen begrenzt: Dann musst du warten, oder die KI antwortet mit einer einfacheren Version.</li>
            <li><b>Claude:</b> Kostenlos gilt eine Grenze pro Zeitfenster von ein paar Stunden. Ist sie erreicht, geht es nach einer Pause weiter. Mit Abo passt deutlich mehr hinein. Auch dann gibt es Grenzen, nur später.</li></ul>
            <h4 id="kostenlos--denkstaerke">Gründlicher nachdenken</h4>
            <p><b>Mit Abo geht mehr:</b> Die Abos ChatGPT Plus und Claude Pro bieten stärkere KI-Modelle an. Diese denken gründlicher nach. Das merkst du bei Aufgaben mit mehreren Schritten, etwa wenn die KI vergleichen, rechnen und daraus einen Plan machen soll. Für Alltagsfragen reichen die kostenlosen Versionen oft.</p>
            <h4 id="kostenlos--werbung">Werbung</h4>
            <p><b>Mit Abo hast du mehr Ruhe:</b> ChatGPT Plus zeigt keine Werbung. Bei ChatGPT kann Werbung erscheinen, in der kostenlosen Version und im günstigeren Abo ChatGPT Go. Bei Claude erscheint keine. Mehr dazu: <a href="/mein-bereich#artikel-daten">„Was passiert mit all meinen Daten?“</a></p>
            <h4 id="kostenlos--preise">Was ein Abo kostet</h4>
            <p>Ein Abo kostet rund 20 bis 25 Euro im Monat und lässt sich jeden Monat kündigen. Du kannst es also einen Monat ausprobieren und gleich wieder kündigen, dann endet es nach diesem Monat. Bei ChatGPT gibt es mit ChatGPT Go eine günstigere Stufe. Sie hat mehr Spielraum als kostenlos, aber Werbung und nicht die stärksten Modelle.</p>
            <h4>Lohnt sich das für dich?</h4>
            <p>Ein Abo lohnt sich für dich erst, wenn du an Grenzen stößt. Entweder durch Daten-, Bilderstellungs- oder Analyse-Limits oder durch Antworten, die sich nicht intelligent anfühlen. Kostenlose Konten nutzen günstigere, weniger fähige Modelle (die Technik hinter den Antworten). Wenn du KI nur ab und zu für eine Frage nutzt, reicht kostenlos meist. Stößt du öfter an eine Grenze oder willst du ganze Aufgaben statt einzelner Fragen erledigen lassen, kannst du ein Abo einen Monat ausprobieren. Bietet dir die KI-App ein Abo an, kannst du den Hinweis einfach wegklicken.</p>
            <p>Bei manchen unserer Anleitungen kommst du kostenlos nur bis zu einer bestimmten Stelle. Deshalb steht bei jeder Anleitung, was kostenlos gut klappt und was erst mit Abo geht. Was kostenlos zwar geht, aber nur schwache Ergebnisse liefert, empfehlen wir nicht.</p>
            <p class="note">KI-Apps und ihre Preise ändern sich schnell, deshalb prüfen wir diese Angaben regelmäßig. Keiner der Anbieter bezahlt uns.</p>` },
        'wie-reden': { g: 'loslegen', q: 'Wie rede ich mit einer KI?', kw: 'fragen schreiben formulieren prompt reden richtig fragen mensch',
          kurz: 'Keine Befehle lernen: schreib oder sprich wie mit einem Menschen.',
          lead: 'Du musst keine Befehle lernen. Schreib oder sprich mit der KI wie mit einem Menschen, und frag nach, wenn dir etwas unklar ist.',
          body: `<p>Die KI versteht normale Sätze, auch mit Tippfehlern. Je mehr sie über deine Lage weiß, desto besser passt die Antwort.</p>
            <div class="vergleich"><p><span>Knapp</span>Wohngeld Voraussetzungen</p><p><span>Besser</span>Ich bin Rentnerin, bekomme 1.100 Euro Rente und zahle 600 Euro Miete. Kann ich Wohngeld bekommen?</p></div>
            <h4>Am einfachsten: erzählen statt tippen</h4>
            <p>Wer spricht, statt zu tippen, gibt automatisch mehr Hintergrund mit, und genau der macht die Antworten besser. Wie du mit dem Mikrofon diktierst, steht unter <a href="/mein-bereich#artikel-sprechen">„Kann ich mit der KI sprechen?“</a></p>
            <p>Wenn du KI oft nutzt, lohnt es sich, die Erinnerungsfunktion zu nutzen. Bei wichtigen Dingen, die du nicht jedes Mal wiederholen willst, kannst du „merk dir das“ hinzufügen.</p>
            <p>Wenn du etwas nicht verstehst, schreib es einfach: „Erklär das einfacher.“ Oder frag nach einem Wort, das dir fremd ist: „Was meinst du mit Bemessungsgrundlage?“ Die KI wird nicht ungeduldig. Wenn du etwas über die Nutzung von KI wissen willst, frag sie einfach selbst, sie wird dir auch hier weiterhelfen.</p>` },
        'sprechen': { g: 'loslegen', q: 'Kann ich mit der KI sprechen?', kw: 'sprechen diktieren stimme mikrofon voice sprachmodus tippen',
          kurz: 'Mikrofon zum Diktieren oder Sprachmodus wie am Telefon.',
          lead: 'Es gibt zwei Wege: Das Mikrofon schreibt mit, was du sagst. Im Sprachmodus unterhältst du dich wie am Telefon.',
          body: `<div class="zwei"><div class="sp-karte"><h4 class="sp-h"><span class="df-l-ic sp-ic sp-mikro"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg></span>Diktieren</h4><p>Das Mikrofon im Eingabefeld. Du sprichst, dein Text erscheint im Feld, du liest ihn und schickst ihn ab. Gut für lange Erklärungen. Du kannst dabei durcheinander reden, die KI sortiert das. In ruhiger Umgebung versteht sie dich sehr gut.</p><div class="df sm"><div class="df-kopf"><span class="df-chip">Beispiel</span><label class="df-pause" title="Animation anhalten"><input type="checkbox" aria-label="Animation anhalten"><svg class="df-pz" viewBox="0 0 14 14" aria-hidden="true"><rect x="2.5" y="2" width="3" height="10" rx="1"/><rect x="8.5" y="2" width="3" height="10" rx="1"/></svg><svg class="df-play" viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L4.9 1.7a.6.6 0 0 0-.9.5z"/></svg></label></div><div class="df-buehne" aria-hidden="true"><div class="df-box"><span class="sm-feld"><span class="df-ph">Frag irgendwas …</span><span class="sm-z sm-z1">Also, mein Vermieter will</span><span class="sm-z sm-z2">mehr Miete. Darf der das?</span></span><span class="df-zeile"><span class="df-plus"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span><span class="df-welle"><i></i><i></i><i></i><i></i><i></i><i></i><b>Ich höre zu …</b></span><span class="df-mikro"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg></span><span class="df-rund"><span class="df-ic-wellen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v4M10 7v10M14 9v6M17 11v2"/></svg></span><span class="df-ic-pfeil"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg></span></span></span><span class="df-finger"></span></div></div></div></div>
            <div class="sp-karte"><h4 class="sp-h"><span class="df-l-ic sp-ic sp-rund"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v4M10 7v10M14 9v6M17 11v2"/></svg></span>Sprachmodus</h4><p>Das runde Symbol mit den Schallwellen daneben. Die KI antwortet mit Stimme, und du kannst sie unterbrechen. Gut zum Üben schwieriger Gespräche, beim Kochen oder als Dolmetscher im Urlaub. ChatGPT hat einen sehr guten Sprachmodus, auch in der kostenlosen Version. Bei Claude ist er nicht ganz so natürlich, funktioniert aber auch.</p><div class="df sm"><div class="df-kopf"><span class="df-chip">Beispiel</span><label class="df-pause" title="Animation anhalten"><input type="checkbox" aria-label="Animation anhalten"><svg class="df-pz" viewBox="0 0 14 14" aria-hidden="true"><rect x="2.5" y="2" width="3" height="10" rx="1"/><rect x="8.5" y="2" width="3" height="10" rx="1"/></svg><svg class="df-play" viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L4.9 1.7a.6.6 0 0 0-.9.5z"/></svg></label></div><div class="df-buehne" aria-hidden="true"><div class="sm-schirm"><span class="sm-glut sm-glut-du"></span><span class="sm-glut sm-glut-ki"></span><span class="sm-wer sm-wer-du">Du sprichst …</span><span class="sm-wer sm-wer-ki">Die KI antwortet …</span></div></div></div></div></div>
            <p>Du entscheidest, wann die KI zuhört: Das Mikrofon ist nur an, wenn du es einschaltest, mit dem Mikrofon-Symbol oder im Sprachmodus.</p>
            <p class="note">Die Beispiele sind vereinfacht, jede KI-App sieht etwas anders aus.</p>` },

        'daten': { g: 'sicher', q: 'Was passiert mit all meinen Daten?', kw: 'daten datenschutz speichern server training sicher sicherheit privat mitlesen menschen verkaufen werbung löschen konto dsgvo temporär inkognito fotos',
          kurz: 'Sie liegen beim Anbieter. Ob er damit trainiert, entscheidest du.',
          lead: 'Deine Chatnachrichten liegen beim Anbieter, damit du sie wiederfindest. Ob er damit seine KI trainieren darf, entscheidest du: Bei <svg class="logo logo--text" aria-hidden="true"><use href="#l-openai"/></svg>ChatGPT und <svg class="logo logo--text" aria-hidden="true"><use href="#l-claude"/></svg>Claude lässt sich das ausschalten, auch in der kostenlosen Version.',
          body: `<h4>Das Wichtigste zuerst: Training ausschalten</h4>
            <p>Mit einem Schalter legst du fest, dass deine Chats nicht zum Trainieren neuer KI-Modelle verwendet werden. Das gilt für alles, was du teilst, auch für Fotos und Dateien. Es geht bei ChatGPT und Claude kostenlos genauso wie im Abo:</p>
            <ul><li><b>ChatGPT:</b> Einstellungen › Datenkontrollen › „Das Modell für alle verbessern“ ausschalten.</li>
            <li><b>Claude:</b> Einstellungen › Datenschutz › den Schalter fürs Verbessern von Claude ausschalten.</li></ul>
            <p>Bei ChatGPT ist das Training eingeschaltet, bis du es ausschaltest. Bei Claude fließen deine Chatnachrichten nur ins Training, wenn du zugestimmt hast. Ein Abo ändert daran nichts, nur Firmenkonten wie ChatGPT Business oder Claude Team sind von vornherein ausgenommen. Bei anderen Anbietern wie Gemini (der KI von Google) gibt es ähnliche Schalter.</p>
            <h4>Was dann mit deinen Chats passiert</h4>
            <div class="zwei stapel"><div><h4>Training aus</h4><ul>
            <li>Deine Chats liegen verschlüsselt auf den Servern des Anbieters, meist in den USA, damit du sie in deinem Verlauf wiederfindest.</li>
            <li>Im normalen Betrieb liest sie niemand. Automatische Systeme prüfen auf Missbrauch, etwa Betrug. Ein Mensch schaut nur in Ausnahmefällen hinein, zum Beispiel bei Missbrauchsverdacht.</li>
            <li>Löschst du einen Chat, ist er nach etwa 30 Tagen auch beim Anbieter weg, außer Gesetze oder Gerichte verlangen etwas anderes.</li></ul></div>
            <div><h4>Training an</h4><ul>
            <li>Deine Chats können ohne deinen Namen in den Lernstoff für künftige Modelle einfließen. Die KI lernt daraus, wie gute Antworten aussehen. Eine Akte über dich legt sie dabei nicht an.</li>
            <li>Dafür lesen auch Menschen im Auftrag des Anbieters Ausschnitte und bewerten die Antworten. Namen werden vorher entfernt, Persönliches im Text kann aber stehen bleiben.</li>
            <li>Bei Claude bleiben diese Chats bis zu fünf Jahre gespeichert.</li></ul></div></div>
            <h4>Werden meine Daten verkauft oder geklaut?</h4>
            <ul><li><b>Verkauft:</b> Nein. OpenAI und Anthropic, die Firma hinter Claude, verkaufen nach eigenen Angaben keine Nutzerdaten.</li>
            <li><b>Werbung:</b> In der kostenlosen Version von ChatGPT kann Werbung erscheinen. Sie richtet sich nach dem Thema des aktuellen Chats, die Werbefirmen sehen deine Chats nicht. In den größeren ChatGPT-Abos gibt es keine Werbung, und Claude bleibt nach eigener Zusage ganz werbefrei.</li>
            <li><b>Weitergegeben:</b> nur an Dienstleister, die für den Anbieter arbeiten, etwa Rechenzentren, und an Behörden, wenn ein Gericht es rechtmäßig verlangt.</li>
            <li><b>Gestohlen:</b> Die Daten sind verschlüsselt gespeichert. Ein Datenleck lässt sich aber bei keinem Onlinedienst ganz ausschließen, genau wie bei deinem E-Mail-Postfach.</li>
            <li><b>Von anderen abgefragt:</b> Nein. Fragt jemand die KI nach dir, bekommt er nicht zu sehen, was du ihr erzählt hast. Deine Chats gehören zu deinem Konto, so wie deine E-Mails zu deinem Postfach.</li>
            <li><b>Geteilte Links:</b> Teilst du einen Chat per Link, kann ihn jeder lesen, der den Link hat.</li></ul>
            <h4>Was du beim Anmelden akzeptierst</h4>
            <p>Mit dem Konto stimmst du den Nutzungsbedingungen und der Datenschutzerklärung des Anbieters zu. In Europa ist dein Vertragspartner jeweils eine Tochterfirma in Irland, deshalb gilt die europäische Datenschutz-Grundverordnung. Du kannst jederzeit nachfragen, welche Daten gespeichert sind, alles herunterladen und dein Konto mitsamt den Chats löschen.</p>
            <h4>So schützt du dich zusätzlich</h4>
            <ul><li><b>Für Heikles ein Chat ohne Verlauf:</b> bei ChatGPT der „temporäre Chat“, bei Claude „Inkognito“. Diese Chats landen weder im Verlauf noch im Training und sind nach etwa 30 Tagen gelöscht.</li>
            <li><b>Rückmeldung nur bei Unverfänglichem:</b> Bewertest du eine KI-Antwort mit Daumen hoch oder runter, bekommt der Anbieter den ganzen Chat zum Verbessern, auch wenn das Training aus ist.</li>
            <li><b>Gedächtnis ansehen:</b> Was sich die KI über dich merkt, findest du in den Einstellungen und kannst es dort löschen.</li>
            <li><b>Abdecken, was sie nicht braucht:</b> Name, Adresse, Konto- und Ausweisnummern. Wie du mit sensiblen Daten umgehen kannst, steht unter <a href="/mein-bereich#artikel-ampel">„Was darf ich der KI erzählen?“</a></li></ul>
            <h4>Und hier auf der Seite?</h4>
            <p>Deine Herzen und Sammlungen bleiben ohne Konto auf deinem Gerät. Erst wenn du ein Konto anlegst, speichern wir sie, damit du sie überall findest. Verkauft oder weitergegeben wird nichts.</p>` },
        'ampel': { g: 'sicher', q: 'Was darf ich der KI erzählen?', kw: 'daten teilen privat abdecken schwärzen passwort ampel sicher vorteil nutzen risiko lebenslauf kontoauszug',
          kurz: 'Erzählen darfst du alles, was du teilen möchtest. Vermeide aber lieber, Dinge zu teilen wie Passwörter, PINs und Ausweisnummern.',
          lead: 'Nicht alles, was privat ist, ist heikel. Und manches Private braucht die KI, damit sie dir helfen kann.',
          body: `<h4>Abwägen: Daten gegen echten Vorteil</h4>
            <p>Ohne deinen Lebenslauf kann die KI keine Bewerbungen für dich übernehmen. Ohne deine Kontoauszüge kann die KI kein Einsparpotential erkennen. Alles, was du mit KI machst, ist am Ende eine individuelle Frage nach dem Nutzen und dem Risiko, das du bereit bist einzugehen. Der Nutzen ist bei jeder Anfrage ein anderer, und das Risiko schätzt du über die Zeit besser ein, je mehr du dich mit KI beschäftigst.</p>
            <h4>Was die KI meist braucht und was nicht</h4>
            <ul><li><b>Allgemeine Fragen</b> kannst du einfach stellen: Rezepte, Texte ohne Namen, deine Lage in eigenen Worten.</li>
            <li><b>Briefe, Rechnungen, Verträge:</b> Hier hilft der Inhalt. Name, Adresse, Aktenzeichen und Kontonummer braucht die KI für ihre Antwort meist nicht. Wenn du magst, deckst du sie vor dem Foto ab oder lässt sie beim Abtippen weg.</li>
            <li><b>Passwörter, PINs und TANs (Einmalcodes fürs Online-Banking)</b> braucht keine KI, um dir zu helfen. Mit ihnen und mit Ausweis- oder Kartennummern könnte jemand in deinem Namen handeln. Deshalb behältst du sie am besten für dich.</li></ul>
            <p>Was mit deinen Chatnachrichten passiert, steht unter <a href="/mein-bereich#artikel-daten">„Was passiert mit all meinen Daten?“</a></p>` },
        'falsch': { g: 'sicher', q: 'Wie sehr kann ich den Antworten trauen?', kw: 'falsch fehler irrt irrtum vertrauen trauen prüfen stimmt halluziniert',
          kurz: 'Meistens gut. Bei Zahlen, Fristen und Gesundheit prüfst du nach.',
          lead: 'Meistens gut, aber nicht blind. Manchmal erfindet KI etwas und klingt dabei genauso sicher wie sonst. Bei Wichtigem prüfst du nach.',
          body: `<p>Fachleute nennen das „Halluzinationen“. Das Thema ist in den letzten Jahren deutlich besser geworden, dennoch bleibt es etwas, das man im Hinterkopf behalten sollte.</p>
            <h4>So prüfst du</h4>
            <ul><li>Bei wichtigen Zahlen, Rechnungen und Fristen lohnt sich ein zweiter Blick, denn hier hat ein Fehler echte Folgen. Rechne am besten selbst noch einmal nach. Bei Recht und Gesundheit hilft eine zweite Quelle, etwa die Website der zuständigen Stelle oder eine Beratung.</li><li>Frag nach: „Wie sicher bist du dir bei …?“, „Woher weißt du das?“ oder „Gibt es dafür eine Quelle?“ Dann schaut die KI noch einmal genauer hin. Das ersetzt bei Wichtigem das eigene Prüfen nicht, kann dir aber helfen, wenn es schnell gehen muss.</li><li>Bitte die KI, im Netz nachzusehen und die Quelle zu nennen. KI-Chats werden besser darin, das automatisch zu tun, es ist trotzdem wichtig, darauf zu achten.</li></ul>
            <h4>Wenn die KI dich falsch versteht</h4>
            <p>Sag es der KI einfach: „Nein, ich meinte …“. Oder fang einen neuen Chat an. Kaputt machen kannst du dabei nichts.</p>`, fall: 'brief' },
        'kosten': { g: 'faq', q: 'Kostet mich das etwas?', kw: 'kosten geld abo preis kostenlos bezahlen',
          lead: 'Diese Seite ist vorerst kostenlos. Für den Anfang reichen auch die kostenlosen Versionen von ChatGPT oder Claude. Ein Abo kostet rund 20 bis 25 Euro im Monat und lohnt sich erst, wenn du an Grenzen stößt.', link: 'kostenlos' },
        'meldungen': { g: 'sicher', q: 'Kann ich etwas falsch machen?', kw: 'meldung fenster fehler kaputt falsch machen limit anmelden angst',
          lead: 'Kaputt machen kannst du nichts. Im Chat verschickt die KI nichts und ändert nichts an deinem Gerät.',
          body: `<dl>
            <dt>„Anmelden“ oder „Registrieren“</dt><dd>Mach das ruhig, mit einem kostenlosen Konto. Ohne Konto kannst du keine Fotos und Dateien hochladen, und genau das brauchen viele unserer Anleitungen. Deine Gespräche liegen in deinem eigenen Konto, andere können sie nicht sehen.</dd>
            <dt>„Du hast dein Limit erreicht“</dt><dd>Die kostenlose Version hat Grenzen, je nach KI bei Nachrichten, Fotos oder Bildern. Meist geht es nach ein paar Stunden weiter. Du kannst so lange die jeweils andere KI nehmen, also Claude statt ChatGPT oder umgekehrt, wenn du dort ein kostenloses Konto hast. Stößt du oft an dieses Limit, kann sich ein Abo lohnen. Mehr dazu: <a href="/mein-bereich#artikel-kostenlos">„Kostenlos oder Abo: Was geht bei ChatGPT und Claude?“</a></dd>
            <dt>Eine KI-Antwort, die nicht passt</dt><dd>Schreib zum Beispiel „Das passt nicht, weil …“, „Erklär es einfacher“ oder „Fass es kürzer zusammen“. Oder fang einen neuen Chat an.</dd></dl>` },

        'staerken': { g: 'verstehen', q: 'Was kann KI?', kw: 'stärken können gut nutzen wofür vorteile alltag beispiele agent agenten aufgaben erledigen cowork work abo',
          kurz: 'Erklären, schreiben, sortieren, übersetzen – und ganze Aufgaben erledigen.',
          lead: 'KI erklärt, schreibt, sortiert und übersetzt für dich, je nachdem, was du ihr zeigst oder erzählst. Und sie erledigt inzwischen ganze Aufgaben selbstständig für dich.',
          body: `<h4>Was vor KI kaum möglich war</h4>
            <p>Statt zehn Links bekommst du eine Antwort auf deine Lage, in einfachen Worten, und kannst nachfragen, so oft du willst. Allein das spart viel Zeit. Dazu kommt, was es vor ein paar Jahren so nicht gab:</p>
            <ul><li><b>Verstehen, was vor dir liegt.</b> Ein Foto vom Behördenbrief, vom Beipackzettel oder von der Fehlermeldung der Waschmaschine reicht. Die KI erklärt dir in einfachen Worten, was dahintersteckt und was du jetzt tun kannst.</li>
            <li><b>Schreiben und Perspektivwechsel.</b> Widerspruch, Kündigung, Bewerbung, eine Rede oder eine schwierige Nachricht: KI erstellt den Entwurf, du entscheidest, was übernommen wird. Idee: Bitte die KI danach, den Text aus der Sicht einer anderen Person zu lesen: „Was fällt auf? Was kommt an, was nicht?“</li>
            <li><b>Ordnung ins Durcheinander bringen.</b> Aus Kontoauszügen, Rechnungen oder Notizen macht sie eine Übersicht, rechnet zusammen und zeigt dir, was auffällt.</li>
            <li><b>Fremde Sprachen verstehen.</b> Sie übersetzt Briefe und Websites und dolmetscht Gespräche fast in Echtzeit, etwa beim Arzt, im Urlaub oder sogar beim Arzt im Urlaub.</li>
            <li><b>Üben, bevor es ernst wird.</b> Im Sprachmodus spielt sie dein Gegenüber, etwa im Gehaltsgespräch oder im Vorstellungsgespräch auf Englisch.</li>
            <li><b>Etwas Neues lernen.</b> Ob Englisch für den Urlaub oder die Mathe-Hausaufgabe deines Kindes: KI erklärt dir alles so oft und so einfach, wie du willst. Und sie fragt dich danach ab, damit es hängen bleibt.</li>
            <li><b>Ideen sichtbar machen.</b> Aus einem Foto deines Wohnzimmers werden drei neue Entwürfe, aus ein paar Sätzen eine Einladung.</li></ul>
            <h4>KI, die Dinge für dich erledigt</h4>
            <p>Die großen KI-Apps haben inzwischen Agenten, etwa ChatGPT Work oder Claude Cowork. Du gibst ihnen statt einer Frage ein Ziel, und sie arbeiten es selbstständig für dich ab. Mehr dazu: <a href="/mein-bereich#artikel-mehr">„Was geht außer Chatten noch?“</a></p>
            <h4>Umdenken hilft</h4>
            <p>Die meisten fragen die KI nur, was sie auch googeln könnten. Mehr bringt es, ihr die ganze Aufgabe zu geben: nicht „Was ist Wohngeld?“, sondern „Hilf mir, den Antrag auszufüllen.“ Dann fragt sie dich, was sie dafür wissen muss. Genau so sind unsere Anleitungen gebaut.</p>
            <p class="note">Wo KI an Grenzen stößt, steht unter <a href="/mein-bereich#artikel-grenzen">„Was kann KI nicht?“</a></p>` },
        'grenzen': { g: 'verstehen', q: 'Was kann KI nicht?', kw: 'grenzen schwächen nicht können limit fehler aktuell halluzinieren erfinden recht geben verantwortung mitgefühl mensch zukunft fähigkeiten',
          kurz: 'Sie irrt sich manchmal, kennt dich nicht und trägt keine Verantwortung.',
          lead: 'Sie kann sich irren, ohne es zu merken, kennt die Welt nur aus Texten und Bildern und trägt keine Verantwortung. Und manches wollen wir gar nicht abgeben.',
          body: `<h4>Wo sie heute an Grenzen stößt</h4>
            <p>KI löst inzwischen Aufgaben aus der Mathe-Olympiade und zählt trotzdem manchmal die Gegenstände auf einem Foto falsch. Stärken und Schwächen liegen überraschend dicht beieinander, so beschreibt es der Internationale KI-Sicherheitsbericht 2026. Für dich heißt das:</p>
            <ul><li><b>Sie erfindet manchmal etwas und wirkt dabei selbstsicher.</b> Eine Frist, eine Zahl, einen Paragrafen, den es so nicht gibt: Das Thema „Halluzinationen“ ist in den letzten Jahren deutlich besser geworden, dennoch bleibt es etwas, das man im Hinterkopf behalten sollte. Selbst OpenAI (das Unternehmen hinter ChatGPT) schreibt, dass sich das mit der heutigen Technik nicht ganz abstellen lässt, weil die Modelle beim Training eher fürs Raten belohnt werden als für ein ehrliches „weiß ich nicht“. Wichtiges prüfst du deshalb nach.</li>
            <li><b>Sie gibt dir gern recht.</b> Laut einer Stanford-Studie in der Fachzeitschrift Science stimmen KI-Chats ihren Nutzern fast um die Hälfte häufiger zu als Menschen, auch wenn diese im Unrecht sind. Willst du wissen, ob eine Idee taugt, frag: „Was spricht dagegen?“, „Nimm auch die Gegenposition ein“ oder „Was übersehe ich?“</li>
            <li><b>Sie kennt die Welt nicht aus eigener Erfahrung.</b> Sie hat nie Regen gespürt oder einen Schrank aufgebaut. Ob der Sessel bequem ist oder dein Kind traurig, weiß sie nur aus deiner Beschreibung.</li>
            <li><b>Ganz Aktuelles und sehr Lokales</b> kennt sie oft nicht oder nur ungenau, etwa die Öffnungszeiten der Praxis um die Ecke. Lass sie im Netz nachsehen und prüf die Quelle. KI-Chats werden besser darin, das automatisch zu tun, es ist trotzdem wichtig, darauf zu achten.</li>
            <li><b>Sie kennt dich nicht.</b> Was du nicht erzählst, weiß sie nicht. Je genauer du deine Lage beschreibst, desto besser passt die Antwort. Wenn du KI oft nutzt, lohnt es sich, die Erinnerungsfunktion zu nutzen und bei wichtigen Dingen, die du nicht jedes Mal wiederholen willst, „merk dir das“ hinzuzufügen. Hast du schon mehr Erfahrung im Umgang mit KI und möchtest du, dass die KI sich alles merkt, gibt es weitere Möglichkeiten, ein umfangreiches Erinnerungssystem aufzubauen. Mehr dazu folgt.</li></ul>
            <h4>Was sie auch in Zukunft nicht kann</h4>
            <ul><li><b>Verantwortung tragen.</b> KI entscheidet und handelt nicht wirklich selbst und kann keine Verantwortung übernehmen, sagt der Deutsche Ethikrat. Verantwortung tragen immer Menschen, im Zweifel du. Deshalb unterschreibst, schickst ab und kaufst du selbst.</li>
            <li><b>Für dich wissen, was dir wichtig ist.</b> Sie kann Möglichkeiten sortieren und abwägen. Welche zu deinem Leben passt, hängt an Werten, die nur du kennst.</li>
            <li><b>Echtes Mitgefühl geben.</b> KI kann dir helfen, deine Gedanken und Sorgen zu sortieren, klarer zu sehen und dir Denk- und Handlungsanstöße geben, die wirklich etwas bewirken können. Nicht hilfreich ist KI aber, wenn du gesehen werden willst und Trost suchst. Ihre Worte können tröstlich klingen, in Studien mit über 6.000 Menschen aber wirkten dieselben Sätze deutlich weniger unterstützend, sobald die Leute wussten, dass sie von einer KI kamen. Wer Trost sucht, sollte immer einen echten Menschen der KI vorziehen.</li></ul>
            <h4>Was wir gar nicht abgeben wollen</h4>
            <p>Was du lieber selbst in der Hand behältst, auch wenn KI es könnte, steht unter <a href="/mein-bereich#artikel-mensch">„KI als Lösung für alles?“</a></p>
            <h4>Was dich unersetzlich macht</h4>
            <p>Fragt man Arbeitgeber weltweit nach den wichtigsten Fähigkeiten der kommenden Jahre, stehen vor allem menschliche ganz oben: Anpassungsfähigkeit, Führung, Kreativität, Neugier und Einfühlungsvermögen. So steht es im Future of Jobs Report 2025 des Weltwirtschaftsforums. Dazu kommt, was keine Maschine hat: Urteilskraft aus eigener Erfahrung und das Vertrauen von Menschen, die dich kennen.</p>
            <p class="note">Die gute Nachricht: Genau diese Fähigkeiten brauchst du, um KI gut zu nutzen. Wie du ihre Antworten prüfst, steht unter <a href="/mein-bereich#artikel-falsch">„Wie sehr kann ich den Antworten trauen?“</a></p>
            <p class="quellen">Quellen: Bericht zur KI-Sicherheit (2026), Stanford-Studie in der Zeitschrift Science (2026), OpenAI (2025), Nature Human Behaviour (2025), Weltwirtschaftsforum (2025), Deutscher Ethikrat (2023).</p>`, fall: 'brief' },
        'auftrag': { g: 'verstehen', q: 'Warum stellt mir die KI so viele Fragen?', kw: 'fragen anleitung auftrag prompt umdenken bessere antworten allgemein kontext zusammenhang sprechen diktieren mikrofon',
          kurz: 'Damit die Antwort zu deiner Lage passt.',
          lead: 'Allgemeine Fragen bringen allgemeine Antworten. Unsere Anleitungen drehen es um: Die KI fragt erst nach deiner Lage.',
          body: `<p>So bekommst du eine KI-Antwort, die zu dir passt, ohne dass du wissen musst, was wichtig ist. Je mehr die KI über deine Lage erfährt, desto besser passt ihre Antwort. Ohne deinen Lebenslauf kann sie zum Beispiel keine Bewerbung für dich übernehmen, deshalb fragt sie danach.</p>
            <h4>Antworten kannst du auch mit der Stimme</h4>
            <p>Du kannst deine Antworten auch einfach sprechen. Gesprochen gibst du ganz von selbst mehr Hintergrund mit als beim Tippen, und das hilft der KI. Wenn du lieber tippst, geht das genauso. Wie das Sprechen geht, steht unter <a href="/mein-bereich#artikel-sprechen">„Kann ich mit der KI sprechen?“</a></p>
            <p>Du musst nichts perfekt formulieren. Wenn du etwas nicht weißt oder nicht beantworten willst, sag oder schreib „weiß ich nicht“ oder „möchte ich nicht sagen“. Die KI macht mit dem weiter, was sie hat.</p>`, fall: 'abo' },
        'mehr': { g: 'verstehen', q: 'Was geht außer Chatten noch?', kw: 'agenten agent recherche deep research assistent automatisieren aufgaben mehr bilder',
          kurz: 'Recherchieren, Aufgaben erledigen lassen, Bilder machen, sprechen.',
          lead: 'Außer Chatten kann KI recherchieren, Aufgaben erledigen, Bilder erstellen und mit dir sprechen. Manches davon läuft, während du etwas anderes machst.',
          body: `<ul><li><b>Gründlich recherchieren lassen.</b> Im Recherche-Modus liest die KI viele Quellen und liefert einen Bericht mit Links, etwa für den Vergleich von Tarifen. In den Apps heißt er oft „Deep Research“, also „gründliche Recherche“. Bei ChatGPT gibt es ihn auch in der kostenlosen Version in kleinen Portionen, bei Claude brauchst du dafür ein Abo.</li>
            <li><b>Aufgaben erledigen lassen.</b> Agenten sind KI-Helfer, die Aufgaben selbstständig Schritt für Schritt abarbeiten: im Browser, mit deinen Dateien und in verbundenen Apps. Die großen KI-Apps haben sie inzwischen, etwa ChatGPT Work oder Claude Cowork. Du gibst ihnen ein Ziel statt einer Frage, etwa: „Such mir passende Ferienwohnungen heraus und leg mir die besten Optionen mit Links vor.“ Die Agenten sehen im Internet nach, vergleichen und füllen Formulare vor. Solche Agenten gibt es meist nur mit Abo.</li>
            <li><b>Eine KI, die dich kennt.</b> Sag der KI einmal, wer du bist und was du brauchst, zum Beispiel in den Einstellungen der App. Dann musst du es nicht jedes Mal erklären. Auch bei einzelnen wichtigen Dingen hilft der Zusatz „merk dir das“ im Chat. Wer später mehr Erfahrung hat, kann sich ein eigenes, umfangreicheres Erinnerungssystem aufbauen.</li>
            <li><b>Bilder erstellen.</b> Beschreib in Worten, was du sehen willst, etwa eine Einladung zur nächsten Feier oder Einrichtungsvorschläge für deine Wohnung. Das kann ChatGPT, kostenlos allerdings nur wenige Bilder. Claude analysiert Bilder, erstellt aber keine.</li>
            <li><b>Sprachmodus.</b> Du unterhältst dich mit der KI wie in einem normalen Gespräch, bei ChatGPT auch in der kostenlosen Version. Du kannst damit z.B. ein schwieriges Gespräch üben, bevor du es führst, etwa ein Bewerbungsgespräch.</li></ul>
            <h4>Was Agenten für dich erledigen</h4>
            <ul><li><b>Suchen und vergleichen:</b> Tarife, Angebote oder Ferienwohnungen durchsehen und dir die besten Optionen mit Links vorlegen.</li>
            <li><b>Ausfüllen und vorbereiten:</b> Formulare, Kündigungen oder Buchungen bis kurz vor dem Absenden fertig machen.</li>
            <li><b>Mit deinen Dateien arbeiten:</b> einen Ordner voller Rechnungen sortieren und daraus eine Tabelle für die Steuer machen.</li>
            <li><b>Dranbleiben:</b> jeden Morgen neue Stellenanzeigen sammeln oder jede Woche die Preise für einen Flug prüfen, ohne dass du daran denken musst.</li>
            <li><b>Fertig abliefern:</b> aus ein paar Sätzen eine Präsentation, eine Tabelle oder einen Plan machen.</li></ul>`, fall: 'stellen' },
        'mensch': { g: 'verstehen', q: 'KI als Lösung für alles?', kw: 'mensch menschlich abgeben selbst machen philosophie haltung nähe entscheiden lösung für alles kann ki alles nicht übernehmen zukunft verantwortung konsequenzen trost schreibstil persönlich rede nachricht',
          kurz: 'Nein. Entscheidungen, Nähe und dein eigenes Denken bleiben bei dir.',
          lead: 'KI kann heute vieles und in Zukunft noch viel mehr. Aber was sollte oder kann KI nicht übernehmen?',
          body: `<p>Nicht alles, was KI übernehmen könnte, soll sie übernehmen. Viele Menschen fürchten eher, dass KI uns schlechter darin macht, kreativ zu denken und echte Beziehungen zu knüpfen, als dass sie uns darin besser macht.</p>
            <ul><li><b>Entscheidungen über dein Leben.</b> KI kann Muster erkennen, Möglichkeiten sortieren, Belege liefern und dir vorlegen. Eine Entscheidung zu treffen liegt jedoch immer bei uns Menschen einschließlich der Verantwortung für die Konsequenzen.</li><li><b>Nähe.</b> Die Geschichte, die deinem Kind etwas Schweres erklärt, kann die KI schreiben. Vorlesen, in den Arm nehmen und die Fragen danach beantworten bleibt bei dir. KI kann dir helfen, deine Gedanken und Sorgen zu sortieren. Wenn du gesehen werden willst oder Trost brauchst, ersetzt KI jedoch keinen Menschen. Studien von MIT und OpenAI zeigen: Wer sehr viel und sehr persönlich mit einer KI redet, ist im Schnitt einsamer.</li><li><b>Was du selbst können willst.</b> Wenn dir das Tun etwas bedeutet, lass dir helfen, statt es dir abnehmen zu lassen. Wer Texte ganz von der KI schreiben lässt, erinnert sich später kaum an den Inhalt und empfindet ihn weniger als eigenen, zeigt eine Untersuchung des MIT Media Lab. Und wer der KI sehr vertraut, prüft ihre Antworten seltener, fanden Microsoft und die Carnegie Mellon University heraus. Sag der KI zum Beispiel: „Stell mir eine Frage, die mich in die richtige Richtung schubst.“ oder „Bevor du weitermachst: Frag mich ab, ob ich es wirklich verstanden habe.“</li><li><b>Was nach dir klingen soll.</b> Du kannst inzwischen deinen Schreibstil analysieren lassen und in deinem Ton Nachrichten verfassen lassen. Bei einer Rede oder einer Nachricht an einen dir wichtigen Menschen, wo es nicht nur um den Inhalt geht, sondern auch darum, was zwischen den Zeilen – durch Ausdruck und Formulierung – kommuniziert wird, ist der persönliche Schreibstil unersetzlich.</li></ul>
            <p class="quellen">Quellen: MIT und OpenAI (2025), MIT Media Lab (2025), Microsoft und Carnegie Mellon University (2025), Umfrage des Instituts Pew (2025).</p>`, fall: 'kind' },

        'haltung': { g: 'haltung', q: 'Wer steckt hinter der Seite?', kw: 'wer werbung unabhängig haltung warum seite firma',
          kurz: 'Kein KI-Unternehmen, keine Werbung, jede Anleitung von Menschen getestet.',
          lead: 'Wir sind kein KI-Unternehmen und machen keine Werbung für eins. Es geht uns darum, die Technologie Menschen zugänglich zu machen, um die Vorteile und Grenzen zu vermitteln und sich eine belastbarere Meinung durch eigene Erfahrung bilden zu können.',
          body: `<ul><li><b>Du musst KI nicht lernen.</b> Auch ohne Zeit dich einzulesen oder das Interesse an Technik, kannst du bei uns KI nutzen.</li>
            <li><b>Jede Anleitung hat ein Mensch getestet.</b> Um Frust im Umgang mit KI zu minimieren, sind die Anleitungen auf dieser Seite alle von Menschen getestet und optimiert worden. Dass immer alles rund läuft, lässt sich deshalb trotzdem nicht ausschließen.</li>
            <li><b>Wir sagen dir auch, was nicht geht.</b> Wir weisen auf Grenzen, Daten und Kosten hin.</li>
            <li><b>Unabhängig.</b> Wir empfehlen KI-Anbieter, wenn sie in unseren Tests am besten abschneiden, nicht weil uns jemand dafür bezahlt.</li></ul>` },

        'f-anmelden': { g: 'faq', q: 'Muss ich mich anmelden oder etwas installieren?', kw: 'anmelden installieren konto app browser handy computer chatgpt claude google e-mail kostenlos herunterladen',
          lead: 'Für den Start reicht der Browser. Ein kostenloses Konto bei ChatGPT oder Claude lohnt sich aber, denn ohne Konto kannst du keine Fotos und Dateien hochladen. Bei uns selbst brauchst du kein Konto.', link: 'chatgpt-konto' },
        'f-mitlesen': { g: 'faq', q: 'Kann jemand meinen Chat mitlesen?', kw: 'mitlesen lesen mitarbeiter anbieter andere sehen privat geheim chat chats verlauf menschen',
          lead: 'Andere Nutzer nicht: Deine Chats gehören zu deinem Konto, so wie deine E-Mails zu deinem Postfach. Beim Anbieter liest im normalen Betrieb niemand mit. Ein Mensch schaut nur in Ausnahmefällen hinein, etwa bei Missbrauchsverdacht.', link: 'daten' },
        'f-brauche': { g: 'faq', q: 'Brauche ich das überhaupt? Es geht doch auch so.', kw: 'brauche überhaupt nötig sinn',
          lead: 'Das kannst du nur für dich selbst herausfinden. Such dir einen oder zwei Fälle, die dir wahrscheinlich Zeit oder Nerven sparen könnten, und probier sie aus. Danach weißt du es.' },
        'f-hype': { g: 'faq', q: 'Ist das nicht nur ein Hype?', kw: 'hype übertrieben mode',
          lead: 'Manches, was über KI erzählt wird, ist übertrieben, in beide Richtungen. Dass KI wieder verschwindet, ist unwahrscheinlich. Wie damals das Internet wird KI wohl bald in vielem stecken, was du sowieso nutzt. Deshalb zeigen wir nur Fälle, die im Alltag etwas bringen. Ob es dir hilft, entscheidest du nach dem ersten Versuch.', link: 'staerken' },
        'f-abhaengig': { g: 'faq', q: 'Ist KI gefährlich?', kw: 'abhängig verlernen denken gefährlich gefahr risiko angst sicher bedenken hacken betrug ende menschheit chancen nachrichten',
          lead: 'Auf der einen Seite hört man in den Nachrichten von KIs, die sich selbstständig machen und Unternehmen hacken. Manche sprechen sogar vom möglichen Ende der Menschheit. Auf der anderen Seite sagen Leute, dass KI die Lösung für die größten Probleme der Menschheit ist und jedem Einzelnen Möglichkeiten bietet, wie es sie noch nie gab. Fest steht: Es kommt darauf an, wie wir mit KI umgehen. Das kannst du heute schon lernen, Schritt für Schritt und ohne großes Risiko. Die bekannten KI-Apps haben dafür Schutzregeln eingebaut. Auf deine Mails, Dateien oder deinen Computer greift KI nur zu, wenn du es technisch freischaltest. Übrigens: Die KI aus den Nachrichten, die sich selbstständig gemacht hat, ist absichtlich nicht mit diesen Schutzregeln ausgestattet gewesen. Achtsam bleiben lohnt sich trotzdem bei zwei Dingen: KI kann sich irren, und Betrüger nutzen KI, etwa für täuschend echte E-Mails, die vorgeben von deiner Bank zu sein oder Stimmimitationen von Familienmitgliedern am Telefon.', link: 'grenzen',
          wand: 'Es kommt darauf an, wie wir mit KI umgehen. Die bekannten KI-Apps haben Schutzregeln eingebaut. Auf deine Mails, Dateien oder deinen Computer greift KI nur zu, wenn du es technisch freischaltest. Achtsam bleiben lohnt sich trotzdem: KI kann sich irren, und Betrüger nutzen KI.' },
        'f-schon': { g: 'faq', q: 'Ich nutze ChatGPT schon. Was bringt mir diese Seite?', kw: 'schon nutze chatgpt bringt anleitung kontext individuell bessere ergebnisse durchdacht',
          lead: 'Ideen für Dinge, an die du bei KI nicht gedacht oder die du der KI nicht zugetraut hättest. Und Anleitungen, die schon getestet sind. Mit ihnen fragt dich die KI zuerst nach deiner Lage, damit das Ergebnis zu dir passt und besser ausfällt. Jede Anleitung ist durchdacht aufgebaut, du musst dir davon nichts selbst ausdenken.', link: 'mehr' },
        'f-alt': { g: 'faq', q: 'Bin ich zu alt dafür?', kw: 'alt alter älter senioren rente zu alt jung',
          lead: 'Nein. Technik musst du dafür nicht können: Du schreibst oder sprichst mit der KI wie mit einem Menschen. Und deine Lebenserfahrung hilft dir, denn du merkst schneller, wenn eine KI-Antwort nicht zu deiner Lage passt und kannst nachsteuern.' },
        'f-mithoeren': { g: 'faq', q: 'Hört die KI mit, wenn ich nicht mit ihr spreche?', kw: 'mithören mikrofon abhören lauschen',
          lead: 'Nein. In ChatGPT und Claude hört das Mikrofon nur zu, wenn du es selbst einschaltest. Das geht mit dem Mikrofon-Symbol oder im Sprachmodus, einem Gespräch mit Stimme. Das siehst du am Symbol.', link: 'sprechen' },
        'f-konto': { g: 'faq', q: 'Wozu brauche ich hier ein Konto?', kw: 'konto registrieren anmelden speichern sammlung verloren',
          lead: 'Du brauchst keins. Wenn du deine Lieblings-Ideen speichern willst, Kurse fortsetzen möchtest oder Neuigkeiten über die KI-Macherei erfahren willst, lohnt sich ein Konto. Das Konto bei ChatGPT oder Claude ist etwas anderes.' },
        'f-geld': { g: 'faq', q: 'Verdient ihr an den KI-Firmen?', kw: 'geld verdienen werbung firmen bezahlt sponsor',
          lead: 'Nein. Kein Anbieter bezahlt uns, und wir bekommen nichts, wenn du dich irgendwo anmeldest.', link: 'haltung' }
      };
      // Mehr Wissen nach dem Kompass (Yannis, 01.10. spätnachmittags): Fragen, die zum Weg aus dem Kompass passen und mit hoher
      // Wahrscheinlichkeit spannend sind, auch wenn sie niemand ausdrücklich gestellt hat. Reihenfolge = Wichtigkeit. Was schon als
      // Antwort, Frage oder Grundlage auf der Seite steht, fällt weg. Die ersten Einträge haben einen ganzen Artikel.
      const SPANNEND = {
        neu: ['anbieter', 'wie-reden', 'ampel', 'meldungen', 'falsch', 'erster-chat', 'kosten', 'kostenlos'],
        selten: ['wie-reden', 'staerken', 'anbieter', 'falsch', 'sprechen', 'ampel', 'auftrag', 'mensch'],
        oft: ['mehr', 'falsch', 'ampel', 'mensch', 'daten', 'anbieter', 'f-schon', 'f-abhaengig'],
        profi: ['f-schon', 'mehr', 'anbieter', 'falsch', 'mensch', 'ampel', 'daten', 'f-abhaengig'],
        skeptisch: ['haltung', 'falsch', 'daten', 'mensch', 'staerken', 'ampel', 'f-geld', 'f-brauche'],
        offen: ['erster-chat', 'anbieter', 'falsch', 'ampel', 'wie-reden', 'kosten', 'meldungen', 'auftrag']
      };
      const SPANNEND_NOTIZ = {
        neu: 'Was sich viele vor dem ersten Mal fragen',
        selten: 'Was beim nächsten Versuch weiterhilft',
        oft: 'Was über das Chatten hinausgeht',
        profi: 'Was dich noch weiterbringt',
        skeptisch: 'Was andere vor dem ersten Versuch wissen wollten',
        offen: 'Was sich viele am Anfang fragen'
      };
      return { EINLEITUNG, GRUPPEN, REIHENFOLGE, LEAD, SORGE_ARTIKEL, GRUND_ARTIKEL, SPANNEND, SPANNEND_NOTIZ, ARTIKEL, EINSTIEG: ['brief', 'kind', 'foerderung', 'suetterlin', 'keller', 'miete', 'foto', 'abo'] };
    })();
