Feature: compare screenshots

  Scenario: compare screenshots
    Then I expect '$actual' screenshot to equal '$expected'

  Scenario: compare screenshots with params
    Then I expect '$actualError' screenshot to equal '$expected':
      | threshold | 0.99 |

