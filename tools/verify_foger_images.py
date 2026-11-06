#!/usr/bin/env python3
"""CI-ready Foger asset validation; no Pillow dependency and no network access."""
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'data/products.json'
MANIFEST = ROOT / 'docs/foger_images_manifest.json'


def main():
    data=json.loads(CATALOG.read_text(encoding='utf-8'))
    items={p['id']:p for p in data['products']}
    specs=json.loads(MANIFEST.read_text(encoding='utf-8'))['products']
    assert len(specs)==len({p['id'] for p in specs})==182
    count=Counter()
    for spec in specs:
        prod=items[spec['id']]
        assert prod['brand']=='Foger' and prod['category']==spec['type'] and prod['variety']==spec['flavor'],spec['id']
        assert prod['productName']==spec['name'] and len(prod['productName'])<40,spec['id']
        assert prod['image']==spec['image'],spec['id']
        assert not spec['image'].startswith(('http://','https://'))
        data=(ROOT/spec['image']).read_bytes()
        assert data[:4]==b'RIFF' and data[8:12]==b'WEBP',spec['id']
        assert hashlib.sha256(data).hexdigest()==spec['sha256'],spec['id']
        thumb=ROOT/'assets/email-thumbnails'/Path(*Path(spec['image']).parts[2:]).with_suffix('.png')
        assert thumb.is_file() and thumb.read_bytes()[:8]==b'\x89PNG\r\n\x1a\n',spec['id']
        count[spec['type']]+=1
    assert count == Counter({'Kits':91,'Replacement Pods':91}),count
    for i in range(1,92):
        kit=items[f'foger-kit-{i:03}']; pod=items[f'foger-pod-{i:03}']
        assert kit['image']!=pod['image'] and kit['variety']==pod['variety']
    print(f'PASS: {len(specs)} individually matched local Foger images; 91 Kits/91 Pods; PNG email thumbnails')

if __name__=='__main__':
    main()
