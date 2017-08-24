# AWS S3 library
A wrapper around aws-sdk S3 library with promise support
and simplification

# Installation
> `$ npm install @bhoos/js-s3`

# Usage
```javascript
import { get, put } from '@bhoos/js-s3';

await put('my-bucket', 'my-object', 'whatever-data-you-want-to-store');
const data = await get('my-bucket', 'my-object');

```
