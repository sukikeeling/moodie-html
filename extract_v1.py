"""提取 moodie-v1.html 的 <script> 内容到 _check_v1.js 供 node 验证"""
import re
html = open('moodie-v1.html', encoding='utf-8').read()
scripts = re.findall(r'<script>(.*?)</script>', html, re.S)
merged = '\n;\n'.join(scripts)
open('_check_v1.js', 'w', encoding='utf-8').write(merged)
print(f'extracted {len(scripts)} blocks, {len(merged)} chars')
