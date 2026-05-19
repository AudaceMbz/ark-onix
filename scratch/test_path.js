const path = require('path');
console.log('Join with leading slash:', path.join('C:\\base\\public', '/images/logo.png'));
console.log('Join without leading slash:', path.join('C:\\base\\public', 'images/logo.png'));
