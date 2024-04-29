// renderer.js
const fs = require('fs');
const { remote } = require('electron');
const app = remote.app;
const { ipcRenderer } = require('electron');

// Now you can use the `app` object to access the main process `app` module
console.log(app.getVersion());
// Use require to load Node.js modules
const path = require('path');

// Access process
console.log(process.versions);

// Access remote module

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



console.log('asdasdasdasdsd');


ipcRenderer.send('ping', 'Hello from the renderer process!');



document.addEventListener('keydown', (event) => {
   if (event.key === 'F24') {
      ipcRenderer.send('toggle-visibility');
   }
});
