#!/usr/bin/env python3
"""
Dreamy Needle — Lightweight Local Server
Serves static assets and provides persistent review storage to reviews.json in the folder directory.
Usage: python server.py [port] (default: 8000)
"""

import http.server
import socketserver
import json
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
REVIEWS_FILE = os.path.join(DIRECTORY, 'reviews.json')

class NeedleRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        if self.path == '/api/reviews':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            if os.path.exists(REVIEWS_FILE):
                with open(REVIEWS_FILE, 'r', encoding='utf-8') as f:
                    self.wfile.write(f.read().encode('utf-8'))
            else:
                self.wfile.write(b'[]')
            return
        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/reviews':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                new_review = json.loads(post_data.decode('utf-8'))
                current_reviews = []
                if os.path.exists(REVIEWS_FILE):
                    try:
                        with open(REVIEWS_FILE, 'r', encoding='utf-8') as f:
                            current_reviews = json.load(f)
                    except Exception:
                        current_reviews = []
                
                # Prepend the new review
                current_reviews.insert(0, new_review)

                with open(REVIEWS_FILE, 'w', encoding='utf-8') as f:
                    json.dump(current_reviews, f, indent=2, ensure_ascii=False)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = json.dumps({'success': True, 'reviews': current_reviews})
                self.wfile.write(response.encode('utf-8'))
                print(f"[Review Saved] Added review from {new_review.get('name', 'Anonymous')}")
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return
        self.send_error(404, "Endpoint not found")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), NeedleRequestHandler) as httpd:
        print(f"Dreamy Needle studio running at http://localhost:{PORT}")
        print(f"Serving files from {DIRECTORY}")
        print(f"Reviews saved to {REVIEWS_FILE}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
