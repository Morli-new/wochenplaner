"""Lokaler Server fuer den Wochenplaner.

Startet einen kleinen Webserver im Ordner dieser Datei und oeffnet die App
im Standardbrowser. Laeuft bereits ein Server auf dem Port, wird nur der
Browser geoeffnet.

Wichtig: Das Logging wird bewusst stillgelegt, weil dieses Skript mit
pythonw.exe (ohne Konsolenfenster) laeuft. Dort ist sys.stderr None, und
die Standard-Logausgabe des Handlers wuerde bei jeder Anfrage abbrechen.
"""

import http.server
import os
import socket
import socketserver
import sys
import threading
import webbrowser

PORT = 8420
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
URL = f"http://localhost:{PORT}"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        # Ohne Konsole gibt es kein stderr - jede Ausgabe wuerde die Anfrage abbrechen.
        pass

    def end_headers(self):
        # Immer revalidieren, damit Aenderungen sofort sichtbar sind.
        # Bewusst "no-cache" und nicht "no-store": Browser lehnen die
        # Service-Worker-Registrierung ab, wenn das Skript "no-store" sendet.
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


class Server(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True


def port_belegt():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.settimeout(0.5)
        return probe.connect_ex(("127.0.0.1", PORT)) == 0


def main():
    if port_belegt():
        # Server laeuft schon - einfach die App oeffnen.
        webbrowser.open(URL)
        return

    try:
        httpd = Server(("127.0.0.1", PORT), Handler)
    except OSError:
        webbrowser.open(URL)
        return

    threading.Timer(0.5, webbrowser.open, args=[URL]).start()

    with httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    sys.exit(main())
