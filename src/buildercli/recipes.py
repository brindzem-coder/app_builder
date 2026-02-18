import json
from pathlib import Path
from buildercli.util import render_vars, run_cmd, write_from_template, ensure_dir

ROOT = Path(__file__).resolve().parents[2]  # .../src
RECIPES_DIR = ROOT / "buildercli" / ".." / ".." / "recipes"  # not ideal but works

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
