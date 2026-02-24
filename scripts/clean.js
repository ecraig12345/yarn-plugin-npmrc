const fs = require('fs');
const paths = require('./paths');

fs.rmSync(paths.bundles, { recursive: true, force: true });
