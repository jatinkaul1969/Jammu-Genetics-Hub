@echo off
cd /d "%~dp0"
set NODE_OPTIONS=
set PATH=C:\Program Files\nodejs;%PATH%
"C:\Program Files\nodejs\node.exe" node_modules/next/dist/bin/next dev --webpack --disable-source-maps
