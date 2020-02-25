import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!Devtool/PageWrapper/PageWrapper');

function getThemeName(userTheme?: 'dark' | 'light' | 'devtools'): string {
   const themeName = (!userTheme || userTheme === 'devtools') ? chrome.devtools.panels.themeName : userTheme;
   switch (themeName) {
      case 'light':
         return 'devtools__light';
      case 'dark':
         return 'devtools__dark';
      default:
         return 'devtools__light';
   }
}

class Extension extends Control {
   protected _template: TemplateFunction = template;
   protected _currentTheme: string;

   protected _beforeMount(): Promise<void> {
      return new Promise((resolve) => {
         chrome.storage.sync.get('theme', (result) => {
            this._currentTheme = getThemeName(result.theme);
            resolve();
         });
      });
   }

   protected _afterMount(): void {
      chrome.storage.onChanged.addListener((changes, areaName) => {
         if (areaName === 'sync' && changes.theme) {
            this._currentTheme = getThemeName(changes.theme.newValue);
         }
      });
   }
}

export default Extension;
