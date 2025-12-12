import { ContentData, EntityType } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const PLAYER_SPEED = 0.5; // Changed to acceleration force
export const PLAYER_FRICTION = 0.92;
export const PLAYER_MAX_SPEED = 8;
export const PROJECTILE_SPEED = 12;
export const ENEMY_SPEED = 2;

export const CONTENT_MAP: Record<string, ContentData> = {
  [EntityType.ENEMY_ILLUSTRATION]: {
    title: "ILLUSTRATION",
    description: "Permanent trippy visuals.",
    style: "illustration",
    links: [
      { label: "INSTAGRAM", url: "https://www.instagram.com/candyflip.tattoos/" }
    ]
  },
  [EntityType.ENEMY_MUSIC]: {
    title: "MUSIC",
    description: "Solo Sonic Explorations.\nBeats from the void.",
    style: "music",
    links: [
      { label: "INSTAGRAM", url: "https://www.instagram.com/insight_frequencies/" },
      { label: "SOUNDCLOUD", url: "https://on.soundcloud.com/vlxFtABNWgMialXNXP" }
    ]
  },
  [EntityType.ENEMY_BAND]: {
    title: "SATIVA IM EXIL",
    description: "Illusion Respektive.\nThe Duo Project.",
    style: "band",
    links: [
      { label: "INSTAGRAM", url: "https://www.instagram.com/sativa.im.exil/?hl=de" },
      { label: "BANDCAMP", url: "https://sativaimexil.bandcamp.com/album/illusion-respektive" },
      { label: "SPOTIFY", url: "https://open.spotify.com/intl-de/artist/1INpSDJvTFEeAICSF2XMAo" },
      { label: "DUBLAB.DE RADIO", url: "https://dublab.de/shows/latente-hypnosen/" }
    ]
  },
  [EntityType.BOSS_MAIL]: {
    title: "STAY IN TOUCH",
    description: "hello@fynn-caesar.com",
    style: "contact",
    links: []
  }
};

export const IMPRESSUM_TEXT = `Impressum

Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)

Fynn Caesar
Sieverstraße 1
51103 Köln
Deutschland

Kontakt
E-Mail: info@fynn-caesar.com

Umsatzsteuer-Identifikationsnummer (USt-IdNr.)
DE441296428

Webdesign
Arasch Saffari – https://arasch-saffari.com`;

export const DATENSCHUTZ_TEXT = `Datenschutzerklärung

Stand: 12.12.2025

1. Verantwortlicher
Fynn Caesar
Sieverstraße 1
51103 Köln
Deutschland

E-Mail: info@fynn-caesar.com

2. Allgemeines zur Datenverarbeitung
Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung einer funktionsfähigen Website sowie unserer Inhalte erforderlich ist.

3. Hosting (VPS in Deutschland)
Diese Website wird auf einem Server (VPS) in Deutschland gehostet. Der Hosting-Anbieter verarbeitet in unserem Auftrag die zur Bereitstellung und zum Betrieb der Website erforderlichen Daten (Auftragsverarbeitung gemäß Art. 28 DSGVO).

Eine Übermittlung in Drittländer außerhalb der EU/des EWR findet im Rahmen dieses Hostings nicht statt.

4. Zugriffsdaten / Server-Logfiles
Bei der rein informatorischen Nutzung der Website werden durch den Server automatisch Informationen erfasst und in sogenannten Server-Logfiles gespeichert. Das können insbesondere sein:
- IP-Adresse (ggf. in gekürzter/anonmyisierter Form, abhängig von der Serverkonfiguration)
- Datum und Uhrzeit der Anfrage
- aufgerufene Seite/Datei (URL/Pfad)
- übertragene Datenmenge
- Meldung über erfolgreichen Abruf (HTTP-Statuscode)
- Referrer-URL (zuvor besuchte Seite, sofern übermittelt)
- Browsertyp/-version, Betriebssystem, User-Agent

Zwecke der Verarbeitung:
- technische Auslieferung der Website
- Stabilität und Betriebssicherheit
- Abwehr und Analyse von Angriffen / Missbrauch

Rechtsgrundlage:
Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem und störungsfreiem Betrieb der Website).

Speicherdauer:
Logfiles werden nur so lange gespeichert, wie es für die genannten Zwecke erforderlich ist, und anschließend gelöscht oder anonymisiert, sofern keine weitere Aufbewahrung zur Aufklärung sicherheitsrelevanter Vorfälle notwendig ist.

5. Kontaktaufnahme per E-Mail
Wenn du uns per E-Mail kontaktierst, verarbeiten wir die von dir übermittelten Daten (z. B. E-Mail-Adresse, Inhalt der Nachricht), um deine Anfrage zu bearbeiten.

Rechtsgrundlage:
Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen und Kommunikation).

Speicherdauer:
Die Daten werden gelöscht, sobald sie für die Bearbeitung nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.

6. Cookies / Local Storage
Diese Website setzt keine Analyse- oder Marketing-Cookies ein und nutzt kein Tracking/Analytics.

Sofern im Einzelfall technisch notwendige Cookies oder vergleichbare Speicher-/Zugriffstechnologien eingesetzt werden sollten (z. B. zur Gewährleistung grundlegender Funktionen oder Sicherheit), erfolgt dies ausschließlich im erforderlichen Umfang. Für alle nicht erforderlichen Cookies/Technologien wäre eine Einwilligung erforderlich.

7. Empfänger von Daten
Empfänger sind grundsätzlich nur:
- der Hosting-Anbieter (als Auftragsverarbeiter)
- ggf. technisch notwendige IT-Dienstleister, sofern eingesetzt (ebenfalls als Auftragsverarbeiter)

Eine Weitergabe an sonstige Dritte erfolgt nicht, sofern wir nicht gesetzlich dazu verpflichtet sind.

8. Deine Rechte
Du hast nach der DSGVO insbesondere folgende Rechte:
- Auskunft über deine gespeicherten Daten (Art. 15 DSGVO)
- Berichtigung unrichtiger Daten (Art. 16 DSGVO)
- Löschung (Art. 17 DSGVO)
- Einschränkung der Verarbeitung (Art. 18 DSGVO)
- Datenübertragbarkeit (Art. 20 DSGVO)
- Widerspruch gegen Verarbeitungen, die auf Art. 6 Abs. 1 lit. f DSGVO beruhen (Art. 21 DSGVO)

Zur Ausübung deiner Rechte reicht eine formlose Mitteilung per E-Mail an info@fynn-caesar.com.

9. Beschwerderecht bei einer Aufsichtsbehörde
Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Für Nordrhein-Westfalen ist dies insbesondere:

Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW)
Postfach 20 04 44, 40102 Düsseldorf
Telefon: +49 (0)211 38424-0
E-Mail: poststelle@ldi.nrw.de
Website: https://www.ldi.nrw.de

10. Keine automatisierte Entscheidungsfindung
Es findet keine automatisierte Entscheidungsfindung einschließlich Profiling gemäß Art. 22 DSGVO statt.

11. Änderungen dieser Datenschutzerklärung
Wir passen diese Datenschutzerklärung an, wenn sich die Website, die eingesetzten Technologien oder die rechtlichen Anforderungen ändern.`;