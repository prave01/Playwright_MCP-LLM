const data = {
  commands: [
    {
      name: "browser_snapshot",
      title: "Page snapshot",
      description:
        "Capture accessibility snapshot of the current page, this is better than screenshot",
      parameters: null,
      readOnly: true,
    },
    {
      name: "browser_click",
      title: "Click",
      description: "Perform click on a web page",
      parameters: {
        element: "string",
        ref: "string",
      },
      readOnly: false,
    },
    {
      name: "browser_drag",
      title: "Drag mouse",
      description: "Perform drag and drop between two elements",
      parameters: {
        startElement: "string",
        startRef: "string",
        endElement: "string",
        endRef: "string",
      },
      readOnly: false,
    },
    {
      name: "browser_hover",
      title: "Hover mouse",
      description: "Hover over element on page",
      parameters: {
        element: "string",
        ref: "string",
      },
      readOnly: true,
    },
    {
      name: "browser_type",
      title: "Type text",
      description: "Type text into editable element",
      parameters: {
        element: "string",
        ref: "string",
        text: "string",
        submit: "boolean (optional)",
        slowly: "boolean (optional)",
      },
      readOnly: false,
    },
    {
      name: "browser_select_option",
      title: "Select option",
      description: "Select an option in a dropdown",
      parameters: {
        element: "string",
        ref: "string",
        values: "array",
      },
      readOnly: false,
    },
    {
      name: "browser_press_key",
      title: "Press a key",
      description: "Press a key on the keyboard",
      parameters: {
        key: "string",
      },
      readOnly: false,
    },
    {
      name: "browser_wait_for",
      title: "Wait for",
      description:
        "Wait for text to appear or disappear or a specified time to pass",
      parameters: {
        time: "number (optional)",
        text: "string (optional)",
        textGone: "string (optional)",
      },
      readOnly: true,
    },
    {
      name: "browser_file_upload",
      title: "Upload files",
      description: "Upload one or multiple files",
      parameters: {
        paths: "array",
      },
      readOnly: false,
    },
    {
      name: "browser_handle_dialog",
      title: "Handle a dialog",
      description: "Handle a dialog",
      parameters: {
        accept: "boolean",
        promptText: "string (optional)",
      },
      readOnly: false,
    },
    {
      name: "browser_navigate",
      title: "Navigate to a URL",
      description: "Navigate to a URL",
      parameters: {
        url: "string",
      },
      readOnly: false,
    },
    {
      name: "browser_navigate_back",
      title: "Go back",
      description: "Go back to the previous page",
      parameters: null,
      readOnly: true,
    },
    {
      name: "browser_navigate_forward",
      title: "Go forward",
      description: "Go forward to the next page",
      parameters: null,
      readOnly: true,
    },
    {
      name: "browser_take_screenshot",
      title: "Take a screenshot",
      description:
        "Take a screenshot of the current page. You can't perform actions based on the screenshot, use browser_snapshot for actions.",
      parameters: {
        raw: "boolean (optional)",
        filename: "string (optional)",
        element: "string (optional)",
        ref: "string (optional)",
      },
      readOnly: true,
    },
    {
      name: "browser_pdf_save",
      title: "Save as PDF",
      description: "Save page as PDF",
      parameters: {
        filename: "string (optional)",
      },
      readOnly: true,
    },
    {
      name: "browser_network_requests",
      title: "List network requests",
      description: "Returns all network requests since loading the page",
      parameters: null,
      readOnly: true,
    },
    {
      name: "browser_console_messages",
      title: "Get console messages",
      description: "Returns all console messages",
      parameters: null,
      readOnly: true,
    },
  ],
};

export default data;
