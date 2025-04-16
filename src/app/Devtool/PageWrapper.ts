import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
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

   protected _beforeMount(options: IControlOptions): void {
      // we get the theme during initialization, so first time we can take it from options
      this._currentTheme = options.theme as string;
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
