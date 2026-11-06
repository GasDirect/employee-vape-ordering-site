#!/usr/bin/env python3
"""Check curated flavor family metadata, stable source ordering, and both Foger collections."""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = json.loads((ROOT / "data/products.json").read_text(encoding="utf-8"))["products"]
META = json.loads((ROOT / "data/flavor-groups.json").read_text(encoding="utf-8"))
EXPECTED_GROUPS = [
    "Mints & Fresh",
    "Ice & Frozen",
    "Classic & Neutral",
    "Strawberry Fruit",
    "Berries & Melons",
    "Tropical & Citrus",
    "Lemonade & Refreshers",
    "Slush",
    "Punch & Bold Blends",
    "Desserts & Creams",
    "Gummy & Cotton Candy",
    "Bubblegum, B-Pop & Hubba",
    "Sweet Candy & Savers",
    "Sour, Gush & Extreme",
]


def main():
    assert META["version"] == 1
    groups = META["brands"]["foger"]
    assert [g["title"] for g in groups] == EXPECTED_GROUPS, "Wrong curated group order."
    assert len({g["id"] for g in groups}) == 14, "Duplicate group identifiers."
    all_flavors = [f for group in groups for f in group["flavors"]]
    assert len(all_flavors) == 91
    assert all(count == 1 for count in Counter(all_flavors).values()), "A flavor appears in multiple groups."
    assert all(group["shortLabel"] and group["flavors"] for group in groups)

    for category in ("Kits", "Replacement Pods"):
        products = sorted(
            [p for p in PRODUCTS if p["retailerKey"] == "foger" and p["category"] == category],
            key=lambda p: p["displayOrder"],
        )
        assert len(products) == 91, f"{category}: expected 91 products"
        assert len({p["id"] for p in products}) == 91
        assert Counter(p["variety"] for p in products) == Counter(all_flavors), f"{category}: missing or duplicate flavor."
        for group in groups:
            wanted = set(group["flavors"])
            ordered_subsequence = [p["variety"] for p in products if p["variety"] in wanted]
            assert ordered_subsequence == group["flavors"], (
                f"{category}/{group['title']}: curated source order changed."
            )
        for product in products:
            picture = str(product["image"])
            assert picture.startswith(f"assets/products/foger/{'kits' if category == 'Kits' else 'pods'}/")
            assert picture.endswith(".webp")
            assert (ROOT / picture).is_file(), f"Missing picture: {picture}"

    for i in range(1, 92):
        kit = next(p for p in PRODUCTS if p["id"] == f"foger-kit-{i:03d}")
        pod = next(p for p in PRODUCTS if p["id"] == f"foger-pod-{i:03d}")
        assert kit["variety"] == pod["variety"]
        assert kit["image"] != pod["image"]

    print("PASS: 14 curated groups, 91 unique flavors, 91 Kits + 91 Pods, source order preserved, all 182 image paths valid.")


if __name__ == "__main__":
    main()
