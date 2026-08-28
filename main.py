"""Run the Adaptor JSON Builder locally."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HOST = "127.0.0.1"
PORT = 8000

if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), SimpleHTTPRequestHandler)
    print(f"Adaptor JSON Builder is running at http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
    finally:
        server.server_close()
