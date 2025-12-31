import requests
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse
import re

API_KEY = '4c4ae26aebfea1e40d21bc90a496e46a'
BASE_URL = 'https://api.themoviedb.org/3'

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Extract movie ID from path like /api/credits?id=123
        parsed_path = urlparse(self.path)
        
        # Try to get movie_id from query params
        from urllib.parse import parse_qs
        params = parse_qs(parsed_path.query)
        movie_id = params.get('id', [None])[0]
        
        if not movie_id:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"error": "movie_id required"}')
            return
        
        try:
            # Make request to TMDb
            response = requests.get(
                f'{BASE_URL}/movie/{movie_id}/credits',
                params={'api_key': API_KEY}
            )
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response.content)
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(f'{{"error": "{str(e)}"}}'.encode())