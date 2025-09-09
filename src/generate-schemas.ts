import { promises as fs, readdirSync } from "node:fs";
import { join } from "node:path";
import type { RegistryItemSchema, RegistrySchema } from "@/types";

const files: {
  type: RegistryItemSchema["type"];
  path: string;
  content: string;
}[] = [];

const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
const registryUrl = `${protocol}://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

const rootDir = join(process.cwd());
const componentsDir = join(rootDir, "components");
const hooksDir = join(rootDir, "hooks");

const componentItems = readdirSync(componentsDir, { withFileTypes: true });
const tsxFiles = componentItems.filter(
  (item) => item.isFile() && item.name.endsWith(".tsx")
);

const hookItems = readdirSync(hooksDir, { withFileTypes: true });
const hookTsxFiles = hookItems.filter(
  (item) => item.isFile() && item.name.endsWith(".tsx")
);

const componentsContent = await Promise.all(
  tsxFiles.map(async (file) => {
    const filePath = join(componentsDir, file.name);
    const content = await fs.readFile(filePath, "utf-8");

    return {
      type: "registry:component",
      path: `registry/default/${file.name}`,
      content,
    } satisfies (typeof files)[0];
  })
);

const hooksContent = await Promise.all(
  hookTsxFiles.map(async (file) => {
    const filePath = join(hooksDir, file.name);
    const content = await fs.readFile(filePath, "utf-8");

    return {
      type: "registry:hook",
      path: `registry/default/${file.name}`,
      content,
    } satisfies (typeof files)[0];
  })
);

files.push(...componentsContent, ...hooksContent);

const allComponents: RegistryItemSchema[] = tsxFiles.map((compFile) => {
  const componentName = compFile.name.replace(".tsx", "");

  const item: RegistryItemSchema = {
    name: componentName,
    type: "registry:component",
    title: componentName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    files: [
      {
        path: `registry/default/${compFile.name}`,
        type: "registry:component",
      },
    ],
    author: "Diecodev (https://dieco.dev)",
    dependencies: ["next@latest"],
  };

  return item;
});

const allHooks: RegistryItemSchema[] = hookTsxFiles.map((hookFile) => {
  const hookName = hookFile.name.replace(".tsx", "");

  const item: RegistryItemSchema = {
    name: hookName,
    type: "registry:hook",
    title: hookName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    files: [
      {
        path: `registry/default/${hookFile.name}`,
        type: "registry:hook",
        target: `hooks/${hookFile.name}.tsx`,
      },
    ],
  };

  return item;
});

const allItems: RegistryItemSchema[] = [...allComponents, ...allHooks];

const response: RegistrySchema = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "@diecodev/shadcn-nextjs-typed",
  homepage: new URL("/elements", registryUrl).toString(),
  items: allItems,
};

async function writeRegistrySchemas() {
  try {
    const dir = join(rootDir, "registry");

    // Ensure the registry directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write the aggregated registry schema file
    const schemaPath = join(dir, "all-items-schema.json");
    await fs.writeFile(schemaPath, JSON.stringify(response, null, 2));

    // Write individual schemas for each item (component/hook)
    await Promise.all(
      response.items.map(async (item) => {
        const itemPath = join(dir, `${item.name}.json`);
        const itemSchema = {
          $schema: "https://ui.shadcn.com/schema/registry-item.json",
          ...item,
          files:
            files.filter((file) =>
              item.files?.some((f) => f.path === file.path)
            ) ?? item.files,
        } as const;
        await fs.writeFile(itemPath, JSON.stringify(itemSchema, null, 2));
      })
    );

    console.log("Registry schema written to /registry (aggregate + per-item)");
  } catch (err) {
    console.error("Failed to write registry schemas:", err);
  }
}

if (process.env.NODE_ENV !== "production") {
  await writeRegistrySchemas();
}
