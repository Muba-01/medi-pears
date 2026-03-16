import re
import os
import glob

# Find ALL files with conflicts
pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> [a-f0-9]+', re.DOTALL)
fixed_count = 0
error_count = 0

for filepath in glob.glob('src/**/*.*', recursive=True):
    if not filepath.endswith(('.ts', '.tsx', '.css', '.json')):
        continue
    
    try:
        # Try different encodings
        for encoding in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']:
            try:
                with open(filepath, 'r', encoding=encoding) as f:
                    content = f.read()
                break
            except (UnicodeDecodeError, UnicodeEncodeError):
                continue
        
        # Check for conflicts
        if '<<<<<<< HEAD' not in content:
            continue
            
        # Keep remote version (group 2)
        fixed = re.sub(pattern, r'\2', content)
        
        if fixed != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed)
            print(f'✓ {filepath}')
            fixed_count += 1
    except Exception as e:
        print(f'✗ {filepath}: {e}')
        error_count += 1

print(f'\n✓ Fixed: {fixed_count} | ✗ Errors: {error_count}')
