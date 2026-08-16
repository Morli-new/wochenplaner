# Wochenplaner

Eine kleine, lokale Web-App zur produktiven Planung deiner Woche — keine Installation nötig, keine Anmeldung, keine Daten verlassen deinen Browser.

## Funktionen

- **Wochenübersicht (Mo–So)** mit eigener Aufgabenliste pro Tag
- **Aufgaben** mit Priorität (hoch/mittel/niedrig, per Klick auf den Punkt umschaltbar) und Erledigt-Status
- **Wochenziele** – die 3–5 wichtigsten Dinge der Woche im Blick behalten
- **Gewohnheiten-Tracker** – wiederkehrende Habits über die 7 Tage abhaken
- **Notizen** – freier Platz für Gedanken und Ideen der Woche
- **Fortschrittsanzeige** – zeigt den Anteil erledigter Aufgaben der aktuellen Woche
- **Wochennavigation** – vor/zurück blättern, jede Woche wird separat gespeichert
- **Hell-/Dunkelmodus**
- Alle Daten werden per `localStorage` **lokal im Browser** gespeichert

## Verwenden

Kein Build-Schritt nötig. Einfach `index.html` in einem lokalen Webserver öffnen, z. B.:

```bash
python -m http.server 8420
```

und danach `http://localhost:8420` im Browser öffnen.

(Direktes Öffnen der `index.html` per Doppelklick funktioniert in den meisten Browsern ebenfalls.)
