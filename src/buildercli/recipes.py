import json
from pathlib import Path
from buildercli.util import render_vars, run_cmd, write_from_template, ensure_dir

ROOT = Path(__file__).resolve().parents[2]  # .../src
RECIPES_DIR = ROOT / "buildercli" / ".." / ".." / "recipes"  # not ideal but works

def _parse_env(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in text.splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        if "=" not in s:
            continue
        k, v = s.split("=", 1)
        out[k.strip()] = v.strip()
    return out


def _read_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    return _parse_env(path.read_text(encoding="utf-8"))


def _write_env_file(path: Path, data: dict[str, str]):
    lines = [f"{k}={v}" for k, v in data.items()]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _maybe_inject_parent_key(workdir: Path):
    """
    If parent.env exists at repo root, copy OPENAI_API_KEY into <workdir>/server/.env
    only if server/.env is missing key or has placeholder value.
    """
    repo_root = Path(__file__).resolve().parents[2]  # .../builder
    parent_env = repo_root / "parent.env"
    if not parent_env.exists():
        return

    parent = _read_env_file(parent_env)
    parent_key = parent.get("OPENAI_API_KEY", "").strip()
    if not parent_key:
        return

    target_env = workdir / "server" / ".env"
    if not target_env.exists():
        return

    target = _read_env_file(target_env)
    cur = target.get("OPENAI_API_KEY", "").strip()

    # Replace only if missing or placeholder-like
    placeholder = (not cur) or ("PASTE_YOUR_KEY" in cur) or ("YOUR_KEY" in cur) or (cur == "sk-...")

    if placeholder:
        target["OPENAI_API_KEY"] = parent_key
        _write_env_file(target_env, target)

def _recipes_base() -> Path:
    # robust: find recipes folder relative to this file
    return Path(__file__).resolve().parents[2] / "recipes"

def list_recipes():
    base = _recipes_base()
    return [p.name for p in base.iterdir() if p.is_dir()]

def apply_recipe(recipe_id: str, workdir: Path):
    base = _recipes_base() / recipe_id
    recipe_path = base / "recipe.json"
    if not recipe_path.exists():
        raise SystemExit(f"Recipe not found: {recipe_id}")

    recipe = json.loads(recipe_path.read_text(encoding="utf-8"))

    vars_map = {
        "WORKDIR": str(workdir).replace("\\", "/"),
        **(recipe.get("vars") or {})
    }

    for step in recipe.get("steps", []):
        t = step["type"]

        if t == "mkdir":
            path = Path(render_vars(step["path"], vars_map))
            ensure_dir(path)

        elif t == "write_file":
            path = Path(render_vars(step["path"], vars_map))
            tpl = base / render_vars(step["from_template"], vars_map)
            write_from_template(path, tpl, vars_map)

        elif t == "exec":
            cwd = Path(render_vars(step["cwd"], vars_map))
            cmd = render_vars(step["cmd"], vars_map)
            run_cmd(cmd, cwd)

        else:
            raise SystemExit(f"Unknown step type: {t}")

    # save recipe id for runner
    (workdir / ".builder.json").write_text(json.dumps({"recipe": recipe_id}, indent=2), encoding="utf-8")
    _maybe_inject_parent_key(workdir)

