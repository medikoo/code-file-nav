'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as codeFileNav from './code_file_nav';
const fs = require('fs-extra');
const drivelist = require('drivelist');

interface bookmark {
    label: string;
    path: string;
}

interface cmdData {
    cwd: string;
    files: codeFileNav.fileData[];
}

interface cmd {
    position: string;
    label: string;
    handler: (data: cmdData) => void;
    show?: (data: cmdData) => boolean;
}

let cmds: cmd[] = [
    {
        position: 'top',
        label: '..',
        handler: up,
    },
    {
        position: 'bottom',
        label: '> New file',
        handler: newFile,
    },
    {
        position: 'bottom',
        label: '> New folder',
        handler: newFolder,
    },
    {
        position: 'bottom',
        label: '> Rename',
        handler: rename,
    },
    {
        position: 'bottom',
        label: '> Copy',
        handler: copy,
    },
    {
        position: 'bottom',
        label: '> Cut',
        handler: cut,
    },
    {
        position: 'bottom',
        label: '> Paste',
        handler: paste,
        show: cmdData => !!~['copy', 'cut'].indexOf(cutCopyCmdMemory),
    },
    {
        position: 'bottom',
        label: '> Delete',
        handler: remove,
    },
    {
        position: 'bottom',
        label: '> Change drive',
        handler: changeDrive,
    },
    {
        position: 'bottom',
        label: '> Bookmarks',
        handler: bookmarks,
    },
];

let cutCopyFileMemory: codeFileNav.fileData;
let cutCopyCmdMemory: string;
let lastCmd: string;

export function getList(position: string, data: cmdData): string[] {
    return cmds
        .filter(cmd => cmd.position === position && (cmd.show ? cmd.show(data) : true))
        .map(cmd => cmd.label);
}

export function handle(cmdLabel: string, data: cmdData): boolean {
    let command: cmd = cmds.find(cmd => cmd.label === cmdLabel);

    if (command) {
        command.handler(data);

        lastCmd = command.label;
    }

    return !!command;
}

////////////////////////////////////////
// Command handlers are defined below //
////////////////////////////////////////

export function up(data: cmdData): void {
    codeFileNav.showFileList(path.join(data.cwd, '..'));
}

export function newFile(data: cmdData): void {
    vscode.window.showInputBox({
        placeHolder: 'Enter your new file name'
    }).then(fileName => {
        if (!fileName) {
            codeFileNav.showFileList();

            return;
        }

        fs.writeFile(path.join(data.cwd, fileName), '', err => {
            if (codeFileNav.checkError(err)) { return; }

            codeFileNav.showFileList();
        });
    });
}

export function newFolder(data: cmdData): void {
    vscode.window.showInputBox({
        placeHolder: 'Enter your new folder name'
    }).then(folderName => {
        if (!folderName) {
            codeFileNav.showFileList();

            return;
        }

        fs.mkdir(path.join(data.cwd, folderName), err => {
            if (codeFileNav.checkError(err)) { return; }

            codeFileNav.showFileList();
        });
    });
}

export function remove(data: cmdData): void {
    vscode.window.showQuickPick(data.files.map(file => file.label), {
        placeHolder: 'Choose a file or folder to delete'
    }).then(label => {
        const file: codeFileNav.fileData = data.files.find(file => file.label === label);

        if (!file) {
            codeFileNav.showFileList();

            return;
        }

        if (!file.isFile && !file.isDirectory) { return; }

        const type: string = file.isFile ? 'file' : 'folder';

        vscode.window.showQuickPick(['No', 'Yes'], {
            placeHolder: `Are you sure you want to permanently delete the "${file.name}" ${type}?`
        }).then(answer => {
            if (answer === 'Yes') {
                fs.remove(file.path, err => {
                    if (codeFileNav.checkError(err)) { return; }

                    codeFileNav.showFileList();
                });
            } else {
                codeFileNav.showFileList();
            }
        });
    });
}

