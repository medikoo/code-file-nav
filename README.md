# Code File Nav (File Navigator)

A _Visual Studio Code_ extension that allows easy navigation and file/folder manipulation of the filesystem via quick pick palettes.

## Notes

Currently this extension has only been tested on Windows 10 so Mac and Linux users are needed for testing on those operating systems.

## Usage

After opening VSCode use the default `ctrl+l` key binding to show a quick pick palette that lists all of the files and folders in the directory of the current active document in VSCode.

You can bind your own key combination by adding the following to your keyboard shortcuts file:

```
{ "key": "ctrl+l", "command": "extension.codeFileNav" }
```

Using the arrow keys and the enter key you can navigate your file system.

Selecting a folder will refresh the quick pick palette with a new list of files in that folder.

Selecting a file will attempt to open that file in VSCode.

You can also use the commands at the bottom of the quick pick palette to perform additional actions in the current folder.

## Configuration

`codeFileNav.codePath`

Accepts an object of strings. The string to be used as the VS Code path will be found based on the return value of `os.platform()` which will be used as a key.

You should edit these entries if you wish to use `code-insiders` instead of `code` or if your executable is in a different location.

For example:

```
"codeFileNav.codePath": {
    "win32": "C:\\Program Files (x86)\\Microsoft VS Code\\bin\\code",
    "darwin": "code",
    "linux": "code"
}
```

`codeFileNav.defaultFolder`

A string of pipe separated values that will be check in left to right order to determine which folder to open in the quick pick palette upon running the command.

For example: `${folder}|${workspace}|${home}/some-file|${home}`

- `${folder}` will open the folder of the current active file in the editor
- `${workspace}` will open the folder that is open in VS Code
- `${home}` will be expanded to whatever value is returned from `os.homedir()`

Because the values are checked from left to right, the default configuration (`${folder}|${workspace}|${home}`) will first try to open the
folder of the current active file, then the workspace folder, then the home directory.

Assuming that all values in the configuration can't be found then a fallback value of whatever `os.homedir()` returns will be used instead.

`codeFileNav.bookmarks`

Accepts an object of bookmark arrays. Bookmarks will be found based on the return value of `os.platform()` which will be used as a key.

This means you can define OS specific bookmark arrays for `darwin`, `freebsd`, `linux`, `sunos` or `win32`.

Each OS specific bookmark object should conatain `label` and `path` key value pairs.

`${home}` will be automatically expanded to the value returned by `os.homedir()`.

For example:

```
"codeFileNav.bookmarks": {
    "win32": [
        {
            "label": "Desktop",
            "path": "${home}/Desktop"
        },
        {
            "label": "Documents",
            "path": "${home}/Documents"
        },
        {
            "label": "Downloads",
            "path": "${home}/Downloads"
        }
    ]
}
```

## Current available commands

- `..`
  - Moves the view up by one directory
- `> New file`
  - Prompts you for a new file name and write an empty file to the current folder
- `> New folder`
  - Prompts you for a new folder name and attempt to create a new folder
- `> Rename`
  - Allows you to select a file or folder to rename
- `> Duplicate`
  - Allows you to select a file or folder to duplicate in the current folder
- `> Copy`
  - Allows you to select a file or folder to copy
- `> Cut`
  - Allows you to select a file or folder to cut
- `> Paste`
  - Will only show after copying or cutting a file or folder and pastes into the current folder
- `> Delete`
  - Allows you to select a file or folder to delete
- `> Change drive`
  - Uses the [`drivelist`][drivelist-github] node module to list available drives to switch to
- `> Open this folder`
  - Attempts to open the current folder in VS Code giving you the option to reuse the current instance or start a new one
- `> Bookmarks`
  - Displays a list of bookmarked folders from the extension configuration based on the OS returned from `os.platform()`

## To do

- Implement `> Change mode` command
- Configurable file permissions for new files and folders

## Contributing

Contributions are welcome from anybody at the [GitHub repository][code-file-nav-github].

## License

This project uses the [MIT][code-file-nav-license] license.

[code-file-nav-github]: https://github.com/jakelucas/code-file-nav
[code-file-nav-license]: https://github.com/jakelucas/code-file-nav/blob/master/LICENSE
[drivelist-github]: https://github.com/resin-io-modules/drivelist