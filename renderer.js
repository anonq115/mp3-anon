// renderer.js
const fs = require('fs');
const { remote } = require('electron');

// Use require to load Node.js modules
const path = require('path');

// Access process
console.log(process.versions);

// Access remote module
const app = remote.app;

// Now you can access properties of the app object
console.log(app.getVersion());
// Access fs module
fs.readdir(__dirname, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(files);
});
