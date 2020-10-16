import {
   IFrontendChangedReactiveProp,
   IStackFrame
} from 'Extension/Plugins/Elements/IProfilingData';
import { IControlNode } from 'Extension/Plugins/Elements/IControlNode';

function isOldReactiveProps(
   reactiveProps: unknown[]
): reactiveProps is string[] {
   return typeof reactiveProps[0] === 'string';
}

const LINE_NUMBER_AND_COLUMN_REGEXP = /:(\d+)(:\d+)?\)?,?$/;
function parseUrl(
   url: string
): {
   lineNumber: number;
   url: string;
} {
   const possibleLineNumber = LINE_NUMBER_AND_COLUMN_REGEXP.exec(url);
   const cleanUrl = possibleLineNumber
      ? url.slice(0, possibleLineNumber.index)
      : url;
   return {
      url: cleanUrl,
      lineNumber: possibleLineNumber
         ? // openResource indexes lines from 0 so we have to account for this with -1
           parseInt(possibleLineNumber[1], 10) - 1
         : 0
   };
}

const INTERNAL_STACK_SIZE = 2;
const CHROME_STACK_REGEXP = /^(eval )?at [^\(]*/;
const INNER_FUNCTION = /\((.* \(.*\),)/;
const CHROME_ERROR_REGEXP = /at (new )?(\S* (\[.*\] )?)?\(?(\S+)/;
const GROUP_WITH_URL = 4;
function parseStack(stack: string): IStackFrame[] {
   return stack
      .split('\n')
      .map((part) => part.trim())
      .filter((part) => CHROME_STACK_REGEXP.test(part))
      .map((part) => {
         const innerFunction = part.match(INNER_FUNCTION);
         let parsedPart;
         if (innerFunction) {
            parsedPart = innerFunction[1].match(CHROME_ERROR_REGEXP);
         } else {
            parsedPart = part.match(CHROME_ERROR_REGEXP);
         }

         if (
            parsedPart &&
            !(parsedPart[GROUP_WITH_URL] as string).includes('<anonymous>')
         ) {
            const parsedUrl = parseUrl(parsedPart[GROUP_WITH_URL] as string);

            return {
               name: parsedPart[2] ? parsedPart[2].trim() : 'anonymous',
               url: parsedUrl.url,
               lineNumber: parsedUrl.lineNumber
            };
         } else {
            return {
               name: 'unknown',
               url: 'unknown',
               lineNumber: 0
            };
         }
      })
      .filter((item) => item.name !== 'unknown' && item.url !== 'unknown')
      .slice(INTERNAL_STACK_SIZE);
}

export function parseStacksOfReactiveProps(
   reactiveProps?: IControlNode['changedReactiveProps']
): IFrontendChangedReactiveProp[] | undefined {
   if (reactiveProps) {
      // TODO: обратная совместимость, убрать после выхода 7100
      if (isOldReactiveProps(reactiveProps)) {
         return reactiveProps.map((item) => {
            return {
               name: item
            };
         });
      } else {
         return reactiveProps.map((item) => {
            return {
               name: item.name,
               stack: item.stack ? parseStack(item.stack) : undefined
            };
         });
      }
   } else {
      return reactiveProps;
   }
}
