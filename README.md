# @qavajs/steps-visual-testing
Step library to perform visual testing

## installation

`npm install @qavajs/steps-visual-testing`

## configuration
```javascript
const Memory = require('./memory');

module.exports = {
    default: {
        require: [
            '@qavajs/steps-visual-testing/index.js'
        ],
        memory: new Memory()
    }
}
```
