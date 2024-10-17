let id: number = 1;

/**
 * Generates unique id for a file or a module.
 * @author Зайцев А.С.
 */
export function getId(): number {
   id++;
   return id;
}
