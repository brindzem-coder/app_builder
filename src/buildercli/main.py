import typer
from pathlib import Path
from buildercli.recipes import list_recipes, apply_recipe
from buildercli.runner import run_project

app = typer.Typer(no_args_is_help=True)

@app.command()
def recipes():
    """List available recipes."""
    for r in list_recipes():
        typer.echo(r)

@app.command()
def new(recipe: str, project_name: str, out: str = "generated"):
    """Create a new project from a recipe."""
    workdir = Path(out).resolve() / project_name
    workdir.mkdir(parents=True, exist_ok=True)
    apply_recipe(recipe_id=recipe, workdir=workdir)
    typer.echo(f"✅ Created: {workdir}")

@app.command()
def run(project_name: str, out: str = "generated"):
    """Run server + mobile for the project (from its recipe run section)."""
    workdir = (Path(out).resolve() / project_name)
    run_project(workdir)

if __name__ == "__main__":
    app()
