declare module "*.html?raw" {
  const content: string;
  export default content;
}

declare module "*.css";

interface ImportMeta {
  glob(pattern: string | readonly string[]): Record<string, () => Promise<unknown>>;
  glob(
    pattern: string | readonly string[],
    options: { query: "?raw"; import: "default"; eager: true },
  ): Record<string, string>;
}
