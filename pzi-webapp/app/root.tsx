import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";

import "./app.css";

import { createTheme, ThemeProvider } from "@mui/material";

const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontSize: "0.875rem",
          padding: "4px 10px",
          borderRadius: "6px",
          color: "#000",
          borderColor: "#ccc",
          '&:hover': {
            backgroundColor: "#f0f0f0",
          },
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 8,
        },
        switchBase: {
          color: "#888",
          '&.Mui-checked': {
            color: "#1976d2",
          },
          '&.Mui-checked + .MuiSwitch-track': {
            backgroundColor: "#1976d2",
          },
        },
        track: {
          backgroundColor: "#ccc",
          borderRadius: 20,
        },
        thumb: {
          width: 16,
          height: 16,
        },
      },
    },

    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          marginLeft: "4px"
        },
        label: {
          marginLeft: "4px"
        },
      },
    },
  },
});

export const links: Route.LinksFunction = () => [];

export function meta() {
  return [{ title: "Prague Zoo Inventory" }];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta name="version" content={import.meta.env.VITE_APP_VERSION} />
        <Meta />
        <Links />
      </head>
      <body className="overflow-y-scroll">
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
