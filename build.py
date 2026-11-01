"""Rebuild both offline HTML prototypes from source/. Standard library only."""
from pathlib import Path
import base64, json, re
R=Path(__file__).resolve().parent
S=R/'source'
D=R

def uri(p):
    mime='font/woff2' if p.suffix=='.woff2' else 'image/webp'
    return 'data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode('ascii')
assets={p.name:uri(p) for p in sorted((S/'assets').glob('*.webp'))}
css=(S/'style.css').read_text().replace("url('fonts/manrope.woff2')","url('"+uri(S/'fonts/manrope.woff2')+"')")
bootstrap='<script>window.CHANDANI_ASSETS='+json.dumps(assets,separators=(',',':'))+';document.querySelectorAll("img[data-asset]").forEach(function(img){img.src=window.CHANDANI_ASSETS[img.dataset.asset]});</script>'
for name in ['index.html','atelier.html']:
    h=(S/name).read_text().replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
    h=h.replace('<link rel="stylesheet" href="try-room.css">','<style>'+(S/'try-room.css').read_text()+'</style>')
    h=re.sub(r'src="assets/([^\"]+)"',lambda m:'data-asset="'+m[1]+'"',h)
    h=h.replace('<script src="catalogue.js" defer></script>',bootstrap+'<script>'+(S/'catalogue.js').read_text()+'</script>')
    h=h.replace('<script src="app.js" defer></script>','<script>'+(S/'app.js').read_text()+'</script>')
    for script in ['try-room-data.js','try-room.js']:
        h=h.replace('<script src="'+script+'" defer></script>','<script>'+(S/script).read_text()+'</script>')
    (D/name).write_text(h)
    print(name,round((D/name).stat().st_size/1024),'KiB')
