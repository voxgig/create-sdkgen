To run the linter:

```js
npm run lint:py
```

To run the linter in watch mode:

```js
npm run lint:py:watch
```

**Add the Local Bin Directory to Your PATH:**

You can add the local bin directory (~/.local/bin) to your PATH so that autopep8 and other Python tools can be found.

Run the following command to add the directory to your current session’s PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
```
To make this permanent, add it to your shell configuration file (~/.bashrc or ~/.zshrc):


```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc  # For bash
```
Reload your shell configuration:

```bash
source ~/.bashrc  # For bash
```

** NOTES: **

You can use --recursive to format entire directories. For example:

```
autopep8 --in-place --recursive sdk/py
```

This will recursively format all Python files in the sdk/py directory.
