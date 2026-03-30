import os

patched = []
for root, dirs, files in os.walk("sadtalker_repo"):
    for fname in files:
        if fname.endswith(".py"):
            fpath = os.path.join(root, fname)
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if ".astype(float32)" in content or ".astype(float64)" in content:
                new_content = content.replace(
                    ".astype(float32)", ".astype(np.float32)"
                ).replace(
                    ".astype(float64)", ".astype(np.float64)"
                )
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                patched.append(fpath)

print(f"Patched {len(patched)} files:")
for p in patched:
    print(f"  {p}")
print("Done!")