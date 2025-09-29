
import http.server
import socketserver
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == "__main__":
    PORT = 3000
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"🌐 Frontend server running on http://localhost:{PORT}")
        httpd.serve_forever()
