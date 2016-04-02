'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as child_process from 'child_process';
import * as codeFileNav from './code_file_nav';
const drivelist = require('drivelist');

export function newFile(cwd: string): void {
    vscode.window.showInputBox({
        placeHolder: 'Enter your new file name'
    }).then(fileName => {
        if (!fileName) {
            codeFileNav.showFileList();

            return;
        }

        fs.writeFile(path.join(cwd, fileName), '', (err) => {
            codeFileNav.showFileList();
        });
    });
}

export function newFolder(cwd: string): void {
    vscode.window.showInputBox({
        placeHolder: 'Enter your new folder name'
    }).then(folderName => {
        if (!folderName) {
            codeFileNav.showFileList();

            return;
        }

        fs.mkdir(path.join(cwd, folderName), (err) => {
            codeFileNav.showFileList();
        });
    });
}

export function remove(cwd: string, files: string[]): void {
    vscode.window.showQuickPick(files).then(file => {
        if (!file) {
            codeFileNav.showFileList();

            return;
        }

        let fullPath: string = path.join(cwd, file);

        fs.lstat(fullPath, (err, stats) => {
            if (!stats.isFile() && !stats.isDirectory()) {
                return;
            }

            let type: string = stats.isFile() ? 'file' : 'folder';
            let cmd: string = os.platform() === 'win32' ? 'rmdir /s /q' : 'rm -rf';

            vscode.window.showQuickPick(['No', 'Yes'], {
                placeHolder: `Are you sure you want to delete the "${file}" ${type}?`
            }).then(answer => {
                if (answer === 'Yes') {
                    if (type === 'file') {
                        fs.unlink(fullPath, (err) => {
                            codeFileNav.showFileList();
                        });
                    } else if (type === 'folder') {
                        child_process.exec(`${cmd} ${fullPath}`, (err, stdout, stderr) => {
                            if (err) {
                                vscode.window.showErrorMessage(err.message);
                            }

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

export function rename(cwd: string, files: string[]): void {
    vscode.window.showQuickPick(files).then(file => {
        if (!file) {
            codeFileNav.showFileList();

            return;
        }

        let oldPath: string = path.join(cwd, file);

        vscode.window.showInputBox({
            placeHolder: 'Enter a new name'
        }).then(newName => {
            if (!newName) {
                codeFileNav.showFileList();

                return;
            }

            let newPath: string = path.join(cwd, newName);

            fs.rename(oldPath, newPath, (err) => {
                codeFileNav.showFileList();
            });
        });
    });
}

export function changeDrive(): void {
    drivelist.list((err, drives) => {
        let driveList: string[] = drives.map(drive => drive.name);

        vscode.window.showQuickPick(driveList).then(drive => {
            codeFileNav.showFileList(drive);
        });
    });
}