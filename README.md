# Adaptor JSON Builder

A local web application for selecting an environment, role, DUIS version, SRV, command variant, and payload template, then generating a curl request and JSON payload.

## Prerequisites

- Python 3.10 or later
- A modern web browser such as Chrome, Edge, or Firefox

No third-party Python or JavaScript packages are required to run the website.

## Run locally

1. Clone the repository and enter its directory:

   ```powershell
   git clone https://github.com/alexszarko/Adaptor-JSON-Builder.git
   cd Adaptor-JSON-Builder
   ```

2. Start the local web server:

   ```powershell
   python main.py
   ```

3. Open the following address in your browser:

   ```text
   http://127.0.0.1:8000
   ```

4. To stop the server, return to the terminal and press `Ctrl+C`.

Do not open `index.html` directly from the filesystem. The website loads JSON configuration and payload templates with browser requests, which require the local web server.

## Runtime configuration

- `app-config.json` contains the filter values, SRV metadata, and curl command template.
- `environment-setup.json` contains Determined Originator Name records grouped by environment and DUIS version.
- `templates/` contains the JSON payload templates used by the website.

These JSON files and the files under `templates/` are the application's authoritative runtime data. They can be maintained directly, and the website does not read either source spreadsheet.

## Optional spreadsheet import

The spreadsheets are retained as optional maintenance sources. If spreadsheet data needs to be imported again, refresh the corresponding JSON files with:

```powershell
python build_environment_json.py
python build_srv_config.py
python build_payload_templates.py
```

Run the scripts from the repository root. These scripts overwrite their corresponding JSON output, so direct JSON changes should be committed or backed up before running them. The spreadsheets are not needed to run the website or a future desktop client.
