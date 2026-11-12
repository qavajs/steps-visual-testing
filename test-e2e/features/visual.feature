Feature: compare screenshots

  Scenario: compare screenshots
    Then I expect '$actual' screenshot to equal '$expected'
    Then I expect '$actualBuffer' screenshot to equal '$expected'

  Scenario: compare screenshots with params
    Then I expect '$actualError' screenshot to equal '$expected':
      | threshold | 0.99 |
    Then I expect '$actualError' screenshot to equal '$expectedBuffer':
      | threshold | 0.99 |

  Scenario: compare screenshots with all params
    Then I expect '$actualError' screenshot to equal '$expected':
      | threshold    | 0.99      |
      | includeAA    | true      |
      | alpha        | 0.5       |
      | aaColor      | #00ff00   |
      | diffColor    | 0, 0, 255 |
      | diffColorAlt | #ff00ff   |
      | diffMask     | false     |
      | attach       | diff      |

  Scenario: mismatch reports pixel count
    Then I expect comparing '$actualError' to '$expected' to fail with 'Images are not equal:'
    Then I expect comparing '$actualError' to '$expected' to fail with 'at threshold 0.1'
    Then I expect comparing '$actualError' to '$expected' to fail with 'pixels':
      | attach | none |

  Scenario: size mismatch reports dimensions
    Then I expect comparing '$small' to '$expected' to fail with 'Image sizes do not match: actual 1x1, expected 1280x720'

  Scenario: invalid image
    Then I expect comparing '$notPng' to '$expected' to fail with 'The actual screenshot is not a valid PNG image'

  Scenario Outline: invalid params: <param>
    Then I expect comparing '$actual' to '$expected' to fail with '<error>':
      | <param> | <value> |

    Examples:
      | param     | value | error                           |
      | treshold  | 0.1   | Unknown parameter               |
      | threshold | abc   | expected a number in range 0..1 |
      | threshold | 1.5   | expected a number in range 0..1 |
      | includeAA | yes   | expected true or false          |
      | diffColor | red   | expected a color                |
      | diffColor | 0, 0  | expected a color                |
      | attach    | some  | expected one of                 |
