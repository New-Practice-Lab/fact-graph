#!/usr/bin/env python3
"""Development server with no-cache headers"""
from http.server import HTTPServer, SimpleHTTPRequestHandler

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


def main():
    print("Starting development server at http://localhost:8000")
    HTTPServer(('', 8000), NoCacheHandler).serve_forever()


if __name__ == '__main__':
    main()