"""将 LaoA-GrokBot 的 original-data.js 数据内嵌进模板，生成单文件 moodie.html"""
import io

TEMPLATE = '_template.html'
DATA_SRC = r'D:\temp\LaoA-GrokBot\original-data.js'
OUT = 'moodie.html'

with io.open(TEMPLATE, encoding='utf-8') as f:
    template = f.read()
with io.open(DATA_SRC, encoding='utf-8') as f:
    data = f.read()

marker = '/*__ORIGINAL_DATA__*/'
if marker not in template:
    raise SystemExit('模板缺少数据占位符')

result = template.replace(marker, data)
with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(result)

print(f'OK: {OUT} = {len(result)} chars ({len(result)/1024:.1f} KB)')
