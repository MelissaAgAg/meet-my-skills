import streamlit as st
from pathlib import Path

# PIBot - versión Streamlit
# La interfaz principal vive en index.html + style.css + script.js.
# Este archivo los integra en un componente de Streamlit para poder ejecutar
# el proyecto como una pequeña aplicación web.

st.set_page_config(
    page_title="PIBot | Laboratorio de Macroeconomía",
    page_icon="📊",
    layout="wide",
)

BASE_DIR = Path(__file__).resolve().parent

html_path = BASE_DIR / "index.html"
css_path = BASE_DIR / "style.css"
js_path = BASE_DIR / "script.js"

html = html_path.read_text(encoding="utf-8")
css = css_path.read_text(encoding="utf-8")
js = js_path.read_text(encoding="utf-8")

# Convertimos los archivos externos en una sola página para que el componente
# funcione dentro de Streamlit sin depender de rutas relativas del navegador.
html = html.replace(
    '<link rel="stylesheet" href="style.css">',
    f"<style>{css}</style>"
)
html = html.replace(
    '<script src="script.js"></script>',
    f"<script>{js}</script>"
)

# Evita que el HTML intente utilizar recursos externos.
st.components.v1.html(html, height=1450, scrolling=True)
