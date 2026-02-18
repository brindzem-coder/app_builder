import subprocess
from pathlib import Path

def render_vars(s: str, vars_map: dict) -> str:
    for k, v in vars_map.items():
        s = s.replace("{{" + k + "}}", str(v))
    return s

def ensure_dir(path: Path):
    path.mkdir(parents=True, exist_ok=True)

def write_from_template(dst: Path, template_path: Path, vars_map: dict):
    text = template_path.read_text(encoding="utf-8")
    text = render_vars(text, vars_map)
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(text, encoding="utf-8")

def run_cmd(cmd: str, cwd: Path):
    print(f"\n[cmd] ({cwd}) {cmd}")
    p = subprocess.Popen(cmd, cwd=str(cwd), shell=True)
    code = p.wait()
    if code != 0:
        raise SystemExit(f"Command failed ({code}): {cmd}")
