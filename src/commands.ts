'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as codeFileNav from './code_file_nav';
const fs = require('fs-extra');
const drivelist = require('drivelist');

interface cmdData {
    cwd: string;
    files: codeFileNav.fileData[];
}

interface cmd {
    position: string;
    label: string;
    handler: (data: cmdData) => void;
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
        label: '> Delete',
        handler: remove,
    },
    {
        position: 'bottom',
        label: '> Change drive',
        handler: changeDrive,
    },
];

export function getList(position: string): string[] {
    return cmds.filter(cmd => cmd.position === position).map(cmd => cmd.label);
}

export function handle(cmdLabel: string, data: cmdData): boolean {
    let isCmd = false;

    cmds.forEach(cmd => {
       if (cmd.label === cmdLabel) {
           cmd.handler(data);
           isCmd = true;

           return;
       }
    });

    return isCmd;
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
        const file = data.files.find(file => file.label === label);

        if (!file) {
            codeFileNav.showFileList();

            return;
        }

        if (!file.isFile && !file.isDirectory) { return; }

        let type: string = file.isFile ? 'file' : 'folder';

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
        const file = data.files.find(file => file.label === label);

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

export function changeDrive(data: cmdData): void {
    drivelist.list((err, drives) => {
        if (codeFileNav.checkError(err)) { return; }

        let driveList: string[] = drives.map(drive => drive.name);

        vscode.window.showQuickPick(driveList).then(drive => {
            codeFileNav.showFileList(drive);
        });
    });
}