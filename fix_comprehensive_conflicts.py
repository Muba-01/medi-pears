import re
import glob
import os

# Multiple patterns to catch different conflict formats
patterns = [
    # Standard: <<<<<<< HEAD\n...\n=======\n...\n>>>>>>>
    re.compile(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> [a-f0-9]+', re.DOTALL),
    # With extra newlines: <<<<<<< HEAD\n\n...\n=======\n...\n>>>>>>>
    re.compile(r'<<<<<<< HEAD\n\n(.*?)\n=======\n(.*?)\n>>>>>>> [a-f0-9]+', re.DOTALL),
    # Different markers format
    re.compile(r'<<<<<<< HEAD.*?\n=======.*?\n>>>>>>>[^\n]*\n', re.DOTALL),
]

fixed = 0
errors = 0

for filepath in glob.glob('src/**/*.*', recursive=True):
    if not filepath.endswith(('.ts', '.tsx', '.css', '.json')):
        continue
    
    if '<<<<<<< HEAD' not in open(filepath, errors='ignore').read():
        continue
    
    try:
        for enc in ['utf-8', 'latin-1', 'cp1252']:
            try:
                with open(filepath, 'r', encoding=enc) as f:
                    content = f.read()
                break
            except:
                continue
        
        original = content
        
        # Try each pattern
        for pattern in patterns:
            matches = list(pattern.finditer(content))
            if matches:
                for match in matches:
                    # Keep remote version (group 2), or group 1 if empty
                    if len(match.groups()) >= 2:
                        remote = match.group(2).strip() if len(match.groups()) >= 2 else ''
                        local = match.group(1).strip() if len(match.groups()) >= 1 else ''
                        replacement = remote if remote else local
                    else:
                        # For patterns without groups, just remove the markers
                        replacement = ''
                    content = content[:match.start()] + replacement + content[match.end():]
                break
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'✓ {filepath}')
            fixed += 1
    except Exception as e:
        print(f'✗ {filepath}: {e}')
        errors += 1

print(f'\n✓ Fixed {fixed} | ✗ Errors {errors}')
