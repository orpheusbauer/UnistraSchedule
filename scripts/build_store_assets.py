"""Reconstruit les icônes et la vignette du Store depuis logo-master.png.

Ce script de maintenance nécessite Pillow : ``python -m pip install Pillow``.
Les fichiers produits sont déterministes et peuvent être régénérés après une
modification du logo maître.
"""

from pathlib import Path

from PIL import Image, ImageDraw


REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
STORE_ASSETS = REPOSITORY_ROOT / "store-assets"
EXTENSION_ICONS = REPOSITORY_ROOT / "extension" / "icons"
MASTER_PATH = STORE_ASSETS / "logo-master.png"


def resample(size: int) -> Image.Image:
    master = Image.open(MASTER_PATH).convert("RGBA")
    return master.resize((size, size), Image.Resampling.LANCZOS)


def build_icons() -> None:
    EXTENSION_ICONS.mkdir(parents=True, exist_ok=True)
    for size in (16, 32, 48, 128):
        resample(size).save(EXTENSION_ICONS / f"icon-{size}.png", optimize=True)
    resample(128).save(STORE_ASSETS / "icon-128.png", optimize=True)


def build_small_promo() -> None:
    canvas = Image.new("RGB", (440, 280), "#176e73")
    draw = ImageDraw.Draw(canvas)

    # Repères de grille discrets pour évoquer un emploi du temps.
    for x in range(0, 441, 55):
        draw.line((x, 0, x, 280), fill="#237b80", width=1)
    for y in range(0, 281, 56):
        draw.line((0, y, 440, y), fill="#237b80", width=1)

    # Logo sur un support neutre pour rester lisible sur le fond coloré.
    draw.rounded_rectangle((25, 55, 195, 225), radius=24, fill="#f7fbfb")
    logo = resample(150)
    canvas.paste(logo, (35, 65), logo)

    # Miniature de calendrier : cours d’origine atténué et ajouts colorés.
    draw.rounded_rectangle((225, 36, 414, 244), radius=13, fill="#f7fbfb")
    draw.rounded_rectangle((225, 36, 414, 75), radius=13, fill="#dceced")
    draw.rectangle((225, 62, 414, 75), fill="#dceced")
    for x in (270, 318, 366):
        draw.line((x, 75, x, 244), fill="#d9e4e5", width=1)
    for y in (109, 143, 177, 211):
        draw.line((225, y, 414, y), fill="#d9e4e5", width=1)

    draw.rounded_rectangle((234, 87, 264, 138), radius=4, fill="#b6dfe1")
    draw.rounded_rectangle((278, 119, 313, 188), radius=4, fill="#e9bd60")
    draw.rounded_rectangle((326, 94, 360, 145), radius=4, fill="#78c6c9")
    draw.rounded_rectangle((370, 166, 405, 218), radius=4, fill="#176e73")

    canvas.save(STORE_ASSETS / "promo-small-440x280.png", optimize=True)


if __name__ == "__main__":
    build_icons()
    build_small_promo()
    print("Icônes et vignette promotionnelle générées.")
