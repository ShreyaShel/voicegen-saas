import os

replacements = [
    ("np.float", "float"),
    ("np.int ", "int "),
    ("np.int,", "int,"),
    ("np.int)", "int)"),
    ("np.complex", "complex"),
    ("np.bool ", "bool "),
    ("np.bool,", "bool,"),
    ("np.bool)", "bool)"),
    ("np.object ", "object "),
    ("np.str ", "str "),
]

patched = []
for root, dirs, files in os.walk("sadtalker_repo"):
    for fname in files:
        if fname.endswith(".py"):
            fpath = os.path.join(root, fname)
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            new_content = content
            for old, new in replacements:
                new_content = new_content.replace(old, new)
            if new_content != content:
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                patched.append(fpath)

print(f"Patched {len(patched)} files:")
for p in patched:
    print(f"  {p}")
print("Done!")