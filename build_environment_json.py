"""Build environment-setup.json from the Registration Data Template worksheet."""

import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile


SOURCE = Path("Environment Setup.xlsx")
OUTPUT = Path("environment-setup.json")
SHEET_NAME = "Registration Data Template"
MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"m": MAIN_NS}


def column_index(reference: str) -> int:
    """Convert an Excel cell reference such as C12 to a zero-based column index."""
    letters = re.match(r"[A-Z]+", reference).group()
    result = 0
    for letter in letters:
        result = result * 26 + ord(letter) - ord("A") + 1
    return result - 1


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        inline = cell.find("m:is", NS)
        return "" if inline is None else "".join(inline.itertext()).strip()

    value = cell.find("m:v", NS)
    if value is None or value.text is None:
        return ""
    if cell_type == "s":
        return shared_strings[int(value.text)].strip()
    return value.text.strip()


def read_sheet_rows(archive: ZipFile, sheet_name: str) -> list[list[str]]:
    shared_strings: list[str] = []
    if "xl/sharedStrings.xml" in archive.namelist():
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
        shared_strings = ["".join(item.itertext()) for item in root.findall("m:si", NS)]

    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    targets = {item.attrib["Id"]: item.attrib["Target"] for item in relationships}
    sheet = next(
        (item for item in workbook.find("m:sheets", NS) if item.attrib["name"] == sheet_name),
        None,
    )
    if sheet is None:
        raise ValueError(f"Worksheet not found: {sheet_name}")

    relationship_id = sheet.attrib[f"{{{REL_NS}}}id"]
    target = targets[relationship_id].lstrip("/")
    sheet_path = target if target.startswith("xl/") else f"xl/{target}"
    root = ET.fromstring(archive.read(sheet_path))

    rows: list[list[str]] = []
    for row in root.findall(".//m:sheetData/m:row", NS):
        cells = row.findall("m:c", NS)
        if not cells:
            continue
        values = [""] * (max(column_index(cell.attrib["r"]) for cell in cells) + 1)
        for cell in cells:
            values[column_index(cell.attrib["r"])] = cell_value(cell, shared_strings)
        rows.append(values)
    return rows


def build_grouped_data(rows: list[list[str]]) -> dict[str, dict[str, list[dict[str, str]]]]:
    headers = rows[0]
    required = ["EUI-64", "Role", "DUIS Role", "DUIS Version", "Environment", "Determined Originator Name"]
    missing = [header for header in required if header not in headers]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")

    positions = {header: headers.index(header) for header in required}
    grouped: dict[str, dict[str, list[dict[str, str]]]] = {}

    for row in rows[1:]:
        values = {
            header: row[index] if index < len(row) else ""
            for header, index in positions.items()
        }
        if not values["Environment"] or not values["DUIS Version"]:
            continue

        environment = values["Environment"]
        version = re.sub(r"^DUIS\s*", "", values["DUIS Version"], flags=re.IGNORECASE)
        record = {
            "eui64": values["EUI-64"],
            "role": values["Role"],
            "duisRole": values["DUIS Role"],
            "determinedOriginatorName": values["Determined Originator Name"],
        }
        grouped.setdefault(environment, {}).setdefault(version, []).append(record)

    return grouped


def main() -> None:
    with ZipFile(SOURCE) as archive:
        rows = read_sheet_rows(archive, SHEET_NAME)
    grouped = build_grouped_data(rows)
    OUTPUT.write_text(json.dumps(grouped, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    record_count = sum(len(records) for versions in grouped.values() for records in versions.values())
    print(f"Wrote {record_count} records across {len(grouped)} environments to {OUTPUT}")


if __name__ == "__main__":
    main()
