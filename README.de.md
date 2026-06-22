# Obsidian - Frontmatter Date Manager

[English](README.md) | [简体中文](README.zh-CN.md) | [Русский](README.ru.md) | **Deutsch** | [日本語](README.ja.md)

_Übersetzung der englischen [README](README.md). Einen Fehler entdeckt? Beiträge sind willkommen - siehe [CONTRIBUTING.md](CONTRIBUTING.md)._

[![CI](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/SmetDenis/obsidian-frontmatter-date-manager)](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/releases/latest)
[![Obsidian](https://img.shields.io/badge/Obsidian-v1.11.0+-7C3AED)](https://obsidian.md)
[![Obsidian downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=7C3AED&label=downloads&query=%24%5B%22frontmatter-date-manager%22%5D.downloads&url=https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugin-stats.json)](https://community.obsidian.md/plugins/frontmatter-date-manager)
[![License: MIT](https://img.shields.io/github/license/SmetDenis/obsidian-frontmatter-date-manager)](LICENSE)

Aktualisiert automatisch die Datumsangaben `created`, `updated` und `viewed` im YAML-Frontmatter, wenn du Notizen in Obsidian bearbeitest.

## Warum dieses Plugin?

- **Datumsangaben von Hand zu pflegen ist mühsam.** `created` und `updated` im Frontmatter bei jeder Bearbeitung einer Notiz manuell zu aktualisieren ist fehleranfällig und unterbricht deinen Schreibfluss.
- **Obsidian hat keine eingebaute Frontmatter-Datumsverwaltung.** Es erfasst `ctime`/`mtime` auf Dateisystemebene, schreibt oder pflegt aber keine Datumseigenschaften innerhalb deiner Notizen.
- **Sync-Tools verursachen falsche Aktualisierungen.** Obsidian Sync, iCloud, Syncthing, Dropbox und Git-basierte Synchronisierung verändern Dateien ohne echte Inhaltsänderungen. Ohne Inhalts-Hashing würde jede Synchronisierung eine Datumsaktualisierung auslösen - das erzeugt Rauschen und potenziell endlose Sync-Schleifen.
- **Vorlagen- und Automatisierungs-Plugins kollidieren.** Templater, Daily Notes, QuickAdd und ähnliche Plugins erstellen Dateien und verändern sie sofort. Ohne eine konfigurierbare Verzögerung werden Datumsangaben geschrieben, bevor die Vorlage vollständig angewendet ist - das führt zu falschen Daten.
- **Bestehenden Vaults fehlen Datumsangaben.** Wenn du das Plugin in einem Vault mit Hunderten oder Tausenden Notizen einsetzt, brauchst du eine Möglichkeit, Datumsangaben aus den Dateisystemdaten in großer Menge zu befüllen - und nicht jede Notiz einzeln zu aktualisieren.
- **Manuelle Eingabe führt zu uneinheitlichen Formaten.** Verschiedene Notizen enden mit `2024-01-15`, `Jan 15, 2024`, `15.01.2024` und anderen Varianten. Das Plugin erzwingt ein einziges konfigurierbares Format im gesamten Vault.
- **Keine automatische Erfassung von „zuletzt geöffnet".** Obsidian erfasst, wann eine Datei zuletzt verändert wurde, kennt aber kein Konzept davon, wann du sie zuletzt *gelesen* hast - und kein anderes Plugin schreibt das ins Frontmatter. Dieses Plugin kann optional bei jedem Öffnen einer Notiz ein `viewed`-Datum setzen, sodass es über Dataview abfragbar wird - für Spaced Repetition, Review-Workflows und „Was habe ich seit Monaten nicht mehr angesehen?"-Dashboards.

## Funktionen

- Automatische Aktualisierung des Feldes `updated` bei Dateiänderung (synchron mit `mtime`)
- Automatisches Setzen des Feldes `created` bei neuen Dateien (synchron mit `ctime`)
- Automatisches Setzen des Feldes `viewed` beim Öffnen einer Datei - eine einzigartige Funktion, die andere Plugins nicht bieten (standardmäßig deaktiviert)
- Zähle, wie oft du jede Notiz bearbeitest (`updated_count`, standardmäßig deaktiviert) - ein ungefähres Aktivitätssignal, das du in Bases/Dataview sortieren oder filtern kannst, um deine meistbearbeiteten Notizen zu finden
- Anpassbares Datumsformat (verwendet die [date-fns](https://date-fns.org/v4.1.0/docs/format)-Syntax)
- Zeitzonenunterstützung mit Autovervollständigung für IANA-Zeitzonen
- Eigenschaftstypen Text und Zahl (Zahl nützlich für Unix-Zeitstempel)
- Datei-Filterregeln im Gitignore-Stil mit Vorschau und Validierung
- Konfigurierbares Mindestintervall zwischen Aktualisierungen
- Verzögerung für neu erstellte Dateien (Kompatibilität mit Templater, Daily Notes usw.)
- SHA-256-Inhalts-Hashing zur Erkennung echter Änderungen (verhindert falsche Aktualisierungen durch Sync-Tools)
- Modus der Änderungserkennung: nur Notiztext, nur Eigenschaften oder beides
- Ausschluss von Eigenschaften aus der Änderungserkennung
- Befehl ausführen, nachdem Datumsangaben aktualisiert wurden
- Datumsangaben aus den jeweils eigenen Datumsangaben jeder Datei auf der Festplatte massenhaft befüllen, mit Probelauf-Vorschau
- Eine Eigenschaft über alle Notizen hinweg umbenennen (alte Namen mit Vorschau migrieren)
- Bestehende Datumsangaben von einem Format in ein anderes umformatieren (altes parsen, neues schreiben, mit Vorschau)
- Jede Massenvorschau ist seitenweise navigierbar (Zurück/Weiter), zeigt alle betroffenen Dateien (keine Zeilenbegrenzung) und kann das vollständige Diff als TSV-Datei am Desktop herunterladen (im System-Download-Ordner gespeichert, nie in deinen Vault geschrieben)
- Automatische Aktualisierung über die Befehlspalette oder die Statusleiste umschalten
- Automatische Aktualisierung für 5 Minuten pausieren mit automatischer Fortsetzung
- Mehrsprachige Oberfläche, die der App-Sprache von Obsidian folgt - Englisch und Russisch von Hand geprüft, plus 19 Basisübersetzungen, alle mit schlüsselweisem Rückfall auf Englisch
- Funktioniert auf Desktop und Mobilgeräten

## Screenshots

![Datumsangaben für Erstellung, Bearbeitung und zuletzt geöffnet werden in einer Notiz automatisch gepflegt](screenshots/01-automatic-dates.png)

![Datumsangaben für einen bestehenden Vault aus der jeweils eigenen Historie jeder Datei massenhaft befüllen, mit Probelauf-Vorschau](screenshots/02-populate-vault.png)

![Gemischte Datumsformate auf einen Standard umformatieren, mit Schutz gegen mehrdeutige Tag/Monat-Datumsangaben](screenshots/03-reformat-dates.png)

![Übersichtliche, allgemein verständliche Einstellungen](screenshots/04-settings.png)

![Filterregeln im Gitignore-Stil, die genau festlegen, welche Notizen Datumsangaben erhalten](screenshots/05-filter-rules.png)

## Installation

### Community-Plugins

Öffne in Obsidian Einstellungen > Community-Plugins > Durchsuchen, suche nach **Frontmatter Date Manager** und klicke auf Installieren.

### Manuelle Installation

Lade `main.js`, `manifest.json` und `styles.css` aus dem
[neuesten Release](https://github.com/SmetDenis/obsidian-frontmatter-date-manager/releases/latest)
in das Verzeichnis `<vault>/.obsidian/plugins/frontmatter-date-manager/` herunter.

## Verwendung

Das Plugin läuft nach der Installation automatisch. Wenn du eine Markdown-Datei bearbeitest, aktualisiert es die Eigenschaft `updated` mit der aktuellen Änderungszeit. Fehlt die Eigenschaft `created`, setzt es sie auf die Erstellungszeit der Datei. Optional kannst du in den Einstellungen das `viewed`-Datum aktivieren, um festzuhalten, wann du jede Notiz zuletzt geöffnet hast.

Konfiguriere das Verhalten unter **Einstellungen -> Frontmatter Date Manager**.

### Befehle

| Befehl                                 | Beschreibung                                            |
|----------------------------------------|---------------------------------------------------------|
| **Zeitstempel für aktuelle Datei aktualisieren** | Löst manuell eine Aktualisierung der Zeitstempel für die aktive Notiz aus |
| **Automatische Aktualisierung ein-/ausschalten** | Aktiviert oder deaktiviert die automatische Aktualisierung der Zeitstempel |
| **Automatische Aktualisierung für 5 Minuten pausieren** | Pausiert Aktualisierungen vorübergehend mit automatischer Fortsetzung |

**Statusleisten-Anzeige** - zeigt den aktuellen Zustand (`Paused` oder `Paused (Xm)`); klicke darauf, um die automatische Aktualisierung ein-/auszuschalten.

## Einstellungen

| Einstellung                        | Standard                | Beschreibung                                                                     |
|------------------------------------|-------------------------|----------------------------------------------------------------------------------|
| Erstellungsdatum erfassen          | `true`                  | Fügt Notizen, die noch keines haben, ein Erstellungsdatum hinzu                  |
| Eigenschaft für Erstellung         | `created`               | Eigenschaftsname, unter dem das Erstellungsdatum gespeichert wird                |
| Datum der letzten Bearbeitung erfassen | `true`              | Aktualisiert dieses Datum jedes Mal, wenn du die Notiz bearbeitest               |
| Eigenschaft für Aktualisierung     | `updated`               | Eigenschaftsname, unter dem das Datum der letzten Bearbeitung gespeichert wird   |
| Bearbeitungen zählen               | `false`                 | Fügt eine Zahleneigenschaft hinzu, die bei jeder Bearbeitung um eins steigt (ein ungefährer Aktivitätszähler, keine exakte Historie) |
| Eigenschaft für Bearbeitungszähler | `updated_count`         | Eigenschaftsname, unter dem der Bearbeitungszähler gespeichert wird              |
| Datum „zuletzt geöffnet" erfassen  | `false`                 | Speichert das Datum bei jedem Öffnen der Notiz                                   |
| Eigenschaft für „angesehen"        | `viewed`                | Eigenschaftsname, unter dem das Datum „zuletzt geöffnet" gespeichert wird        |
| Datumsformat                       | `yyyy-MM-dd'T'HH:mm:ss` | Datums- und Zeitformat ([date-fns-Syntax](https://date-fns.org/v4.1.0/docs/format)) |
| Zeitzone                           | `""` (System)           | IANA-Zeitzonenkennung; leer verwendet die Systemzeitzone                         |
| Nur-Zahlen-Datumsangaben ohne Anführungszeichen speichern | `false` | Gibt für reine Ziffernformate Zahlen statt Text in Anführungszeichen aus       |
| Automatische Aktualisierung        | `true`                  | Aktualisiert Datumsangaben automatisch, wenn du eine Notiz bearbeitest           |
| Mindestsekunden zwischen Aktualisierungen | `30`             | Mindestintervall zwischen Datumsaktualisierungen                                |
| Zu überspringende Dateien und Ordner | `""` (alle Dateien)   | Regeln im Gitignore-Stil: Zeilen schließen aus, `!` schließt wieder ein, `#` für Kommentare |
| Änderungserkennung (Inhalts-Hashing) | `true`                | Schreibt das Datum nur, wenn sich der Inhalt tatsächlich ändert (SHA-256-Hashing) |
| Was als Änderung gilt              | `body`                  | Was Aktualisierungen auslöst: `body`, `frontmatter` oder `both`                  |
| Diese Eigenschaften ignorieren     | `[]`                    | Eigenschaften, die bei der Änderungserkennung ignoriert werden; mehrere auf einmal hinzufügen, durch Kommas getrennt |
| Verzögerung für neue Dateien       | `5000` ms               | Wartezeit, bevor neu erstellte Notizen verarbeitet werden                        |
| Cache beim Start automatisch befüllen | `true`               | Erstellt Änderungserkennungsdaten für nicht zwischengespeicherte Notizen beim Laden des Plugins |
| Maximale Cache-Einträge            | `10000`                 | Die ältesten ungenutzten Einträge werden entfernt, wenn der Cache dieses Limit überschreitet |
| Befehl nach Aktualisierung         | `""` (keiner)           | Obsidian-Befehl, der nach jeder Datumsaktualisierung ausgeführt wird             |

### Bearbeitungsdatum vor Erstellungsdatum

| Einstellung                      | Standard   | Beschreibung                                                                                                                      |
|----------------------------------|------------|----------------------------------------------------------------------------------------------------------------------------------|
| `Wie Datumsangaben außer der Reihe korrigiert werden` | `disabled` | Was geschehen soll, wenn das Datum der letzten Bearbeitung vor dem Erstellungsdatum liegt. Gilt für automatische Bearbeitungen; `disabled` bedeutet nur erkennen. |
| `Winzige Unterschiede ignorieren (Sekunden)` | `0` | Ignoriert Datumsangaben außer der Reihe, wenn der Abstand kleiner als dieser Wert ist. Nützlich, um Uhrabweichungen unter einer Sekunde zu unterdrücken. |
| `Datumsangaben außer der Reihe finden` | _(Aktion)_ | Durchsucht deine Notizen (beachtet die Überspring-Regeln) und listet jene auf, bei denen das Datum der letzten Bearbeitung vor dem Erstellungsdatum liegt. Wende die Korrektur im Dialog an. |

Verfügbare Strategien: `Erstellungsdatum auf das Datum der letzten Bearbeitung setzen`, `Datum der letzten Bearbeitung auf das Erstellungsdatum setzen`, `Beide auf das jüngste Datum setzen`.

## Beispiele für Datumsformate

| Formatzeichenkette      | Beispielausgabe           |
|-------------------------|---------------------------|
| `yyyy-MM-dd'T'HH:mm:ss` | 2026-04-12T14:30:00       |
| `yyyy-MM-dd HH:mm:ss`   | 2026-04-12 14:30:00       |
| `dd.MM.yyyy HH:mm`      | 12.04.2026 14:30          |
| `t`                     | 1776268200 (Unix-Sekunden) |
| `T`                     | 1776268200000 (Unix-ms)   |

> **Hinweis:** Dieses Plugin verwendet **date-fns**, nicht Moment.js. Häufige Migration: `YYYY` -> `yyyy`, `DD` -> `dd`.

## Deine meistbearbeiteten Notizen finden (optional)

Sobald **Bearbeitungen zählen** aktiviert ist, ist die Eigenschaft `updated_count` eine reine Zahl, die du beliebig sortieren und filtern kannst. Das Plugin schreibt nur die Zahl - das Erstellen einer Ansicht bleibt dir überlassen. Zum Beispiel eine Dataview-Abfrage für die am häufigsten bearbeiteten Notizen:

````markdown
```dataview
TABLE updated_count, updated
WHERE updated_count
SORT updated_count DESC
LIMIT 20
```
````

Oder sortiere in Obsidian **Bases** absteigend nach `updated_count` (optional gefiltert nach einem kürzlichen `updated`). Der Zähler ist ein ungefähres Aktivitätssignal, keine exakte Historie - er beginnt in dem Moment, in dem du die Funktion aktivierst. Er steigt einmal pro Bearbeitungs-*Sitzung*, nicht pro Tastenanschlag: schnelle Bearbeitungen innerhalb deines Fensters **Mindestsekunden zwischen Aktualisierungen** zählen als eine. Auch das Ausführen des Befehls **Zeitstempel für aktuelle Datei aktualisieren** zählt; Massenoperationen (Befüllen/Umformatieren/Umbenennen) schreiben Datumsangaben neu, ohne den Zähler zu verändern.

## FAQ

### Erste Installation

> Verändert das Plugin alle meine bestehenden Notizen, wenn ich es zum ersten Mal aktiviere?

Nein. Das Plugin verarbeitet eine Datei nur, wenn du sie bearbeitest. Beim ersten Laden erstellt es im Hintergrund einen Hash-Cache deiner bestehenden Dateien, um die Änderungserkennung vorzubereiten, schreibt dabei aber niemals Zeitstempel. Dein Vault bleibt unberührt, bis du tatsächlich eine Notiz bearbeitest.

> Wie füge ich Notizen Zeitstempel hinzu, die ich vor der Installation geschrieben habe?

Verwende Einstellungen → Massenoperationen → Datumsangaben aus den eigenen Datumsangaben der Datei setzen. Es liest die jeweils eigenen Erstellungs- und Änderungsdaten jeder Datei auf der Festplatte und schreibt sie in die Eigenschaften deiner Notiz, mit einer Probelauf-Vorschau, sodass du vor dem Übernehmen prüfen kannst. Der Standardmodus ist „Nur fehlende befüllen" - bestehende Datumsangaben werden nicht überschrieben. Wenn dein Vault über iCloud oder Obsidian Sync synchronisiert wird, wurden diese Datumsangaben auf der Festplatte möglicherweise vom Sync-Dienst zurückgesetzt - prüfe die Vorschau sorgfältig.

> Ich verwende Templater / Daily Notes / QuickAdd. Wird das Plugin damit kollidieren?

Nein. Das Plugin wartet 5 Sekunden (konfigurierbar: Einstellungen → Verhalten → Erweitert → Verzögerung für neue Dateien), bevor es neu erstellte Dateien verarbeitet, und gibt Vorlagen-Plugins so Zeit, fertig zu werden.

> Muss ich zuerst jeder Notiz manuell Eigenschaften hinzufügen?

Nein. Hat eine Notiz noch keine Eigenschaften, erstellt das Plugin beim nächsten Bearbeiten den `---`-Block und fügt die Datumsangaben ein. Existieren bereits Eigenschaften, fügt es die Datumseigenschaften neben deinen bestehenden hinzu.

> Welches Datumsformat funktioniert am besten mit Dataview?

Das Standardformat `yyyy-MM-dd'T'HH:mm:ss` (ISO 8601) funktioniert ohne Weiteres. Dataview kann es nativ parsen, sortieren und vergleichen.

> Das Plugin verwendet date-fns, nicht Moment.js. Betrifft mich das?

Nur, wenn du das Datumsformat anpasst. Wesentlicher Unterschied: Verwende `yyyy` (nicht `YYYY`) für das Jahr und `dd` (nicht `DD`) für den Tag. Das Plugin zeigt in den Einstellungen einen Hinweis, wenn es ein Format im Moment.js-Stil erkennt.

### Alltägliche Nutzung

> Ich habe „viewed"-Zeitstempel aktiviert, aber sie erscheinen in manchen Notizen nicht.

Der viewed-Zeitstempel wird nur geschrieben, wenn du eine Datei öffnest. Notizen, die du seit dem Aktivieren der Funktion nicht geöffnet hast, haben das Feld noch nicht. Für viewed-Schreibvorgänge gelten dieselben Filterregeln und dieselbe Mindestintervall-Einstellung.

> Ich habe Tags oder Aliase bearbeitet, aber `updated` hat sich nicht geändert. Ist das ein Fehler?

Nein. Standardmäßig betrachtet die Änderungserkennung nur den Notiztext - nur Änderungen unterhalb des Eigenschaftsblocks lösen eine Datumsaktualisierung aus. Um Eigenschaftsänderungen einzubeziehen, stelle Einstellungen → Änderungserkennung → Was als Änderung gilt auf „Beide".

> Wird das Synchronisieren (iCloud / Obsidian Sync / Dropbox) falsche Zeitstempel verursachen?

Nein. Das Plugin vergleicht den Dateiinhalt per SHA-256-Hashing. Schreibt ein Sync-Dienst eine Datei neu, ohne ihren Inhalt zu ändern, stimmt der Hash überein und kein Zeitstempel wird aktualisiert. Standardmäßig aktiviert.

> Ich habe eine Notiz umbenannt oder verschoben. Verliert das Plugin sie aus den Augen?

Nein. Der Hash-Cache-Eintrag wird automatisch auf den neuen Pfad migriert. Bestehende Zeitstempel bleiben erhalten.

> Ich habe das Datumsformat geändert. Werden alte Zeitstempel umgewandelt?

Nicht automatisch. Verwende Einstellungen → Massenoperationen → Datumsangaben umformatieren, um alle Werte zu vereinheitlichen. Das Plugin erkennt bestehende Formate automatisch (ISO 8601, europäisch, US-amerikanisch, numerische Zeitstempel) und schreibt sie mit deinem aktuellen Format neu. Sieh dir vor dem Anwenden alle Änderungen in der Vorschau an.

> Ein Datum wie `01/05/2024` könnte den 5. Januar oder den 1. Mai bedeuten. Was passiert?

Solche mehrdeutigen Tag/Monat-Datumsangaben bleiben standardmäßig unverändert - das Plugin rät niemals. Die Vorschau zeigt, wie viele gefunden wurden, und bietet eine Ein-Klick-Auswahl (Tag zuerst oder Monat zuerst), die anhand deiner Systemregion vorgeschlagen wird, sodass du entscheidest, bevor etwas neu geschrieben wird. Datumsangaben mit nur einer gültigen Lesart (z. B. `25/12/2024`) werden immer umgewandelt.

> Ich habe die Eigenschaft umbenannt (z. B. `created` → `date_created`). Was ist mit bestehenden Dateien?

Verwende Einstellungen → Massenoperationen → Eigenschaft umbenennen. Gib den alten und den neuen Eigenschaftsnamen ein, sieh dir die betroffenen Notizen in der Vorschau an und wende es dann an. Du kannst wählen, ob die alte Eigenschaft gelöscht oder beide behalten werden sollen.

> Ich habe die Zeitzone geändert. Werden alte Zeitstempel neu berechnet?

Nein. Dasselbe Prinzip - alte Werte bleiben unberührt. Neue Schreibvorgänge verwenden die neue Zeitzone.

> Was passiert, wenn eine Notiz fehlerhaftes YAML-Frontmatter hat?

Das Plugin überspringt diese Datei und zeigt einen Hinweis mit dem Dateipfad und den Fehlerdetails an. Es schreibt niemals in eine Datei mit fehlerhaftem YAML. Korrigiere die Syntax, und das Plugin erfasst sie bei der nächsten Bearbeitung.

> Ich speichere in schneller Folge. Wird der Zeitstempel bei jedem Speichern aktualisiert?

Nein. Es gibt ein Mindestintervall von 30 Sekunden zwischen Aktualisierungen (konfigurierbar: 5-300 Sekunden) plus eine Entprellung von 2 Sekunden, sodass schnelle Bearbeitungen zu einem einzigen Zeitstempel-Schreibvorgang zusammengefasst werden.

## Synchronisierung und Versionsverwaltung

Das Plugin speichert eine lokale Cache-Datei `hash-cache.json` in seinem Datenverzeichnis (`.obsidian/plugins/frontmatter-date-manager/`). Diese Datei enthält SHA-256-Hashes, die zur Erkennung von Inhaltsänderungen verwendet werden. Sie wird beim Start automatisch neu aufgebaut, sodass es sicher und empfehlenswert ist, sie auszuschließen.

**Warum ausschließen:** Der Cache wird bei jeder Dateibearbeitung aktualisiert, sodass mehrere Geräte ihn unabhängig voneinander verändern - das führt zu häufigen Sync-Konflikten und unnötigem Datenverkehr. Da er automatisch neu aufgebaut wird, bringt das Synchronisieren keinen Vorteil.

Füge zu deiner `.gitignore` hinzu:

```
.obsidian/plugins/frontmatter-date-manager/hash-cache.json
```

Für **Obsidian Sync**: Die Datei ist bereits automatisch ausgeschlossen (Sync synchronisiert keine Plugin-Datendateien außer `data.json`).

Für **iCloud, Syncthing, Dropbox oder andere dateibasierte Synchronisierung**: Füge `hash-cache.json` zur Ignorier-/Ausschlussliste deines Sync-Tools für das Plugin-Verzeichnis hinzu.

## Datenschutz und Berechtigungen

Dieses Plugin ist vollständig lokal. Es hat kein Backend, stellt keine Netzwerkanfragen und sammelt keinerlei Telemetrie oder Analysedaten. Die Community-Plugin-Bewertungskarte listet die Berechtigungen auf, die der Code eines Plugins nutzen kann; hier ist genau, wofür dieses Plugin jede einzelne verwendet:

- **Liest Markdown-Dateien in deinem Vault.** Die Massen-Tools (Datumsangaben befüllen, eine Eigenschaft umbenennen, Datumsangaben umformatieren, Datumsangaben außer der Reihe finden, den Änderungserkennungs-Cache neu aufbauen) arbeiten über den gesamten Vault hinweg, sodass sie deine Markdown-Notizen über Obsidians `getMarkdownFiles()` auflisten. Das Plugin zählt niemals Nicht-Markdown-Dateien auf (`getFiles()` wird nicht verwendet), sodass Anhänge, Bilder und andere Binärdateien niemals berührt werden.
- **Schreibt nur die konfigurierten Datumseigenschaften.** Alle Änderungen laufen über Obsidians `processFrontMatter()`, das nur die von dir konfigurierten Eigenschaften `created` / `updated` / `viewed` berührt und den Notiztext, die Schlüsselreihenfolge, Kommentare und unbeteiligte Eigenschaften unberührt lässt.
- **Schreibt eine Begleitdatei in seinem eigenen Plugin-Ordner.** Der SHA-256-Änderungserkennungs-Cache (`hash-cache.json`) wird innerhalb von `.obsidian/plugins/frontmatter-date-manager/` geschrieben, niemals in deine Notizen.
- **Nur lokaler Export.** Die Schaltfläche „Vollständige Vorschau herunterladen" speichert das Diff über den Browser als lokale `.tsv`-Datei und schreibt keine Datei in deinen Vault. Der Dateidownload ist nur am Desktop verfügbar - auf Mobilgeräten bleibt das vollständige Diff in der Tabelle auf dem Bildschirm lesbar.

## Sprachen

Die Oberfläche des Plugins folgt automatisch der eigenen Spracheinstellung von Obsidian - es gibt keine separate Sprachoption zum Einstellen. Es liefert Übersetzungen für 21 Sprachen mit (Arabisch, Deutsch, Englisch, Spanisch, Persisch, Französisch, Indonesisch, Italienisch, Japanisch, Koreanisch, Niederländisch, Polnisch, Portugiesisch, brasilianisches Portugiesisch, Russisch, Thailändisch, Türkisch, Ukrainisch, Vietnamesisch sowie vereinfachtes/traditionelles Chinesisch), und jeder Text, den eine Übersetzung nicht abdeckt, fällt auf Englisch zurück, sodass die Oberfläche nie leer bleibt. Englisch und Russisch sind von Hand geprüft; der Rest sind Basisübersetzungen, und **Verbesserungen sind sehr willkommen** - siehe „Translations" in [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Entwicklung

```bash
make              # Show all available commands
make install      # Install dependencies
make pre-commit   # Run all checks (format, lint, test, build)
make local-test   # Build and copy plugin to local vault
```

Um `make local-test` zu verwenden, setze `OBSIDIAN_VAULT_TEST` in deiner Shell-Umgebung oder übergib es direkt: `make local-test OBSIDIAN_VAULT_TEST=/path/to/vault`.

## Lizenz

[MIT](LICENSE)
