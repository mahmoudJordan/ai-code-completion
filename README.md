
# GPT Code Helper VS Code Extension

**GPT Code Helper** is a powerful VS Code extension that integrates OpenAI's GPT to assist developers with inline code suggestions, comment-based code generation, and a ChatGPT-like message box. This extension enhances your coding experience by providing contextual code completions and interactive assistance.

---

## Features

1. **Inline Code Suggestions**
   - Get context-aware code completions while typing.
   - Suggestions trigger automatically when typing or can be invoked based on certain conditions.

2. **Comment-to-Code Generation**
   - Write comments to describe what you want, and press `Enter` to generate the corresponding code snippet.
   - Supports single-line (`//`, `#`) and multi-line (`/* */`) comments.

3. **ChatGPT Message Box**
   - Access a dedicated ChatGPT-like interface within VS Code.
   - Ask coding questions, request explanations, or interactively debug your code.

---

## Usage

### Inline Code Suggestions
1. Start typing your code, and suggestions will appear after 3+ characters on the current line.
2. Suggestions can also be manually invoked by writing comments.

### Comment-to-Code Generation
1. Write a comment describing the functionality you need (e.g., `// Generate a function to calculate the sum of an array`).
2. Press `Enter`, and the extension will generate the corresponding code.

### ChatGPT Message Box
1. Open the ChatGPT Message Box from the sidebar.
2. Ask your questions or describe the functionality you're seeking assistance with.
3. View the response and apply suggestions directly to your code.

---

## Illustration

![ChatGPT Message Box Example](https://github.com/mahmoudJordan/ai-code-completion/blob/de198d02c602cd15a173bd1f8f0a04adec9d1615/illust.gif)

---

## Installation

1. **Install from VS Code Marketplace**
   - Visit the [VS Code Marketplace](https://marketplace.visualstudio.com/) and search for "GPT Code Helper".
   - Click "Install" to add it to your VS Code.

2. **Clone and Build**
   - Clone the repository:
     ```bash
     git clone https://github.com/your-username/gpt-code-helper
     cd gpt-code-helper
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Build the extension:
     ```bash
     npm run build
     ```
   - Run the extension in a development VS Code instance:
     ```bash
     code .
     ```

---

## Development

### Folder Structure
- `src/`: Source code for the extension.
  - `api/`: API integrations for OpenAI.
  - `providers/`: Logic for inline suggestions and comment completions.
- `package.json`: Extension metadata and dependencies.

### Debugging
1. Open the repository in VS Code.
2. Press `F5` to launch the extension in a new Extension Development Host window.

---

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add feature name"
   ```
4. Push your branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgements

- [VS Code API](https://code.visualstudio.com/api)
- [OpenAI](https://platform.openai.com/)
