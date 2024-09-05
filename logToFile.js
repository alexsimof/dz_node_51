import fs from "fs";

export function logToFile(message) {
  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  const logMessage = `${timestamp} - ${message}\n`;
  fs.appendFile('filesUpload.log', logMessage, (err) => {
    err? 'Errore' : null;
  });
}