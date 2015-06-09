# Stereo-Music-Visualization-using-Manifold-Harmonics
Visualisierung 2 UE TU Wien SS15

# Group Members
Velitchko Filipov 0726328
Silvester Farda 0727611 

# Comandline Options for Chrome when running locally
 --ignore-gpu-blacklist --disable-web-security

# CPP APP
Compiled and works with VS12 / VS13
Outputs MHB Data as text and binary file.

# Python
Use convert_obj_three.py to convert OBJ models into JS BIN files.
Three.JS does not like native OBJ files so we need to convert them to JSON.
NOTE: The python script ONLY works with Python versions 2.X (you might need to downgrade)
Usage:
python convert_obj_three.py -i input.obj -o output.js -t binary

# WEBGL
USE CHROME!
Makes use of three.js, Web Audio API and HTML5 elements.
Make sure your browser is WebGL Capable and up to date
Tested on Chrome Version 43.0.2357.81 dev-m
