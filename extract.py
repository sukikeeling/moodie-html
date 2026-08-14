"""提取 moodie.html 所有 <script> 内容并合并，供 node 检查"""
import re

html = open('moodie.html', encoding='utf-8').read()
scripts = re.findall(r'<script>(.*?)</script>', html, re.S)
merged = '\n;\n'.join(scripts)
open('_check.js', 'w', encoding='utf-8').write(merged)
print(f'extracted {len(scripts)} script blocks, {len(merged)} chars')
