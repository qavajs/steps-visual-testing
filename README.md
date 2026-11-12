# @qavajs/steps-visual-testing

Cucumber step library to perform visual (screenshot) testing using [pixelmatch](https://github.com/mapbox/pixelmatch).

## Installation

```
npm install @qavajs/steps-visual-testing
```

## Configuration

Register the steps in your qavajs config:

```typescript
import Memory from './memory';

export default {
    require: [
        '@qavajs/steps-visual-testing/index.js'
    ],
    memory: new Memory()
}
```

## Usage

Screenshots passed to the steps can be either a **Buffer** or a **base64-encoded PNG string**. They must be stored in memory under an alias before being referenced in a step.

### Compare two screenshots

```gherkin
Then I expect '$actual' screenshot to equal '$expected'
```

Compares `$actual` against `$expected` using the default threshold of `0.1`.

### Compare two screenshots with custom parameters

```gherkin
Then I expect '$actual' screenshot to equal '$expected':
  | threshold | 0.4  |
  | includeAA | true |
  | attach    | diff |
```

All parameters are optional. Values can be memory expressions (e.g. `$threshold`).

| Parameter      | Type    | Default       | Description                                                                                                                                                         |
|----------------|---------|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `threshold`    | number  | `0.1`         | Per-pixel color matching threshold (0–1), relative to the maximum possible color difference (perceptual OKLab distance). `0` requires an exact match, `1` accepts any difference. |
| `includeAA`    | boolean | `false`       | Count anti-aliased pixels as differences instead of detecting and ignoring them.                                                                                    |
| `alpha`        | number  | `0.1`         | Opacity (0–1) of the original image drawn under the diff in the delta image.                                                                                        |
| `aaColor`      | color   | `255, 255, 0` | Color of anti-aliased pixels in the delta image.                                                                                                                    |
| `diffColor`    | color   | `255, 0, 0`   | Color of differing pixels in the delta image.                                                                                                                       |
| `diffColorAlt` | color   | `diffColor`   | Color of differing pixels that are darker in the expected image, to tell "added" from "removed" parts.                                                             |
| `diffMask`     | boolean | `false`       | Draw the diff over a transparent background instead of the original image.                                                                                         |
| `attach`       | string  | `all`         | Images attached to the report on failure: `all` (actual, expected, delta), `diff` (delta only), `none`.                                                             |

Colors can be given as `#rrggbb` or `r, g, b` (0–255). Unknown parameters and invalid values fail the step with a descriptive error.

## Failure messages

- Mismatch: `Images are not equal: 5872 of 921600 pixels (0.64%) differ at threshold 0.1`
- Size mismatch: `Image sizes do not match: actual 1280x800, expected 1280x720`
- Invalid input: `The actual screenshot is not a valid PNG image: ...`

## Failure attachments

When images do not match, the step attaches images to the Cucumber report according to the `attach` parameter (by default all three):

- **actual** — the actual screenshot
- **expected** — the expected screenshot
- **delta** — a diff image highlighting pixel differences

If image sizes differ, no delta can be built, so **actual** and **expected** are attached (unless `attach` is `none`).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.
