export enum Lang {
   ru = 'ru',
   en = 'en'
}

const LAYOUTS: Record<Lang, string> = {
   [Lang.ru]:
      'ёйцукенгшщзхъфывапролджэ\\ячсмитьбю.Ё!"№;%:?*()_+ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭ/ЯЧСМИТЬБЮ,',
   [Lang.en]: `\`qwertyuiop[]asdfghjkl;'\\zxcvbnm,./~!@#$%^&*()_+QWERTYUIOP{}ASDFGHJKL:"|ZXCVBNM<>?`
};

export function revert(str: string, from: Lang, to: Lang): string {
   const _from = LAYOUTS[from];
   const _to = LAYOUTS[to];
   if (!_from || !_to || !str.trim().length) {
      return str;
   }
   let result: string = '';
   for (const char of str) {
      const i = _from.indexOf(char);
      result += _to[i] || char;
   }
   return result;
}
