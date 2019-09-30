const deprecatedModulesMasks: RegExp[] = [/Deprecated\//, /html!/];

export default function isDeprecated(moduleName: string): boolean {
   return deprecatedModulesMasks.some((mask) => mask.test(moduleName));
}
