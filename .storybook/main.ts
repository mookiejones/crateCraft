import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-mcp"],
  framework: "@storybook/react-vite",
  core: {
    disableTelemetry: true,
  },
  features: {
    componentsManifest: true,
  },
  async viteFinal(viteConfig) {
    const env = (globalThis as { process?: { env?: { STORYBOOK_BASE?: string } } })
      .process?.env;
    const base = env?.STORYBOOK_BASE;
    if (base) {
      viteConfig.base = base.endsWith("/") ? base : `${base}/`;
    }
    return viteConfig;
  },
};

export default config;
