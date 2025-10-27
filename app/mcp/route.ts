import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const getAppsSdkCompatibleHtml = async (baseUrl: string, path: string) => {
  const result = await fetch(`${baseUrl}${path}`);
  return await result.text();
};

type ContentWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  description: string;
  widgetDomain: string;
};

function widgetMeta(widget: ContentWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const handler = createMcpHandler(async (server) => {
  const html = await getAppsSdkCompatibleHtml(baseURL, "/");
  const pizzaListHtml = await getAppsSdkCompatibleHtml(baseURL, "/pizza-list");

  const contentWidget: ContentWidget = {
    id: "show_content",
    title: "Show Content",
    templateUri: "ui://widget/content-template.html",
    invoking: "Loading content...",
    invoked: "Content loaded",
    html: html,
    description: "Displays the homepage content",
    widgetDomain: "https://nextjs.org/docs",
  };
  
  const pizzaListWidget: ContentWidget = {
    id: "pizza_list",
    title: "Pizza List",
    templateUri: "ui://widget/pizza-list-template.html",
    invoking: "Loading pizza list...",
    invoked: "Pizza list loaded",
    html: pizzaListHtml,
    description: "Displays the National Best Pizza List with rankings and ratings",
    widgetDomain: baseURL,
  };

  server.registerResource(
    "content-widget",
    contentWidget.templateUri,
    {
      title: contentWidget.title,
      description: contentWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": contentWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${contentWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": contentWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": contentWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerResource(
    "pizza-list-widget",
    pizzaListWidget.templateUri,
    {
      title: pizzaListWidget.title,
      description: pizzaListWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": pizzaListWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${pizzaListWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": pizzaListWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": pizzaListWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    contentWidget.id,
    {
      title: contentWidget.title,
      description:
        "Fetch and display the homepage content with the name of the user",
      inputSchema: {
        name: z.string().describe("The name of the user to display on the homepage"),
      },
      _meta: widgetMeta(contentWidget),
    },
    async ({ name }) => {
      return {
        content: [
          {
            type: "text",
            text: name,
          },
        ],
        structuredContent: {
          name: name,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(contentWidget),
      };
    }
  );

  server.registerTool(
    pizzaListWidget.id,
    {
      title: pizzaListWidget.title,
      description: pizzaListWidget.description,
      inputSchema: {
        query: z.string().optional().describe("Optional search query to filter pizzerias"),
      },
      _meta: widgetMeta(pizzaListWidget),
    },
    async ({ query }) => {
      return {
        content: [
          {
            type: "text",
            text: query ? `Showing pizza places matching: ${query}` : "Displaying the National Best Pizza List",
          },
        ],
        structuredContent: {
          query: query || undefined,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(pizzaListWidget),
      };
    }
  );
});

export const GET = handler;
export const POST = handler;
