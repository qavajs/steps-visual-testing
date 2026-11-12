# Change Log

All notable changes to the "@qavajs/steps-visual-testing" will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

:rocket: - new feature  
:beetle: - bugfix  
:x: - deprecation/removal  
:pencil: - chore  
:microscope: - experimental

## [2.2.0]
- :rocket: updated pixelmatch to v8 (OKLab-based color difference); `threshold` is scaled to keep the 0–1 range
- :pencil: updated dependencies
- :rocket: descriptive failure messages (differing pixel count and percentage, image dimensions, invalid PNG input)
- :rocket: validation of step parameters: unknown parameters and invalid values fail the step
- :rocket: added `includeAA`, `alpha`, `aaColor`, `diffColor`, `diffColorAlt` and `diffMask` parameters
- :rocket: added `attach` parameter to control which images are attached on failure (`all`, `diff`, `none`)

## [2.1.1]
- :pencil: update publish workflows

## [2.1.0]
- :rocket: updated pixelmatch dependency
- :beetle: fixed publishing workflow

## [2.0.0]
- :rocket: added initial implementation of v2

## [0.4.0]
- :rocket: added named attachments

## [0.3.1]
- :beetle: attach screenshot if size do not match

## [0.3.0]
- :rocket: added support of Buffer type image values

## [0.2.0]
- :rocket: added parametrized version of screenshot compare step

## [0.1.0]
- :rocket: initial implementation
