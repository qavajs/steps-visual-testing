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
            '@qavajs/steps-visual-testing'
        ],
        memory: new Memory()
    }
}
```

## screenshot strategy
@qavajs/steps-playwright has build-in capability to take screenshot on particular event. If you need to add 
screenshot to your report add _screenshot_ property to profile config.
Supported events:
- onFail
- beforeStep
- afterStep

```javascript
module.exports = {
    default: {
        screenshot: 'onFail'
    }
}
```
