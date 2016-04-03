'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import * as codeFileNav from './code_file_nav';
const drivelist = require('drivelist');

interface cmdData {
    cwd: string;
    files: string[];
}

interface cmd {
    label: string;
    handler: (data: cmdData) => void;
}

let cmds: cmd[] = [
    {
        label: '> New file',
        handler: newFile,
    },
    {
        label: '> New folder',
        handler: newFolder,
    },
    {
        label: '> Rename',
        handler: rename,
    },
    {
        label: '> Delete',
        handler: remove,
    },
    {
        label: '> Change drive',
        handler: changeDrive,
    },
];

export function getList(): string[] {
    return cmds.map(cmd => cmd.label);
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

// Command handlers are defined below

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
    vscode.window.showQuickPick(data.files).then(file => {
        if (!file) {
            codeFileNav.showFileList();

            return;
        }

        let fullPath: string = path.join(data.cwd, file);

        fs.lstat(fullPath, (err, stats) => {
            if (codeFileNav.checkError(err)) { return; }
            if (!stats.isFile() && !stats.isDirectory()) { return; }

            let type: string = stats.isFile() ? 'file' : 'folder';
            let cmd: string = os.platform() === 'win32' ? 'rmdir /s /q' : 'rm -rf';

            vscode.window.showQuickPick(['No', 'Yes'], {
                placeHolder: `Are you sure you want to delete the "${file}" ${type}?`
            }).then(answer => {
                if (answer === 'Yes') {
                    if (type === 'file') {
                        fs.unlink(fullPath, err => {
                            if (codeFileNav.checkError(err)) { return; }

                            codeFileNav.showFileList();
                        });
                    } else if (type === 'folder') {
                        child_process.exec(`${cmd} ${fullPath}`, (err, stdout, stderr) => {
                            if (codeFileNav.checkError(err)) { return; }

                            codeFileNav.showFileList();
                        });
                    }
                } else {
                    codeFileNav.showFileList();
                }
            });
        });
    });
}

export function rename(data: cmdData): void {
    vscode.window.showQuickPick(data.files).then(file => {
        if (!file) {
            codeFileNav.showFileList();

            return;
        }

        let oldPath: string = path.join(data.cwd, file);

        vscode.window.showInputBox({
            placeHolder: 'Enter a new name'
        }).then(newName => {
            if (!newName) {
                codeFileNav.showFileList();

                return;
            }

            let newPath: string = path.join(data.cwd, newName);

            fs.rename(oldPath, newPath, err => {
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