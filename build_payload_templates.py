"""Extract valid JSON payload templates from the supplied curl examples."""

import json
from pathlib import Path


TEMPLATES = {
    Path("JSONs/1.1.1/ESME/Block/1.1.1 - ESME - Block"): Path("templates/1.1.1/esme-block.json"),
    Path("JSONs/1.1.1/ESME/TOU/1.1.1 - ESME - TOU"): Path("templates/1.1.1/esme-tou.json"),
    Path("JSONs/1.1.1/GSME/TOU/1.1.1 - GSME - TOU"): Path("templates/1.1.1/gsme-tou.json"),
    Path("JSONs/1.6/1.6 - Credit Mode"): Path("templates/1.6/credit-mode.json"),
    Path("JSONs/1.6/1.6 - Prepay Mode"): Path("templates/1.6/prepay-mode.json"),
    Path("JSONs/2.2/2.2"): Path("templates/2.2/default.json"),
    Path("JSONs/3.1/3.1"): Path("templates/3.1/default.json"),
    Path("JSONs/4.1.1/4.1.1"): Path("templates/4.1.1/default.json"),
    Path("JSONs/4.1.3/4.1.3"): Path("templates/4.1.3/default.json"),
    Path("JSONs/4.4.2/4.4.2"): Path("templates/4.4.2/default.json"),
    Path("JSONs/4.6.1/4.6.1"): Path("templates/4.6.1/default.json"),
}


def extract_payload(source: Path) -> dict:
    command = source.read_text(encoding="utf-8-sig")
    payload_start = command.find("{")
    payload_end = command.rfind("}")
    if payload_start == -1 or payload_end < payload_start:
        raise ValueError(f"No JSON object found in {source}")
    return json.loads(command[payload_start:payload_end + 1])


def main() -> None:
    for source, destination in TEMPLATES.items():
        payload = extract_payload(source)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print(f"Created {destination}")


if __name__ == "__main__":
    main()
