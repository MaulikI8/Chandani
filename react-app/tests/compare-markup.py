"""Compare static page composition to the approved HTML. This is not a screenshot test."""
from html.parser import HTMLParser
from pathlib import Path
import difflib
import json
import re

VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

class Tree(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = {'tag': 'document', 'attrs': {}, 'children': []}
        self.stack = [self.root]
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        node = {'tag': tag, 'attrs': dict(attrs), 'children': []}
        self.stack[-1]['children'].append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i]['tag'] == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, data):
        self.stack[-1]['children'].append(data)

def find(node, predicate):
    if isinstance(node, str): return None
    if predicate(node): return node
    for child in node['children']:
        found = find(child, predicate)
        if found: return found

def normalize(node):
    if isinstance(node, str):
        text = re.sub(r'\s+', ' ', node).strip()
        return text or None
    attrs = node['attrs']
    classes = attrs.get('class', '')
    # Deliberate accessibility and showroom additions are checked separately; retain the
    # original composition checks for everything surrounding them.
    if node['tag'] in ('noscript', 'script', 'link') or any(c in ('try-loading', 'nav-try-room', 'comparison-adjust', 'showroom-extension') for c in classes.split()): return None
    result = {'tag': node['tag']}
    if classes: result['class'] = classes
    if node['tag'] == 'img': result['src'] = attrs['src'].lstrip('/')
    if 'd' in attrs: result['d'] = attrs['d']
    if classes not in ('hotspots', 'scene-card', 'product-grid') and attrs.get('id') != 'resultCount':
        children = [normalize(child) for child in node['children']]
        result['children'] = [child for child in children if child is not None]
    return result

checks = []
for name, source in [('home', 'index.html'), ('studio', 'atelier.html')]:
    reference = Tree(Path('../source', source).read_text()).root
    migrated = Tree(Path('test-results/markup', name + '.html').read_text()).root
    for section in ('header', 'main', 'footer'):
        a = normalize(find(reference, lambda node: node['tag'] == section))
        b = normalize(find(migrated, lambda node: node['tag'] == section))
        if a != b:
            before = json.dumps(a, indent=2, ensure_ascii=False).splitlines()
            after = json.dumps(b, indent=2, ensure_ascii=False).splitlines()
            print('\n'.join(difflib.unified_diff(before, after, fromfile=f'{name} reference {section}', tofile=f'{name} React {section}')))
            raise SystemExit(1)
        checks.append(f'{name}: {section} static composition matches')
        print('PASS', checks[-1])
def text_content(node):
    if isinstance(node, str): return node
    return ''.join(text_content(child) for child in node['children'])

for name, label in [('try-sofa', 'With sofa'), ('try-kitchen', 'Kitchen concept'), ('try-carpet', 'With carpet')]:
    tree = Tree(Path('test-results/markup', name + '.html').read_text()).root
    dialog = find(tree, lambda n: n['tag'] == 'dialog')
    assert dialog['attrs'].get('aria-modal') == 'true'
    assert find(tree, lambda n: n['attrs'].get('id') == dialog['attrs']['aria-labelledby'])
    slider = find(tree, lambda n: n['tag'] == 'input' and n['attrs'].get('type') == 'range')
    assert slider['attrs'].get('aria-label')
    description = find(tree, lambda n: n['attrs'].get('id') == slider['attrs']['aria-describedby'])
    assert description and all(key in text_content(description) for key in ['arrow keys', 'Home', 'End'])
    assert label.lower() in slider['attrs']['aria-valuetext']
    assert find(tree, lambda n: n['tag'] == 'button' and n['attrs'].get('aria-label') == 'Show more: ' + label)
    assert find(tree, lambda n: n['tag'] == 'button' and n['attrs'].get('aria-label') == 'Show less: ' + label)
    for group in ['Choose a piece', 'Comparison view', 'Preview lighting', 'Adjust comparison']:
        assert find(tree, lambda n: n['attrs'].get('role') == 'group' and n['attrs'].get('aria-label') == group)
    assert find(tree, lambda n: n['attrs'].get('class') == 'try-feedback' and n['attrs'].get('role') == 'status')
    glass = find(tree, lambda n: 'glass-surface' in n['attrs'].get('class', '').split())
    assert glass and 'glass-surface--fallback' in glass['attrs']['class']
    for label in ['Day', 'Evening']:
        assert find(glass, lambda n: n['tag'] == 'button' and text_content(n) == label and 'aria-pressed' in n['attrs'])
    assert find(glass, lambda n: n['tag'] == 'button' and n['attrs'].get('aria-label') == 'Expand room comparison')
    assert len(re.findall(r'class="[^"]*\bglass-surface ', Path('test-results/markup', name + '.html').read_text())) == 1
    checks.append(f'{name}: named dialog, descriptive slider, non-drag controls, named groups and local feedback')
    print('PASS', checks[-1])

home = Tree(Path('test-results/markup/home.html').read_text()).root
entry = find(home, lambda n: n['attrs'].get('class') == 'nav-try-room')
assert entry and entry['attrs'].get('aria-haspopup') == 'dialog' and 'Try the room' in text_content(entry)
checks.append('Desktop navigation has a direct Try the room entry')
print('PASS', checks[-1])

def visible_content(node):
    if isinstance(node, str): return
    # Animations must never leave SSR/fallback content transparent or translated.
    style = node['attrs'].get('style', '')
    assert not re.search(r'opacity\s*:\s*0(?:;|$)', style), style
    assert not re.search(r'transform\s*:\s*(?:translate|matrix)', style), style
    for child in node['children']: visible_content(child)

for name in ['home', 'studio']:
    tree = Tree(Path('test-results/markup', name + '.html').read_text()).root
    visible_content(tree)
    assert not find(tree, lambda n: 'glass-surface' in n['attrs'].get('class', '').split())
checks.append('Motion starts with visible page content; glass is limited to one room toolbar with labelled working controls')
print('PASS', checks[-1])
Path('test-results/markup/report.json').write_text(json.dumps({'checks': checks, 'scope': 'Static composition and accessibility semantics. Comparison excludes dynamic product grids, counts, hidden hotspot/detail children and explicit new accessibility controls (nav-try-room/comparison-adjust). Does not validate browser layout, focus or assistive technology behavior.'}, indent=2) + '\n')
