"""Build a minimal Ollama model payload for handing out on USB sticks.

Copies only the manifests and blobs for the models the workshop actually needs,
rather than the whole models directory, which is usually many times larger.

    python3 source/make_usb.py /Volumes/WORKSHOP
    python3 source/make_usb.py /Volumes/WORKSHOP --models granite4.2:3b granite4.2:8b

Attendees then copy the contents into their own models directory:
    macOS and Linux   ~/.ollama/models
    Windows           %USERPROFILE%\\.ollama\\models
and restart Ollama.
"""
import argparse
import json
import pathlib
import shutil
import sys

DEFAULT_MODELS = ["granite4.2:3b", "granite4.2:8b"]
SRC = pathlib.Path.home() / ".ollama" / "models"
README = """Workshop models
===============

Copy the two folders in here (manifests and blobs) into your Ollama models
directory, merging with what is already there:

  macOS and Linux   ~/.ollama/models
  Windows           %USERPROFILE%\\.ollama\\models

Then restart Ollama and check with:

  ollama list

You should see granite4.2:3b and granite4.2:8b.

If you would rather download them instead, it is about 7.5 GB:

  ollama pull granite4.2:3b
  ollama pull granite4.2:8b
"""


def manifest_path(model):
    name, _, tag = model.partition(":")
    return SRC / "manifests" / "registry.ollama.ai" / "library" / name / (tag or "latest")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dest", help="target directory, usually the mounted USB stick")
    ap.add_argument("--models", nargs="*", default=DEFAULT_MODELS)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    dest = pathlib.Path(args.dest)
    if not SRC.exists():
        print(f"No Ollama models directory at {SRC}")
        return 1

    plan, total = [], 0
    for model in args.models:
        mf = manifest_path(model)
        if not mf.exists():
            print(f"  missing manifest for {model}, pull it first")
            return 1
        d = json.loads(mf.read_text())
        layers = list(d.get("layers", []))
        if d.get("config"):
            layers.append(d["config"])
        size = 0
        for layer in layers:
            digest = layer.get("digest")
            if not digest:
                continue
            blob = SRC / "blobs" / digest.replace(":", "-")
            if not blob.exists():
                print(f"  missing blob {digest} for {model}")
                return 1
            plan.append((blob, dest / "blobs" / blob.name))
            size += blob.stat().st_size
        plan.append((mf, dest / mf.relative_to(SRC)))
        total += size
        print(f"  {model:<20} {size / 1e9:6.2f} GB")

    print(f"  {'total':<20} {total / 1e9:6.2f} GB in {len(plan)} files -> {dest}")
    if args.dry_run:
        print("\ndry run, nothing copied")
        return 0

    free = shutil.disk_usage(dest.parent if not dest.exists() else dest).free
    if free < total * 1.05:
        print(f"\nNot enough space at the destination: {free / 1e9:.1f} GB free")
        return 1

    copied = 0
    for src, dst in plan:
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists() and dst.stat().st_size == src.stat().st_size:
            continue                       # already there, sticks get reused
        shutil.copy2(src, dst)
        copied += 1
        print(f"    copied {dst.name[:24]:<24} {copied}/{len(plan)}", end="\r", flush=True)
    (dest / "README.txt").write_text(README)
    print(f"\nDone. {copied} files copied, {len(plan) - copied} already present.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
