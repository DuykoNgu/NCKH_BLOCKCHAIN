import os

def replace_checkmark_in_files(root_dir):
    for root, dirs, files in os.walk(root_dir):
        # Exclude venv
        if 'venv' in dirs:
            dirs.remove('venv')
            
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if '[OK]' in content:
                        print(f"Fixing {file_path}")
                        new_content = content.replace('[OK]', '[OK]')
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    replace_checkmark_in_files(".")
