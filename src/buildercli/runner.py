import json
import subprocess
import time
from pathlib import Path
from buildercli.util import render_vars

def run_project(workdir: Path):
    meta = json.loads((workdir / ".builder.json").read_text(encoding="utf-8"))
    recipe_id = meta["recipe"]

    recipe_path = Path(__file__).resolve().parents[2] / "recipes" / recipe_id / "recipe.json"
    recipe = json.loads(recipe_path.read_text(encoding="utf-8"))

    vars_map = {"WORKDIR": str(workdir).replace("\\", "/"), **(recipe.get("vars") or {})}

    procs: list[subprocess.Popen] = []
    try:
        for proc in recipe.get("run", []):
            cwd = Path(render_vars(proc["cwd"], vars_map))
            cmd = render_vars(proc["cmd"], vars_map)

            print(f"[run:{proc['name']}] {cmd}   (cwd={cwd})")
            p = subprocess.Popen(cmd, cwd=str(cwd), shell=True)
            procs.append(p)

            # маленька пауза щоб сервер піднявся до старту expo (не обов'язково, але зручно)
            if proc.get("name") == "server":
                time.sleep(1.5)

        print("\n✅ Running. Press Ctrl+C to stop both processes.")
        while True:
            time.sleep(1.0)
            # якщо якийсь процес впав — виходимо
            for p in procs:
                code = p.poll()
                if code is not None:
                    raise SystemExit(f"Process exited with code {code}")
    except KeyboardInterrupt:
        print("\nStopping...")
    finally:
        for p in procs:
            if p.poll() is None:
                p.terminate()
