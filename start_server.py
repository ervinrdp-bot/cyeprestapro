#!/usr/bin/env python3
"""
Servidor local ultraligero para PrestaPro (PWA & Web App)
Sirve los archivos estáticos en http://localhost:8080 con soporte MIME completo
"""
import http.server
import socketserver
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Desactivar caché estricto para desarrollo local ágil
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    # Permitir reutilización rápida del puerto
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print("==================================================", flush=True)
            print(f"🚀 PRESTAPRO INICIADO EXITOSAMENTE", flush=True)
            print(f"👉 Abre en tu navegador: http://localhost:{PORT}", flush=True)
            print(f"📱 Compatible con computadoras, tablets y teléfonos", flush=True)
            print("Presiona Ctrl+C para detener el servidor", flush=True)
            print("==================================================", flush=True)
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 48: # Address already in use
            PORT = 8081
            with socketserver.TCPServer(("", PORT), Handler) as httpd:
                print(f"Puerto 8080 ocupado, sirviendo en: http://localhost:{PORT}")
                httpd.serve_forever()
        else:
            raise e