export function rename(data: cmdData): void {
    vscode.window.showQuickPick(data.files.map(file => file.label), {
        placeHolder: 'Choose a file or folder to rename'
    }).then(label => {
        const file: codeFileNav.fileData = data.files.find(file => file.label === label);

        if (!file) {
            codeFileNav.showFileList();

            return;
        }

        vscode.window.showInputBox({
            placeHolder: 'Enter a new name'
        }).then(newName => {
            if (!newName) {
                codeFileNav.showFileList();

                return;
            }

            let newPath: string = path.join(data.cwd, newName);

            fs.rename(file.path, newPath, err => {
                if (codeFileNav.checkError(err)) { return; }

                codeFileNav.showFileList();
            });
        });
    });
}

export function copy(data: cmdData): void {
    vscode.window.showQuickPick(data.files.map(file => file.label), {
        placeHolder: 'Choose a file or folder to copy'
    }).then(label => {
        const file: codeFileNav.fileData = data.files.find(file => file.label === label);

        if (!file) {
            codeFileNav.showFileList();

            return;
        }

        cutCopyFileMemory = file;
        cutCopyCmdMemory = 'copy';

        let command: cmd = cmds.find(cmd => cmd.label.substr(0, '> Paste'.length) === '> Paste');

        if (command) {
            command.label = `> Paste (copy: ${cutCopyFileMemory.name})`;
        }

        codeFileNav.showFileList();
    });
}

export function cut(data: cmdData): void {
    vscode.window.showQuickPick(data.files.map(file => file.label), {
        placeHolder: 'Choose a file or folder to cut'
    }).then(label => {
        const file: codeFileNav.fileData = data.files.find(file => file.label === label);

        if (!file) {
            codeFileNav.showFileList();

            return;
        }

        cutCopyFileMemory = file;
        cutCopyCmdMemory = 'cut';

        let command: cmd = cmds.find(cmd => cmd.label.substr(0, '> Paste'.length) === '> Paste');

        if (command) {
            command.label = `> Paste (cut: ${cutCopyFileMemory.name})`;
        }

        codeFileNav.showFileList();
    });
}

export function paste(data: cmdData): void {
    if (!cutCopyFileMemory) {
        codeFileNav.showFileList();

        return;
    }

    const method = cutCopyCmdMemory === 'cut' ? fs.move : fs.copy;
    let newPath: string = path.join(data.cwd, cutCopyFileMemory.name);

    fs.access(newPath, err => {
        if (err) {
            method(cutCopyFileMemory.path, newPath, err => {
                cutCopyCmdMemory = undefined;

                if (codeFileNav.checkError(err)) { return; }

                codeFileNav.showFileList();
            });
        } else {
            const type: string = cutCopyFileMemory.isFile ? 'file' : 'folder';

            vscode.window.showInputBox({
                placeHolder: `The destination ${type} already exists, enter a new ${type} name`
            }).then(newName => {
                if (!newName) {
                    codeFileNav.showFileList();

                    return;
                }

                newPath = path.join(data.cwd, newName);

                method(cutCopyFileMemory.path, newPath, err => {
                    cutCopyCmdMemory = undefined;

                    if (codeFileNav.checkError(err)) { return; }

                    codeFileNav.showFileList();
                });
            });
        }
    });
}

export function changeDrive(data: cmdData): void {
    drivelist.list((err, drives) => {
        if (codeFileNav.checkError(err)) { return; }

        let driveList: string[] = drives.map(drive => drive.name);

        vscode.window.showQuickPick(driveList).then(drive => {
            codeFileNav.showFileList(drive);
        });
    });
}

function formatPath(path: string): string {
    return path.replace(/\${home}/gi, os.homedir());
}

export function bookmarks(data: cmdData): void {
    const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('codeFileNav');
    const platform = os.platform();
    const bookmarks: bookmark[] = config.get(`bookmarks.${platform}`, []);
    const bookmarkQuickPicks: string[] = bookmarks
        .map(bookmark => {
            bookmark.path = formatPath(bookmark.path);

            return bookmark;
        })
        .filter(bookmark => {
            try {
                fs.accessSync(bookmark.path);

                return true;
            }
            catch (err) {
                return false;
            }
        })
        .map(bookmark => bookmark.label);

    vscode.window.showQuickPick(bookmarkQuickPicks).then(bookmarkLabel => {
        const bookmark = bookmarks.find(bookmark => bookmark.label === bookmarkLabel);

        if (!bookmark) {
            codeFileNav.showFileList();

            return;
        }

        bookmark.path = formatPath(bookmark.path);

        codeFileNav.showFileList(bookmark.path);
    });
}
