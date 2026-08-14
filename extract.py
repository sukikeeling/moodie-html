import re
html = open('moodie.html', encoding='utf-8').read()
m = re.search(r'<script>(.*?)</script>', html, re.S)
open('_check.js', 'w', encoding='utf-8').write(m.group(1))
print('ok')
