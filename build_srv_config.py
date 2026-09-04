"""Enrich the configured SRVs with Command Variants from SRV Control Sheet.xlsx."""

import json
import re
from pathlib import Path
from zipfile import ZipFile

from build_environment_json import read_sheet_rows


SOURCE = Path("SRV Control Sheet.xlsx")
CONFIG = Path("app-config.json")
SHEET_NAME = "SRV's"
CV_COLUMNS = {
    7: ("1",),
    8: ("2",),
    9: ("3",),
    10: ("4", "5"),
    11: ("6",),
    12: ("7",),
    13: ("8",),
}
PERMITTED_USER_COLUMNS = {
    20: "IS",
    21: "ES",
    22: "GS",
    23: "RSA",
    24: "ED",
    25: "GT",
    26: "OU",
    27: "DSP",
    28: "MDR",
}


def normalise_srv(value: str) -> str:
    """Restore known trailing-zero SRVs and remove Excel floating-point noise."""
    if value == "6.3":
        return "6.30"
    if re.fullmatch(r"\d+\.\d{6,}", value):
        return format(float(value), ".12g")
    return value


def extract_command_variants(rows: list[list[str]]) -> dict[str, list[str]]:
    header_index = next(
        index for index, row in enumerate(rows)
        if row and row[0] == "Service Reference Variant"
    )
    variants_by_srv: dict[str, set[str]] = {}

    for row in rows[header_index + 1:]:
        if not row or not row[0]:
            continue
        srv = normalise_srv(row[0])
        applicable = variants_by_srv.setdefault(srv, set())
        for column, variants in CV_COLUMNS.items():
            value = row[column].strip().upper() if column < len(row) else ""
            if value == "X":
                applicable.update(variants)

    return {
        srv: sorted(variants, key=int)
        for srv, variants in variants_by_srv.items()
    }


def extract_permitted_users(rows: list[list[str]]) -> dict[str, list[str]]:
    header_index = next(
        index for index, row in enumerate(rows)
        if row and row[0] == "Service Reference Variant"
    )
    users_by_srv: dict[str, set[str]] = {}

    for row in rows[header_index + 1:]:
        if not row or not row[0]:
            continue
        srv = normalise_srv(row[0])
        permitted = users_by_srv.setdefault(srv, set())
        for column, user in PERMITTED_USER_COLUMNS.items():
            value = row[column].strip().upper() if column < len(row) else ""
            if value == "Y":
                permitted.add(user)

    user_order = list(PERMITTED_USER_COLUMNS.values())
    return {
        srv: sorted(users, key=user_order.index)
        for srv, users in users_by_srv.items()
    }


def extract_future_dated(rows: list[list[str]]) -> dict[str, str]:
    header_index = next(
        index for index, row in enumerate(rows)
        if row and row[0] == "Service Reference Variant"
    )
    values_by_srv: dict[str, list[str]] = {}

    for row in rows[header_index + 1:]:
        if not row or not row[0]:
            continue
        srv = normalise_srv(row[0])
        value = row[16].strip() if len(row) > 16 else ""
        if value:
            values_by_srv.setdefault(srv, []).append(value)

    return {
        srv: "yes" if any(value.lower() != "no" for value in values) else "no"
        for srv, values in values_by_srv.items()
    }


def main() -> None:
    with ZipFile(SOURCE) as archive:
        rows = read_sheet_rows(archive, SHEET_NAME)
    variants_by_srv = extract_command_variants(rows)
    users_by_srv = extract_permitted_users(rows)
    future_dated_by_srv = extract_future_dated(rows)

    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    configured = config["serviceRequestVariant"]
    srv_values = [item if isinstance(item, str) else item["srv"] for item in configured]
    existing_details = {
        item["srv"]: item
        for item in configured
        if isinstance(item, dict)
    }
    missing = sorted({srv for srv in srv_values if srv not in variants_by_srv})
    config["serviceRequestVariant"] = [
        {
            **existing_details.get(srv, {}),
            "srv": srv,
            "commandVariants": variants_by_srv.get(srv, []),
            "permittedUsers": users_by_srv.get(srv, []),
            "futureDated": future_dated_by_srv.get(srv, "no"),
        }
        for srv in srv_values
    ]
    CONFIG.write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated {len(srv_values)} configured SRV entries in {CONFIG}")
    if missing:
        print(f"No spreadsheet rows found for: {', '.join(missing)}")


if __name__ == "__main__":
    main()
