"""Turn a writers'-room concept (JSON) into episodes/<ep>/script.json for audio/build_episode.py.

  python3 tools/concept_to_script.py <ranked.json> <concept-id-or-title> <ep> [--spooky]

Line beats → speaker 'narr'; HUSS beats → speaker 'me'. Concept sfx names are mapped onto
build_episode's sfx types and spread across the beat; overlays/quote cards become beat fields the
shot builder reads (overlay, card). music 'same' is dropped (the previous mode continues);
--spooky turns 'night' into the dark 'spooky' drone.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX = {
    'boom': 'boom', 'vine boom': 'boom', 'record scratch': 'scratch', 'scratch': 'scratch', 'ding': 'ding', 'pop': 'pop',
    'thunder': 'thunder', 'siren': 'siren', 'static': 'static', 'knock': 'knock', 'cheer': 'cheer', 'laugh': 'laugh',
    'laugh track': 'laugh', 'thump': 'thump', 'whoosh': 'whoosh', 'rumble': 'rumble', 'airhorn': 'airhorn', 'air horn': 'airhorn',
    'dun dun': 'dundun', 'dundun': 'dundun', 'sting': 'sting', 'wahwah': 'wahwah', 'sad trombone': 'wahwah', 'coo': 'coo',
}


def main():
    src, key, ep = sys.argv[1], sys.argv[2], sys.argv[3]
    spooky = '--spooky' in sys.argv
    data = json.load(open(src))
    items = data['ranked'] if 'ranked' in data else data
    c = next(x for x in items if x.get('id') == key or x.get('title', '').lower() == key.lower())
    beats, n = [], 0
    for b in c['beats']:
        n += 1
        bid = f'b{n:02d}'
        if b['kind'] == 'huss':
            k = int(b.get('n') or len(re.findall(r'huss', b['text'], re.I)) or 3)
            beat = {'id': bid, 'kind': 'huss', 'speaker': 'me', 'text': ' '.join(['HUSS!'] * k), 'n': k, 'gapAfter': 0.3}
        else:
            beat = {'id': bid, 'kind': 'line', 'speaker': 'narr', 'text': b['text'].strip(), 'gapAfter': 0.3}
        m = b.get('music')
        if m and m != 'same':
            beat['music'] = 'spooky' if (spooky and m == 'night') else m
        fx = []
        for j, s in enumerate(b.get('sfx') or []):
            t = SFX.get(s.strip().lower())
            if not t:
                print(f'  ! {bid}: unknown sfx {s!r} skipped', file=sys.stderr)
                continue
            fx.append({'type': t, 'at': 'start' if j == 0 else f'start+{0.55 * j:.2f}', 'gain': 0.7})
        if fx:
            beat['sfx'] = fx
        ov = (b.get('overlay') or '').strip()
        if ov:
            q = re.match(r'^["“](.+?)["”]\s*[—-]\s*(.+)$', ov)
            if q:
                beat['card'] = {'type': 'quote', 'quote': q.group(1), 'by': q.group(2)}
            else:
                beat['overlay'] = ov
        beat['visual'] = b['visual']
        beats.append(beat)
    if beats and 'music' not in beats[0]:
        beats[0]['music'] = 'party'
    beats[-1]['gapAfter'] = 0.8
    script = {
        'title': f"In This Town — {c['title']}", 'lead_in': 0.3, 'bed': True, 'voices': {},
        'logline': c.get('logline'), 'twist': c.get('twist'), 'caption_hook': c.get('caption_hook'),
        'vibe': c.get('vibe'), 'sets': c.get('sets'), 'newProps': c.get('new_props'), 'beats': beats,
    }
    out = os.path.join(ROOT, 'episodes', ep)
    os.makedirs(out, exist_ok=True)
    json.dump(script, open(os.path.join(out, 'script.json'), 'w'), indent=1, ensure_ascii=False)
    words = sum(len(x['text'].split()) for x in beats if x['kind'] == 'line')
    print(f"{ep}: {c['title']} — {len(beats)} beats, {words} narration words → episodes/{ep}/script.json")


if __name__ == '__main__':
    main()
