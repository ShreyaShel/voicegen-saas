import os

fixes = [
    (
        "sadtalker_repo/src/face3d/util/preprocess.py",
        'warnings.filterwarnings("ignore", category=np.VisibleDeprecationWarning)',
        'warnings.filterwarnings("ignore")'
    ),
]

# Also search for any other np.VisibleDeprecationWarning in the repo
for root, dirs, files in os.walk("sadtalker_repo"):
    for fname in files:
        if fname.endswith(".py"):
            fpath = os.path.join(root, fname)
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if "VisibleDeprecationWarning" in content:
                new_content = content.replace(
                    "category=np.VisibleDeprecationWarning",
                    ""
                ).replace(
                    "np.VisibleDeprecationWarning",
                    "DeprecationWarning"
                )
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Patched: {fpath}")

print("Done patching!")