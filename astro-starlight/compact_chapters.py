import os
import re

source_base = "/Users/anand/Projects/project-vyasa/vyasa-docs/astro-starlight/sample-workspaces/vedabase-bg/content"
dest_base = "/Users/anand/Projects/project-vyasa/vyasa-docs/astro-starlight/sample-workspaces/vyasa-bg/content"

def process_stream(stream_name, source_path_suffix, dest_path_suffix):
    src_dir = os.path.join(source_base, source_path_suffix)
    dest_dir = os.path.join(dest_base, dest_path_suffix)
    
    os.makedirs(dest_dir, exist_ok=True)
    
    for chapter in range(2, 19):
        chapter_dir = os.path.join(src_dir, str(chapter))
        if not os.path.exists(chapter_dir):
            continue
            
        verses = []
        for filename in os.listdir(chapter_dir):
            if not filename.endswith('.vy'):
                continue
                
            # Parse verse number to sort correctly. E.g., '1-2.vy' or '10.vy'
            base = filename.replace('.vy', '')
            if '-' in base:
                sort_key = int(base.split('-')[0])
            else:
                sort_key = int(base)
                
            verses.append((sort_key, filename))
            
        verses.sort(key=lambda x: x[0])
        
        combined_text = []
        for _, filename in verses:
            filepath = os.path.join(chapter_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Remove `set meta { urn = "..." }
                content = re.sub(r'`set meta \{ urn = "[^"]+" \}\n', '', content)
                
                # Remove `devanagari [ or `iast [
                content = re.sub(r'[ \t]*`(devanagari|iast) \[\n', '', content)
                
                # Replace the double closing brackets
                content = re.sub(r'[ \t]*\]\n\]', ']', content)
                
                combined_text.append(content.strip() + "\n")
                
        output_file = os.path.join(dest_dir, f"{chapter}.vy")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("\n".join(combined_text))
            
        print(f"Created {output_file}")

process_stream("mula", "mula", "mula")
process_stream("iast", "transliteration/iast", "iast")
