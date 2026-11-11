import type { Preview } from "@storybook/react-vite";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "../src/lib/ui/mui-theme";
import "../static/tokens.css";
import "../static/app.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={createAppTheme("serato-like")}>
        <div data-colorway="serato-like">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;
