export type RegistrySchema = {
  $schema: "https://ui.shadcn.com/schema/registry.json";
  name: string;
  homepage: string;
  items: RegistryItemSchema[];
};

export type RegistryItemSchema = {
  name: string;
  type:
    | "registry:lib"
    | "registry:block"
    | "registry:component"
    | "registry:ui"
    | "registry:hook"
    | "registry:theme"
    | "registry:page"
    | "registry:file"
    | "registry:style"
    | "registry:item";
  description?: string;
  title?: string;
  author?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files?: {
    path?: string;
    content?: string;
    type?:
      | "registry:lib"
      | "registry:block"
      | "registry:component"
      | "registry:ui"
      | "registry:hook"
      | "registry:theme"
      | "registry:page"
      | "registry:file"
      | "registry:style"
      | "registry:item";
    target?: string;
    [k: string]: unknown;
  }[];
  tailwind?: {
    config?: {
      content?: string[];
      theme?: {
        [k: string]: unknown;
      };
      plugins?: string[];
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  cssVars?: {
    theme?: {
      [k: string]: string;
    };
    light?: {
      [k: string]: string;
    };
    dark?: {
      [k: string]: string;
    };
    [k: string]: unknown;
  };
  css?: {
    [k: string]:
      | string
      | {
          [k: string]:
            | string
            | {
                /**
                 * CSS property value for nested rule
                 */
                [k: string]: string;
              };
        };
  };
  envVars?: {
    [k: string]: string;
  };
  meta?: {
    [k: string]: unknown;
  };
  docs?: string;
  categories?: string[];
  extends?: string;
};
