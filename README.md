# Code File Nav (File Navigator)

A _Visual Studio Code_ extension that allows easy navigation and file/folder manipulation of the filesystem via quick pick palettes.

## Notes

Currently this extension has only been tested on Windows 10 so Mac and Linux users are needed for testing on those operating systems.

## Usage

After opening VSCode use the default `ctrl+l` key binding to show a quick pick palette that lists all of the files and folders in the directory of the current active document in VSCode.

If no document is currently active then it will open either the current open folder in VSCode, the root of your hard drive or the VSCode install folder.

Using the arrow keys and the enter key you can navigate your file system.

Selecting a folder will refresh the quick pick palette with a new list of files in that folder.

Selecting a file will attempt to open that file in VSCode.

You can also use the commands at the bottom of the quick pick palette to perform additional actions in the current folder.

## Current available commands

- `> New file`
  - Prompts you for a new file name and write an empty file to the current folder
- `> New folder`
  - Prompts you for a new folder name and attempt to create a new folder
- `> Rename`
  - Allows you to select a file or folder to rename
- `> Delete`
  - Allows you to select a file or folder to delete
- `> Change drive`
  - Uses the [`drivelist`][drivelist-github] node module to list available drives to switch to

## To do

- Write unit tests
- Speed up the `> Change drive` command
- Implement `> Cut` command
- Implement `> Copy` command
- Implement `> Paste` command
- Implement `> Duplicate` command
- Implement `> Change mode` command
- Implement `> Bookmarks` command
- Recursive mkdir for `> New file`, `> New folder` and `> Rename`
- Check for existing files when using the `> New file` command
- Check for existing folders when using the `> New folder` command
- Check for existing files or folders when using the `> Rename` command
- Create multiple files or folders in the current directory with `> New file` and `> New folder`
- Configurable file/folder exclusions (read .gitignore etc)
- Configurable file/folder exclusions (manual)
- Configurable default folder to open
- Configurable file permissions for new files and folders
- Configurable bookmark locations

## Contributing

Contributions are welcome from anybody at the [GitHub repository][code-file-nav-github], especially contributions that may fix any potential cross-platform issues.

## License

This project uses the [MIT][code-file-nav-license] license.

[code-file-nav-github]: https://github.com/jakelucas/code-file-nav
[code-file-nav-license]: https://github.com/jakelucas/code-file-nav/blob/master/LICENSE
[drivelist-github]: https://github.com/resin-io-modules/drivelist