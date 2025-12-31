import requests
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

API_KEY = '4c4ae26aebfea1e40d21bc90a496e46a'
BASE_URL = 'https://api.themoviedb.org/3'

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        params = parse_qs(parsed_path.query)
        
        # Get query parameter
        query = params.get('query', [''])[0]
        
        if len(query) < 2:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"results": []}')
            return
        
        try:
            # Make request to TMDb
            response = requests.get(
                f'{BASE_URL}/search/movie',
                params={
                    'api_key': API_KEY,
                    'query': query,
                    'language': 'en-US',
                    'page': 1
                }
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