"""Extract valid JSON payload templates from the supplied curl examples."""

import json
from pathlib import Path


TEMPLATES = {
    Path("JSONs/1.1.1/ESME/Block/1.1.1 - ESME - Block"): Path("templates/1.1.1/esme-block.json"),
    Path("JSONs/1.1.1/ESME/TOU/1.1.1 - ESME - TOU"): Path("templates/1.1.1/esme-tou.json"),
    Path("JSONs/1.1.1/GSME/TOU/1.1.1 - GSME - TOU"): Path("templates/1.1.1/gsme-tou.json"),
    Path("JSONs/1.6/1.6 - Credit Mode"): Path("templates/1.6/credit-mode.json"),
    Path("JSONs/1.6/1.6 - Prepay Mode"): Path("templates/1.6/prepay-mode.json"),
    Path("JSONs/1.7/1.7"): Path("templates/1.7/default.json"),
    Path("JSONs/2.2/2.2"): Path("templates/2.2/default.json"),
    Path("JSONs/2.5/2.5"): Path("templates/2.5/default.json"),
    Path("JSONs/3.1/3.1"): Path("templates/3.1/default.json"),
    Path("JSONs/3.2/3.2"): Path("templates/3.2/default.json"),
    Path("JSONs/3.3/3.3"): Path("templates/3.3/default.json"),
    Path("JSONs/3.4/3.4"): Path("templates/3.4/default.json"),
    Path("JSONs/3.5/3.5"): Path("templates/3.5/default.json"),
    Path("JSONs/4.1.1/4.1.1"): Path("templates/4.1.1/default.json"),
    Path("JSONs/4.1.2/4.1.2"): Path("templates/4.1.2/default.json"),
    Path("JSONs/4.1.3/4.1.3"): Path("templates/4.1.3/default.json"),
    Path("JSONs/4.1.4/4.1.4"): Path("templates/4.1.4/default.json"),
    Path("JSONs/4.2/4.2"): Path("templates/4.2/default.json"),
    Path("JSONs/4.3/4.3"): Path("templates/4.3/default.json"),
    Path("JSONs/4.4.2/4.4.2"): Path("templates/4.4.2/default.json"),
    Path("JSONs/4.4.3/4.4.3"): Path("templates/4.4.3/default.json"),
    Path("JSONs/4.4.4/4.4.4"): Path("templates/4.4.4/default.json"),
    Path("JSONs/4.4.5/4.4.5"): Path("templates/4.4.5/default.json"),
    Path("JSONs/4.6.1/4.6.1"): Path("templates/4.6.1/default.json"),
    Path("JSONs/4.6.2/4.6.2"): Path("templates/4.6.2/default.json"),
    Path("JSONs/4.8.1/4.8.1"): Path("templates/4.8.1/default.json"),
    Path("JSONs/4.11.1/4.11.1"): Path("templates/4.11.1/default.json"),
    Path("JSONs/4.11.2/4.11.2"): Path("templates/4.11.2/default.json"),
    Path("JSONs/4.12.1/4.12.1"): Path("templates/4.12.1/default.json"),
    Path("JSONs/4.12.2/4.12.2"): Path("templates/4.12.2/default.json"),
    Path("JSONs/4.13/4.13"): Path("templates/4.13/default.json"),
    Path("JSONs/4.14/4.14"): Path("templates/4.14/default.json"),
    Path("JSONs/4.15/4.15"): Path("templates/4.15/default.json"),
    Path("JSONs/4.16/4.16"): Path("templates/4.16/default.json"),
    Path("JSONs/4.17/4.17"): Path("templates/4.17/default.json"),
    Path("JSONs/4.18/4.18"): Path("templates/4.18/default.json"),
    Path("JSONs/5.2/by Device ID"): Path("templates/5.2/by-device-id.json"),
    Path("JSONs/5.2/by DSPScheduleID"): Path("templates/5.2/by-dsp-schedule-id.json"),
    Path("JSONs/5.3/by Device ID"): Path("templates/5.3/by-device-id.json"),
    Path("JSONs/5.3/by DSPScheduleID"): Path("templates/5.3/by-dsp-schedule-id.json"),
    Path("JSONs/6.2.1/6.2.1"): Path("templates/6.2.1/default.json"),
    Path("JSONs/6.2.2/6.2.2"): Path("templates/6.2.2/default.json"),
    Path("JSONs/6.2.3/6.2.3"): Path("templates/6.2.3/default.json"),
    Path("JSONs/6.2.4/6.2.4"): Path("templates/6.2.4/default.json"),
    Path("JSONs/6.2.5/6.2.5"): Path("templates/6.2.5/default.json"),
    Path("JSONs/6.2.7/6.2.7"): Path("templates/6.2.7/default.json"),
    Path("JSONs/6.2.8/6.2.8"): Path("templates/6.2.8/default.json"),
    Path("JSONs/6.2.9/6.2.9"): Path("templates/6.2.9/default.json"),
    Path("JSONs/6.6/6.6"): Path("templates/6.6/default.json"),
    Path("JSONs/6.7/6.7"): Path("templates/6.7/default.json"),
    Path("JSONs/6.11/6.11"): Path("templates/6.11/default.json"),
    Path("JSONs/6.20.1/6.20.1 - Import MPAN"): Path("templates/6.20.1/electricity-import-mpan.json"),
    Path("JSONs/6.20.1/Elec Import MPAN"): Path("templates/6.20.1/electricity-import-mpan.json"),
    Path("JSONs/6.20.1/6.20.1 - MPRN"): Path("templates/6.20.1/gas-mprn.json"),
    Path("JSONs/6.20.1/Gas MPRN"): Path("templates/6.20.1/gas-mprn.json"),
    Path("JSONs/6.20.2/6.20.2"): Path("templates/6.20.2/default.json"),
    Path("JSONs/6.24.1/6.24.1"): Path("templates/6.24.1/default.json"),
    Path("JSONs/6.24.2/6.24.2"): Path("templates/6.24.2/default.json"),
    Path("JSONs/6.26/6.26"): Path("templates/6.26/default.json"),
    Path("JSONs/6.27/6.27"): Path("templates/6.27/default.json"),
    Path("JSONs/6.29/6.29"): Path("templates/6.29/default.json"),
    Path("JSONs/6.30/6.30"): Path("templates/6.30/default.json"),
    Path("JSONs/6.31/6.31"): Path("templates/6.31/default.json"),
    Path("JSONs/6.32/6.32"): Path("templates/6.32/default.json"),
    Path("JSONs/7.1/7.1"): Path("templates/7.1/default.json"),
    Path("JSONs/7.2/7.2"): Path("templates/7.2/default.json"),
    Path("JSONs/7.3/7.3"): Path("templates/7.3/default.json"),
    Path("JSONs/7.4/7.4"): Path("templates/7.4/default.json"),
    Path("JSONs/7.11/7.11"): Path("templates/7.11/default.json"),
    Path("JSONs/7.12/7.12"): Path("templates/7.12/default.json"),
    Path("JSONs/7.14/7.14"): Path("templates/7.14/default.json"),
    Path("JSONs/7.15/7.15"): Path("templates/7.15/default.json"),
    Path("JSONs/8.1.1/8.1.1"): Path("templates/8.1.1/default.json"),
    Path("JSONs/8.2/byDeviceID"): Path("templates/8.2/by-device-id.json"),
    Path("JSONs/8.2/byMPXN"): Path("templates/8.2/by-mpxn.json"),
    Path("JSONs/8.2/byUPRN"): Path("templates/8.2/by-uprn.json"),
    Path("JSONs/8.3/8.3"): Path("templates/8.3/default.json"),
    Path("JSONs/8.7.1/8.7.1 - Add PPMID to ESME - UIT-B"): Path("templates/8.7.1/default.json"),
    Path("JSONs/8.7.2/8.7.2 - ESME added to PPMID - UIT-B"): Path("templates/8.7.2/default.json"),
    Path("JSONs/8.11/Add"): Path("templates/8.11/add.json"),
    Path("JSONs/8.11/Remove"): Path("templates/8.11/remove.json"),
    Path("JSONs/8.9/with ReadSecurityDetails"): Path("templates/8.9/with-read-security-details.json"),
    Path("JSONs/8.9/without ReadSecurityDetails"): Path("templates/8.9/without-read-security-details.json"),
    Path("JSONs/11.2/11.2"): Path("templates/11.2/default.json"),
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
