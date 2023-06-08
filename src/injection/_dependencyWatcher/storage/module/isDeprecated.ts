const deprecatedModulesMasks: RegExp[] = [/Deprecated\//, /html!/];

/**
 * Determines whether a module is deprecated.
 * @author Зайцев А.С.
 */
export default function isDeprecated(moduleName: string): boolean {
   return deprecatedModulesMasks.some((mask) => mask.test(moduleName));
}
