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
  const projectListHtml = await getAppsSdkCompatibleHtml(baseURL, "/project-list");
  const projectViewerHtml = await getAppsSdkCompatibleHtml(baseURL, "/project-viewer");

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

  const projectListWidget: ContentWidget = {
    id: "project_list",
    title: "Project List",
    templateUri: "ui://widget/project-list-template.html",
    invoking: "Loading project models...",
    invoked: "Project list loaded",
    html: projectListHtml,
    description: "Displays a list of BIM project models with the ability to view them in 3D",
    widgetDomain: baseURL,
  };

  const projectViewerWidget: ContentWidget = {
    id: "view_project_model",
    title: "View Project Model",
    templateUri: "ui://widget/project-viewer-template.html",
    invoking: "Loading 3D model viewer...",
    invoked: "Model viewer loaded",
    html: projectViewerHtml,
    description: "Displays a 3D BIM model using Autodesk Viewer",
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

  server.registerResource(
    "project-list-widget",
    projectListWidget.templateUri,
    {
      title: projectListWidget.title,
      description: projectListWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": projectListWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${projectListWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": projectListWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": projectListWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerResource(
    "project-viewer-widget",
    projectViewerWidget.templateUri,
    {
      title: projectViewerWidget.title,
      description: projectViewerWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": projectViewerWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${projectViewerWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": projectViewerWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": projectViewerWidget.widgetDomain,
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

  server.registerTool(
    projectListWidget.id,
    {
      title: projectListWidget.title,
      description: "Display a list of BIM project models available to view",
      inputSchema: {},
      _meta: widgetMeta(projectListWidget),
    },
    async () => {
      return {
        content: [
          {
            type: "text",
            text: "Displaying project models list",
          },
        ],
        structuredContent: {
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(projectListWidget),
      };
    }
  );

  server.registerTool(
    projectViewerWidget.id,
    {
      title: projectViewerWidget.title,
      description: "Display a 3D BIM model in the Autodesk Viewer",
      inputSchema: {
        projectName: z.string().describe("The name of the project/model to display"),
        urn: z.string().describe("The URN of the model to load in the viewer"),
        accessToken: z.string().describe("The access token for authentication"),
      },
      _meta: widgetMeta(projectViewerWidget),
    },
    async ({ projectName, urn, accessToken }) => {
      return {
        content: [
          {
            type: "text",
            text: `Opening 3D model viewer for: ${projectName}`,
          },
        ],
        structuredContent: {
          projectName,
          urn,
          accessToken,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(projectViewerWidget),
      };
    }
  );
});

export const GET = handler;
export const POST = handler;
